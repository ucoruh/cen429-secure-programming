// CEN429 — Week 13 — Common Criteria (ISO/IEC 15408): PP/ST, SFR/SAR, and the EAL1-7 ladder (docs/week-13
// Section 4). A Protection Profile (PP) is a reusable requirement set for a PRODUCT CLASS; a Security Target
// (ST) is one product's own document, which may CLAIM CONFORMANCE to a PP. SFRs (functional requirements, from
// a standard catalogue: FCS/FDP/FIA/FPT/FTP...) say WHAT the product must do; SARs (assurance requirements:
// ADV/ATE/AVA...) say HOW DEEPLY that was checked. An EAL is a predefined SAR package — EAL1..EAL7 is not "more
// secure", it is "evaluated more deeply". No code panel: a standard's structure, not a running program.
(function (D) {
  'use strict';
  var T = D.T;

  var EAL = [
    { n: 1, name: T('İşlevsel olarak test edildi', 'Functionally tested'), use: T('düşük tehdit', 'low threat') },
    { n: 2, name: T('Yapısal olarak test edildi', 'Structurally tested'), use: T('temel güvence', 'basic assurance') },
    { n: 3, name: T('Yöntemli test edildi ve denetlendi', 'Methodically tested and checked'), use: T('orta düzey', 'medium level') },
    { n: 4, name: T('Yöntemli tasarlandı, test edildi, incelendi', 'Methodically designed, tested, and reviewed'), use: T('ticari ürünlerin en yaygın üst düzeyi', 'the most common upper level for commercial products') },
    { n: 5, name: T('Yarı-biçimsel tasarlandı ve test edildi', 'Semi-formally designed and tested'), use: T('akıllı kartlar, güvenli elemanlar', 'smart cards, secure elements') },
    { n: 6, name: T('Yarı-biçimsel doğrulanmış tasarım', 'Semi-formally verified design'), use: T('yüksek riskli ortamlar', 'high-risk environments') },
    { n: 7, name: T('Biçimsel doğrulanmış tasarım', 'Formally verified design'), use: T('çok yüksek risk, küçük sistemler', 'very high-risk, small systems') }
  ];

  function mk(targetEal, sfrFamilies) { return { targetEal: targetEal, sfrFamilies: sfrFamilies.slice() }; }

  /** Independent reference: every SAR component up to and including the target level is included — computed
   * directly from targetEal, never by iterating the EAL[] table build() draws from. */
  function reference(data) {
    var included = [];
    for (var i = 1; i <= data.targetEal; i++) included.push(i);
    return { includedLevels: included, sfrCount: data.sfrFamilies.length, targetEal: data.targetEal };
  }

  function build(S, data) {
    var W = 360, H = 30, GAP = 8;
    S.label('sfrTitle', { x: 0, y: -30, text: T('SFR (ne yapmalı?)', 'SFR (what must it do?)'), anchor: 'start', bold: true, size: 13 });
    for (var i = 0; i < data.sfrFamilies.length; i++) {
      S.box('sfr' + i, { x: i * 90, y: 0, w: 80, h: 26, size: 11, mono: true, text: data.sfrFamilies[i], style: 'normal' });
    }
    S.step(T('Önce SFR ailelerini seçiyoruz — standart bir katalogdan, uydurulmaz: ' + data.sfrFamilies.join(', ') + '.',
              'First we pick SFR families — from a standard catalogue, never invented: ' + data.sfrFamilies.join(', ') + '.'), {});

    S.label('sarTitle', { x: 0, y: 50, text: T('SAR merdiveni (ne kadar derin denetlendi?)', 'SAR ladder (how deeply was it checked?)'), anchor: 'start', bold: true, size: 13 });
    for (i = 0; i < EAL.length; i++) {
      var y = 70 + i * (H + GAP);
      S.box('eal' + i, { x: 0, y: y, w: W, h: H, size: 12,
        text: T('EAL' + EAL[i].n + ' — ' + EAL[i].name.tr, 'EAL' + EAL[i].n + ' — ' + EAL[i].name.en), style: 'dim' });
    }
    S.step(T('EAL1den EAL7ye: her düzey bir öncekinin SAR paketini kapsar ve üstüne ekler — bir merdiven, ayrık kutular değil.',
              'EAL1 to EAL7: each level contains the previous level\'s SAR package and adds to it — a ladder, not separate boxes.'), {});

    for (i = 0; i < EAL.length; i++) {
      S.at(null);
      var included = EAL[i].n <= data.targetEal;
      S.set('eal' + i, { style: included ? 'new' : 'dim' });
      if (EAL[i].n === data.targetEal) {
        S.label('target', { x: W + 16, y: 70 + i * (H + GAP) + H / 2 + 4, text: T('hedef düzey', 'target level'), anchor: 'start', size: 12, bold: true });
      }
      S.step(T('EAL' + EAL[i].n + ' — "' + EAL[i].name.tr + '": ' + EAL[i].use.tr + '. Bu ekleniyor mu? ' + (included ? 'evet.' : 'hayır, hedefin ötesinde.'),
                'EAL' + EAL[i].n + ' — "' + EAL[i].name.en + '": ' + EAL[i].use.en + '. Does this get added? ' + (included ? 'yes.' : 'no, beyond the target.')), {});
    }

    S.at(null);
    var result = reference(data);
    S.label('summary', { x: 0, y: 70 + EAL.length * (H + GAP) + 10,
      text: T('Hedef: EAL' + data.targetEal + ' (' + result.includedLevels.length + ' düzeyin SAR paketi dahil).',
              'Target: EAL' + data.targetEal + ' (' + result.includedLevels.length + ' levels\' SAR packages included).'),
      anchor: 'start', size: 13, bold: true });
    S.result = result;
    S.step(T('Daha yüksek EAL "daha güvenli" demek DEĞİLDİR — "daha derin değerlendirildi" demektir. STdeki tehdit ve hedeflerin kapsamı asıl belirleyicidir.',
              'A higher EAL does NOT mean "more secure" — it means "evaluated more deeply". The scope of threats and objectives in the ST is what actually matters.'), {});
  }

  D.define({
    id: 'common-criteria-ladder',
    title: T('Ortak Kriterler yapısı: PP/ST, SFR/SAR ve EAL1-7 merdiveni', 'Common Criteria structure: PP/ST, SFR/SAR, and the EAL1-7 ladder'),
    minSize: 7,
    presets: [
      { id: 'normal-eal2', level: 'normal',
        name: T('Normal: temel güvence hedefi — EAL2', 'Normal: a basic-assurance target — EAL2'),
        data: mk(2, ['FCS', 'FDP', 'FIA']) },
      { id: 'hard-eal4', level: 'hard',
        name: T('Zor: ticari üst düzey hedefi — EAL4', 'Hard: the common commercial upper target — EAL4'),
        data: mk(4, ['FCS', 'FDP', 'FIA', 'FPT', 'FTP', 'FAU']) },
      { id: 'edge-eal1', level: 'edge', small: true,
        name: T('Uç durum: en düşük düzey — EAL1', 'Edge case: the lowest level — EAL1'),
        data: mk(1, ['FCS']) },
      { id: 'edge-eal7', level: 'edge',
        name: T('Uç durum: en yüksek düzey — EAL7, tüm merdiven dahil', 'Edge case: the highest level — EAL7, the whole ladder included'),
        data: mk(7, ['FCS', 'FDP', 'FIA', 'FPT', 'FTP', 'FAU', 'FMT']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return EAL.length; },
    random: function (level, r) {
      var allFamilies = ['FCS', 'FDP', 'FIA', 'FPT', 'FTP', 'FAU', 'FMT', 'FCO', 'FPR'];
      var target = level === 'easy' ? D.randInt(r, 1, 2) : (level === 'normal' ? D.randInt(r, 2, 3) : (level === 'hard' ? D.randInt(r, 3, 5) : D.randInt(r, 4, 7)));
      var count = D.randInt(r, 2, 6);
      var pool = allFamilies.slice(), chosen = [];
      for (var i = 0; i < count && pool.length; i++) chosen.push(pool.splice(D.randInt(r, 0, pool.length - 1), 1)[0]);
      return mk(target, chosen);
    },
    input: {
      hint: T('EAL<1..7>: SFR1,SFR2,...', 'EAL<1..7>: SFR1,SFR2,...'),
      format: function (data) { return 'EAL' + data.targetEal + ': ' + data.sfrFamilies.join(','); },
      tokens: function () { return EAL.map(function (e) { return 'EAL' + e.n; }); },
      parse: function (text) {
        var m = String(text).trim().match(/^EAL([1-7]):\s*(.+)$/i);
        if (!m) throw T('Biçim: "EAL<1..7>: SFR1,SFR2,..." olmalı.', 'Format must be "EAL<1..7>: SFR1,SFR2,...".');
        var families = m[2].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!families.length) throw T('En az bir SFR ailesi girin.', 'Enter at least one SFR family.');
        return mk(parseInt(m[1], 10), families);
      },
      bad: ['', 'EAL0: FCS', 'EAL8: FCS', 'EAL3:', 'not-a-level']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
