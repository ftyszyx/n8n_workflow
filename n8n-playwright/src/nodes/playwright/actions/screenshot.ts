import type {INodeProperties} from 'n8n-workflow';
export const screenshotProperties: INodeProperties[] = [
  {
    displayName: 'Property Name',
    name: 'dataPropertyName',
    type: 'string',
    required: true,
    default: 'screenshot',
    description:
        'Name of the binary property in which to store the screenshot data',
    displayOptions: {show: {operation: ['takeScreenshot']}}
  },
  {
    displayName: 'Screenshot Options',
    name: 'screenshotOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {show: {operation: ['takeScreenshot']}},
    options: [
      {
        displayName: 'Full Page',
        name: 'fullPage',
        type: 'boolean',
        default: false,
        description: 'Whether to take a screenshot of the full scrollable page'
      },
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '',
        description: 'The file path to save the screenshot to'
      }
    ]
  }
];
