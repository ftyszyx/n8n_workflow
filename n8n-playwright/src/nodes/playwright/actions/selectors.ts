import type {INodeProperties} from 'n8n-workflow';
export const selectorProperties: INodeProperties[] = [
  {
    displayName: 'Selector Type',
    name: 'selectorType',
    type: 'options',
    options: [
      {
        name: 'CSS Selector',
        value: 'css',
        description: 'Use CSS selector (e.g., #submit-button, .my-class)'
      },
      {
        name: 'XPath',
        value: 'xpath',
        description: 'Use XPath expression (e.g., //button[@ID="submit"])'
      }
    ],
    default: 'css',
    description: 'Choose between CSS selector or XPath',
    displayOptions: {show: {operation: ['getText', 'clickElement', 'fillForm']}}
  },
  {
    displayName: 'CSS Selector',
    name: 'selector',
    type: 'string',
    default: '',
    placeholder: '#submit-button',
    description:
        'CSS selector for the element (e.g., #ID, .class, button[type="submit"])',
    displayOptions: {
      show: {
        operation: ['getText', 'clickElement', 'fillForm'],
        selectorType: ['css']
      }
    },
    required: true
  },
  {
    displayName: 'XPath',
    name: 'xpath',
    type: 'string',
    default: '',
    placeholder: '//button[@ID="submit"]',
    description:
        'XPath expression for the element (e.g., //div[@class="content"], //button[text()="Click Me"])',
    displayOptions: {
      show: {
        operation: ['getText', 'clickElement', 'fillForm'],
        selectorType: ['xpath']
      }
    },
    required: true
  },
  {
    displayName: 'Value',
    name: 'value',
    type: 'string',
    default: '',
    description: 'Value to fill in the form field',
    displayOptions: {show: {operation: ['fillForm']}},
    required: true
  }
];
