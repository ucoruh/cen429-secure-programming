// CEN429 — Week 13 — mapping sector requirement sets onto the course's nine requirement families (docs/
// week-13 Sections 6 and 8). EMVCo's software-based mobile payment document lists almost exactly these nine
// families (the course's families were adapted from that structure) — so EMVCo has a counterpart everywhere.
// PCI (DSS/MPoC/SSF combined) and OWASP MASVS each name some but not all of the nine. GSMA's SAS/NESAS audit
// the MANUFACTURING FACILITY, not the product itself — so it has almost no per-family counterpart, which is
// itself the lesson: not every "standard" asks the same kind of question. No code panel: a cross-reference
// table, not a running program.
(function (D) {
  'use strict';
  var T = D.T;

  // Curated, one-line-per-family summary of Section 6/8's own text — not randomly generated per family.
  var FAMILY_INFO = {
    AP: { topic: T('Uygulama koruması', 'Application protection'), emvco: true, pci: true, gsma: false, masvs: 'RESILIENCE' },
    ID: { topic: T('Kimlik doğrulama ve bağlama', 'Authentication and binding'), emvco: true, pci: true, gsma: false, masvs: 'AUTH' },
    AS: { topic: T('Varlık koruması', 'Asset protection'), emvco: true, pci: false, gsma: false, masvs: null },
    DR: { topic: T('Durağan veri', 'Data at rest'), emvco: true, pci: true, gsma: false, masvs: 'STORAGE' },
    DU: { topic: T('Kullanımdaki veri', 'Data in use'), emvco: true, pci: true, gsma: false, masvs: 'PRIVACY' },
    DT: { topic: T('Aktarımdaki veri', 'Data in transit'), emvco: true, pci: true, gsma: false, masvs: 'NETWORK' },
    RP: { topic: T('Raporlama', 'Reporting'), emvco: true, pci: true, gsma: false, masvs: null },
    CR: { topic: T('Kripto ve anahtarlar', 'Crypto and keys'), emvco: true, pci: false, gsma: false, masvs: 'CRYPTO' },
    DV: { topic: T('Geliştirme süreci', 'Development process'), emvco: true, pci: true, gsma: true, masvs: null }
  };
  var ORDER = ['AP', 'ID', 'AS', 'DR', 'DU', 'DT', 'RP', 'CR', 'DV'];
  var STANDARDS = ['EMVCo', 'PCI', 'GSMA', 'MASVS'];

  function mk(families) { return { families: families.slice() }; }

  /** Independent reference: counts, for the shown families, how many of the four standards have a named
   * counterpart — read straight from FAMILY_INFO, never by re-running build()'s cell-drawing loop. */
  function reference(data) {
    var counts = {};
    STANDARDS.forEach(function (s) { counts[s] = 0; });
    data.families.forEach(function (fam) {
      var info = FAMILY_INFO[fam];
      if (info.emvco) counts.EMVCo++;
      if (info.pci) counts.PCI++;
      if (info.gsma) counts.GSMA++;
      if (info.masvs) counts.MASVS++;
    });
    return { counts: counts, familyCount: data.families.length };
  }

  var COLW = [150, 90, 90, 90, 90];
  var COLX = [0, 160, 260, 360, 460];

  function build(S, data) {
    S.label('col0', { x: COLW[0] / 2, y: -20, text: T('Aile', 'Family'), anchor: 'middle', bold: true, size: 13 });
    for (var c = 0; c < STANDARDS.length; c++) {
      S.label('col' + (c + 1), { x: COLX[c + 1] + COLW[c + 1] / 2, y: -20, text: STANDARDS[c], anchor: 'middle', bold: true, size: 13 });
    }
    var H = 30, GAP = 8;
    for (var i = 0; i < data.families.length; i++) {
      var y = i * (H + GAP);
      var fam = data.families[i];
      var info = FAMILY_INFO[fam];
      S.box('fam' + i, { x: COLX[0], y: y, w: COLW[0], h: H, size: 12, mono: true, text: 'CEN429-' + fam, style: 'normal' });
      var flags = [info.emvco, info.pci, info.gsma, !!info.masvs];
      for (c = 0; c < 4; c++) {
        S.box('c' + i + '-' + c, { x: COLX[c + 1], y: y, w: COLW[c + 1], h: H, size: 11, mono: true,
          text: flags[c] ? (c === 3 ? info.masvs : 'yes') : '-', style: flags[c] ? 'normal' : 'empty' });
      }
    }
    S.step(T('Dokuz aile, dört sektör kaynağı: satırlar bizim gereksinim ailelerimiz, sütunlar dış standartlar.',
              'Nine families, four sector sources: rows are our requirement families, columns are the external standards.'), {});

    for (i = 0; i < data.families.length; i++) {
      S.at(i);
      var fam2 = data.families[i];
      var info2 = FAMILY_INFO[fam2];
      S.set('fam' + i, { style: 'hl' });
      var parts = [];
      if (info2.emvco) parts.push('EMVCo');
      if (info2.pci) parts.push('PCI');
      if (info2.gsma) parts.push('GSMA');
      if (info2.masvs) parts.push('MASVS-' + info2.masvs);
      var msg = parts.length
        ? T('CEN429-' + fam2 + ' (' + info2.topic.tr + ') -> karşılığı olan setler: ' + parts.join(', ') + '.',
            'CEN429-' + fam2 + ' (' + info2.topic.en + ') -> the sets with a counterpart: ' + parts.join(', ') + '.')
        : T('CEN429-' + fam2 + ' (' + info2.topic.tr + ') -> bu dört sette adlandırılmış doğrudan bir karşılık yok.',
            'CEN429-' + fam2 + ' (' + info2.topic.en + ') -> none of these four sets names a direct counterpart.');
      S.step(msg, {});
    }

    S.at(null);
    var result = reference(data);
    S.step(T('GSMA satırlarının çoğu boş: SAS/NESAS ÜRÜNÜ değil ÜRETİM TESİSİNİ denetler — farklı bir eksen, eksiklik değil.',
              'Most of the GSMA cells are empty: SAS/NESAS audit the MANUFACTURING FACILITY, not the PRODUCT — a different axis, not a gap.'), {});
    S.result = result;
  }

  D.define({
    id: 'sector-standard-mapping',
    title: T('Sektör gereksinim setlerini ders ailelerine eşlemek (EMVCo/PCI/GSMA/OWASP MASVS)',
              'Mapping sector requirement sets onto the course\'s families (EMVCo/PCI/GSMA/OWASP MASVS)'),
    minSize: 3,
    presets: [
      { id: 'normal-five', level: 'normal',
        name: T('Normal: beş aile', 'Normal: five families'),
        data: mk(['AP', 'ID', 'DR', 'DT', 'CR']) },
      { id: 'hard-all-nine', level: 'hard',
        name: T('Zor: dokuz ailenin tamamı', 'Hard: all nine families'),
        data: mk(ORDER.slice()) },
      { id: 'edge-gsma-gap', level: 'edge', small: true,
        name: T('Uç durum: GSMA karşılığı olmayan tek aile — AS', 'Edge case: a single family with no GSMA counterpart — AS'),
        data: mk(['AS']) },
      { id: 'edge-facility-only', level: 'edge',
        name: T('Uç durum: yalnız GSMA karşılığı olan aile — DV', 'Edge case: the one family with a GSMA counterpart — DV'),
        data: mk(['DV', 'RP', 'CR']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.families.length * 4; },
    random: function (level, r) {
      var n = level === 'easy' ? 3 : (level === 'normal' ? D.randInt(r, 3, 5) : (level === 'hard' ? D.randInt(r, 5, 7) : D.randInt(r, 7, 9)));
      var pool = ORDER.slice(), chosen = [];
      for (var i = 0; i < n && pool.length; i++) chosen.push(pool.splice(D.randInt(r, 0, pool.length - 1), 1)[0]);
      return mk(chosen);
    },
    input: {
      hint: T('AP,ID,AS,DR,DU,DT,RP,CR,DV (alt küme)', 'AP,ID,AS,DR,DU,DT,RP,CR,DV (a subset)'),
      format: function (data) { return data.families.join(','); },
      tokens: function (data) { return data.families.map(function (f) { return 'CEN429-' + f; }); },
      parse: function (text) {
        var parts = String(text).split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
        if (!parts.length) throw T('En az bir aile kodu girin.', 'Enter at least one family code.');
        parts.forEach(function (p) {
          if (ORDER.indexOf(p) < 0) throw T('"' + p + '" bilinen bir aile kodu değil (AP,ID,AS,DR,DU,DT,RP,CR,DV).', '"' + p + '" is not a known family code (AP,ID,AS,DR,DU,DT,RP,CR,DV).');
        });
        return mk(parts);
      },
      bad: ['', 'XX', 'AP,XX,DR', ',,,']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
