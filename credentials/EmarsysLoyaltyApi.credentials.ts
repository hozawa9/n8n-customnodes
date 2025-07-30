import {
  ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

const credentialParam = require('./headerAuthCredentialParams_emarsysLoyaltyApi.json') as {
	name: string;
	displayName: string;
	documentationUrl: string;
	properties: Array<{
		name: string;
		displayName: string;
	}>;
};

export class EmarsysLoyaltyApi implements ICredentialType {
  name = credentialParam?.name;
  displayName = credentialParam?.displayName;
  documentationUrl = credentialParam?.documentationUrl;
  properties: INodeProperties[] = [
    {
      displayName: 'Name',
      name: 'x-api-key',
      type: 'string',
      default: '',
      required: true,
      description: '',
    },
    {
      displayName: 'Value',
      name: credentialParam?.properties[1]?.name,
      type: 'string',
      default: '',
      required: true,
      description: '',
    },
  ];

  authenticate = {
    type: 'generic' as const,
    properties: {
      headers: {
        '={{$credentials.name}}': '={{$credentials.value}}',
      },
    },
  };
}

module.exports = {
  EmarsysLoyaltyApi,
};
