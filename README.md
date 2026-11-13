# 飞沙堰动画入门模板

用 Three.js 搭一个固定机位的飞沙堰教学示意。8 秒内看水铺满石滩、漫过低堰、顺坡汇入外江。模型由几何体组成，时间按教学需要编排。

## 从下载到第一条 MP4

1. 安装 Node.js 22 或更新版本、Google Chrome、带 libx264 的 FFmpeg。终端运行 `node -v`、`npm -v`、`ffmpeg -version`，确认都能显示版本。
2. 解压 ZIP，在解压后的目录打开终端，运行以下命令。Windows PowerShell 如果限制运行 npm.ps1，可用 `npm.cmd` 替代 `npm`。

```bash
npm ci
npm run preview
```

打开终端打印的 `http://127.0.0.1:4173`，可以暂停和拖动时间条。另开一个终端，在同一目录导出：

```bash
npm run render
```

导出脚本会自行启动临时本地服务，也可以跳过预览直接导出。成片在 `output/feishayan.mp4`，1080 × 1920、24 fps、8 秒，无声。再次导出会更新这个文件。

默认使用已安装的 Chrome。要改用 Playwright 自带 Chromium，可先运行 `npx playwright install chromium`，再设置环境变量 `PLAYWRIGHT_CHROME=0`。如果 FFmpeg 未加入 PATH，可把环境变量 `FFMPEG_PATH` 指向它的完整路径。

## 改第一处时间

打开 `timeline.json`，把 `overflow.start` 从 4.1 改成 4.8，再刷新预览。滩面铺满后会多停 0.7 秒，越堰动作也会更集中。想保持原来的越堰速度，可以把 `overflow.end` 从 6.4 一并改成 7.1。满意后再运行 `npm run render`。

| 字段 | 默认秒数 | 画面变化 |
| --- | --- | --- |
| spread.start / spread.end | 0.6 / 3.6 | 水的前缘从内江逐渐铺到堰脚 |
| overflow.start / overflow.end | 4.1 / 6.4 | 薄层水先跨过堰顶，再顺坡连接外江 |
| duration | 8 | 留到片尾看水纹继续移动 |

保持铺滩结束早于或等于越堰开始，越堰结束不超过总时长。时间单位统一是秒。

## 代码怎么连起来

`scene.mjs` 用 `renderFrame(t)` 画出任意秒数的场景。两条平滑曲线分别推进滩面和越堰薄层，水纹也按同一个时间值计算。相机固定，拖进度和导出看到的是同一套状态。 `render.mjs` 用 Playwright 按 `帧号 / 帧率` 调用这个函数，Canvas 的 JPEG 帧通过管道交给 FFmpeg 编码。

## 可以复制给 AI 的提示词

**调研并改成自己的选题**

> 我想用这个模板解释【问题】。请先找两份可核对的官方或一手资料，逐条给链接，说明每份资料能支持哪个动作。给我一个固定机位、8 秒内的白模方案，列出需要保留的空间参照和三个验收帧。先出分镜，再修改 scene.mjs 和 timeline.json。导出 MP4 并逐帧核对前、中、后。

**拿着上一版继续改**

> 我在【时间点】看到【具体问题】。我希望先看到【动作 A】，留【秒数】确认它发生，再看到【动作 B】。先定位时间参数，保持当前机位，优先改 timeline.json。重出 MP4，对照动作开始前、切换处和结束后的帧，告诉我改了哪几个值。

**接上自己的旁白**

> 用我的 WAV 和已确认的文案，标出三个动作对应的台词起止时间。把动作时间写进 timeline.json，再渲染画面。字幕使用确认稿，按同一条时间线用 FFmpeg 合成旁白和字幕。片尾留一拍，检查台词说完再切镜。

## 发布到自己的 GitHub

在 GitHub 创建空仓库后，在模板目录运行下面命令，把地址换成你的仓库。推送后可在仓库设置里启用 Template repository，也可以把 ZIP 上传为 Release 附件。

```bash
git init -b main
git add .
git commit -m "Add Feishayan video starter"
git remote add origin https://github.com/你的账号/feishayan-video-starter.git
git push -u origin main
```

公众号可以引用 Release 下载链接，或者仓库的 `Code → Download ZIP`。目录中的示例只使用程序生成的几何体，下载包可直接作为读者起步项目。

