import type { INodeProperties } from 'n8n-workflow';
export const browserProperties: INodeProperties[] = [
  {
    displayName: 'Browser',
    name: 'browser',
    type: 'options',
    options: [
      { name: 'Chromium', value: 'chromium' },
      { name: 'Firefox', value: 'firefox' }, { name: 'Webkit', value: 'webkit' }
    ],
    default: 'chromium'
  },
  {
    displayName: 'Browser Launch Options',
    name: 'browserOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    options: [
      {
        displayName: 'Headless',
        name: 'headless',
        type: 'boolean',
        default: true,
        description: 'Whether to run browser in headless mode'
      },
      // {
      //   displayName: 'Open DevTools (Chromium Only)',
      //   name: 'showDebug',
      //   type: 'boolean',
      //   default: false,
      //   description: 'Open DevTools and force headless=false for Chromium'
      // },
      {
        displayName: 'Slow Motion',
        name: 'slowMo',
        type: 'number',
        default: 0,
        description:
          'Slows down operations by the specified amount of milliseconds'
      },
      {
        displayName: 'Default Timeout (ms)',
        name: 'defaultTimeoutMs',
        type: 'number',
        default: 30000,
        description: 'Timeout for actions like click/fill/wait'
      },
      {
        displayName: 'Navigation Timeout (ms)',
        name: 'navigationTimeoutMs',
        type: 'number',
        default: 30000,
        description: 'Timeout for page.goto/navigation'
      }
    ]
  }
];
