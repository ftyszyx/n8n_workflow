import type {IExecuteFunctions} from 'n8n-workflow';
import type {Page} from 'playwright';
export async function navigateHandler(
    page: Page, executeFunctions: IExecuteFunctions,
    itemIndex: number): Promise<any> {
  const content = await page.content();
  const pageUrl = page.url();
  return {
    json: {content: content, url: pageUrl},
    pairedItem: {item: itemIndex}
  };
}
