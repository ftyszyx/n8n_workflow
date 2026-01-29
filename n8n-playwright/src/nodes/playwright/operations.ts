import { IExecuteFunctions } from 'n8n-workflow';
import { Page, Request, Response } from 'playwright';

type StringMatchMode = 'regex' | 'includes' | 'startsWith';
function buildStringMatcher(mode: StringMatchMode, pattern: string): (value: string) => boolean {
    const p = (pattern ?? '').toString();
    if (!p) return () => true;
    if (mode === 'startsWith') return (v: string) => (v ?? '').toString().startsWith(p);
    if (mode === 'includes') return (v: string) => (v ?? '').toString().includes(p);
    try {
        const re = new RegExp(p);
        return (v: string) => re.test((v ?? '').toString());
    } catch {
        return (v: string) => (v ?? '').toString().includes(p);
    }
}

export async function handleOperation(
    operation: string,
    page: Page,
    executeFunctions: IExecuteFunctions,
    itemIndex: number
): Promise<any> {
    switch (operation) {
        case 'navigate': {
            const content = await page.content();
            const pageUrl = page.url();
            return {
                json: {
                    content: content,
                    url: pageUrl
                },
                pairedItem: {
                    item: itemIndex
                }
            };
        }

        case 'takeScreenshot':
            const screenshotOptions = executeFunctions.getNodeParameter('screenshotOptions', itemIndex);
            const dataPropertyName = executeFunctions.getNodeParameter('dataPropertyName', itemIndex) || 'screenshot';
            const screenshot = await page.screenshot(screenshotOptions as any);

            // Prepare binary data using n8n's helper
            const binaryData = await executeFunctions.helpers.prepareBinaryData(
                Buffer.from(screenshot),
                (screenshotOptions as { path?: string }).path || dataPropertyName,
                'image/png'
            );

            return {
                binary: {
                    [dataPropertyName]: binaryData
                },
                json: {
                    success: true,
                    url: page.url()
                },
                pairedItem: {
                    item: itemIndex
                }
            };

        case 'getText':
            const selectorType = executeFunctions.getNodeParameter('selectorType', itemIndex) as string;
            const textSelector = selectorType === 'css' 
                ? executeFunctions.getNodeParameter('selector', itemIndex) as string
                : executeFunctions.getNodeParameter('xpath', itemIndex) as string;
            
            let textElement;
            if (selectorType === 'css') {
                textElement = await page.$(textSelector);
            } else {
                textElement = await page.locator(`xpath=${textSelector}`).first();
            }
            
            const text = selectorType === 'css' 
                ? await textElement?.textContent()
                : await textElement?.textContent();
            
            return {
                json: {
                    text,
                    selectorType,
                    selector: textSelector
                },
                pairedItem: {
                    item: itemIndex
                }
            };

        case 'clickElement':
            const clickSelectorType = executeFunctions.getNodeParameter('selectorType', itemIndex) as string;
            const clickSelector = clickSelectorType === 'css'
                ? executeFunctions.getNodeParameter('selector', itemIndex) as string
                : executeFunctions.getNodeParameter('xpath', itemIndex) as string;
            
            if (clickSelectorType === 'css') {
                await page.click(clickSelector);
            } else {
                await page.locator(`xpath=${clickSelector}`).click();
            }
            
            return {
                json: {
                    success: true,
                    selectorType: clickSelectorType,
                    selector: clickSelector
                },
                pairedItem: {
                    item: itemIndex
                }
            };

        case 'fillForm':
            const formSelectorType = executeFunctions.getNodeParameter('selectorType', itemIndex) as string;
            const formSelector = formSelectorType === 'css'
                ? executeFunctions.getNodeParameter('selector', itemIndex) as string
                : executeFunctions.getNodeParameter('xpath', itemIndex) as string;
            const value = executeFunctions.getNodeParameter('value', itemIndex) as string;
            
            if (formSelectorType === 'css') {
                await page.fill(formSelector, value);
            } else {
                await page.locator(`xpath=${formSelector}`).fill(value);
            }
            
            return {
                json: {
                    success: true,
                    selectorType: formSelectorType,
                    selector: formSelector,
                    value
                },
                pairedItem: {
                    item: itemIndex
                }
            };
        case 'captureNetwork': {
            const targetUrl = executeFunctions.getNodeParameter('url', itemIndex) as string;
            const urlFilterType = executeFunctions.getNodeParameter('urlFilterType', itemIndex) as StringMatchMode;
            const urlFilter = executeFunctions.getNodeParameter('urlFilter', itemIndex) as string;
            const contentTypeFilterType = executeFunctions.getNodeParameter('contentTypeFilterType', itemIndex) as StringMatchMode;
            const contentTypeFilter = executeFunctions.getNodeParameter('contentTypeFilter', itemIndex) as string;
            const resourceTypes = (executeFunctions.getNodeParameter('resourceTypes', itemIndex) as string[]) || [];
            const includeRequestHeaders = executeFunctions.getNodeParameter('includeRequestHeaders', itemIndex) as boolean;
            const includeRequestPostData = executeFunctions.getNodeParameter('includeRequestPostData', itemIndex) as boolean;
            const includeResponseHeaders = executeFunctions.getNodeParameter('includeResponseHeaders', itemIndex) as boolean;
            const includeResponseBody = executeFunctions.getNodeParameter('includeResponseBody', itemIndex) as 'none' | 'text' | 'base64';
            const maxResponseBodyBytes = executeFunctions.getNodeParameter('maxResponseBodyBytes', itemIndex) as number;
            const maxCaptured = executeFunctions.getNodeParameter('maxCaptured', itemIndex) as number;
            const waitForLoadState = executeFunctions.getNodeParameter('waitForLoadState', itemIndex) as 'load' | 'domcontentloaded' | 'networkidle' | 'none';
            const extraWaitMs = executeFunctions.getNodeParameter('extraWaitMs', itemIndex) as number;
            const outputMode = executeFunctions.getNodeParameter('outputMode', itemIndex) as 'singleItem' | 'items';
            const urlMatch = buildStringMatcher(urlFilterType, urlFilter);
            const contentTypeMatch = buildStringMatcher(contentTypeFilterType, contentTypeFilter);
            const requestToId = new WeakMap<Request, number>();
            const recordById = new Map<number, any>();
            const records: any[] = [];
            let nextId = 1;
            const onRequest = (req: Request) => {
                if (records.length >= maxCaptured) return;
                const reqUrl = req.url();
                if (!urlMatch(reqUrl)) return;
                const rType = req.resourceType();
                if (resourceTypes.length && !resourceTypes.includes(rType)) return;
                const id = nextId++;
                requestToId.set(req, id);
                const rec: any = {
                    id,
                    request: {
                        url: reqUrl,
                        method: req.method(),
                        resourceType: rType,
                        timestampMs: Date.now(),
                    },
                };
                if (includeRequestHeaders) rec.request.headers = req.headers();
                if (includeRequestPostData) rec.request.postData = req.postData();
                recordById.set(id, rec);
                records.push(rec);
            };
            const onResponse = async (res: Response) => {
                const req = res.request();
                const id = requestToId.get(req);
                if (!id) return;
                const rec = recordById.get(id);
                if (!rec) return;
                let headers: Record<string, string> = {};
                try {
                    headers = res.headers();
                } catch {}
                const contentType = headers['content-type'] || headers['Content-Type'] || '';
                if (!contentTypeMatch(contentType)) return;
                const responseData: any = {
                    url: res.url(),
                    status: res.status(),
                    statusText: res.statusText(),
                    ok: res.ok(),
                    contentType,
                    timestampMs: Date.now(),
                };
                if (includeResponseHeaders) responseData.headers = headers;
                if (includeResponseBody !== 'none') {
                    try {
                        const body = await res.body();
                        const limited = maxResponseBodyBytes > 0 && body.length > maxResponseBodyBytes ? body.subarray(0, maxResponseBodyBytes) : body;
                        responseData.bodyTruncated = limited.length !== body.length;
                        if (includeResponseBody === 'base64') responseData.bodyBase64 = Buffer.from(limited).toString('base64');
                        if (includeResponseBody === 'text') responseData.bodyText = Buffer.from(limited).toString('utf8');
                    } catch (e: any) {
                        responseData.bodyError = e?.message ?? 'Failed to read response body';
                    }
                }
                rec.response = responseData;
            };
            page.on('request', onRequest);
            page.on('response', onResponse);
            const gotoOptions: any = {};
            if (waitForLoadState !== 'none') gotoOptions.waitUntil = waitForLoadState;
            await page.goto(targetUrl, gotoOptions);
            if (extraWaitMs > 0) await page.waitForTimeout(extraWaitMs);
            page.off('request', onRequest);
            page.off('response', onResponse);
            if (outputMode === 'items') {
                return records.map((r) => ({
                    json: r,
                    pairedItem: { item: itemIndex },
                }));
            }
            return {
                json: {
                    url: targetUrl,
                    matchedCount: records.length,
                    records,
                },
                pairedItem: { item: itemIndex },
            };
        }

        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}