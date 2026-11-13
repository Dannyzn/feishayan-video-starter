import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';

const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
if (spawnSync(ffmpeg,['-version'],{stdio:'ignore'}).status !== 0) {
  throw new Error('找不到 FFmpeg。安装后运行 ffmpeg -version，或设置 FFMPEG_PATH。');
}
const timing = JSON.parse(await readFile(new URL('timeline.json',import.meta.url),'utf8'));
const {duration,fps,width,height,spread,overflow} = timing;
if (![duration,fps,width,height,spread?.start,spread?.end,overflow?.start,overflow?.end].every(Number.isFinite)
  || !Number.isInteger(fps) || fps < 1 || !Number.isInteger(duration*fps)
  || ![width,height].every(n => Number.isInteger(n) && n > 0 && n%2 === 0)
  || !(0 <= spread.start && spread.start < spread.end && spread.end <= overflow.start
    && overflow.start < overflow.end && overflow.end <= duration)) {
  throw new Error('检查 timeline.json：铺滩完成后再开始越堰，画幅用偶数，时长×帧率应为整数。');
}
const folder = new URL('output/',import.meta.url);
await mkdir(folder,{recursive:true});
const output = new URL('feishayan.mp4',folder);
const pending = new URL('feishayan.pending.mp4',folder);
const {server,url} = await startServer();
let browser;
let encoder;
let completed;
try {
  const args = ['--use-angle=swiftshader','--enable-unsafe-swiftshader'];
  browser = await chromium.launch({args,...(process.env.PLAYWRIGHT_CHROME !== '0' ? {channel:'chrome'} : {})});
  const page = await browser.newPage();
  page.on('pageerror', error => console.error(error.message));
  await page.goto(url+'/?export=1');
  await page.waitForFunction(() => typeof window.renderFrame === 'function');
  encoder = spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe',
    '-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264',
    '-pix_fmt','yuv420p','-movflags','+faststart',fileURLToPath(pending)],{stdio:['pipe','ignore','inherit']});
  completed = new Promise((resolve,reject) => {
    encoder.once('error',reject);
    encoder.once('close',code => code === 0 ? resolve() : reject(new Error('FFmpeg 退出，代码 ' + code)));
  });
  completed.catch(() => {});
  encoder.stdin.on('error', () => {});
  for (let frame=0;frame<duration*fps;frame++) {
    const jpeg = await page.evaluate(t => {
      window.renderFrame(t);
      return document.querySelector('canvas').toDataURL('image/jpeg',.94).split(',')[1];
    }, frame/fps);
    if (!encoder.stdin.write(Buffer.from(jpeg,'base64'))) {
      await Promise.race([once(encoder.stdin,'drain'),completed]);
    }
    if (frame%fps === 0) console.log('渲染 '+frame/fps+' / '+duration+' 秒');
  }
  encoder.stdin.end();
  await completed;
  await rename(pending,output);
  console.log(fileURLToPath(output));
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (completed) await completed.catch(() => {});
  try {
    if (browser) await browser.close();
  } finally {
    server.close();
    await rm(pending,{force:true});
  }
}

