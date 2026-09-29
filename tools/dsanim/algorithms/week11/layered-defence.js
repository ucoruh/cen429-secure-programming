// CEN429 — Week 11 — Section 5: where WBC sits in layered defence.
// Reference material: docs/week-11/cen429-week-11.{tr,en}.md, section 5 (the key-protection option table
// and the "apply the decision rule to three assets" worked example). WBC is never used alone: the option
// table shows it paired with key rotation, device/version binding and server-side risk audit; a hardware
// root (TEE/SE client-side, HSM/SoftHSM server-side) replaces all four when it exists and can be trusted.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    '/* key-protection options, weakest to strongest (docs/week-11 section 5) */',
    'PLAIN  = key sits in a plain static array           -> NEVER (docs/week-11 section 2)',
    'OBF    = obfuscated/split key, no WBC                -> only low-value, short-lived secrets',
    'WBC    = key folded into tables + input/output encoding (docs/week-11 section 3)',
    'ROTATE = the WBC key is rotated/refreshed periodically',
    'BIND   = the WBC tables are bound to one device/app version (stops code lifting)',
    'AUDIT  = server-side risk checks watch how the key/token is actually used',
    'HWROOT = a hardware root of trust: TEE/SE (client) or HSM/SoftHSM (server)',
    '',
    '/* which layers are active for each option (docs/week-11 section 5 table) */',
    'plain : (none)',
    'obf   : OBF',
    'wbc   : WBC, ROTATE, BIND, AUDIT',
    'hw    : HWROOT'
  ];
  var LAYERS = ['OBF', 'WBC', 'ROTATE', 'BIND', 'AUDIT', 'HWROOT'];
  var LAYER_LINE = { OBF: 11, WBC: 12, ROTATE: 12, BIND: 12, AUDIT: 12, HWROOT: 13 };
  var CAT_LINE = { plain: 10, obf: 11, wbc: 12, hw: 13 };
  var CAT_LABEL = {
    plain: T('düz anahtar — ASLA', 'plain key — NEVER'),
    obf: T('gizlenmiş/parçalanmış anahtar', 'obfuscated/split key'),
    wbc: T('WBC + katmanlı savunma', 'WBC + layered defence'),
    hw: T('donanım kökü (TEE/SE ya da HSM)', 'hardware root (TEE/SE or HSM)')
  };
  var APPLIES = {
    plain: { OBF: 0, WBC: 0, ROTATE: 0, BIND: 0, AUDIT: 0, HWROOT: 0 },
    obf: { OBF: 1, WBC: 0, ROTATE: 0, BIND: 0, AUDIT: 0, HWROOT: 0 },
    wbc: { OBF: 0, WBC: 1, ROTATE: 1, BIND: 1, AUDIT: 1, HWROOT: 0 },
    hw: { OBF: 0, WBC: 0, ROTATE: 0, BIND: 0, AUDIT: 0, HWROOT: 1 }
  };

  function mk(assets) { return { assets: assets }; }
  function asset(name, cat) { return { name: name, cat: cat }; }

  /** Independent computation (a plain lookup, no build()-side state): every asset's active layers. */
  function reference(data) {
    return data.assets.map(function (a) {
      var layers = LAYERS.filter(function (L) { return APPLIES[a.cat][L] === 1; });
      return { name: a.name, cat: a.cat, layers: layers };
    });
  }

  function isValidName(s) { return s.length >= 1 && s.length <= 64 && !/[:;]/.test(s); }

  var NORMAL = [
    asset('Static TLS key in a fixed array (bad example)', 'plain'),
    asset('Session-token encryption key (minutes)', 'obf'),
    asset('One-time-password shared secret (30 s)', 'obf'),
    asset('Push-notification token', 'obf'),
    asset('Local database key, no trusted TEE', 'wbc'),
    asset('Mobile wallet signing key, no trusted TEE', 'wbc'),
    asset('Offline license-check key, no trusted TEE', 'wbc'),
    asset('Local database key, device has a trusted TEE', 'hw'),
    asset('Device-pairing key, secure element present', 'hw'),
    asset('Payment signing key, server-side HSM', 'hw'),
    asset('Cloud KMS master key, server-side', 'hw'),
    asset('IoT authentication key, secure element present', 'hw')
  ];
  var HARD = NORMAL.concat([
    asset('Feature-flag signing key, short-lived', 'obf'),
    asset('Firmware update key, no trusted TEE on old devices', 'wbc'),
    asset('Config-file encryption key, device root untrusted', 'wbc'),
    asset('Backup-encryption key, server-side HSM', 'hw')
  ]);
  var EDGE_WBC = [];
  for (var i = 1; i <= 10; i++) EDGE_WBC.push(asset('Client asset #' + i + ', value high, no trusted hardware root', 'wbc'));
  var EDGE_HW = [];
  for (var j = 1; j <= 10; j++) EDGE_HW.push(asset('Asset #' + j + ' with a trusted hardware root available', 'hw'));

  function build(S, data) {
    var assets = data.assets;
    var seenCats = {};
    var GX = 0, GY = 0, EW = 280, EH = 34, LW = 52, LGAP = 6;

    S.box('ast', { x: GX, y: GY, w: EW, h: EH, size: 13, mono: false, text: '', style: 'hl' });
    S.label('catLbl', { x: GX + EW / 2, y: GY - 16, text: '', anchor: 'middle', size: 13, bold: true });
    var lx0 = GX + EW + 40;
    for (var li = 0; li < LAYERS.length; li++) {
      S.box('L' + li, { x: lx0 + li * (LW + LGAP), y: GY, w: LW, h: EH, size: 12, mono: true, text: LAYERS[li], style: 'dim' });
    }
    S.label('layerRow', { x: lx0 - 14, y: GY + 22, text: T('katman', 'layer'), anchor: 'end', size: 13, bold: true });

    var outY = GY + 90, outCount = 0;
    S.label('outLbl', { x: GX, y: outY - 14, text: T('etkin katmanlar (özet)', 'active layers (summary)'), anchor: 'start', size: 13, bold: true });

    for (var idx = 0; idx < assets.length; idx++) {
      var e = assets[idx];
      var detailed = !seenCats[e.cat];
      seenCats[e.cat] = true;

      S.set('ast', { text: e.name });
      S.set('catLbl', { text: CAT_LABEL[e.cat] });
      for (li = 0; li < LAYERS.length; li++) S.set('L' + li, { style: 'dim' });
      S.at(idx);

      if (detailed) {
        S.step(T('`' + e.name + '` — karar: **' + CAT_LABEL[e.cat].tr + '**. Altı katmanı tek tek soralım.',
                  '`' + e.name + '` — decision: **' + CAT_LABEL[e.cat].en + '**. Let\'s ask all six layers one by one.'),
               { c: [CAT_LINE[e.cat]] });
        for (li = 0; li < LAYERS.length; li++) {
          var Lc = LAYERS[li], yes = APPLIES[e.cat][Lc] === 1;
          S.set('L' + li, { style: yes ? 'new' : 'del' });
          S.step(T('`' + Lc + '`: bu karar için ' + (yes ? 'ETKİN.' : 'etkin değil — atla.'),
                    '`' + Lc + '`: for this decision, this layer is ' + (yes ? 'ACTIVE.' : 'not active — skip.')),
                 { c: [LAYER_LINE[Lc]] });
        }
      } else {
        for (li = 0; li < LAYERS.length; li++) {
          var Lc2 = LAYERS[li];
          if (APPLIES[e.cat][Lc2] === 1) S.set('L' + li, { style: 'new' });
        }
        var appl = LAYERS.filter(function (LL) { return APPLIES[e.cat][LL] === 1; });
        S.step(T('`' + e.name + '` de **' + CAT_LABEL[e.cat].tr + '**: aynı katmanlar (' + (appl.length ? appl.join(', ') : T('yok', 'none').tr) + ') etkin.',
                  '`' + e.name + '` is also **' + CAT_LABEL[e.cat].en + '**: the same layers (' + (appl.length ? appl.join(', ') : 'none') + ') are active.'),
               { c: [CAT_LINE[e.cat]] });
      }

      var applicable = LAYERS.filter(function (LL) { return APPLIES[e.cat][LL] === 1; });
      S.label('out' + outCount, {
        x: GX, y: outY + outCount * 20, anchor: 'start', size: 12, mono: true,
        text: applicable.length
          ? e.name + '  ->  ' + applicable.join(',')
          : T(e.name + '  ->  (yok)', e.name + '  ->  (none)')
      });
      outCount++;
    }
    S.remove('ast'); S.remove('catLbl');
    for (li = 0; li < LAYERS.length; li++) S.remove('L' + li);
    S.at(null);
    S.result = reference(data);
    S.step(T(assets.length + ' varlığın hepsi sınıflandırıldı. `wbc` kararı HER ZAMAN dört katmanı BİRLİKTE etkinleştirir — WBC hiçbir zaman tek başına yeterli değildir.',
              'All ' + assets.length + ' assets are classified. The `wbc` decision ALWAYS activates four layers TOGETHER — WBC is never sufficient by itself.'), {});
  }

  D.define({
    id: 'layered-defence',
    title: T('WBC katmanlı savunmada nereye oturur?', 'Where does WBC sit in layered defence?'),
    code: { c: REF_C },
    presets: [
      { id: 'mixed-12', level: 'normal', name: T('Normal: 12 varlık, dört karar da temsil ediliyor', 'Normal: 12 assets, all four decisions represented'), data: mk(NORMAL) },
      { id: 'mixed-16', level: 'hard', name: T('Zor: 16 varlık, aynı kararlar tekrar karışık sırada', 'Hard: 16 assets, the same decisions mixed in a different order'), data: mk(HARD) },
      { id: 'edge-all-wbc', level: 'edge', name: T('Uç durum: 10 varlık de WBC — hep aynı dört katman', 'Edge case: all 10 assets are WBC — always the same four layers'), data: mk(EDGE_WBC) },
      { id: 'edge-all-hw', level: 'edge', name: T('Uç durum: 10 varlık de donanım kökü — WBC hiç gerekmiyor', 'Edge case: all 10 assets have a hardware root — WBC is never needed'), data: mk(EDGE_HW) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.assets.length; },
    random: function (level, r) {
      var cats = ['plain', 'obf', 'wbc', 'hw'];
      var counts = { easy: 10, normal: 12, hard: 16, extreme: 20 };
      var n = counts[level] || 10;
      var out = [];
      for (var i = 0; i < n; i++) {
        var c = cats[D.randInt(r, 0, 3)];
        out.push(asset(CAT_LABEL[c].en + ' asset #' + (i + 1), c));
      }
      return mk(out);
    },
    input: {
      hint: T('ad:karar; ad:karar; … (karar = plain|obf|wbc|hw)', 'name:decision; name:decision; … (decision = plain|obf|wbc|hw)'),
      format: function (data) { return data.assets.map(function (e) { return e.name + ':' + e.cat; }).join('; '); },
      tokens: function (data) { return data.assets.map(function (e) { return e.name; }); },
      parse: function (text) {
        var toks = String(text).split(';').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir varlık girin.', 'Enter at least one asset.');
        var out = [];
        toks.forEach(function (t) {
          var parts = t.split(':');
          if (parts.length !== 2) throw T('"' + t + '" biçimi "ad:karar" olmalı.', '"' + t + '" must be "name:decision".');
          var name = parts[0].trim(), c = parts[1].trim();
          if (!isValidName(name)) throw T('"' + name + '" geçersiz bir ad.', '"' + name + '" is not a valid name.');
          if (['plain', 'obf', 'wbc', 'hw'].indexOf(c) < 0) throw T('"' + c + '" geçersiz bir karar.', '"' + c + '" is not a valid decision.');
          out.push(asset(name, c));
        });
        return mk(out);
      },
      bad: ['', 'noDecision', 'x:purple', 'a:wbc:extra', ':wbc']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
