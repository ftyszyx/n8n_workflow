import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, } from 'n8n-workflow';

function extractFirstUrl(text: string): string | null {
  const urls = text.match(/https?:\/\/[^\s]+/gi) || [];
  const short = urls.find((u) => /https?:\/\/v\.douyin\.com\//i.test(u));
  return short ?? urls[0] ?? null;
}

export class DouyinParse implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Douyin Parse',
    name: 'douyinParse',
    icon: 'file:douyin.svg',
    group: ['transform'],
    version: 1,
    description:
      'Extract Douyin v.douyin.com short link and resolve videoId',
    defaults: {
      name: 'Douyin Parse',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties:
      [
        {
          displayName: 'Share Text or Link',
          name: 'shareText',
          type: 'string',
          default: '',
          required: true,
          typeOptions: {
            rows: 10,
          },
          description:
            'Paste Douyin share text containing a URL or a direct URL. Supports multiple lines (one URL/share text per line).',
        },
        {
          displayName: 'User Agent',
          name: 'userAgent',
          type: 'string',
          default:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        },
      ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const shareText = this.getNodeParameter('shareText', itemIndex) as string;
      const userAgent = this.getNodeParameter('userAgent', itemIndex) as string;
      const resolveFinalUrl = async (inputUrl: string): Promise<string> => {
        let current = inputUrl;
        for (let i = 0; i < 8; i++) {
          const res = (await this.helpers.httpRequest({
            method: 'GET',
            url: current,
            headers: { 'User-Agent': userAgent },
            disableFollowRedirect: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
          })) as any;
          const status: number | undefined = res?.statusCode ?? res?.status;
          const location = res?.headers?.location;
          const loc: string | undefined = Array.isArray(location) ? location[0] : location;
          if (!loc) break;
          const next = new URL(loc, current).toString();
          if ([301, 302, 303, 307, 308].includes(status ?? -1)) {
            current = next;
            continue;
          }
          current = next;
          break;
        }
        return current;
      };
      const lines =
        (shareText || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (!lines.length) throw new Error('Share Text or Link is empty');
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const shortUrl = extractFirstUrl(line);
        if (!shortUrl)
          throw new Error(`No valid URL found in line ${lineIndex + 1}`);
        const finalUrl = await resolveFinalUrl(shortUrl);
        let videoId: string | null = null;
        try {
          const u = new URL(finalUrl);
          videoId =
            u.searchParams.get('modal_id') || u.searchParams.get('video_id');
        } catch {
          // ignore
        }
        if (!videoId) {
          const m = finalUrl.match(/\/share\/video\/(\d+)/i) || finalUrl.match(/\/video\/(\d+)/i);
          if (m) videoId = m[1] || null;
        }
        if (!videoId)
          throw new Error(`Unable to extract videoId from share URL (line ${lineIndex + 1})`);
        returnData.push({ json: { shortUrl, finalUrl, videoId } });
      }
    }

    return [returnData];
  }
}
