import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class EmarsysLoyalty implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Emarsys Loyalty',
		name: 'emarsysLoyalty',
		icon: 'file:emarsys.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["action"]}}',
		description: 'Interact with Emarsys Loyalty API',
		defaults: {
			name: 'Emarsys Loyalty',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		credentials: [
			{
				name: 'emarsysLoyaltyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'Contact', value: 'contact' },
					{ name: 'Actions', value: 'actions' },
					{ name: 'Tiers', value: 'tiers' },
					{ name: 'Referral', value: 'referral' },
				],
				default: 'contact',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: { show: { resource: ['contact'] } },
				options: [
					{ name: "Get Contact Info", value: 'contact' },
					{ name: "Get Contact Activities", value: 'activities' },
					{ name: "Hash Contact Id", value: 'hash'},
				],
				default: 'contact',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: { show: { resource: ['actions'] } },
				options: [
					{ name: "Get Contact Actions", value: 'actions' },
				],
				default: 'actions',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: { show: { resource: ['tiers'] } },
				options: [
					{ name: "Get Contact Tiers", value: 'tiers' },
				],
				default: 'tiers',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: { show: { resource: ['referral'] } },
				options: [
					{ name: "Get Referral Content", value: 'referralFriendContent' },
					{ name: "Get Referrals", value: 'referrals' },
				],
				default: 'referralFriendContent',
			},
			{
				displayName: 'Contact External ID',
				name: 'xContactId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						action: [
							'contact', 'activities', 'hash', 'actions', 'tiers', 'referralFriendContent', 'referrals'
						]
					},
				},
				description: 'External ID of the contact (required)',
			},
			{
				displayName: 'Language (ISO Code)',
				name: 'xLanguage',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						action: [
							'contact', 'activities', 'actions', 'tiers', 'referralFriendContent', 'referrals'
						]
					},
				},
				description: 'Optional. Example: en, es, zh-CN etc.',
			},
			{
				displayName: 'Currency Code',
				name: 'xCurrency',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						action: ['actions']
					},
				},
				description: 'Optional. Example: USD, EUR',
			},
			{
				displayName: 'Market Code',
				name: 'xMarket',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						action: ['tiers', 'referralFriendContent', 'referrals']
					},
				},
				description: 'Optional market identifier code.',
			},
			{
				displayName: 'Referral ID',
				name: 'xReferralId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						action: ['referralFriendContent']
					},
				},
				description: 'The referralId which is returned when getting a contact\'s referrals.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const action = this.getNodeParameter('action', 0) as string;

		const endpointMap: { [key: string]: string } = {
			contact: '/api/v4/contact',
			activities: '/api/v4/contact/activities',
			actions: '/api/v4/contact/actions',
			tiers: '/api/v4/contact/tiers',
			referralFriendContent: '/api/v4/contact/referralFriendContent',
			referrals: '/api/v4/contact/referrals',
			hash: '/api/v4/contact/hash',
		};

		const baseUrl = 'https://contact-api.loyalsys.io';

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('emarsysLoyaltyApi');
				const url = `${baseUrl}${endpointMap[action]}`;
				const headers: { [key: string]: string } = {
					[credentials.name as string]: credentials.value as string,
					'Content-Type': 'application/json',
				};

				headers['x-contact-id'] = this.getNodeParameter('xContactId', i) as string;
				const xLanguage = this.getNodeParameter('xLanguage', i, '') as string;
				if (xLanguage) headers['x-language'] = xLanguage;
				const xCurrency = this.getNodeParameter('xCurrency', i, '') as string;
				if (xCurrency) headers['x-currency'] = xCurrency;
				const xMarket = this.getNodeParameter('xMarket', i, '') as string;
				if (xMarket) headers['x-market'] = xMarket;
				const xReferralId = this.getNodeParameter('xReferralId', i, '') as string;
				if (xReferralId) headers['x-referral-id'] = xReferralId;

				const response = await this.helpers.request({
					method: 'GET',
					url,
					headers,
					json: true,
				});

				if (action === 'hash') {
					returnData.push({ json: { result: typeof response === 'string' ? JSON.parse(response) : response } });
				} else {
					returnData.push({ json: response });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}
		return [returnData];
	}
}
