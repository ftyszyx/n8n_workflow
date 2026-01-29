import requests

headers = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "origin": "https://www.douyin.com",
    "priority": "i",
    "range": "bytes=0-",
    "referer": "https://www.douyin.com/",
    "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "video",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0",
}
url = "https://v95-web-sz.douyinvod.com/f5fbacc26eb86e908de588611aa3ddaa/697b5334/video/tos/cn/tos-cn-ve-15/ooPAFEI5NYBOiBDQxLQWAIau1K4QGwAihEiXv/"
params = {
    "a": "6383",
    "ch": "26",
    "cr": "3",
    "dr": "0",
    "lr": "all",
    "cd": "0|0|0|3",
    "cv": "1",
    "br": "785",
    "bt": "785",
    "cs": "0",
    "ds": "4",
    "ft": "GZnU0RqeffPdXP~ka1jNvAq-antLjrKF-xynRkaEgLvzljVhWL6",
    "mime_type": "video_mp4",
    "qs": "0",
    "rc": "ZTo4NTVkOjc2NGQ8ZWg6M0BpMzc0cHM5cmc7ODMzNGkzM0BjNDI1YjA0X2AxMl9eYTVjYSNrLS0uMmRrcHBhLS1kLTBzcw==",
    "btag": "80000e00028000",
    "cquery": "100o_100w_100B_100H_100K",
    "dy_q": "1769678994",
    "feature_id": "0ea98fd3bdc3c6c14a3d0804cc272721",
    "l": "20260129172954AE5A933011A41DC15A39",
    "__vid": "7599985729380322570",
}
out_path = "video.mp4"
with requests.get(url, headers=headers, params=params, stream=True, timeout=60) as response:
    response.raise_for_status()
    with open(out_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
print(f"Saved: {out_path}")
