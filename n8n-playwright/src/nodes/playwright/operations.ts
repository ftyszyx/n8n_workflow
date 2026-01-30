import type {IExecuteFunctions} from 'n8n-workflow';
import type {Page} from 'playwright';

import {captureNetworkHandler} from './actions/handlers/captureNetwork';
import {clickElementHandler} from './actions/handlers/clickElement';
import {fillFormHandler} from './actions/handlers/fillForm';
import {getTextHandler} from './actions/handlers/getText';
import {navigateHandler} from './actions/handlers/navigate';
import {takeScreenshotHandler} from './actions/handlers/takeScreenshot';

export async function handleOperation(
    operation: string, page: Page, executeFunctions: IExecuteFunctions,
    itemIndex: number): Promise<any> {
  switch (operation) {
    case 'navigate':
      return navigateHandler(page, executeFunctions, itemIndex);
    case 'takeScreenshot':
      return takeScreenshotHandler(page, executeFunctions, itemIndex);
    case 'getText':
      return getTextHandler(page, executeFunctions, itemIndex);
    case 'clickElement':
      return clickElementHandler(page, executeFunctions, itemIndex);
    case 'fillForm':
      return fillFormHandler(page, executeFunctions, itemIndex);
    case 'captureNetwork':
      return captureNetworkHandler(page, executeFunctions, itemIndex);

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}