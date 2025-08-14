import {
  ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

const credentialParam = require('./headerAuthCredentialParams_emarsysLoyaltyApi.json') as {
	name: string;
	displayName: string;
	documentationUrl: string;
	properties: Array<{	name: string; displayName: string; }>;
};

export class EmarsysLoyaltyApi implements ICredentialType {
  name = credentialParam.name;
	extends = ['httpHeaderAuth'];
  displayName = credentialParam.displayName;
  documentationUrl = credentialParam.documentationUrl;

  properties = [
    {
      displayName: credentialParam.properties[0].displayName,
      name: 'name',
      type: 'hidden' as NodePropertyTypes,
      default: credentialParam.properties[0].name,
      required: true,
      description: 'the name of key for the header',
    },
    {
      displayName: credentialParam.properties[1].displayName,
      name: credentialParam.properties[1].name,
      type: 'string' as NodePropertyTypes,
      default: '',
      required: true,
      description: 'the value of key for the header',
			typeOptions: { password: true },
    },
  ];
}

module.exports = {
  EmarsysLoyaltyApi,
};
