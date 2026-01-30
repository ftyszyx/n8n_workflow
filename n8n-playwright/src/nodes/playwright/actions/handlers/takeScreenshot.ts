import type {IExecuteFunctions} from 'n8n-workflow';
import type {Page} from 'playwright';
export async function takeScreenshotHandler(
    page: Page, executeFunctions: IExecuteFunctions,
    itemIndex: number): Promise<any> {
  const screenshotOptions =
      executeFunctions.getNodeParameter('screenshotOptions', itemIndex);
  const dataPropertyName =
      executeFunctions.getNodeParameter('dataPropertyName', itemIndex) ||
      'screenshot';
  const screenshot = await page.screenshot(screenshotOptions as any);
  const binaryData = await executeFunctions.helpers.prepareBinaryData(
      Buffer.from(screenshot),
      (screenshotOptions as {path?: string}).path || dataPropertyName,
      'image/png');
  return {
    binary: {[dataPropertyName]: binaryData},
    json: {success: true, url: page.url()},
    pairedItem: {item: itemIndex}
  };
}
