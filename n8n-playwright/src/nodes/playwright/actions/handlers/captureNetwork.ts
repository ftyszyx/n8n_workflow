import type { IExecuteFunctions } from 'n8n-workflow';
import type { Page, Request, Response } from 'playwright';
type StringMatchMode = 'regex' | 'includes' | 'startsWith' | 'glob';
function splitList(input: string): string[] { return (input ?? '').split(',').map((s) => s.trim()).filter(Boolean); }
function escapeRegExp(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function globToRegExp(glob: string): RegExp {
    let g = (glob ?? '').toString();
    if (!g) return /.*/;
    g = g.replace(/\\/g, '/');
    let out = '^';
    for (let i = 0; i < g.length; i++) {
        const c = g[i];
        if (c === '*') {
            const next = g[i + 1];
            if (next === '*') { out += '.*'; i++; } else out += '[^/]*';
            continue;
        }
        if (c === '?') { out += '[^/]'; continue; }
        if (c === '{') {
            const end = g.indexOf('}', i + 1);
            if (end > i) {
                const body = g.slice(i + 1, end);
                const parts = body.split(',').map((p) => escapeRegExp(p));
                out += `(?:${parts.join('|')})`;
                i = end;
                continue;
            }
        }
        out += escapeRegExp(c);
    }
    out += '$';
    return new RegExp(out);
}
function buildStringMatcher(mode: StringMatchMode, pattern: string): (value: string) => boolean {
    const p = (pattern ?? '').toString();
    if (!p) return () => true;
    if (mode === 'startsWith') return (v: string) => (v ?? '').toString().startsWith(p);
    if (mode === 'includes') return (v: string) => (v ?? '').toString().includes(p);
    if (mode === 'glob') { const re = globToRegExp(p); return (v: string) => re.test((v ?? '').toString().replace(/\\/g, '/')); }
    try { const re = new RegExp(p); return (v: string) => re.test((v ?? '').toString()); } catch { return (v: string) => (v ?? '').toString().includes(p); }
}

export async function captureNetworkHandler(page: Page, executeFunctions: IExecuteFunctions, itemIndex: number): Promise<any> {
    const targetUrl = executeFunctions.getNodeParameter('url', itemIndex) as string;
    const urlFilterType = executeFunctions.getNodeParameter('urlFilterType', itemIndex) as StringMatchMode;
    const urlFilter = executeFunctions.getNodeParameter('urlFilter', itemIndex) as string;
    const resourceTypes = (executeFunctions.getNodeParameter('resourceTypes', itemIndex) as string[]) || [];
    const urlMatch = buildStringMatcher(urlFilterType, urlFilter);
    const resourceTypeMatchers = resourceTypes.length ? resourceTypes.map((p) => buildStringMatcher('glob', p)) : [];
    const records: any[] = [];
    const onResponse = async (res: Response) => {
        const req = res.request();
        const url = req.url();
        if (!urlMatch(url)) return;
        // const resourceType = req.resourceType();
        const contentType = res.headers()['content-type'] || res.headers()['Content-Type'] || '';
        console.log("url", url, "contentType", contentType);
        if (resourceTypeMatchers.length > 0) {
            if (!resourceTypeMatchers.some((m) => m(contentType))) return;
        }
        const buf = await res.body();
        if (records.length > 0) return res;
        const result = {
            url,
            contentType,
            timestampMs: Date.now(),
            headers: res.headers(),
            body: {},
        }
        const text = buf?.toString('utf-8') || '';
        if (contentType.includes('application/json')) {
            result.body = JSON.parse(text);
        }
        else {
            result.body = text;
        }
        records.push(result);
        return res;
    };
    page.on('response', onResponse);
    await page.goto(targetUrl);
    while (records.length === 0) {
        await page.waitForTimeout(100);
    }
    page.off('response', onResponse);
    console.log("get records ok");
    return { json: { url: targetUrl, records }, pairedItem: { item: itemIndex } };
}
