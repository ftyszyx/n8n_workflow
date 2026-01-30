import type {IExecuteFunctions} from 'n8n-workflow';
import type {Page} from 'playwright';
export async function getTextHandler(
    page: Page, executeFunctions: IExecuteFunctions,
    itemIndex: number): Promise<any> {
  const selectorType =
      executeFunctions.getNodeParameter('selectorType', itemIndex) as string;
  const textSelector = selectorType === 'css' ?
      executeFunctions.getNodeParameter('selector', itemIndex) as string :
      executeFunctions.getNodeParameter('xpath', itemIndex) as string;
  const textElement = selectorType === 'css' ?
      await page.$(textSelector) :
      await page.locator(`xpath=${textSelector}`).first();
  const text = await textElement?.textContent();
  return {
    json: {text, selectorType, selector: textSelector},
    pairedItem: {item: itemIndex}
  };
}
