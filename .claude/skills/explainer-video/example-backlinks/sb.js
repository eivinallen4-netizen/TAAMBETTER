const PANELS = [
  { b: 'hook', t: 4.95, name: 'The hook', cut: 'Opening',
    text: ['THEIRS', 'LOOKS WORSE', 'YOURS', 'Google G logo', '#1', '#2'],
    flow: 'Opens as the orange disc rolls in and four beams crack out. Their crooked site slams in on "competitor\'s" and yours on "yours". On "Google" the Google G stamps in at the top and both cards re-stack into a results column: #1 slams on "above", #2 on "you".',
    sound: 'Disc rumble and thud, beam cracks, a paper slap per card, a press stamp for #1 and a lighter one for #2.' },
  { b: 'reason', t: 6.9, name: 'Not on their site',
    text: ['THE REASON?', '✕ on their card', 'NOT ON THEIR SITE'],
    flow: 'Continuous: same stack. THE REASON? shoots in on "reason", an orange cross is stamped on their #1 card on "isn\'t", and NOT ON / THEIR SITE slam down on "website".',
    sound: 'Slab slap, full-volume stamp on the cross, two press slams.' },
  { b: 'pct', t: 12.55, name: 'Under 1% see page 2', cut: 'Wedge 7.0 s',
    text: ['PAGE 1', '<1%', 'OF SEARCHERS', 'PAGE 2'],
    flow: 'Scene change: the wedge drives across in the gap after "website", because the story jumps from their site to how people search. 200 cursors print row by row, <1% stamps on "1", and on "page 2" one orange cursor hops along the arrow to PAGE 2.',
    sound: 'Iron-ram roar of the wedge, row ticks (minor), stamp and thud on <1%, swish for the hop, slap for PAGE 2.' },
  { b: 'looking', t: 14.3, name: 'What is Google looking at?',
    text: ['Google G logo', '?'],
    flow: 'Continuous: the page-1 board drops off left on "so", a magnifier swings in, the Google G stamps above it and beams punch out on "Google", and the ? slams into the lens on "looking".',
    sound: 'Whoosh, beam cracks, a horn blast on the ?.' },
  { b: 'same', t: 20.7, name: 'Two equal candidates', cut: 'Wedge 14.35 s',
    text: ['SAME', '= JOB', '= EXPERIENCE', '= SKILLS', '= RESUME'],
    flow: 'Scene change into the analogy. Two identical halftone TAAM mascots slide up the diagonal on "2". SAME slams on "same", and each "=" slab lands on its word.',
    sound: 'Wedge, two slide thuds, a slab slap per word (alternating left and right).' },
  { b: 'refs', t: 25.9, name: 'Ten references',
    text: ['→ this one', '10', 'REFERENCES', 'HIRED?'],
    flow: 'Continuous: the SAME column shoots off right on "but this guy", and an orange disc and arrow single out the left mascot. 10 stamps on "10", ten reference letters fly in one at a time, each headed with a real company mark (Apple, Amazon, Netflix, Nike, Tesla, Spotify, Coca-Cola, Starbucks, McDonald’s, adidas), through "companies", and HIRED? slams on "hired".',
    sound: 'Arrow ram, stamp on 10, a paper flick per letter (minor), slam on HIRED?.' },
  { b: 'first', t: 27.6, name: 'The first guy gets hired',
    text: ['HIRED!', '✓'],
    flow: 'Continuous: on "first" the left mascot swaps to the trophy pose, ? becomes !, a check is stamped, and the twin fades back.',
    sound: 'The "right" moment at full volume: bright brass blast and stamp.' },
  { b: 'first', t: 29.85, name: 'That\'s your website', sub: 'b',
    text: ['YOUR SITE'],
    flow: 'Continuous transform: the hired mascot grows into YOUR SITE and the ten letters turn into ten small websites on a grid, which is how Google sees it. YOUR SITE lands on "website".',
    sound: 'Paper shuffle under the morph, slab slap on "website".' },
  { b: 'backlinks', t: 32.0, name: 'Backlinks',
    text: ['BACKLINKS'],
    flow: 'Continuous: on "references" every site fires an arrow into yours. BACKLINKS slams on the word with a burst of beams behind your site. This is the key reveal.',
    sound: 'Ten quick arrow thunks (minor), then the biggest hit: impact, stamp and horn chord on "backlinks".' },
  { b: 'backlinks', t: 38.5, name: 'News and local directories', sub: 'b',
    text: ['BACKLINKS (heading)', 'NEWS + NYT logo', 'LOCAL DIRECTORY + Yelp logo'],
    flow: 'Continuous: BACKLINKS shrinks into the heading, eight sites slide off, and two grow into a news site with the New York Times mark (on "news") and a Yelp listing (on "directory"). Heavy orange arrows drive into your site on "links back".',
    sound: 'Slide-off swish, slab slaps on NEWS and LOCAL DIRECTORY, two heavy arrow rams on "links back".' },
  { b: 'howmany', t: 41.8, name: 'Not just how many',
    text: ['NOT JUST', 'HOW MANY', 'LINKS 2 → 99', '✕'],
    flow: 'Continuous: links flood in from the left while the counter runs 2 → 99. NOT JUST and HOW MANY land on their words, and the count gets a stamped cross on "many".',
    sound: 'Rapid arrow ticks and stencil counter stamps (minor), a "wrong" buzz and stamp on the cross.' },
  { b: 'trust', t: 48.9, name: 'One trusted link beats 50', cut: 'Wedge 41.95 s',
    text: ['1', 'TRUSTED', '50', 'RANDOM', '1 > 50'],
    flow: 'Scene change for the new comparison. A balance prints in. The trusted site drops onto the left pan on "one link" and tips the beam. Fifty random sites rain onto the right pan on "50", and the beam jolts but won\'t lift. 1 > 50 slams on "nobody\'s".',
    sound: 'Wedge, heavy clunk on the 1, a patter of 50 small slaps, beam creak, stamp on 1 > 50.' },
  { b: 'follow', t: 54.0, name: 'Takeaway and follow', cut: 'Wedge 48.95 s',
    text: ['YOUR SITE NEEDS', 'BACKLINKS', 'FOLLOW', 'TAAM wordmark'],
    flow: 'Scene change to the takeaway. The phone mascot slides up as the disc rolls in, and the slabs land on "website" and "backlinks". FOLLOW stamps with a beam burst on "follow", then the TAAM wordmark stamps in and holds about 1 s past the last word.',
    sound: 'Wedge, slams, burst impact and horn resolve on FOLLOW, a final press stamp for the logo.' },
];
const fmt = (s) => { const m = Math.floor(s / 60), r = (s - m * 60).toFixed(1).padStart(4, '0'); return `${m}:${r}`; };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const grid = document.getElementById('grid'), jobs = [];
let beatNo = 0, lastB = null;
PANELS.forEach((p) => {
  const bt = B[p.b]; if (p.b !== lastB) { beatNo++; lastB = p.b; }
  const multi = PANELS.filter((q) => q.b === p.b).length > 1, id = beatNo + (multi ? (p.sub || 'a') : '');
  const el = document.createElement('article'); el.className = 'panel';
  el.innerHTML = `<div class="frame"><canvas width="720" height="1280" aria-label="Key frame at ${p.t} s"></canvas><div class="wait">PRINTING…</div></div>
    <div class="row"><span class="num">${id}</span><span class="name">${esc(p.name)}</span>${p.cut ? `<span class="chip cut">${p.cut}</span>` : '<span class="chip">Continuous</span>'}<span class="time">${fmt(bt.start)} – ${fmt(bt.end)} · frame ${p.t.toFixed(2)} s</span></div>
    <dl><dt>On screen</dt><dd class="ost">${p.text.map((x) => `<i>${esc(x)}</i>`).join(' ')}</dd>
    <dt>Spoken</dt><dd>“${esc(bt.said)}”</dd>
    <dt>Gets here by</dt><dd>${esc(p.flow)}</dd>
    <dt>Key sounds</dt><dd>${esc(p.sound)}</dd></dl>`;
  grid.appendChild(el); jobs.push([el.querySelector('canvas'), el.querySelector('.wait'), p.t]);
});
(async () => {
  await ready();
  for (const [cv, w, t] of jobs) {
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    explainer(cv.getContext('2d', { willReadFrequently: true }), 720, 1280, t); w.remove();
  }
})();
