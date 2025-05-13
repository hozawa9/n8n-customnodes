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
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
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
				displayOptions: {
					show: {
						resource: ['actions'],
					},
				},
				options: [
					{ name: "Get Contact Actions", value: 'actions' },
				],
				default: 'actions',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['tiers'],
					},
				},
				options: [
					{ name: "Get Contact Tiers", value: 'tiers' },
				],
				default: 'tiers',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['referral'],
					},
				},
				options: [
					{ name: "Get Referral Content", value: 'referralFriendContent' },
					{ name: "Get Referrals", value: 'referrals' },
				],
				default: 'referralFriendContent',
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
				const response = await this.helpers.request({
					method: 'GET',
					url,
					headers: {
						'Authorization': `Bearer ${credentials.apiKey}`,
						'Content-Type': 'application/json',
					},
				});

				returnData.push({ json: response });
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
