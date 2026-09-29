// CEN429 — Week 14 — Demo 1 (code/week-14/01-source-to-source/demo.sh)
// Order matters: a transform can only see what already exists in the source WHEN IT RUNS, never
// what a LATER transform will still add — and `sign` must be the very LAST stage, or the signature
// no longer matches the bytes that ship (see docs/week-14 §4's two worked examples: EncodeLiterals's
// coverage under two transform orders, and "what happens if signing runs before obfuscation").
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'if command -v tigress >/dev/null 2>&1; then',
    '  echo "STEP 2 - Tigress FOUND: running the real transform pipeline"',
    '  tigress --Environment=x86_64:Linux:Gcc:11 \\',
    '          --Transform=EncodeLiterals --Functions=grant_access \\',
    '          --Transform=AddOpaque --Functions=grant_access --AddOpaqueKinds=call \\',
    '          --Seed=1001 --out=variant_1001.c source.c',
    'else',
    '  echo "STEP 2 - Tigress NOT installed."',
    'fi'
  ];

  var STAGE_POOL = ['clean-build', 'EncodeLiterals', 'EncodeArithmetic', 'Flatten', 'AddOpaque',
    'compile', 'unit-test', 'measure', 'diversify', 'sign'];
  var CONST_PRODUCERS = { Flatten: 1, AddOpaque: 1 };            // each adds one new constant to encode
  var MUTATORS = ['clean-build', 'EncodeLiterals', 'EncodeArithmetic', 'Flatten', 'AddOpaque', 'diversify'];

  function mk(order) { return { order: order.slice() }; }

  function analyze(order) {
    var visibleConsts = 1;   // the one original constant, present from clean-build on
    var encodedAt = -1, encodedCount = 0, signAt = -1;
    for (var i = 0; i < order.length; i++) {
      var stg = order[i];
      if (CONST_PRODUCERS[stg]) visibleConsts += CONST_PRODUCERS[stg];
      if (stg === 'EncodeLiterals') { encodedAt = i; encodedCount = visibleConsts; }
      if (stg === 'sign') signAt = i;
    }
    var mutatedAfterSign = false;
    if (signAt >= 0)
      for (var j = signAt + 1; j < order.length; j++)
        if (MUTATORS.indexOf(order[j]) >= 0) mutatedAfterSign = true;
    return { encodedAt: encodedAt, encodedCount: encodedCount, signAt: signAt,
      signatureValid: signAt < 0 ? null : !mutatedAfterSign };
  }

  function reference(data) {
    var a = analyze(data.order);
    return { encodedCount: a.encodedCount, signatureValid: a.signatureValid };
  }

  function build(S, data) {
    var order = data.order, n = order.length;
    var W = 108, H = 34, GAP = 8;
    S.label('lbl', { x: 0, y: -18, text: T('Dönüşüm hattı (sıra soldan sağa)', 'Transform pipeline (order, left to right)'), anchor: 'start', bold: true, size: 15 });
    for (var i = 0; i < n; i++)
      S.box('s' + i, { x: i * (W + GAP), y: 0, w: W, h: H, size: 10, above: String(i), text: order[i], style: 'dim' });
    S.step(T('Sıra: ' + order.join(' -> ') + '.', 'Order: ' + order.join(' -> ') + '.'), { sh: [{ n: 1, note: T('tigress kurulu mu? evet', 'is tigress installed? yes') }] });

    // Placed clear below the "scope" brace (which sits just under the stage row, around y=42..54,
    // via S.brace's default `dist`/bottom-side geometry) so its label never overlaps this one.
    S.label('countLbl', { x: 0, y: 115, text: T('Görünür sabit sayısı:', 'Visible constants so far:'), anchor: 'start', size: 13 });
    S.box('countBox', { x: 260, y: 100, w: 70, h: 30, size: 14, text: '1', style: 'normal' });

    var visibleConsts = 1, encodedAt = -1, encodedCount = 0, signAt = -1;
    var detail = Math.min(n, 6);
    for (i = 0; i < n; i++) {
      S.at(i);
      S.set('s' + i, { style: 'hl' });
      var stg = order[i];
      var noted = false;
      if (CONST_PRODUCERS[stg]) {
        visibleConsts += CONST_PRODUCERS[stg];
        S.set('countBox', { text: String(visibleConsts), style: 'active' });
      }
      if (stg === 'EncodeLiterals') {
        encodedAt = i; encodedCount = visibleConsts;
        S.brace('scope', { from: 's0', to: 's' + i, text: T(visibleConsts + ' sabit kodlanıyor', visibleConsts + ' constant(s) encoded'), side: 'bottom' });
        if (i < detail) S.step(T('`EncodeLiterals` çalışıyor: şu ana kadar görünen ' + visibleConsts + ' sabiti kodluyor (sonrakileri GÖREMEZ).',
                                   '`EncodeLiterals` runs: encodes the ' + visibleConsts + ' constant(s) visible so far (it cannot see later ones).'),
          { sh: [{ n: 4, note: T('EncodeLiterals hedefi: grant_access', 'EncodeLiterals target: grant_access') }] });
        noted = true;
      }
      if (stg === 'AddOpaque') {
        if (i < detail) S.step(T('`AddOpaque` çalışıyor: yeni bir opak koşul sabiti ekler (' + visibleConsts + '. sabit).',
                                   '`AddOpaque` runs: adds a new opaque-condition constant (constant #' + visibleConsts + ').'),
          { sh: [{ n: 5, note: T('AddOpaque hedefi: grant_access, --AddOpaqueKinds=call', 'AddOpaque target: grant_access, --AddOpaqueKinds=call') }] });
        noted = true;
      }
      if (stg === 'sign') {
        signAt = i;
        S.box('sigBox', { x: 0, y: 150, w: 200, h: 34, size: 13, text: T('imza: hesaplanıyor…', 'signature: computing…'), style: 'active' });
        if (i < detail) S.step(T('`sign`: geçerli o ANDAKİ bayt içeriğine bağlı bir imza üretir.',
                                   '`sign`: produces a signature tied to the bytes AS THEY ARE right now.'), {});
        noted = true;
      }
      if (!noted && i < detail)
        S.step(T('`' + stg + '` çalışıyor.', '`' + stg + '` runs.'), {});
      S.set('s' + i, { style: 'new' });
    }
    S.at(null);

    var mutatedAfterSign = false;
    if (signAt >= 0)
      for (i = signAt + 1; i < n; i++) if (MUTATORS.indexOf(order[i]) >= 0) mutatedAfterSign = true;
    var signatureValid = signAt < 0 ? null : !mutatedAfterSign;
    if (signAt >= 0)
      S.set('sigBox', { text: signatureValid ? T('imza: GEÇERLİ', 'signature: VALID') : T('imza: GEÇERSİZ (reddedildi)', 'signature: INVALID (rejected)'),
        style: signatureValid ? 'new' : 'del' });

    if (signAt < 0)
      S.step(T('Bu sırada `sign` yok; yalnız kapsam karşılaştırması: ' + encodedCount + ' sabit kodlandı.',
                'No `sign` in this order; scope comparison only: ' + encodedCount + ' constant(s) got encoded.'), {});
    else if (signatureValid)
      S.step(T('`sign` SON adım: imza son bayt içeriğiyle eşleşiyor — GEÇERLİ.', '`sign` is the LAST stage: the signature matches the final bytes — VALID.'), {});
    else
      S.step(T('`sign`den SONRA en az bir aşama baytları değiştirdi — imza artık GEÇERSİZ (bölüm 4\'teki "imzalama sırası bozulursa" senaryosu).',
                'At least one stage changed bytes AFTER `sign` — the signature is now INVALID (§4\'s "what if signing runs before obfuscation" scenario).'), {});

    S.result = { encodedCount: encodedCount, signatureValid: signatureValid };
  }

  D.define({
    id: 'transform-stacking-order',
    title: T('Dönüşüm hattında sıranın etkisi: kapsam ve imza', 'Effect of transform stacking order: scope and signature'),
    code: function () { return { sh: C }; },
    presets: [
      { id: 'code-then-structure', level: 'normal', name: T('Normal: kodla → yapılandır → imzala (Sıra 1, doğru)', 'Normal: encode -> structure -> sign (Order 1, correct)'),
        data: mk(['clean-build', 'EncodeLiterals', 'EncodeArithmetic', 'Flatten', 'AddOpaque', 'compile', 'unit-test', 'measure', 'diversify', 'sign']) },
      { id: 'structure-then-code', level: 'hard', name: T('Zor: yapılandır → kodla → imzala (Sıra 2, daha geniş kapsam)', 'Hard: structure -> encode -> sign (Order 2, wider scope)'),
        data: mk(['clean-build', 'Flatten', 'AddOpaque', 'EncodeArithmetic', 'EncodeLiterals', 'compile', 'unit-test', 'measure', 'diversify', 'sign']) },
      { id: 'sign-too-early', level: 'edge', name: T('Uç durum: imza EN BAŞTA — sonradan gizlemek imzayı geçersiz kılar', 'Edge case: signing FIRST — obfuscating afterwards invalidates it'),
        data: mk(['clean-build', 'sign', 'EncodeLiterals', 'EncodeArithmetic', 'Flatten', 'AddOpaque', 'compile', 'unit-test', 'measure', 'diversify']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.order.length; },
    random: function (level, r) {
      var core = ['EncodeLiterals', 'EncodeArithmetic', 'Flatten', 'AddOpaque'];
      // shuffle the four transforms (Fisher-Yates with D.randInt)
      for (var i = core.length - 1; i > 0; i--) {
        var j = D.randInt(r, 0, i);
        var tmp = core[i]; core[i] = core[j]; core[j] = tmp;
      }
      var order = ['clean-build'].concat(core, ['compile', 'unit-test', 'measure', 'diversify']);
      // "sign" is always present (every real release pipeline signs); its POSITION is what varies —
      // at the end (the correct place) most of the time, but sometimes early (the edge-case danger).
      var pos = { easy: order.length, normal: order.length, hard: order.length, extreme: D.randInt(r, 1, order.length) }[level];
      if (pos === undefined || pos >= order.length) order.push('sign'); else order.splice(pos, 0, 'sign');
      return mk(order);
    },
    input: {
      hint: T('sıra=aşama1,aşama2,… (geçerli aşamalar: ' + STAGE_POOL.join(',') + ')',
              'order=stage1,stage2,… (valid stages: ' + STAGE_POOL.join(',') + ')'),
      format: function (data) { return 'order=' + data.order.join(','); },
      tokens: function (data) { return data.order; },
      parse: function (text) {
        var m = String(text).trim().match(/^order=(.+)$/);
        if (!m) throw T('Biçim: "order=aşama1,aşama2,…" olmalı.', 'Format must be "order=stage1,stage2,…".');
        var order = m[1].split(',');
        if (order.length < 1) throw T('En az bir aşama gerekir.', 'At least one stage is required.');
        for (var i = 0; i < order.length; i++)
          if (STAGE_POOL.indexOf(order[i]) < 0) throw T('Bilinmeyen aşama: "' + order[i] + '".', 'Unknown stage: "' + order[i] + '".');
        return mk(order);
      },
      bad: ['', 'order=', 'order=NotAStage', 'order=sign,NotAStage', 'clean-build,sign']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
