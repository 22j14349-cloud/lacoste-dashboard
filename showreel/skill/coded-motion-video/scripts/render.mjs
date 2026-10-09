// Frame-by-frame renderer for a reel page built from templates/reel.html.
//
//   node render.mjs <reel.html> stills <outDir> <t1,t2,...>   PNG stills at the given SECONDS
//   node render.mjs <reel.html> video  <outDir> [workers=4]   chunk_N.mkv (lossless FFV1 RGB), one per worker
//
// The page must expose:
//   window.READY            -> Promise resolving to { frames, width, height, fps }
//   window.renderFrame(f)   -> PNG data URL of frame f (motion blur already applied)
//
// Every frame is a pure function of time, so workers render contiguous frame ranges in parallel.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

async function loadPlaywright() {
  const candidates = ['playwright', process.env.PLAYWRIGHT_MODULE, '/opt/node-tools/node_modules/playwright/index.mjs',
    '/usr/local/lib/node_modules/playwright/index.mjs', '/usr/lib/node_modules/playwright/index.mjs'].filter(Boolean);
  for (const c of candidates) {
    try { if (c.startsWith('/') && !existsSync(c)) continue; return (await import(c)).chromium; } catch { /* try next */ }
  }
  throw new Error('playwright not found: `npm i playwright` next to the reel, or set PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs');
}

const [reel, mode, outDir, arg] = process.argv.slice(2);
if (!reel || !mode || !outDir) {
  console.error('usage: node render.mjs <reel.html> stills <outDir> <t1,t2,...> | video <outDir> [workers]');
  process.exit(2);
}
const url = 'file://' + path.resolve(reel);
mkdirSync(outDir, { recursive: true });
const chromium = await loadPlaywright();

async function openPage() {
  // CPU raster is faster than SwiftShader GPU emulation in GPU-less containers.
  const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-accelerated-2d-canvas'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', e => console.error('[page error]', e.message));
  await page.goto(url);
  const info = await page.evaluate(() => window.READY);
  return { browser, page, info };
}
// canvas.toDataURL PNG (~15 ms at 1080p) is several times faster than page.screenshot.
const decode = d => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');

if (mode === 'stills') {
  const { browser, page, info } = await openPage();
  console.log('ready', info);
  for (const ts of arg.split(',')) {
    const f = Math.min(info.frames - 1, Math.round(parseFloat(ts) * info.fps));
    writeFileSync(path.join(outDir, `still_${String(f).padStart(5, '0')}.png`), decode(await page.evaluate(f => window.renderFrame(f), f)));
  }
  await browser.close();
} else if (mode === 'video') {
  const workers = parseInt(arg || '4', 10);
  const probe = await openPage(); const info = probe.info; await probe.browser.close();
  const per = Math.ceil(info.frames / workers), t0 = Date.now();
  console.log('ready', info);
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(info.frames, a + per);
    if (a >= b) return;
    const { browser, page } = await openPage();
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', path.join(outDir, `chunk_${String(w).padStart(2, '0')}.mkv`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
    for (let f = a; f < b; f++) {
      const png = decode(await page.evaluate(f => window.renderFrame(f), f));
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - a) % 120 === 0) console.log(`worker ${w}: frame ${f}/${info.frames} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    ff.stdin.end(); await done; await browser.close();
  }));
  console.log(`rendered ${info.frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else {
  console.error('unknown mode', mode); process.exit(2);
}
