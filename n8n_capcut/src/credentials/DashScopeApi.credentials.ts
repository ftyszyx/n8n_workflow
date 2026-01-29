import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DashScopeApi implements ICredentialType {
	name = 'dashScopeApi';
	displayName = 'DashScope API';
	documentationUrl = 'https://help.aliyun.com/zh/model-studio/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
}
