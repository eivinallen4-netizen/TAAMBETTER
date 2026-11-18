// Copy for the Instagram story templates. Change words here, then run: python render.py
// House rules (CLAUDE.md): no discount language, only the TAAM mascot and props in its style (no people), orange #F46325 / ink #111111.
// Prop rule: every prop stands on a floor line or peeks from behind something. Nothing floats. Use the mascot only where it fits.
//
// headline: [plain part, outline part]
// shots: crops made by render.py from shots/<id>-desktop.png and shots/<id>-mobile.png (from capture.py)

window.SITES = {
  taam: {
    // Where each prop goes. 'char:<pose>' = mascot pose from /public/characters (TAAM's own stories);
    // other names = assets/<name>.png. Add wall: true for things that hang on a wall (no floor line).
    props: {
      site: { src: 'clapper', w: 300 },
      // body sits right on the line, hands drawn over it (front) like he's gripping the edge
      mobile: { src: 'char:peek', x: 690, w: 260, dy: 14, front: true },
      desktop: { src: 'film-camera', w: 250 },
      badge: { src: 'megaphone' },
      strip: [['film-camera', 'WE FILM'], ['phone-play', 'WE POST'], ['megaphone', 'YOU GROW']],
    },
    label: 'OUR SITE',
    client: 'TAAM MARKETING',
    url: 'taammarketing.com',
    headline: ['30 VIDEOS A MONTH.', 'MORE CUSTOMERS.'],
    statLabel: 'SO FAR',
    stat: { big: '120+', small: 'projects delivered' },
    stat2: { big: '14', small: 'days to your first videos' },
    wins: [
      ['01 / FILM', '30 VIDEOS A MONTH'],
      ['02 / SPEED', 'LIVE IN 14 DAYS'],
      ['03 / TERMS', 'MONTH TO MONTH'],
      ['04 / TEAM', 'LAS VEGAS LOCAL'],
    ],
    tags: ['VIDEO', 'WEBSITES', 'SEO', 'ADS'],
    cta: 'LET’S TALK',
  },
  movers: {
    props: {
      site: { src: 'hand-truck', w: 280 },
      mobile: { src: 'boxes', x: 700, w: 240 },
      desktop: { src: 'boxes', w: 250 },
      badge: { src: 'moving-truck' },
      strip: [['boxes', 'MOVES'], ['junk-pile', 'JUNK'], ['moving-truck', 'SAME DAY']],
    },
    label: 'CLIENT WORK',
    client: 'MOVERS & JUNK REMOVAL',
    url: 'moversandjunkremoval.net',
    headline: ['THEIR OWN LEADS', 'FROM GOOGLE'],
    stat: { big: '150%', small: 'more qualified leads' },
    stat2: { big: 'GOOGLE', small: 'their own leads, no more Thumbtack' },
    wins: [
      ['01 / LEADS', 'THEIR OWN NOW'],
      ['02 / SEARCH', 'FOUND ON GOOGLE'],
      ['03 / CALLS', 'FEWER WASTED'],
      ['04 / SITE', 'BUILT BY TAAM'],
    ],
    tags: ['WEBSITE', 'SEO', 'ADS', 'REVIEWS'],
    cta: 'BOOK A CALL',
  },
  wave: {
    props: {
      site: { src: 'hvac-tools', w: 290 },
      mobile: { src: 'ac-unit', x: 700, w: 280 },
      desktop: { src: 'snow-flame', w: 270 },
      badge: { src: 'thermostat', wall: true },
      strip: [['ac-unit', 'COOLING'], ['snow-flame', 'HEATING'], ['hvac-tools', 'REPAIR']],
    },
    label: 'CLIENT WORK',
    client: 'WAVE HEATING & COOLING',
    url: 'waveheatingandcooling.com',
    headline: ['THEY CALL', 'READY TO BOOK'],
    stat: { big: '5.0', small: 'Google rating, front and center' },
    stat2: { big: '$89', small: 'diagnostic, priced before they start' },
    wins: [
      ['01 / LEADS', 'MORE QUALIFIED'],
      ['02 / CALLS', 'READY TO BOOK'],
      ['03 / PRICES', 'SHOWN UP FRONT'],
      ['04 / SOCIAL', 'RUN BY TAAM'],
    ],
    tags: ['WEBSITE', 'SEO', 'ADS', 'SOCIAL'],
    cta: 'BOOK A CALL',
  },
};

// Layouts rendered for every site. Remove one here to skip it.
// 'results' is off for now; add it back to render it again.
window.LAYOUTS = ['site', 'mobile', 'desktop'];
