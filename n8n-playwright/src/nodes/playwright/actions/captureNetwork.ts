import type { INodeProperties } from 'n8n-workflow';
export const captureNetworkProperties: INodeProperties[] = [
  {
    displayName: 'url过滤类型',
    name: 'urlFilterType',
    type: 'options',
    options: [
      { name: 'Regex', value: 'regex' }, { name: 'Includes', value: 'includes' },
      { name: 'Starts With', value: 'startsWith' }, { name: 'Glob', value: 'glob' }
    ],
    default: 'regex',
    description: 'How to match the request URL',
    displayOptions: { show: { operation: ['captureNetwork'] } }
  },
  {
    displayName: 'url过滤内容',
    name: 'urlFilter',
    type: 'string',
    default: '',
    placeholder: 'api|graphql|/v1/',
    description:
      'Only capture requests whose URL matches this rule (empty = all)',
    displayOptions: { show: { operation: ['captureNetwork'] } }
  },
  {
    displayName: '返回内容类型',
    name: 'resourceTypes',
    type: 'multiOptions',
    options: [
      { name: 'Document', value: 'document' },
      { name: 'Stylesheet', value: 'stylesheet' },
      { name: "json", value: "application/json" },
      { name: "video", value: "video*" },
      { name: 'Image', value: 'image' },
      { name: 'Font', value: 'font' }, { name: 'Script', value: 'script' },
      { name: 'XHR', value: 'xhr' }, { name: 'Fetch', value: 'fetch' },
      { name: 'WebSocket', value: 'websocket' }, { name: 'Other', value: 'other' }
    ],
    default: [],
    description: 'Only capture requests of these resource types (empty = all)',
    displayOptions: { show: { operation: ['captureNetwork'] } }
  },
];
