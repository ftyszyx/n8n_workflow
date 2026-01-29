import {IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription} from 'n8n-workflow';
import {platform} from 'os';
import {join} from 'path';

import {installBrowser} from '../scripts/setup-browsers';

import {BrowserType} from './config';
import {runCustomScript} from './customScript';
import {handleOperation} from './operations';
import {IBrowserOptions} from './types';
import {getBrowserExecutablePath} from './utils';

export class Playwright implements INodeType {
  description : INodeTypeDescription = {
    displayName: 'Playwright',
    name: 'playwright',
    icon: 'file:playwright.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Automate browser actions using Playwright',
    defaults: {
        name: 'Playwright',
    },
    inputs: ['main'],
    outputs: ['main'],

    properties: [
        {
            displayName: 'Operation',
            name: 'operation',
            type: 'options',
            noDataExpression: true,
            options: [
                {
                    name: 'Click Element',
                    value: 'clickElement',
                    description: 'Click on an element',
                    action: 'Click on an element',
                },
                {
                    name: 'Fill Form',
                    value: 'fillForm',
                    description: 'Fill a form field',
                    action: 'Fill a form field',
                },
                {
                    name: 'Get Text',
                    value: 'getText',
                    description: 'Get text from an element',
                    action: 'Get text from an element',
                },
                {
                    name: 'Navigate',
                    value: 'navigate',
                    description: 'Navigate to a URL',
                    action: 'Navigate to a URL',
                },
                {
                    name: 'Run Custom Script',
                    value: 'runCustomScript',
                    description: 'Execute custom JavaScript code with full Playwright API access',
                    action: 'Run custom java script code',
                },
                {
                    name: 'Take Screenshot',
                    value: 'takeScreenshot',
                    description: 'Take a screenshot of a webpage',
                    action: 'Take a screenshot of a webpage',
                },
                {
                    name: 'Capture Network',
                    value: 'captureNetwork',
                    description: 'Capture network requests and responses by filters',
                    action: 'Capture network requests and responses',
                }
            ],
            default: 'navigate',
        },

        {
            displayName: 'URL',
            name: 'url',
            type: 'string',
            default: '',
            placeholder: 'https://example.com',
            description: 'The URL to navigate to',
            displayOptions: {
                show: {
                    operation: ['navigate', 'takeScreenshot', 'getText', 'clickElement', 'fillForm', 'captureNetwork'],
                },
            },
            required: true,
        },
        {
            displayName: 'URL Filter Mode',
            name: 'urlFilterType',
            type: 'options',
            options: [
                { name: 'Regex', value: 'regex' },
                { name: 'Includes', value: 'includes' },
                { name: 'Starts With', value: 'startsWith' },
            ],
            default: 'regex',
            description: 'How to match the request URL',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'URL Filter',
            name: 'urlFilter',
            type: 'string',
            default: '',
            placeholder: 'api|graphql|/v1/',
            description: 'Only capture requests whose URL matches this rule (empty = all)',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Response Content-Type Filter Mode',
            name: 'contentTypeFilterType',
            type: 'options',
            options: [
                { name: 'Regex', value: 'regex' },
                { name: 'Includes', value: 'includes' },
                { name: 'Starts With', value: 'startsWith' },
            ],
            default: 'regex',
            description: 'How to match the response Content-Type header',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Response Content-Type Filter',
            name: 'contentTypeFilter',
            type: 'string',
            default: '',
            placeholder: 'json|text|html',
            description: 'Only keep responses whose Content-Type matches this rule (empty = all)',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Resource Types',
            name: 'resourceTypes',
            type: 'multiOptions',
            options: [
                { name: 'Document', value: 'document' },
                { name: 'Stylesheet', value: 'stylesheet' },
                { name: 'Image', value: 'image' },
                { name: 'Media', value: 'media' },
                { name: 'Font', value: 'font' },
                { name: 'Script', value: 'script' },
                { name: 'XHR', value: 'xhr' },
                { name: 'Fetch', value: 'fetch' },
                { name: 'WebSocket', value: 'websocket' },
                { name: 'Other', value: 'other' },
            ],
            default: [],
            description: 'Only capture requests of these resource types (empty = all)',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Include Request Headers',
            name: 'includeRequestHeaders',
            type: 'boolean',
            default: true,
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Include Request Post Data',
            name: 'includeRequestPostData',
            type: 'boolean',
            default: false,
            description: 'Include request post body for POST/PUT requests',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Include Response Headers',
            name: 'includeResponseHeaders',
            type: 'boolean',
            default: true,
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Include Response Body',
            name: 'includeResponseBody',
            type: 'options',
            options: [
                { name: 'None', value: 'none' },
                { name: 'Text (UTF-8)', value: 'text' },
                { name: 'Base64', value: 'base64' },
            ],
            default: 'none',
            description: 'Whether to include response body content',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Max Response Body Bytes',
            name: 'maxResponseBodyBytes',
            type: 'number',
            default: 1048576,
            description: 'Limit response body size to avoid huge memory usage (0 = unlimited)',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Max Captured Records',
            name: 'maxCaptured',
            type: 'number',
            default: 200,
            description: 'Stop capturing after this many matched requests',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Wait For Load State',
            name: 'waitForLoadState',
            type: 'options',
            options: [
                { name: 'Network Idle', value: 'networkidle' },
                { name: 'Load', value: 'load' },
                { name: 'DOM Content Loaded', value: 'domcontentloaded' },
                { name: 'None', value: 'none' },
            ],
            default: 'networkidle',
            description: 'When to consider navigation finished',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Extra Wait (Ms)',
            name: 'extraWaitMs',
            type: 'number',
            default: 0,
            description: 'Wait extra time after navigation to capture late requests',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },
        {
            displayName: 'Output Mode',
            name: 'outputMode',
            type: 'options',
            options: [
                { name: 'Single Item (Records Array)', value: 'singleItem' },
                { name: 'One Item Per Record', value: 'items' },
            ],
            default: 'singleItem',
            displayOptions: { show: { operation: ['captureNetwork'] } },
        },

        // Custom Script Code
        {
            displayName: 'Script Code',
            name: 'scriptCode',
            type: 'string',
            typeOptions: {
                editor: 'codeNodeEditor',
                editorLanguage: 'javaScript',
            },
            required: true,
            default: `// Navigate to a URL
await $page.goto('https://example.com');

// Get page title
const title = await $page.title();
console.log('Page title:', title);

// Take a screenshot
const screenshot = await $page.screenshot({ type: 'png' });

// Return results
return [{
    json: { 
        title,
        url: $page.url()
    },
    binary: {
        screenshot: await $helpers.prepareBinaryData(
            Buffer.from(screenshot),
            'screenshot.png',
            'image/png'
        )
    }
}];`,
            description: 'JavaScript code to execute with Playwright. Access $page, $browser, $playwright, and all n8n Code node variables.',
            noDataExpression: true,
            displayOptions: {
                show: {
                    operation: ['runCustomScript'],
                },
            },
        },

        {
            displayName: 'Use <code>$page</code>, <code>$browser</code>, or <code>$playwright</code> to access Playwright. <a target="_blank" href="https://docs.n8n.io/code-examples/methods-variables-reference/">Special vars/methods</a> are available. <br><br>Debug by using <code>console.log()</code> statements and viewing their output in the browser console.',
            name: 'notice',
            type: 'notice',
            displayOptions: {
                show: {
                    operation: ['runCustomScript'],
                },
            },
            default: '',
        },

        {
            displayName: 'Property Name',
            name: 'dataPropertyName',
            type: 'string',
            required: true,
            default: 'screenshot',
            description: 'Name of the binary property in which to store the screenshot data',
            displayOptions: {
                show: {
                    operation: ['takeScreenshot'],
                },
            },
        },
        
        // Selector Type
        {
            displayName: 'Selector Type',
            name: 'selectorType',
            type: 'options',
            options: [
                {
                    name: 'CSS Selector',
                    value: 'css',
                    description: 'Use CSS selector (e.g., #submit-button, .my-class)',
                },
                {
                    name: 'XPath',
                    value: 'xpath',
                    description: 'Use XPath expression (e.g., //button[@ID="submit"])',
                }
            ],
            default: 'css',
            description: 'Choose between CSS selector or XPath',
            displayOptions: {
                show: {
                    operation: ['getText', 'clickElement', 'fillForm'],
                },
            },
        },
        
        // CSS Selector field
        {
            displayName: 'CSS Selector',
            name: 'selector',
            type: 'string',
            default: '',
            placeholder: '#submit-button',
            description: 'CSS selector for the element (e.g., #ID, .class, button[type="submit"])',
            displayOptions: {
                show: {
                    operation: ['getText', 'clickElement', 'fillForm'],
                    selectorType: ['css'],
                },
            },
            required: true,
        },
        
        // XPath field
        {
            displayName: 'XPath',
            name: 'xpath',
            type: 'string',
            default: '',
            placeholder: '//button[@ID="submit"]',
            description: 'XPath expression for the element (e.g., //div[@class="content"], //button[text()="Click Me"])',
            displayOptions: {
                show: {
                    operation: ['getText', 'clickElement', 'fillForm'],
                    selectorType: ['xpath'],
                },
            },
            required: true,
        },
        
        {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value to fill in the form field',
            displayOptions: {
                show: {
                    operation: ['fillForm'],
                },
            },
            required: true,
        },
        {
            displayName: 'Browser',
            name: 'browser',
            type: 'options',
            options: [
                {
                    name: 'Chromium',
                    value: 'chromium',
                },
                {
                    name: 'Firefox',
                    value: 'firefox',
                },
                {
                    name: 'Webkit',
                    value: 'webkit',
                },
            ],
            default: 'chromium',
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
                    description: 'Whether to run browser in headless mode',
                },
                {
                    displayName: 'Slow Motion',
                    name: 'slowMo',
                    type: 'number',
                    default: 0,
                    description: 'Slows down operations by the specified amount of milliseconds',
                }
            ],
        },
        {
            displayName: 'Screenshot Options',
            name: 'screenshotOptions',
            type: 'collection',
            placeholder: 'Add Option',
            default: {},
            displayOptions: {
                show: {
                    operation: ['takeScreenshot'],
                },
            },
            options: [
                {
                    displayName: 'Full Page',
                    name: 'fullPage',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to take a screenshot of the full scrollable page',
                },
                {
                    displayName: 'Path',
                    name: 'path',
                    type: 'string',
                    default: '',
                    description: 'The file path to save the screenshot to',
                },
            ],
        },
    ],
};

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;
      const browserType = this.getNodeParameter('browser', i) as BrowserType;
      const browserOptions =
          this.getNodeParameter('browserOptions', i) as IBrowserOptions;

      try {
        const playwright = require('playwright');
        const browsersPath = join(__dirname, '..', 'browsers');

        // Get browser executable path
        let executablePath;
        try {
          executablePath = getBrowserExecutablePath(browserType, browsersPath);
        } catch (error: any) {
          console.error(`Browser path error: ${error.message}`);
          await installBrowser(browserType);
          executablePath = getBrowserExecutablePath(browserType, browsersPath);
        }

        console.log(`Launching browser from: ${executablePath}`);

        const browser = await playwright[browserType].launch({
          headless: browserOptions.headless !== false,
          slowMo: browserOptions.slowMo || 0,
          executablePath,
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        let result;

        if (operation === 'runCustomScript') {
          // Custom script doesn't need URL navigation beforehand
          console.log(`Processing ${i + 1} of ${
              items.length}: [runCustomScript] Custom Script`);
          result = await runCustomScript(this, i, browser, page, playwright);
          await browser.close();
          returnData.push(...result);
        } else {
          if (operation !== 'captureNetwork') {
            const url = this.getNodeParameter('url', i) as string;
            await page.goto(url);
          }
          result = await handleOperation(operation, page, this, i);
          await browser.close();
          if (Array.isArray(result))
            returnData.push(...result);
          else
            returnData.push(result);
        }
      } catch (error: any) {
        console.error(`Browser launch error:`, error);
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              browserType,
              os: platform(),
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}