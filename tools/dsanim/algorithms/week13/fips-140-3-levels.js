// CEN429 — Week 13 — FIPS 140-3 security levels 1-4 (docs/week-13 Section 5). Levels are CUMULATIVE: Level 2
// adds tamper EVIDENCE and role-based authentication on top of Level 1's approved-algorithm baseline; Level 3
// adds tamper RESISTANCE AND RESPONSE (zeroizing the key) and identity-based authentication; Level 4 adds full
// protection against environmental (voltage/temperature) attacks. A module claiming Level 3 must still satisfy
// every Level 1 and Level 2 requirement too. No code panel: a standard's structure, not a running program.
(function (D) {
  'use strict';
  var T = D.T;

  var LEVELS = [
    { n: 1, adds: T('Onaylı algoritmalar, üretim kalitesinde bileşenler; fiziksel koruma şartı yok', 'Approved algorithms, production-grade components; no physical protection required'),
      module: T('Yazılım kripto kütüphaneleri', 'Software crypto libraries') },
    { n: 2, adds: T('Kurcalama KANITI (mühür, kaplama) + rol tabanlı kimlik doğrulama', 'Tamper EVIDENCE (seals, coatings) + role-based authentication'),
      module: T('Güvenli tokenlar, bazı donanım modülleri', 'Secure tokens, some hardware modules') },
    { n: 3, adds: T('Kurcalamaya DAYANIKLILIK ve TEPKİ (anahtarı sil) + kimlik tabanlı kimlik doğrulama', 'Tamper RESISTANCE and RESPONSE (erase the key) + identity-based authentication'),
      module: T('Ağa bağlı HSMler', 'Network-attached HSMs') },
    { n: 4, adds: T('Çevresel (gerilim, sıcaklık) saldırılara TAM koruma', 'FULL protection against environmental (voltage, temperature) attacks'),
      module: T('Fiziksel saldırının beklendiği ortamlar', 'Environments where physical attack is expected') }
  ];

  function mk(targetLevel, moduleName) { return { targetLevel: targetLevel, moduleName: moduleName }; }

  /** Independent reference: every requirement up to and including the target level applies — computed
   * directly from targetLevel, never by iterating the LEVELS[] table build() draws from. */
  function reference(data) {
    var applies = [];
    for (var i = 1; i <= data.targetLevel; i++) applies.push(i);
    return { appliesUpTo: applies, targetLevel: data.targetLevel };
  }

  function build(S, data) {
    var W = 520, H = 70, GAP = 14;
    S.label('title', { x: W / 2, y: -24, text: T('`' + data.moduleName + '` için FIPS 140-3 hedefi: Düzey ' + data.targetLevel,
                                                    'FIPS 140-3 target for `' + data.moduleName + '`: Level ' + data.targetLevel),
      anchor: 'middle', bold: true, size: 14 });
    for (var i = 0; i < LEVELS.length; i++) {
      var y = i * (H + GAP);
      S.box('lvl' + i, { x: 0, y: y, w: 90, h: H, size: 20, text: 'L' + LEVELS[i].n, style: 'dim' });
      S.box('desc' + i, { x: 100, y: y, w: W - 100, h: H, size: 11, text: LEVELS[i].adds, style: 'dim' });
    }
    S.step(T('Dört düzey KÜMÜLATİF: her düzey bir öncekinin tüm gereksinimlerini içerir ve üstüne ekler.',
              'The four levels are CUMULATIVE: each level includes everything the previous one required, and adds to it.'), {});

    for (i = 0; i < LEVELS.length; i++) {
      S.at(null);
      var applies = LEVELS[i].n <= data.targetLevel;
      S.set('lvl' + i, { style: applies ? 'new' : 'dim' });
      S.set('desc' + i, { style: applies ? 'new' : 'dim' });
      if (LEVELS[i].n === data.targetLevel) {
        S.label('modLbl', { x: 100, y: i * (H + GAP) + H + 12, text: T('tipik modül: ' + LEVELS[i].module.tr, 'typical module: ' + LEVELS[i].module.en), anchor: 'start', size: 12, bold: true });
      }
      S.step(T('Düzey ' + LEVELS[i].n + ' ekler: ' + LEVELS[i].adds.tr + '. Hedefe dahil mi? ' + (applies ? 'evet.' : 'hayır, hedefin üstünde.'),
                'Level ' + LEVELS[i].n + ' adds: ' + LEVELS[i].adds.en + '. Does it apply to the target? ' + (applies ? 'yes.' : 'no, above the target.')), {});
    }

    S.at(null);
    var result = reference(data);
    S.result = result;
    S.step(T('"FIPS onaylı bir kütüphane kullanıyoruz" tek başına yeterli değildir: uygulamanın kendisi ayrıca doğrulanmadıysa, kütüphaneyi YANLIŞ kullanmak (anahtarı bellekte bırakmak gibi) tüm garantiyi geçersiz kılar.',
              'Saying "we use a FIPS-validated library" is not enough on its own: if the application itself was not separately validated, misusing the library (e.g. leaving the key in memory) invalidates the whole guarantee.'), {});
  }

  D.define({
    id: 'fips-140-3-levels',
    title: T('FIPS 140-3 güvenlik düzeyleri 1-4: her düzey ne ekler?', 'FIPS 140-3 security levels 1-4: what each level adds'),
    minSize: 4,
    presets: [
      { id: 'normal-level1', level: 'normal',
        name: T('Normal: yazılım kütüphanesi — Düzey 1', 'Normal: a software library — Level 1'),
        data: mk(1, 'crypto library') },
      { id: 'hard-level3', level: 'hard',
        name: T('Zor: ağa bağlı HSM — Düzey 3', 'Hard: a network-attached HSM — Level 3'),
        data: mk(3, 'network HSM') },
      { id: 'edge-level4', level: 'edge', small: true,
        name: T('Uç durum: en yüksek düzey — Düzey 4', 'Edge case: the highest level — Level 4'),
        data: mk(4, 'tamper-hostile field device') },
      { id: 'edge-level2', level: 'edge',
        name: T('Uç durum: güvenli token — Düzey 2', 'Edge case: a secure token — Level 2'),
        data: mk(2, 'secure USB token') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return LEVELS.length; },
    random: function (level, r) {
      var modules = ['crypto library', 'secure token', 'network HSM', 'payment terminal module', 'embedded TPM', 'field device'];
      var target = level === 'easy' ? 1 : (level === 'normal' ? D.randInt(r, 1, 2) : (level === 'hard' ? D.randInt(r, 2, 3) : D.randInt(r, 3, 4)));
      return mk(target, modules[D.randInt(r, 0, modules.length - 1)]);
    },
    input: {
      hint: T('Duzey<1..4>: modul-adi', 'Level<1..4>: module-name'),
      format: function (data) { return 'Level' + data.targetLevel + ': ' + data.moduleName; },
      tokens: function () { return LEVELS.map(function (l) { return 'L' + l.n; }); },
      parse: function (text) {
        var m = String(text).trim().match(/^Level([1-4]):\s*(.+)$/i);
        if (!m) throw T('Biçim: "Level<1..4>: modul-adi" olmalı.', 'Format must be "Level<1..4>: module-name".');
        if (!m[2].trim()) throw T('Modül adı boş olamaz.', 'The module name cannot be empty.');
        return mk(parseInt(m[1], 10), m[2].trim());
      },
      bad: ['', 'Level0: x', 'Level5: x', 'Level2:', 'not-a-level']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
