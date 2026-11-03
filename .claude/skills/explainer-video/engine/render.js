// Render a built explainer to MP4: headless Chrome -> JPEG frames -> ffmpeg, effects via SOUND.renderOffline, voiceover ducked over effects.
// usage: node render.js <name>.local.html <voiceover audio> <out.mp4>
// Needs puppeteer-core + ffmpeg-static installed in this folder (npm i puppeteer-core ffmpeg-static).
const puppeteer = require('puppeteer-core'), { spawn, execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const FF = require('ffmpeg-static'), FPS = 30, DIR = process.cwd();
const [HTML, VO, OUT] = process.argv.slice(2);
if (!HTML || !VO || !OUT) { console.error('usage: node render.js <page.local.html> <voiceover> <out.mp4>'); process.exit(1); }
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--disable-gpu', '--window-size=1400,1400'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1400, height: 1400 });
  page.on('pageerror', (e) => console.error('PAGE', e.message));
  await page.goto('file:///' + path.resolve(HTML).split(path.sep).join('/'));
  await page.waitForFunction('window.READY === true', { timeout: 120000 });
  const D = await page.evaluate('window.DURATION');
  const [W, Hh] = await page.evaluate(() => { const c = document.getElementById('cv'); return [c.width, c.height]; });
  const OW = Math.round(W * 1.5 / 2) * 2, OH = Math.round(Hh * 1.5 / 2) * 2; // 720x1280 -> 1080x1920, 1280x720 -> 1920x1080
  // effects -> float WAV
  const b64 = await page.evaluate(async (D) => { const r = await SOUND.renderOffline(window.scoreSound, D, 48000, { voiceover: true }); const u = new Uint8Array(r.inter.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return [btoa(s), r.peak]; }, D);
  const pcm = Buffer.from(b64[0], 'base64'); console.log('fx peak', b64[1].toFixed(3));
  const hdr = Buffer.alloc(44); hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(3, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(48000, 24); hdr.writeUInt32LE(48000 * 8, 28); hdr.writeUInt16LE(8, 32); hdr.writeUInt16LE(32, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(path.join(DIR, 'effects.wav'), Buffer.concat([hdr, pcm]));
  // frames -> video
  const N = Math.ceil(D * FPS);
  const ff = spawn(FF, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${OW}:${OH}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(DIR, 'video.mp4')], { stdio: ['pipe', 'ignore', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const url = await page.evaluate((t) => { window.seek(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.95); }, i / FPS);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${N} ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await browser.close();
  execFileSync(FF, ['-y', '-i', VO, '-ar', '48000', '-ac', '2', path.join(DIR, 'voice.wav')], { stdio: 'ignore' });
  // apad + -t pin the length: without them the amix chain ends early and truncates the MP4
  execFileSync(FF, ['-y', '-i', 'video.mp4', '-i', 'voice.wav', '-i', 'effects.wav', '-filter_complex',
    `[1:a]atrim=0:${D},apad=whole_dur=${D},loudnorm=I=-17:TP=-2,aresample=48000,asplit=2[v1][v2];[2:a]loudnorm=I=-26:TP=-4:LRA=20,aresample=48000[fx0];[fx0][v1]sidechaincompress=threshold=0.05:ratio=3:attack=10:release=250[fx];[v2][fx]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', String(D), '-movflags', '+faststart', OUT], { cwd: DIR, stdio: 'inherit' });
  console.log('DONE', ((Date.now() - t0) / 1000).toFixed(0), 's', `${OW}x${OH}`, D, 's');
})().catch((e) => { console.error(e); process.exit(1); });
