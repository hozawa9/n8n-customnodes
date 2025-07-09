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

const typedProperties = require('./properties_test02.json') as INodeProperties[];
const paramJson = require('./param.json') as Array<{
	operation: string;
	additional_field: string;
	in: 'headers' | 'body';
}>;
const endpointJson = require('./endpoint.json') as Array<{
	operation: string;
	resource: string;
	method: string;
	path: string;
}>;

const paramMap: Record<string, { headers: string[]; body: string[] }> = {};

for (const { operation, additional_field, in: location } of paramJson) {
	if (!paramMap[operation]) {
		paramMap[operation] = { headers: [], body: [] };
	}
	paramMap[operation][location].push(additional_field);
}

const endpointMap: Record<string, { method: string; path: string }> = {};
for (const { operation, method, path } of endpointJson) {
	endpointMap[operation] = { method: method.toUpperCase(), path: `/api/v4${path}` };
}

export class EmarsysLoyalty implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Emarsys Loyalty v2.4',
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
		properties: typedProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const baseUrl = 'https://contact-api.loyalsys.io';

		for (let i = 0; i < items.length; i++) {
			try {
				const action = this.getNodeParameter('action', i) as string;

				const { method, path } = endpointMap[action];
				const credentials = await this.getCredentials('emarsysLoyaltyApi');
				const url = `${baseUrl}${path}`;

				const headers: Record<string, string> = {
					[credentials.name as string]: credentials.value as string,
					'Content-Type': 'application/json',
				};

				const body: IDataObject = {};

				const headerParams = paramMap[action]?.headers ?? [];
				const bodyParams = paramMap[action]?.body ?? [];

				for (const name of headerParams) {
					let val: any = null;
					try {
						val = this.getNodeParameter(name, i);
					} catch {}

					const displayName = typedProperties.find(p => p.name === name)?.displayName ?? name;
					if (val !== undefined && val !== '') {
						headers[displayName] = String(val);
					}
				}

				for (const name of bodyParams) {
					let val: any = null;
					let type: string | undefined;
					try {
						const paramDef = typedProperties.find(p => p.name === name);
						type = paramDef?.type;
						val = this.getNodeParameter(name, i, type === 'boolean' ? false : undefined);
					} catch {}

					if (type === 'boolean' || (val !== undefined && val !== '')) {
						body[name] = type === 'boolean' ? Boolean(val) : val;
					}
				}

				const options: Record<string, any> = {
					method,
					url,
					headers,
					json: true,
				};
				if (Object.keys(body).length) options.body = body;

				const response = await this.helpers.request({ ...options, resolveWithFullResponse: true });
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
						for (const item of data) returnData.push({ json: item });
					} else if (typeof data === 'object' && data !== null) {
						returnData.push({ json: data as IDataObject });
					} else {
						returnData.push({ json: { body: String(data) } });
					}
				} else {
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
