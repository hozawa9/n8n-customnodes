import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	INodeProperties,
	IDataObject,
	Icon
} from 'n8n-workflow';
const { NodeOperationError } = require('n8n-workflow');

const description = require('./description.json') as {
	displayName: string;
	name: string;
	icon: Icon | undefined;
	group: string[];
	version: number;
	defaults: object;
	credentials: Array<{ name: string; required: boolean }>;
	requestDefaults?: { baseURL: string };
};

const typedProperties = require('./properties_test03.json') as INodeProperties[];
const endpointJson = require('./endpoint.json') as Array<{
	resource: string;
	path: string;
	method: string;
	operation: string;
	headers_1_name: string;
	headers_1_required: boolean;
	headers_2_name: string;
	headers_2_required: boolean;
	headers_3_name: string;
	headers_3_required: boolean;
	headers_4_name: string;
	headers_4_required: boolean;
	body_1_name: string;
	body_1_required: boolean;
	body_2_name: string;
	body_2_required: boolean;
	body_3_name: string;
	body_3_required: boolean;
	body_4_name: string;
	body_4_required: boolean;
}>;

const paramMap: Record<string, { headers: Array<{ name: string; required: boolean }>; body: Array<{ name: string; required: boolean }> }> = {};

for (const endpoint of endpointJson) {
	const { operation } = endpoint;
	if (!paramMap[operation]) {
		paramMap[operation] = { headers: [], body: [] };
	}

	for (let i = 1; i <= 4; i++) {
		const headerName = endpoint[`headers_${i}_name` as keyof typeof endpoint] as string;
		const headerRequired = endpoint[`headers_${i}_required` as keyof typeof endpoint] as boolean;
		if (headerName) {
			paramMap[operation].headers.push({ name: headerName, required: headerRequired });
		}
	}

	for (let i = 1; i <= 4; i++) {
		const bodyName = endpoint[`body_${i}_name` as keyof typeof endpoint] as string;
		const bodyRequired = endpoint[`body_${i}_required` as keyof typeof endpoint] as boolean;
		if (bodyName) {
			paramMap[operation].body.push({ name: bodyName, required: bodyRequired });
		}
	}
}

const endpointMap: Record<string, { method: string; path: string }> = {};
for (const { operation, method, path } of endpointJson) {
	endpointMap[operation] = { method: method.toUpperCase(), path };
}

export class EmarsysLoyalty implements INodeType {
	description: INodeTypeDescription = {
		displayName: description.displayName,
		name: description.name,
		icon: description.icon,
		group: description.group,
		version: description.version,
		description: '',
		defaults: description.defaults,
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		credentials: description.credentials,
		requestDefaults: {baseURL: description.requestDefaults?.baseURL},
		properties: typedProperties
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const baseUrl = description.requestDefaults?.baseURL;

		for (let i = 0; i < items.length; i++) {
			try {
				const action = this.getNodeParameter('action', i) as string;
				const endpoint = endpointMap[action];
				if (!endpoint) throw new NodeOperationError(this.getNode(), `Unknown action: ${action}`);

				const { method, path } = endpoint;
				const url = `${baseUrl}${path}`;
				const credentials = await this.getCredentials(description.credentials[0].name);

				const headerParams = paramMap[action]?.headers ?? [];
				const bodyParams = paramMap[action]?.body ?? [];

				const headers: Record<string, string> = {
					[credentials.name as string]: credentials.value as string,
					'Content-Type': 'application/json',
				};

				const body: IDataObject = {};

				for (const { name, required } of headerParams) {
					let val: any = null;
					try {
						val = this.getNodeParameter(name, i);
					} catch {}

					const displayName = typedProperties.find((p) => p.name === name)?.displayName ?? name;
					if (val !== undefined && val !== '' && (required || val !== null)) {
						headers[displayName] = String(val);
					} else if (required) {
						throw new NodeOperationError(this.getNode(), `Missing required header: ${displayName}`);
					}
				}

				for (const { name, required } of bodyParams) {
					let val: any = null;
					let type: string | undefined;
					try {
						const paramDef = typedProperties.find((p) => p.name === name);
						type = paramDef?.type;
						val = this.getNodeParameter(name, i, type === 'boolean' ? false : undefined);
					} catch {}

					if (type === 'boolean' || (val !== undefined && val !== '' && (required || val !== null))) {
						body[name] = type === 'boolean' ? Boolean(val) : val;
					} else if (required) {
						throw new NodeOperationError(this.getNode(), `Missing required body parameter: ${name}`);
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
