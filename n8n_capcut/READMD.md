#需求1：抖音文本内容提取
1. 用户输入抖音视频分享链接：

8.25 复制打开抖音，看看【AI硬件情报局的作品】这台国产小机器人众筹卷走两百多万，老外都抢着付钱 ... https://v.douyin.com/ZtNn--M8J4M/ 07/25 H@V.lC oDH:/ 

https://www.douyin.com/user/self?from_tab_name=main&modal_id=7588715160664980913&showTab=favorite_collection
2. 系统解析视频内容，下载视频文件，存储到阿里云oss,
3. 使用ffmpeg提取视频文件中的音频，将音频存储到阿里云oss
4. 使用百炼等工具识别音频中的文本内容
5. 返回提取的文本内容及视频链接给用户

whisper:https://github.com/openai/whisper


#视频解析
8.25 复制打开抖音，看看【AI硬件情报局的作品】这台国产小机器人众筹卷走两百多万，老外都抢着付钱 ... https://v.douyin.com/ZtNn--M8J4M/ 07/25 H@V.lC oDH:/ 

获取：https://v.douyin.com/ZtNn--M8J4M/

请求时，获取跳转地址：
https://www.iesdouyin.com/share/video/7599985729380322570/?region=CN&mid=7599985805605391154&u_code=11bm89b83&did=MS4wLjABAAAAIb9uTtzhP-ORZwatcBgJeWp9fDWAD3AudZXiXCpbXtBBOhN65jpxymbn0KCNNvVP&iid=MS4wLjABAAAApJ_g4OORzyAQvXVxQSG3DPoMDjCXoNxkoWX2lw-4a0F0bY-nCPYz-4yQeQyjdVyv&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=U.3q4AcBPEfClzlbL9prDmqXv2vacQWkjbKH1yV_Crg-&share_version=360600&ts=1769661799&from_aid=1128&from_ssr=1&share_track_info=%7B%22link_description_type%22%3A%22%22%7D&utm_source=copy&utm_campaign=client_share&utm_medium=android&app=aweme&ug_share_id=35298662434989321769678941264&activity_info=%7B%22social_author_id%22%3A%2297110471865%22%2C%22social_share_id%22%3A%2283488159290_1769678941264%22%2C%22social_share_time%22%3A%221769678941%22%2C%22social_share_user_id%22%3A%2283488159290%22%7D&share_extra_params=%7B%22schema_type%22%3A%221%22%7D

# 环境安装 
1. 