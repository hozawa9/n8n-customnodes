import {
  ICredentialType,
  NodePropertyTypes,
} from 'n8n-workflow';

export class EmarsysLoyaltyApi implements ICredentialType {
  name = 'emarsysLoyaltyApi';
  displayName = 'Emarsys Loyalty API';
  documentationUrl = '';
  properties = [
    {
      displayName: 'Name',
      name: 'name',
      type: 'string' as NodePropertyTypes,
      default: '',
      required: true,
      description: 'The name of the header to set, e.g., Authorization.',
    },
    {
      displayName: 'Value',
      name: 'value',
      type: 'string' as NodePropertyTypes,
      default: '',
      required: true,
      description: 'The value to use in the header. Include Bearer prefix if needed.',
    },
    {
      displayName: 'Ignore SSL Issues',
      name: 'allowUnauthorizedCerts',
      type: 'boolean' as NodePropertyTypes,
      default: false,
      description: 'Set to true to allow self-signed SSL certificates',
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
