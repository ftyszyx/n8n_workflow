import type {INodeProperties} from 'n8n-workflow';
export const operationProperty: INodeProperties[] = [{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  options: [
    {
      name: 'Click Element',
      value: 'clickElement',
      description: 'Click on an element',
      action: 'Click on an element'
    },
    {
      name: 'Fill Form',
      value: 'fillForm',
      description: 'Fill a form field',
      action: 'Fill a form field'
    },
    {
      name: 'Get Text',
      value: 'getText',
      description: 'Get text from an element',
      action: 'Get text from an element'
    },
    {
      name: 'Navigate',
      value: 'navigate',
      description: 'Navigate to a URL',
      action: 'Navigate to a URL'
    },
    {
      name: 'Run Custom Script',
      value: 'runCustomScript',
      description:
          'Execute custom JavaScript code with full Playwright API access',
      action: 'Run custom java script code'
    },
    {
      name: 'Take Screenshot',
      value: 'takeScreenshot',
      description: 'Take a screenshot of a webpage',
      action: 'Take a screenshot of a webpage'
    },
    {
      name: 'Capture Network',
      value: 'captureNetwork',
      description: 'Capture network requests and responses by filters',
      action: 'Capture network requests and responses'
    }
  ],
  default: 'navigate'
}];
