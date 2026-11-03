// ======================================== PLAYER ========================================
(() => {
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const $ = (id) => document.getElementById(id), playB = $('play'), scrub = $('scrub'), timeL = $('time'), snd = $('snd'), loopC = $('loop'), file = $('file'), voL = $('vo'), drop = $('drop');
  scrub.max = DURATION;
  const fmt = (s) => { const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`; };
  let readyNow = false, playing = false, clockT = 0, clockStart = 0, audio = null, stopSound = null, lastDrawn = -1;
  const draw = (t) => { t = Math.max(0, Math.min(DURATION, t)); if (readyNow) explainer(ctx, FW, FH, t); lastDrawn = t; scrub.value = t; timeL.textContent = `${fmt(t)} / ${fmt(DURATION)}`; };
  window.seek = (t) => { draw(t); return t; };
  window.DURATION = DURATION; window.scoreSound = scoreSound;
  const now = () => (audio ? audio.currentTime : playing ? clockT + (performance.now() - clockStart) / 1000 : clockT);
  const sndStop = () => { if (stopSound) { stopSound(); stopSound = null; } };
  const sndStart = () => { sndStop(); if (snd.checked && playing) stopSound = SOUND.live(scoreSound, now(), { voiceover: true }); };
  const play = () => {
    if (now() >= DURATION - 0.02) setT(0);
    playing = true; playB.textContent = 'Pause';
    if (audio) audio.play().catch(() => {}); else clockStart = performance.now();
    sndStart(); requestAnimationFrame(tick);
  };
  const pause = () => { if (!audio) clockT = now(); playing = false; playB.textContent = 'Play'; if (audio) audio.pause(); sndStop(); };
  const setT = (t) => { if (audio) audio.currentTime = Math.min(t, audio.duration || t); clockT = t; clockStart = performance.now(); draw(t); };
  const tick = () => {
    if (!playing) return;
    let t = now();
    if (t >= DURATION) { if (loopC.checked) { setT(0); if (audio) audio.play().catch(() => {}); sndStart(); t = 0; } else { draw(DURATION); pause(); return; } }
    draw(t); requestAnimationFrame(tick);
  };
  playB.onclick = () => (playing ? pause() : play());
  scrub.oninput = () => { sndStop(); setT(+scrub.value); };
  scrub.onchange = () => { if (playing) sndStart(); };
  snd.onchange = () => (snd.checked ? sndStart() : sndStop());
  const loadAudio = (f) => {
    if (!f || !/^audio\//.test(f.type) && !/\.(m4a|mp3|wav|aac|ogg|flac)$/i.test(f.name)) return;
    const wasPlaying = playing; if (playing) pause();
    const t = now(); if (audio) { URL.revokeObjectURL(audio.src); audio.pause(); }
    audio = new Audio(URL.createObjectURL(f)); audio.preload = 'auto';
    audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.min(t, audio.duration); voL.textContent = `voiceover: ${f.name}`; if (wasPlaying) play(); });
    audio.addEventListener('ended', () => { if (playing && loopC.checked) { setT(0); audio.play().catch(() => {}); sndStart(); } });
  };
  file.onchange = () => loadAudio(file.files[0]);
  addEventListener('dragover', (e) => { e.preventDefault(); drop.hidden = false; });
  addEventListener('dragleave', (e) => { if (!e.relatedTarget) drop.hidden = true; });
  addEventListener('drop', (e) => { e.preventDefault(); drop.hidden = true; loadAudio(e.dataTransfer.files[0]); });
  addEventListener('keydown', (e) => { if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); playB.click(); } });
  (async () => { await ready(); readyNow = true; draw(0); window.READY = true; })();
})();
