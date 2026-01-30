import type {IExecuteFunctions} from 'n8n-workflow';
import type {Page} from 'playwright';
export async function fillFormHandler(
    page: Page, executeFunctions: IExecuteFunctions,
    itemIndex: number): Promise<any> {
  const formSelectorType =
      executeFunctions.getNodeParameter('selectorType', itemIndex) as string;
  const formSelector = formSelectorType === 'css' ?
      executeFunctions.getNodeParameter('selector', itemIndex) as string :
      executeFunctions.getNodeParameter('xpath', itemIndex) as string;
  const value = executeFunctions.getNodeParameter('value', itemIndex) as string;
  if (formSelectorType === 'css')
    await page.fill(formSelector, value);
  else
    await page.locator(`xpath=${formSelector}`).fill(value);
  return {
    json: {
      success: true,
      selectorType: formSelectorType,
      selector: formSelector,
      value
    },
    pairedItem: {item: itemIndex}
  };
}
