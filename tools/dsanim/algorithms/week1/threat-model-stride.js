// CEN429 — Week 1 — Threat modelling: DFD element -> STRIDE categories
// Reference material: docs/week-1/cen429-week-1.{tr,en}.md, section 8, "Hangi ogeye hangi harf sorulur?" table.
// Microsoft's STRIDE (Kohnfelder & Garg, 1999): for every element of a data-flow diagram (DFD) -- external
// entity, process, data store, data flow -- only SOME of the six threat letters are meaningful. This animation
// walks a small system's DFD element by element and shows which letters apply, and why.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    '/* STRIDE threat categories (Kohnfelder & Garg, Microsoft, 1999) */',
    'S = Spoofing               breaks: Authentication',
    'T = Tampering               breaks: Integrity',
    'R = Repudiation             breaks: Non-repudiation',
    'I = Information disclosure  breaks: Confidentiality',
    'D = Denial of service       breaks: Availability',
    'E = Elevation of privilege  breaks: Authorization',
    '',
    '/* which letters apply to which DFD element type (docs/week-1, section 8) */',
    'external_entity : S,          R',
    'process         : S, T, R, I, D, E',
    'data_store      :    T, R, I, D',
    'data_flow       :    T,    I, D'
  ];
  var LETTERS = ['S', 'T', 'R', 'I', 'D', 'E'];
  var LETTER_LINE = { S: 1, T: 2, R: 3, I: 4, D: 5, E: 6 };
  var TYPE_LINE = { external: 9, process: 10, store: 11, flow: 12 };
  var TYPE_LABEL = {
    external: T('dış varlık', 'external entity'),
    process: T('süreç', 'process'),
    store: T('veri deposu', 'data store'),
    flow: T('veri akışı', 'data flow')
  };
  var APPLIES = {
    external: { S: 1, T: 0, R: 1, I: 0, D: 0, E: 0 },
    process: { S: 1, T: 1, R: 1, I: 1, D: 1, E: 1 },
    store: { S: 0, T: 1, R: 1, I: 1, D: 1, E: 0 },
    flow: { S: 0, T: 1, R: 0, I: 1, D: 1, E: 0 }
  };

  function mk(elements) { return { elements: elements }; }
  function el(name, type) { return { name: name, type: type }; }

  var NORMAL = [
    el('Student (browser)', 'external'), el('Instructor (browser)', 'external'),
    el('Login process', 'process'), el('Grade entry process', 'process'), el('Report generator', 'process'),
    el('Session store', 'store'), el('Grade database', 'store'), el('Audit log', 'store'),
    el('HTTP login request', 'flow'), el('HTTP grade submit', 'flow'), el('Grade report response', 'flow'),
    el('Email notification', 'flow')
  ];
  var HARD = [
    el('Card terminal', 'external'), el('Backup server', 'external'), el('Update server', 'external'),
    el('Key derivation process', 'process'), el('Encryption process', 'process'), el('Clipboard writer', 'process'),
    el('Vault file', 'store'), el('Header parameters', 'store'), el('Update signing key', 'store'),
    el('Master password entry', 'flow'), el('Encrypted vault upload', 'flow'), el('Update package download', 'flow'),
    el('Clipboard copy', 'flow'), el('TLS session to backup', 'flow'), el('Config read', 'flow'),
    el('Signature check result', 'flow')
  ];
  var EDGE_FLOW = [];
  for (var i = 1; i <= 10; i++) EDGE_FLOW.push(el('Packet #' + i + ' on the wire', 'flow'));
  var EDGE_EXTERNAL = [];
  for (var j = 1; j <= 10; j++) EDGE_EXTERNAL.push(el('Untrusted peer #' + j, 'external'));

  /** Independent computation (a plain lookup, no build()-side state): every element's applicable letters. */
  function reference(data) {
    return data.elements.map(function (e) {
      var letters = LETTERS.filter(function (L) { return APPLIES[e.type][L] === 1; });
      return { name: e.name, type: e.type, letters: letters };
    });
  }

  function isValidName(s) { return s.length >= 1 && s.length <= 40 && !/[,:;]/.test(s); }

  function build(S, data) {
    var elements = data.elements;
    var seenTypes = {};
    var GX = 0, GY = 0, EW = 210, EH = 34, LW = 30, LGAP = 6;

    S.box('elem', { x: GX, y: GY, w: EW, h: EH, size: 14, mono: false, text: '', style: 'hl' });
    S.label('typeLbl', { x: GX + EW / 2, y: GY - 16, text: '', anchor: 'middle', size: 13, bold: true });
    var lx0 = GX + EW + 40;
    for (var li = 0; li < 6; li++) {
      S.box('L' + li, { x: lx0 + li * (LW + LGAP), y: GY, w: LW, h: EH, size: 15, mono: true, text: LETTERS[li], style: 'dim' });
    }
    S.label('letterRow', { x: lx0 - 14, y: GY + 22, text: 'STRIDE', anchor: 'end', size: 13, bold: true });

    var outY = GY + 90, outCount = 0;
    S.label('outLbl', { x: GX, y: outY - 14, text: T('uygulanan harfler (özet)', 'applicable letters (summary)'), anchor: 'start', size: 13, bold: true });

    for (var idx = 0; idx < elements.length; idx++) {
      var e = elements[idx];
      var detailed = !seenTypes[e.type];
      seenTypes[e.type] = true;

      S.set('elem', { text: e.name });
      S.set('typeLbl', { text: TYPE_LABEL[e.type] });
      for (li = 0; li < 6; li++) S.set('L' + li, { style: 'dim' });
      S.at(idx);

      if (detailed) {
        S.step(T('`' + e.name + '` — bir **' + TYPE_LABEL[e.type].tr + '**. Altı harfi tek tek soralım.',
                  '`' + e.name + '` — a **' + TYPE_LABEL[e.type].en + '**. Let\'s ask all six letters one by one.'),
               { c: [TYPE_LINE[e.type]] });
        for (li = 0; li < 6; li++) {
          var L = LETTERS[li], yes = APPLIES[e.type][L] === 1;
          S.set('L' + li, { style: yes ? 'new' : 'del' });
          S.step(T('`' + L + '` (' + captionTr(L) + '): ' + TYPE_LABEL[e.type].tr + ' için ' + (yes ? 'ANLAMLI.' : 'anlamsız — atla.'),
                    '`' + L + '` (' + captionEn(L) + '): for a ' + TYPE_LABEL[e.type].en + ', this is ' + (yes ? 'MEANINGFUL.' : 'not meaningful — skip.')),
                 { c: [LETTER_LINE[L], TYPE_LINE[e.type]] });
        }
      } else {
        for (li = 0; li < 6; li++) {
          var L2 = LETTERS[li];
          if (APPLIES[e.type][L2] === 1) S.set('L' + li, { style: 'new' });
        }
        var appl = LETTERS.filter(function (LL) { return APPLIES[e.type][LL] === 1; });
        S.step(T('`' + e.name + '` de bir **' + TYPE_LABEL[e.type].tr + '**: aynı harfler (' + appl.join(', ') + ') geçerli — tabloyu tekrar sormaya gerek yok.',
                  '`' + e.name + '` is also a **' + TYPE_LABEL[e.type].en + '**: the same letters (' + appl.join(', ') + ') apply — no need to re-derive the table.'),
               { c: [TYPE_LINE[e.type]] });
      }

      var applicable = LETTERS.filter(function (LL) { return APPLIES[e.type][LL] === 1; });
      S.label('out' + outCount, { x: GX, y: outY + outCount * 20, text: e.name + '  ->  ' + (applicable.length ? applicable.join(',') : T('(yok / none)', '(yok / none)')), anchor: 'start', size: 12, mono: true });
      outCount++;
    }
    S.remove('elem'); S.remove('typeLbl');
    for (li = 0; li < 6; li++) S.remove('L' + li);
    S.at(null);
    S.result = reference(data);
    S.step(T(elements.length + ' ögenin hepsi sınıflandırıldı. Her satır, o öge için gerçekten sorulması gereken tehdit sorularını gösteriyor.',
              'All ' + elements.length + ' elements are classified. Each row shows exactly the threat questions worth asking for that element.'),
           {});
  }
  function captionTr(L) { return { S: 'kimlik taklidi', T: 'kurcalama', R: 'inkâr', I: 'bilgi sızması', D: 'hizmet engelleme', E: 'yetki yükseltme' }[L]; }
  function captionEn(L) { return { S: 'spoofing', T: 'tampering', R: 'repudiation', I: 'info disclosure', D: 'denial of service', E: 'elevation of privilege' }[L]; }

  D.define({
    id: 'threat-model-stride',
    title: T('DFD ögesi -> STRIDE kategorileri', 'DFD element -> STRIDE categories'),
    code: { c: REF_C },
    presets: [
      { id: 'grade-system', level: 'normal', name: T('Normal: öğrenci not sistemi (12 öge)', 'Normal: student grade system (12 elements)'), data: mk(NORMAL) },
      { id: 'password-vault', level: 'hard', name: T('Zor: parola kasası (16 öge, 4 tür karışık)', 'Hard: password vault (16 elements, 4 types mixed)'), data: mk(HARD) },
      { id: 'edge-all-flow', level: 'edge', name: T('Uç durum: 10 öge de veri akışı (asla S/R/E yok)', 'Edge case: all 10 elements are data flows (never S/R/E)'), data: mk(EDGE_FLOW) },
      { id: 'edge-all-external', level: 'edge', name: T('Uç durum: 10 öge de dış varlık (asla T/I/D/E yok)', 'Edge case: all 10 elements are external entities (never T/I/D/E)'), data: mk(EDGE_EXTERNAL) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.elements.length; },
    random: function (level, r) {
      var types = ['external', 'process', 'store', 'flow'];
      var counts = { easy: 10, normal: 12, hard: 16, extreme: 20 };
      var n = counts[level] || 10;
      var out = [];
      for (var i = 0; i < n; i++) {
        var ty = types[D.randInt(r, 0, 3)];
        out.push(el(TYPE_LABEL[ty].en + ' #' + (i + 1), ty));
      }
      return mk(out);
    },
    input: {
      hint: T('ad:tür, ad:tür, … (tür = external|process|store|flow)', 'name:type, name:type, … (type = external|process|store|flow)'),
      format: function (data) { return data.elements.map(function (e) { return e.name + ':' + e.type; }).join(', '); },
      tokens: function (data) { return data.elements.map(function (e) { return e.name; }); },
      parse: function (text) {
        var toks = String(text).split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir öge girin.', 'Enter at least one element.');
        var out = [];
        toks.forEach(function (t) {
          var parts = t.split(':');
          if (parts.length !== 2) throw T('"' + t + '" biçimi "ad:tür" olmalı.', '"' + t + '" must be "name:type".');
          var name = parts[0].trim(), ty = parts[1].trim();
          if (!isValidName(name)) throw T('"' + name + '" geçersiz bir ad.', '"' + name + '" is not a valid name.');
          if (['external', 'process', 'store', 'flow'].indexOf(ty) < 0) throw T('"' + ty + '" geçersiz bir tür.', '"' + ty + '" is not a valid type.');
          out.push(el(name, ty));
        });
        return mk(out);
      },
      bad: ['', 'noType', 'x:weird', 'a:external:extra', ':external']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
