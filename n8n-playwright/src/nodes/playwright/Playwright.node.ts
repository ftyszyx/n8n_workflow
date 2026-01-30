import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import type { INodeInputConfiguration, INodeOutputConfiguration, NodeConnectionType } from 'n8n-workflow';
import { platform } from 'os';
import { join } from 'path';

import { installBrowser } from '../scripts/setup-browsers';

import { playwrightProperties } from './actions';
import { BrowserType } from './config';
import { runCustomScript } from './customScript';
import { handleOperation } from './operations';
import { IBrowserOptions } from './types';
import { getBrowserExecutablePath } from './utils';

async function safeCloseBrowser(browser: any, context: any, page: any, timeoutMs = 15000) {
  const withTimeout = (p: Promise<any>) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), timeoutMs))]);
  try { if (page) await withTimeout(page.close().catch(() => { })); } catch { }
  try { if (context) await withTimeout(context.close().catch(() => { })); } catch { }
  try { if (browser) await withTimeout(browser.close()); return; } catch { }
  try { if (browser?.process?.()) browser.process().kill(); } catch { }
}

export class Playwright implements INodeType {
  description: INodeTypeDescription = {
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
    inputs: [{
      displayName: 'Input',
      type: 'main' as unknown as NodeConnectionType
    } as INodeInputConfiguration],
    outputs: [{
      displayName: 'Output',
      type: 'main' as unknown as NodeConnectionType
    } as INodeOutputConfiguration],

    properties: playwrightProperties,
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
        if (typeof browserOptions.defaultTimeoutMs === 'number') page.setDefaultTimeout(browserOptions.defaultTimeoutMs);
        if (typeof browserOptions.navigationTimeoutMs === 'number') page.setDefaultNavigationTimeout(browserOptions.navigationTimeoutMs);

        let result;

        try {
          if (operation === 'runCustomScript') {
            console.log(`Processing ${i + 1} of ${items.length}: [runCustomScript] Custom Script`);
            result = await runCustomScript(this, i, browser, page, playwright);
            returnData.push(...result);
          } else {
            if (operation !== 'captureNetwork') {
              const url = this.getNodeParameter('url', i) as string;
              await page.goto(url);
            }
            result = await handleOperation(operation, page, this, i);
            if (Array.isArray(result)) returnData.push(...result);
            else returnData.push(result);
          }
        } finally {
          await safeCloseBrowser(browser, context, page);
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