import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';

const { NodeOperationError } = require('n8n-workflow');

const typedProperties = require('./properties_test01.json') as INodeProperties[];

export class EmarsysLoyalty implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Emarsys Loyalty v2.1',
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
		properties: typedProperties as INodeProperties[],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const baseUrl = 'https://contact-api.loyalsys.io';

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const action = this.getNodeParameter('action', i) as string;

				const endpointMap: {
					[key: string]: {
						[key: string]: {
							method: string;
							path: string;
						};
					};
				} = {
					contact: {
						deleteContact: { method: 'DELETE', path: '/api/v4/contact/' },
						addContact: { method: 'POST', path: '/api/v4/contact/join' },
						getContactLoyaltyInfo: { method: 'GET', path: '/api/v4/contact' },
						getHashedXcontactid: { method: 'GET', path: '/api/v4/contact/hash' },
						getContactActivities: { method: 'GET', path: '/api/v4/contact/activities' },
					},
					plan: {
						changeContactLoyaltyPlan: { method: 'POST', path: '/api/v4/contact/changeplans' },
						getProgramSettings: { method: 'GET', path: '/api/v4/contact/programSettings' },
					},
					actions: {
						getContactActions: { method: 'GET', path: '/api/v4/contact/actions' },
					},
					tiers: {
						getContactTiers: { method: 'GET', path: '/api/v4/contact/tiers' },
						downgradeContactTiers: { method: 'PUT', path: '/api/v4/contact/tiers/downgrade' },
						upgradeContactTiers: { method: 'PUT', path: '/api/v4/contact/tiers/upgrade' },
					},
				};

				const { method, path } = endpointMap[resource][action];
				const credentials = await this.getCredentials('emarsysLoyaltyApi');
				const url = `${baseUrl}${path}`;

				const headers: { [key: string]: string } = {
					[credentials.name as string]: credentials.value as string,
					'Content-Type': 'application/json',
				};

				const optionalHeaders = [
					'xContactId',
					'xLanguage',
					'xCurrency',
					'xMarket',
					'xInitiatedBy',
					'xPlanId',
					'xExitTo',
					'xReasonForTierChange',
					'xTierId',
				];

				for (const param of optionalHeaders) {
					const value = this.getNodeParameter(param, i, '') as string;
					if (value) {
						headers[param.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)] = value;
					}
				}

				const bodyParams = ['withPointsAllocations', 'withTierExpiration'];
				const body: Record<string, any> = {};
				for (const param of bodyParams) {
					const value = this.getNodeParameter(param, i, '') as string;
					if (value) {
						body[param] = value;
					}
				}

				const options: Record<string, any> = {
					method,
					url,
					headers,
					json: true,
				};

				if (method === 'POST' || method === 'PUT') {
					options.body = body;
				}

				const response = await this.helpers.request({
					...options,
					resolveWithFullResponse: true,
				});

				const contentType = response.headers['content-type'];
				const responseBody = response.body;

				if (contentType?.includes('application/json')) {
					let data: unknown;
					try {
						data = typeof responseBody === 'object' ? responseBody : JSON.parse(responseBody);
					} catch {
						data = { body: responseBody };
					}

					if (Array.isArray(data)) {
						for (const item of data) {
							returnData.push({ json: item });
						}
					} else if (typeof data === 'object' && data !== null) {
						returnData.push({ json: data as IDataObject });
					} else {
						returnData.push({ json: { body: String(data) } });
					}
				} else {
					// treat as plain text or other format
					returnData.push({ json: { body: responseBody } });
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}

		return [returnData];
	}
}
