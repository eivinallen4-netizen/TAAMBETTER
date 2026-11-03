// ======================================== SOUND: the print works on agitprop duty ========================================
// Slabs and slogans slam down like a press, the orange wedge is an iron ram, stamps are rubber-and-steel, the counter is
// stencil-stamped, beams crack out and the key moments get short brass blasts through a horn. Every time is read from
// BEATS with the same formulas as explainer(): reveals land "on twos" (t quantised to 1/15 s), so ap(w) is the first frame
// a reveal keyed to word w is visible (LEAD = 0.1 s ahead of the word).
const scoreSound = (k) => {
  const D = DURATION, E = H.ease, cl = H.clamp, LEAD = 0.1;
  const q = (b) => Math.ceil(b * 15 - 1e-6) / 15;
  const ap = (w) => q(w - LEAD);
  const pan = (px) => cl((px / FW) * 2 - 1, -1, 1) * 0.7;
  const when = (a, b, ease, u) => { for (let i = 0; i <= 400; i++) if (ease(i / 400) >= u - 1e-6) return a + ((b - a) * i) / 400; return b; };
  const slam = (t, g, p, minor) => { k.play('slap', t, { gain: 0.55 * g, pan: p, minor }); k.play('thud', t, { f: 110, gain: 0.5 * g, pan: p, minor }); };
  const horn = (t, notes, dur, g, p, minor) => notes.forEach((n, i) => { for (const det of [-9, 9])
    k.tone(t, { f: n, type: 'sawtooth', detune: det, dur, gain: 0.035 * g, a: 0.02, hold: dur * 0.6, filter: 'bandpass', f2: [[0, 700], [0.05, 1500], [dur, 1000]], q: 0.9, pan: p + (i - (notes.length - 1) / 2) * 0.15, verb: 0.2, minor }); });
  const beam = (t, g, p) => k.noise(t, { dur: 0.09, filter: 'bandpass', f: [[0, 600], [0.09, 1800]], q: 0.8, gain: 0.22 * g, a: 0.004, pan: p, minor: true });
  const numb = (t, g, p) => k.withMinor(() => { k.noise(t, { dur: 0.03, filter: 'bandpass', f: 1500, q: 1.2, gain: 0.32 * g, a: 0.001, pan: p }); k.tone(t, { f: 130, dur: 0.05, gain: 0.12 * g, pan: p }); });
  const ram = (w) => {
    k.noise(w, { dur: 0.95, color: 'brown', filter: 'lowpass', f: [[0, 150], [0.47, 900], [0.95, 200]], gain: 0.45, a: 0.4, pan: -0.3 });
    k.noise(w + 0.2, { dur: 0.75, color: 'pink', filter: 'bandpass', f: [[0, 300], [0.27, 1300], [0.75, 400]], q: 0.8, gain: 0.16, a: 0.25, pan: 0.3 });
    k.tone(w, { f: [[0, 45], [0.47, 72], [0.95, 40]], type: 'sawtooth', dur: 0.95, gain: 0.1, a: 0.4, filter: 'lowpass', f2: 300 });
  };
  const rumble = (t, d, p, g = 0.25) => k.noise(t, { dur: d, color: 'brown', filter: 'lowpass', f: [[0, 220], [d, 650]], gain: g, a: d * 0.7, pan: p, minor: true });
  const slide = (t, d, p) => k.noise(t, { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 400], [d, 900]], q: 0.7, gain: 0.1, a: d * 0.4, pan: p, minor: true });
  const creak = (t, d, p) => k.tone(t, { f: [[0, 70], [d * 0.5, 95], [d, 60]], type: 'sawtooth', dur: d, gain: 0.05, a: 0.05, hold: d * 0.5, filter: 'bandpass', f2: 700, q: 4, pan: p, minor: true });

  k.bed('hum', 0, D, { gain: 0.35 }); k.bed('room', 0, D, { gain: 0.4 }); // the print works (full mix only)
  WEDGES.forEach(ram);

  // ---- 1. hook
  { const A = B.hook.at, R = B.reason.at;
    // frame 1: the title card is already stamped, so it opens on the hit
    k.play('stamp', 0, { gain: 0.9 }); k.play('thud', 0, { f: 85, gain: 0.6 }); horn(0.01, ['C3', 'G3', 'C4'], 0.3, 0.8, 0);
    k.play('whoosh', A.titleOut, { dur: 0.35, gain: 0.5, top: 3400 });                // title shoots up and away
    k.play('whoosh', A.site - 0.3, { dur: 0.3, gain: 0.5, pan: -0.5, minor: true }); slam(A.site, 0.7, -0.3, true);
    k.play('slap', ap(A.site + 0.15), { gain: 0.4, pan: -0.3, minor: true });
    k.play('slap', ap(A.worse), { gain: 0.4, pan: 0.1, minor: true });
    k.play('whoosh', A.yours - 0.35, { dur: 0.3, gain: 0.5, pan: 0.5, minor: true }); slam(A.yours - 0.05, 0.7, 0.3, true);
    k.play('stamp', q(A.google - 0.03), { gain: 0.75, pan: pan(610) });          // the Google G stamps in
    slide(A.google, A.above - A.google, 0);                                         // cards re-stack into the results
    k.play('stamp', ap(A.above), { gain: 0.8, pan: -0.5 }); k.play('thud', ap(A.above), { f: 90, gain: 0.4, pan: -0.5 }); // #1
    slam(ap(A.you), 0.6, -0.5, true);                                               // #2
    k.play('slap', ap(R.reason), { gain: 0.5, pan: -0.4, minor: true });
    k.play('stamp', q(R.isnt - 0.05) + 1 / 15, { gain: 1.0, pan: pan(420) });     // the cross on their site
    slam(ap(R.website), 0.9, -0.2, false); k.play('stamp', ap(R.website), { gain: 0.5, pan: -0.2 });
  }
  // ---- 2. <1% to page 2, then the lens
  { const P = B.pct.at, K = B.looking.at, t0 = swapAt(B.pct.wedge);
    for (let j = 0; j < 10; j++) k.play('tick', q(t0 + 0.05 + j * 0.06), { gain: 0.5, f: 3600 + j * 120, pan: -0.2 + j * 0.03, minor: true });
    k.play('slap', q(t0 + 0.75), { gain: 0.45, pan: -0.4, minor: true });       // PAGE 1
    k.play('impact', ap(P.one), { gain: 1.2, pan: -0.2 }); k.play('stamp', ap(P.one), { gain: 0.9, pan: -0.2 }); // <1%
    k.play('slap', ap(P.people), { gain: 0.4, pan: -0.2, minor: true });
    k.play('swish', P.make, { dur: 0.45, gain: 0.5, pan: -0.1, minor: true });
    k.play('whoosh', P.page, { dur: 0.6, gain: 0.45, pan: 0.5, top: 3200 });      // the one cursor hops to page 2
    k.play('pop', P.two, { f: 520, gain: 0.7, pan: 0.5 }); slam(ap(P.two), 0.6, 0.4, true);
    k.play('whoosh', K.so + 0.1, { dur: 0.4, gain: 0.45, pan: -0.6, minor: true }); // board drops away
    k.play('whoosh', K.whats - 0.2, { dur: 0.45, gain: 0.55, pan: 0.6 }); k.play('thud', when(K.whats - 0.2, K.whats + 0.35, E.back, 1), { f: 100, gain: 0.5 });
    [0, 1, 2].forEach((i) => beam(q(K.google - 0.2) + i / 15, 0.9, (i - 1) * 0.5));
    k.play('stamp', q(K.google - 0.03), { gain: 0.75, pan: pan(210) });          // Google G over the lens
    horn(ap(K.looking), ['D3', 'Ab3'], 0.4, 1, 0); slam(ap(K.looking), 0.8, 0, false); // the ?
  }
  // ---- 3. two candidates -> references -> backlinks -> how many
  { const Sm = B.same.at, Rf = B.refs.at, F = B.first.at, BL = B.backlinks.at, HM = B.howmany.at;
    slide(Sm.two - 0.25, 0.5, -0.5); slide(Sm.two - 0.25, 0.5, 0.5); k.play('thud', Sm.two + 0.2, { f: 100, gain: 0.45, minor: true });
    k.play('stamp', ap(Sm.same), { gain: 0.7, pan: -0.4 });
    [Sm.job, Sm.experience, Sm.skills, Sm.resume].forEach((w, i) => slam(ap(w), 0.6, i % 2 ? 0.3 : -0.3, true));
    k.play('whoosh', Rf.thisguy - 0.3, { dur: 0.35, gain: 0.45, pan: 0.6, minor: true }); // SAME column shoots off
    rumble(Rf.thisguy - 0.2, 0.3, -0.5); k.play('thud', q(Rf.thisguy + 0.1), { f: 90, gain: 0.5, pan: -0.5 });
    k.noise(Rf.thisguy - 0.1, { dur: 0.3, color: 'brown', filter: 'lowpass', f: [[0, 200], [0.3, 800]], gain: 0.25, a: 0.1, pan: 0.3 }); // arrow drives in
    k.play('stamp', ap(Rf.ten), { gain: 0.85, pan: -0.5 });                       // 10
    k.play('slap', ap(Rf.references + 0.2), { gain: 0.45, pan: 0.2, minor: true });
    for (let i = 0; i < 10; i++) k.play('paper', q(Rf.references - LEAD + i * 0.27), { dur: 0.12, gain: 0.8, pan: pan(70 + i * 30), minor: true }); // letters land
    // "and this guy has one reference from his cousin": a thin arrow, one lonely letter, a deflated honk
    k.noise(Rf.thisguy2 - 0.1, { dur: 0.3, color: 'brown', filter: 'lowpass', f: [[0, 200], [0.3, 700]], gain: 0.2, a: 0.1, pan: 0.4 });
    k.play('stamp', ap(Rf.one), { gain: 0.55, pan: 0.4 });
    k.play('paper', q(Rf.reference1 - LEAD), { dur: 0.15, gain: 0.9, pan: 0.5, minor: true });
    k.play('slap', ap(Rf.cousin), { gain: 0.5, pan: 0.4 }); horn(ap(Rf.cousin) + 0.05, ['Bb2', 'E3'], 0.35, 0.7, 0.4, true);
    slam(ap(Rf.hired), 0.8, -0.3, false);                                         // HIRED?
    // the right moment: the first guy gets the job
    k.play('stamp', ap(F.first), { gain: 0.9, pan: -0.4 }); horn(ap(F.first) + 0.01, ['C4', 'E4', 'G4'], 0.5, 1.1, -0.2);
    k.play('success', ap(F.first) + 0.06, { gain: 0.35, pan: 0.3 });
    k.play('paper', F.thats, { dur: 0.8, gain: 0.9, minor: true }); k.play('whoosh', F.thats, { dur: 0.8, gain: 0.35, minor: true }); // mascot -> YOUR SITE
    k.play('slap', ap(F.website), { gain: 0.5, pan: -0.2, minor: true });
    for (let i = 0; i < 10; i++) k.play('tock', q(BL.references + 0.1 + i * 0.06), { f: 380 + (i % 3) * 60, gain: 0.45, pan: pan(80 + (i % 5) * 134), minor: true });
    // BACKLINKS: the key reveal, with the burst of beams
    const bt = ap(BL.backlinks);
    k.play('impact', bt, { gain: 1.6 }); k.play('thud', bt, { f: 70, gain: 0.9 }); k.play('stamp', bt, { gain: 0.9 });
    horn(bt + 0.01, ['C3', 'G3', 'C4', 'E4'], 0.7, 1.2, 0);
    k.play('swish', BL.its, { dur: 0.4, gain: 0.4, minor: true }); k.play('whoosh', BL.its + 0.1, { dur: 0.5, gain: 0.4, pan: -0.6, minor: true });
    slam(ap(BL.news), 0.6, -0.4, true); slam(ap(BL.local + 0.3), 0.6, 0.4, true);
    k.play('stamp', ap(BL.news), { gain: 0.4, pan: -0.4, minor: true }); k.play('stamp', ap(BL.local), { gain: 0.4, pan: 0.4, minor: true }); // the logos print
    [[BL.links, -0.3], [BL.back, 0.3]].forEach(([w, p]) => { k.noise(w - 0.25, { dur: 0.25, color: 'brown', filter: 'lowpass', f: [[0, 250], [0.25, 900]], gain: 0.25, a: 0.15, pan: p }); k.play('thud', q(w), { f: 110, gain: 0.55, pan: p }); });
    for (let j = 0; j < 30; j++) k.play('tick', q(HM.not - 0.2 + j * 0.03) + 1 / 15, { f: 2800 + (j % 5) * 300, gain: 0.45, pan: j % 3 === 1 ? 0.6 : -0.6, minor: true }); // links flood in
    for (let t = HM.not - 0.1, lt = -1; t < HM.many; t += 1 / 30) { if (t - lt >= 0.09) { numb(t, 0.8, pan(450)); lt = t; } }
    slam(ap(HM.not), 0.55, -0.4, true); slam(ap(HM.how), 0.55, -0.4, true);
    k.play('buzz', q(HM.many - 0.05) + 1 / 15, { f: 98, dur: 0.35, gain: 0.9, pan: pan(540) }); k.play('stamp', q(HM.many - 0.05) + 1 / 15, { gain: 0.9, pan: pan(540) });
  }
  // ---- 4. the balance
  { const T = B.trust.at, t0 = swapAt(B.trust.wedge);
    k.play('press', q(t0 + 0.05), { gain: 0.7 }); k.play('stamp', q(T.one - LEAD), { gain: 0.6, pan: -0.5 }); // fulcrum + the 1
    k.play('thud', q(T.one - LEAD + 0.05), { f: 75, gain: 0.9, pan: -0.5 });       // the trusted site lands
    creak(T.link - 0.1, 0.6, -0.3); k.play('tock', when(T.link - 0.1, T.link + 0.5, E.back, 1), { f: 240, gain: 0.5, pan: -0.4 });
    rumble(T.trust - 0.2, 0.3, -0.5); k.play('slap', ap(T.trust), { gain: 0.5, pan: -0.5, minor: true });
    k.play('stamp', ap(T.fifty), { gain: 0.85, pan: 0.5 });                      // 50
    k.withMinor(() => { for (let i = 0; i < 50; i += 2) k.play('slap', T.fifty - LEAD - 0.1 + i * 0.008 + 0.22, { gain: 0.22, pan: 0.5 + ((i % 6) - 3) * 0.05 }); });
    creak(T.fifty, 0.6, 0.3); k.play('tock', T.fifty + 0.3, { f: 200, gain: 0.4, pan: 0.4, minor: true });
    k.play('slap', ap(T.random), { gain: 0.5, pan: 0.5, minor: true });
    const rv = ap(T.nobody);                                                         // 1 > 50
    k.play('stamp', rv, { gain: 1.0 }); k.play('impact', rv, { gain: 0.9 }); horn(rv + 0.01, ['C3', 'G3', 'C4'], 0.5, 1.0, 0);
  }
  // ---- 5. takeaway
  { const F = B.follow.at, t0 = swapAt(B.follow.wedge);
    rumble(t0, 0.4, 0.6, 0.3); k.play('thud', q(t0 + 0.4), { f: 90, gain: 0.5, pan: 0.5 });
    k.play('whoosh', t0 + 0.1, { dur: 0.5, gain: 0.4, pan: -0.5, minor: true }); k.play('thud', t0 + 0.6, { f: 100, gain: 0.4, pan: -0.3, minor: true });
    [0, 1, 2].forEach((i) => beam(q(t0 + 0.3) + i / 15, 0.9, -0.3 + i * 0.3));
    slam(ap(F.website), 0.7, -0.3, true);
    slam(ap(F.backlinks), 1.0, -0.2, false); k.play('stamp', ap(F.backlinks), { gain: 0.6, pan: -0.2 });
    const ft = ap(F.follow);                                                         // FOLLOW + burst
    k.play('impact', ft, { gain: 1.4 }); k.play('stamp', ft, { gain: 1.0 }); horn(ft + 0.01, ['F3', 'A3', 'C4'], 0.3, 0.9, 0);
    const lt = q(F.follow + 0.25);                                                   // TAAM wordmark
    k.play('press', lt, { gain: 0.9, pan: 0.3 }); k.play('stamp', lt, { gain: 0.7, pan: 0.3 });
    horn(lt + 0.12, ['C3', 'G3', 'C4', 'E4'], 0.7, 0.9, 0);                         // the resolve
  }
};
