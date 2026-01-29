import type {IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription,} from 'n8n-workflow';

function extractFirstUrl(text: string): string|null {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m?.[0] ?? null;
}

function sanitizeTitle(title: string): string {
  return (title || '').trim().replace(/[\\/:*?"<>|]/g, '_');
}

export class DouyinParse implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Douyin Parse',
    name: 'douyinParse',
    icon: 'file:douyin.svg',
    group: ['transform'],
    version: 1,
    description:
        'Parse Douyin share text/link and extract non-watermarked download URL',
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
      const lines =
          (shareText || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (!lines.length) throw new Error('Share Text or Link is empty');
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const shareUrl = extractFirstUrl(line);
        if (!shareUrl)
          throw new Error(`No valid URL found in line ${lineIndex + 1}`);
        let videoId: string|null = null;
        try {
          const u = new URL(shareUrl);
          videoId =
              u.searchParams.get('modal_id') || u.searchParams.get('video_id');
        } catch {
          // ignore
        }
        if (!videoId) {
          try {
            const res = (await this.helpers.httpRequest({
                          method: 'GET',
                          url: shareUrl,
                          headers: {'User-Agent': userAgent},
                          disableFollowRedirect: true,
                          returnFullResponse: true,
                          ignoreHttpStatusErrors: true,
                        })) as any;
            const location = res?.headers?.location;
            const finalUrl: string|undefined =
                Array.isArray(location) ? location[0] : location;
            if (finalUrl) {
              const m = finalUrl.match(/\/video\/(\d+)/i);
              if (m) videoId = m[1];
            }
          } catch {
            // ignore
          }
        }
        if (!videoId) {
          const m = shareUrl.match(/\/video\/(\d+)/i);
          if (m) videoId = m[1];
        }
        if (!videoId)
          throw new Error(`Unable to extract videoId from share URL (line ${
              lineIndex + 1})`);
        const iesUrl = `https://www.iesdouyin.com/share/video/${videoId}`;
        const html = (await this.helpers.httpRequest({
                       method: 'GET',
                       url: iesUrl,
                       headers: {'User-Agent': userAgent},
                     })) as string;
        const match = html.match(/window\._ROUTER_DATA\s*=\s*(.*?)<\/script>/s);
        if (!match?.[1])
          throw new Error(
              `Failed to parse ROUTER_DATA from HTML (line ${lineIndex + 1})`);
        let routerData: any;
        try {
          routerData = JSON.parse(match[1].trim());
        } catch {
          throw new Error(
              `ROUTER_DATA is not valid JSON (line ${lineIndex + 1})`);
        }
        const VIDEO_ID_PAGE_KEY = 'video_(id)/page';
        const NOTE_ID_PAGE_KEY = 'note_(id)/page';
        const loaderData = routerData?.loaderData;
        const videoInfoRes = loaderData?.[VIDEO_ID_PAGE_KEY]?.videoInfoRes ||
            loaderData?.[NOTE_ID_PAGE_KEY]?.videoInfoRes;
        const data = videoInfoRes?.item_list?.[0];
        if (!data)
          throw new Error(
              `Missing item_list[0] in videoInfoRes (line ${lineIndex + 1})`);
        let downloadUrl: string|undefined =
            data?.video?.play_addr?.url_list?.[0];
        if (!downloadUrl)
          throw new Error(
              `Missing video.play_addr.url_list[0] (line ${lineIndex + 1})`);
        downloadUrl = downloadUrl.replace('playwm', 'play');
        const title = sanitizeTitle(data?.desc || `douyin_${videoId}`);
        returnData.push(
            {json: {videoId, title, downloadUrl, iesUrl, shareUrl}});
      }
    }

    return [returnData];
  }
}
