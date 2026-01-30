#需求1：抖音文本内容提取
1. 用户输入抖音视频分享链接：

8.25 复制打开抖音，看看【AI硬件情报局的作品】这台国产小机器人众筹卷走两百多万，老外都抢着付钱 ... https://v.douyin.com/ZtNn--M8J4M/ 07/25 H@V.lC oDH:/ 

https://www.douyin.com/user/self?from_tab_name=main&modal_id=7588715160664980913&showTab=favorite_collection

2. 系统解析视频内容，下载视频文件,
3. 使用ffmpeg提取视频文件中的音频
4. 返回提取的文本内容及视频链接给用户
https://github.com/SYSTRAN/faster-whisper


#视频解析
8.25 复制打开抖音，看看【AI硬件情报局的作品】这台国产小机器人众筹卷走两百多万，老外都抢着付钱 ... https://v.douyin.com/ZtNn--M8J4M/ 07/25 H@V.lC oDH:/ 

获取：https://v.douyin.com/ZtNn--M8J4M/

请求时，获取跳转地址：
https://www.iesdouyin.com/share/video/7599985729380322570/?region=CN&mid=7599985805605391154&u_code=11bm89b83&did=MS4wLjABAAAAIb9uTtzhP-ORZwatcBgJeWp9fDWAD3AudZXiXCpbXtBBOhN65jpxymbn0KCNNvVP&iid=MS4wLjABAAAApJ_g4OORzyAQvXVxQSG3DPoMDjCXoNxkoWX2lw-4a0F0bY-nCPYz-4yQeQyjdVyv&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=U.3q4AcBPEfClzlbL9prDmqXv2vacQWkjbKH1yV_Crg-&share_version=360600&ts=1769661799&from_aid=1128&from_ssr=1&share_track_info=%7B%22link_description_type%22%3A%22%22%7D&utm_source=copy&utm_campaign=client_share&utm_medium=android&app=aweme&ug_share_id=35298662434989321769678941264&activity_info=%7B%22social_author_id%22%3A%2297110471865%22%2C%22social_share_id%22%3A%2283488159290_1769678941264%22%2C%22social_share_time%22%3A%221769678941%22%2C%22social_share_user_id%22%3A%2283488159290%22%7D&share_extra_params=%7B%22schema_type%22%3A%221%22%7D


//
匹配：aweme/v1/web/aweme/detail.*aweme_id=7599985729380322570 
application/json

# 环境安装 

1.whisper(本地离线)
- 本节点使用 faster-whisper(Python)进行语音转文字，需要安装 Python 和依赖
- 安装 Python：Python 3.9+
- 安装依赖：pip install faster-whisper -i https://mirrors.aliyun.com/pypi/simple/
- 说明：首次使用某些 model 可能会自动下载并缓存
- 节点参数配置
  - Binary Property：上游节点输出的二进制字段名(默认 data)
  - Python Path：python 可执行文件名或路径(默认 python)
  - Model：模型名(tiny/base/small/medium/large-v3/turbo)或本地 CTranslate2 模型目录
  - Device：cpu/cuda/auto
  - Compute Type：int8/float16等
  - Language：可选，zh/en，留空自动识别
  - Beam Size：解码 beam size
  - VAD Filter：可选，开启后会过滤静音/非语音
  - Additional Arguments：额外参数，会原样追加到 runner(例如 --task translate)
 