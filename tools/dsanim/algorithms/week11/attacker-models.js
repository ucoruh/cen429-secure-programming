// CEN429 — Week 11 — Section 1: black-box / grey-box / white-box attacker models.
// Reference material: docs/week-11/cen429-week-11.{tr,en}.md, section 1 (the model table, Chow et al. 2002's
// capability list). For a given real-world scenario, only SOME attacker capabilities are actually available —
// this animation walks a list of scenarios one at a time and shows exactly which capabilities apply, and why,
// the same way threat-model-stride.js does for DFD elements.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    '/* attacker capabilities, by model (docs/week-11 section 1; Chow, Eisen, Johnson, van Oorschot 2002) */',
    'IO  = sees input and output only',
    'SC  = can also measure a side channel (timing / power / EM)',
    'MEM = can also read live memory / registers while it runs',
    'COD = can also read the code statically (disassemble / decompile)',
    'MOD = can also modify execution (skip a check, run one round, inject a fault)',
    '',
    '/* which capabilities apply to which attacker model (docs/week-11, section 1 table) */',
    'black : IO,               ',
    'grey  : IO, SC,           ',
    'white : IO, SC, MEM, COD, MOD'
  ];
  var CAPS = ['IO', 'SC', 'MEM', 'COD', 'MOD'];
  var CAP_LINE = { IO: 8, SC: 9, MEM: 10, COD: 10, MOD: 10 };
  var MODEL_LINE = { black: 8, grey: 9, white: 10 };
  var MODEL_LABEL = {
    black: T('kara kutu', 'black box'),
    grey: T('gri kutu', 'grey box'),
    white: T('beyaz kutu', 'white box')
  };
  var APPLIES = {
    black: { IO: 1, SC: 0, MEM: 0, COD: 0, MOD: 0 },
    grey: { IO: 1, SC: 1, MEM: 0, COD: 0, MOD: 0 },
    white: { IO: 1, SC: 1, MEM: 1, COD: 1, MOD: 1 }
  };

  function mk(scenarios) { return { scenarios: scenarios }; }
  function sc(name, model) { return { name: name, model: model }; }

  /** Independent computation (a plain lookup, no build()-side state): every scenario's applicable capabilities. */
  function reference(data) {
    return data.scenarios.map(function (s) {
      var caps = CAPS.filter(function (c) { return APPLIES[s.model][c] === 1; });
      return { name: s.name, model: s.model, caps: caps };
    });
  }

  function isValidName(s) { return s.length >= 1 && s.length <= 64 && !/[:;]/.test(s); }

  var NORMAL = [
    sc('Public REST login endpoint', 'black'), sc('Rate-limited cloud pricing API', 'black'),
    sc('Contactless payment card, power-trace rig', 'grey'), sc('Car-key fob, radio timing capture', 'grey'),
    sc('Decompiled mobile banking APK', 'white'), sc('Debugger attached to a desktop app', 'white'),
    sc('Rooted phone running the client app', 'white'), sc('Web login form over HTTPS', 'black'),
    sc('Smart-card reader on the attacker\'s own desk', 'grey'), sc('Downloaded game client binary', 'white'),
    sc('DNS resolver answering only queries', 'black'), sc('Firmware dumped from a purchased device', 'white')
  ];
  var HARD = [
    sc('Cloud object-storage API', 'black'), sc('SSH server (auth attempts only)', 'black'),
    sc('IoT sensor, EM probe on the PCB', 'grey'), sc('Access-card reader, timing side channel', 'grey'),
    sc('Voltage-glitching rig on a purchased ECU', 'grey'), sc('Fully rooted reference device with root shell', 'white'),
    sc('Static disassembly of a shipped .so library', 'white'), sc('Live memory dump under a debugger', 'white'),
    sc('Emulator running the app with full instrumentation', 'white'), sc('Public search API', 'black'),
    sc('Contactless transit card power trace', 'grey'), sc('Reflashed test device with a custom bootloader', 'white'),
    sc('Load balancer health-check endpoint', 'black'), sc('Frida-hooked mobile process', 'white'),
    sc('Smart meter, power-line side channel', 'grey'), sc('Open Wi-Fi captive portal', 'black')
  ];
  var EDGE_WHITE = [];
  for (var i = 1; i <= 10; i++) EDGE_WHITE.push(sc('Reverse-engineering lab sample #' + i, 'white'));
  var EDGE_BLACK = [];
  for (var j = 1; j <= 10; j++) EDGE_BLACK.push(sc('Remote peer #' + j + ' (network-only view)', 'black'));

  function build(S, data) {
    var scenarios = data.scenarios;
    var seenModels = {};
    var GX = 0, GY = 0, EW = 250, EH = 34, LW = 46, LGAP = 6;

    S.box('scn', { x: GX, y: GY, w: EW, h: EH, size: 13, mono: false, text: '', style: 'hl' });
    S.label('modelLbl', { x: GX + EW / 2, y: GY - 16, text: '', anchor: 'middle', size: 13, bold: true });
    var lx0 = GX + EW + 40;
    for (var li = 0; li < 5; li++) {
      S.box('L' + li, { x: lx0 + li * (LW + LGAP), y: GY, w: LW, h: EH, size: 13, mono: true, text: CAPS[li], style: 'dim' });
    }
    S.label('capRow', { x: lx0 - 14, y: GY + 22, text: T('yetenek', 'capability'), anchor: 'end', size: 13, bold: true });

    var outY = GY + 90, outCount = 0;
    S.label('outLbl', { x: GX, y: outY - 14, text: T('uygulanan yetenekler (özet)', 'applicable capabilities (summary)'), anchor: 'start', size: 13, bold: true });

    for (var idx = 0; idx < scenarios.length; idx++) {
      var e = scenarios[idx];
      var detailed = !seenModels[e.model];
      seenModels[e.model] = true;

      S.set('scn', { text: e.name });
      S.set('modelLbl', { text: MODEL_LABEL[e.model] });
      for (li = 0; li < 5; li++) S.set('L' + li, { style: 'dim' });
      S.at(idx);

      if (detailed) {
        S.step(T('`' + e.name + '` — bir **' + MODEL_LABEL[e.model].tr + '** senaryosu. Beş yeteneği tek tek soralım.',
                  '`' + e.name + '` — a **' + MODEL_LABEL[e.model].en + '** scenario. Let\'s ask all five capabilities one by one.'),
               { c: [MODEL_LINE[e.model]] });
        for (li = 0; li < 5; li++) {
          var c = CAPS[li], yes = APPLIES[e.model][c] === 1;
          S.set('L' + li, { style: yes ? 'new' : 'del' });
          S.step(T('`' + c + '` (' + capTr(c) + '): ' + MODEL_LABEL[e.model].tr + ' saldırganı için ' + (yes ? 'VAR.' : 'yok — atla.'),
                    '`' + c + '` (' + capEn(c) + '): for a ' + MODEL_LABEL[e.model].en + ' attacker, this capability is ' + (yes ? 'PRESENT.' : 'absent — skip.')),
                 { c: [CAP_LINE[c]] });
        }
      } else {
        for (li = 0; li < 5; li++) {
          var c2 = CAPS[li];
          if (APPLIES[e.model][c2] === 1) S.set('L' + li, { style: 'new' });
        }
        var appl = CAPS.filter(function (LL) { return APPLIES[e.model][LL] === 1; });
        S.step(T('`' + e.name + '` de bir **' + MODEL_LABEL[e.model].tr + '**: aynı yetenekler (' + appl.join(', ') + ') geçerli.',
                  '`' + e.name + '` is also a **' + MODEL_LABEL[e.model].en + '**: the same capabilities (' + appl.join(', ') + ') apply.'),
               { c: [MODEL_LINE[e.model]] });
      }

      var applicable = CAPS.filter(function (LL) { return APPLIES[e.model][LL] === 1; });
      S.label('out' + outCount, { x: GX, y: outY + outCount * 20, text: e.name + '  ->  ' + applicable.join(','), anchor: 'start', size: 12, mono: true });
      outCount++;
    }
    S.remove('scn'); S.remove('modelLbl');
    for (li = 0; li < 5; li++) S.remove('L' + li);
    S.at(null);
    S.result = reference(data);
    S.step(T(scenarios.length + ' senaryonun hepsi sınıflandırıldı. WBC, tam olarak beyaz kutu satırının MOD ve COD sütunlarını hedef alır.',
              'All ' + scenarios.length + ' scenarios are classified. WBC targets exactly the white-box row\'s MOD and COD columns.'), {});
  }
  function capTr(c) { return { IO: 'girdi/çıktı', SC: 'yan kanal', MEM: 'canlı bellek', COD: 'statik kod okuma', MOD: 'çalışma anında değiştirme' }[c]; }
  function capEn(c) { return { IO: 'input/output', SC: 'side channel', MEM: 'live memory', COD: 'static code reading', MOD: 'runtime modification' }[c]; }

  D.define({
    id: 'attacker-models',
    title: T('Kara / gri / beyaz kutu: saldırgan hangi yeteneklere sahip?', 'Black / grey / white box: which capabilities does the attacker have?'),
    code: { c: REF_C },
    presets: [
      { id: 'mixed-12', level: 'normal', name: T('Normal: 12 karışık senaryo', 'Normal: 12 mixed scenarios'), data: mk(NORMAL) },
      { id: 'mixed-16', level: 'hard', name: T('Zor: 16 senaryo, üç model de karışık', 'Hard: 16 scenarios, all three models mixed'), data: mk(HARD) },
      { id: 'edge-all-white', level: 'edge', name: T('Uç durum: 10 senaryo de beyaz kutu (hep MOD/COD var)', 'Edge case: all 10 scenarios are white-box (MOD/COD always present)'), data: mk(EDGE_WHITE) },
      { id: 'edge-all-black', level: 'edge', name: T('Uç durum: 10 senaryo de kara kutu (hep yalnız IO)', 'Edge case: all 10 scenarios are black-box (only IO, always)'), data: mk(EDGE_BLACK) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.scenarios.length; },
    random: function (level, r) {
      var models = ['black', 'grey', 'white'];
      var counts = { easy: 10, normal: 12, hard: 16, extreme: 20 };
      var n = counts[level] || 10;
      var out = [];
      for (var i = 0; i < n; i++) {
        var m = models[D.randInt(r, 0, 2)];
        out.push(sc(MODEL_LABEL[m].en + ' scenario #' + (i + 1), m));
      }
      return mk(out);
    },
    input: {
      hint: T('ad:model; ad:model; … (model = black|grey|white)', 'name:model; name:model; … (model = black|grey|white)'),
      format: function (data) { return data.scenarios.map(function (e) { return e.name + ':' + e.model; }).join('; '); },
      tokens: function (data) { return data.scenarios.map(function (e) { return e.name; }); },
      parse: function (text) {
        var toks = String(text).split(';').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir senaryo girin.', 'Enter at least one scenario.');
        var out = [];
        toks.forEach(function (t) {
          var parts = t.split(':');
          if (parts.length !== 2) throw T('"' + t + '" biçimi "ad:model" olmalı.', '"' + t + '" must be "name:model".');
          var name = parts[0].trim(), m = parts[1].trim();
          if (!isValidName(name)) throw T('"' + name + '" geçersiz bir ad.', '"' + name + '" is not a valid name.');
          if (['black', 'grey', 'white'].indexOf(m) < 0) throw T('"' + m + '" geçersiz bir model.', '"' + m + '" is not a valid model.');
          out.push(sc(name, m));
        });
        return mk(out);
      },
      bad: ['', 'noModel', 'x:purple', 'a:black:extra', ':black']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
