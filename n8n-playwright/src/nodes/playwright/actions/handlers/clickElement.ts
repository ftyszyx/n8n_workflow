import type {IExecuteFunctions} from 'n8n-workflow';
import type {Page} from 'playwright';
export async function clickElementHandler(
    page: Page, executeFunctions: IExecuteFunctions,
    itemIndex: number): Promise<any> {
  const clickSelectorType =
      executeFunctions.getNodeParameter('selectorType', itemIndex) as string;
  const clickSelector = clickSelectorType === 'css' ?
      executeFunctions.getNodeParameter('selector', itemIndex) as string :
      executeFunctions.getNodeParameter('xpath', itemIndex) as string;
  if (clickSelectorType === 'css')
    await page.click(clickSelector);
  else
    await page.locator(`xpath=${clickSelector}`).click();
  return {
    json: {
      success: true,
      selectorType: clickSelectorType,
      selector: clickSelector
    },
    pairedItem: {item: itemIndex}
  };
}
