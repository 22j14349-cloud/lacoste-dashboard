// Renders reel.html frame-by-frame with headless Chromium.
//   node render.mjs stills <outDir> <t1,t2,...>     -> PNG stills at the given seconds
//   node render.mjs video  <outDir> [workers=4]     -> chunk_N.mkv (lossless FFV1 RGB), one per worker
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(here, 'reel.html');
const [mode, outDir, arg] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

async function openPage() {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-accelerated-2d-canvas'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url);
  const info = await page.evaluate(() => window.READY);
  return { browser, page, info };
}
const decode = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

if (mode === 'stills') {
  const { browser, page, info } = await openPage();
  console.log('ready', info);
  const { writeFileSync } = await import('node:fs');
  for (const ts of arg.split(',')) {
    const f = Math.round(parseFloat(ts) * 60);
    const png = decode(await page.evaluate(f => window.renderFrame(f), f));
    writeFileSync(path.join(outDir, `still_${String(f).padStart(4, '0')}.png`), png);
  }
  await browser.close();
} else if (mode === 'video') {
  const workers = parseInt(arg || '4', 10), total = 900;
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    const { browser, page } = await openPage();
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'png', '-i', '-',
      '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', path.join(outDir, `chunk_${w}.mkv`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
    for (let f = a; f < b; f++) {
      const png = decode(await page.evaluate(f => window.renderFrame(f), f));
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - a) % 60 === 0) console.log(`worker ${w}: frame ${f} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    ff.stdin.end(); await done; await browser.close();
  }));
  console.log(`rendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
