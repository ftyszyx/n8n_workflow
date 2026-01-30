import type {INodeProperties} from 'n8n-workflow';
export const urlProperty: INodeProperties[] = [{
  displayName: 'URL',
  name: 'url',
  type: 'string',
  default: '',
  placeholder: 'https://example.com',
  description: 'The URL to navigate to',
  displayOptions: {
    show: {
      operation: [
        'navigate', 'takeScreenshot', 'getText', 'clickElement', 'fillForm',
        'captureNetwork'
      ]
    }
  },
  required: true
}];
