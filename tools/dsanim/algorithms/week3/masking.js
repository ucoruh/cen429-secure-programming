// CEN429 — Week 3 — data masking (docs/week-3 §12: masking, tokenization, pseudonymization)
// Encryption hides data from anyone without the key; masking hides data from people/systems that DO
// have the key but don't need to see all of it. This animation shows three techniques on the same
// value: (1) partial masking — replace the middle with '*', keep the first/last few characters, never
// reversible from the masked copy; (2) tokenization — replace the value with a meaningless token, the
// real value stays only in a separate vault; (3) pseudonymization — a keyed HMAC-like digest, matchable
// back only by whoever holds the key. The real mask_pan()/log_filter() functions and the keyed-HMAC
// pseudonym snippet are shown in the code panel (from the week's notes, §12).
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/* 1) Masking at display: "1234567812345678" -> "************5678" */',
    'void mask_pan(const char *pan, char *out, size_t out_size)',
    '{',
    '    size_t n = strnlen(pan, 19);',
    '    if (out_size < n + 1) { if (out_size) out[0] = \'\\0\'; return; }',
    '    for (size_t i = 0; i < n; i++)',
    '        out[i] = (i + 4 < n) ? \'*\' : pan[i];',
    '    out[n] = \'\\0\';',
    '}',
    '',
    '/* 2) Tokenization: a meaningless token travels instead of the real value; */',
    '/*    the real value stays only in a separate, protected vault.          */',
    '',
    '/* 3) Pseudonymization: a keyed digest (code/common/cen429_crypto.h) */',
    'unsigned char pseudonym[32];',
    'crypto_hmac_sha256(pseudonym_key, 32, id_number, strlen(id_number), pseudonym);',
    '/* the data set stores the first 16 bytes of hex(pseudonym) instead of id_number */',
    '',
    '/* Masking in logs — a simple filter: */',
    'void log_filter(char *line)',
    '{',
    '    static const char *keys[] = { "password=", "pin=", "token=" };',
    '    for (size_t k = 0; k < sizeof keys / sizeof keys[0]; k++) {',
    '        char *p = line;',
    '        while ((p = strstr(p, keys[k])) != NULL) {',
    '            p += strlen(keys[k]);',
    '            while (*p && !isspace((unsigned char)*p))',
    '                *p++ = \'*\';',
    '        }',
    '    }',
    '}'
  ];

  // ------------------------------------------------------------------ toy transforms (illustration only)
  function mix(a, b) {
    var x = (a ^ b) >>> 0;
    x = Math.imul(x, 0x9e3779b1) >>> 0; x ^= x >>> 15;
    x = Math.imul(x, 0x2545f491) >>> 0; x ^= x >>> 13;
    return x >>> 0;
  }
  function strHash(s) { var h = 0x2545f491 >>> 0; for (var i = 0; i < s.length; i++) h = mix(h, s.charCodeAt(i)); return h; }
  function hex32(n) { return D.hex((n >>> 24) & 0xff, 2) + D.hex((n >>> 16) & 0xff, 2) + D.hex((n >>> 8) & 0xff, 2) + D.hex(n & 0xff, 2); }

  function partialMask(v) {
    var keep = 4;
    if (v.length <= 2 * keep) return v;   // too short to mask meaningfully — shown as-is
    var mid = '';
    for (var i = keep; i < v.length - keep; i++) mid += '*';
    return v.slice(0, keep) + mid + v.slice(-keep);
  }
  function tokenOf(v) { return 'TOK-' + hex32(strHash(v)).slice(0, 8); }
  function pseudonymOf(v) { return hex32(mix(strHash('vaultkey'), strHash(v))); }

  function mk(value, technique) { return { value: value, technique: technique }; }   // technique: partial | tokenize | pseudonymize

  // Independent re-implementations (different code shape / different hash constants from partialMask()/
  // tokenOf()/pseudonymOf() above, which build() uses to draw the boxes) — used ONLY by reference(), so a
  // coding bug in build()'s own version (e.g. an off-by-one in the keep-count) does not also hide inside
  // reference()'s check of the same bug.
  function partialMaskRef(v) {
    var keep = 4;
    if (v.length <= 2 * keep) return v;
    return v.substring(0, keep) + new Array(v.length - 2 * keep + 1).join('*') + v.substring(v.length - keep);
  }
  function strHashRef(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h >>> 0; }
  function hex8Ref(n) { var s = (n >>> 0).toString(16); while (s.length < 8) s = '0' + s; return s; }
  function tokenOfRef(v) { return 'TOK-' + hex8Ref(strHashRef(v)).slice(0, 8); }
  function pseudonymOfRef(v) { return hex8Ref((Math.imul(strHashRef('vaultkey'), 2654435761) ^ strHashRef(v)) >>> 0); }

  /** Independent computation: recomputes the chosen technique's output with the SEPARATE helpers above,
   * never calling build()'s own partialMask()/tokenOf()/pseudonymOf()/strHash()/mix(). */
  function reference(data) {
    if (data.technique === 'partial') return { result: partialMaskRef(data.value) };
    if (data.technique === 'tokenize') return { result: tokenOfRef(data.value) };
    return { result: pseudonymOfRef(data.value) };
  }

  function build(S, data) {
    var v = data.value, n = v.length, CW = 26, GAP = 2;
    S.label('vlbl', { x: -14, y: 22, text: T('değer =', 'value ='), anchor: 'end', size: 14, mono: true });
    for (var i = 0; i < n; i++) S.box('v' + i, { x: i * (CW + GAP), y: 0, w: CW, h: 30, size: 13, text: v[i], style: 'normal' });
    S.step(T('Gerçek değer, ' + n + ' karakter: `"' + v + '"`. Anahtarı olan sistemler bile bunu HER ZAMAN görmek zorunda değil.',
              'The real value, ' + n + ' characters: `"' + v + '"`. Even systems that HAVE the key don\'t always need to see all of it.'),
           { c: [] });

    var Y1 = 60;
    if (data.technique === 'partial') {
      var masked = partialMask(v);
      for (i = 0; i < n; i++) {
        var isKept = masked[i] !== '*';
        S.box('m' + i, { x: i * (CW + GAP), y: Y1, w: CW, h: 30, size: 13, text: masked[i], style: isKept ? 'new' : 'del' });
      }
      S.label('mlbl', { x: -14, y: Y1 + 22, text: T('maskeli =', 'masked ='), anchor: 'end', size: 14, mono: true });
      S.result = reference(data);
      S.step(T('`mask_pan()`: yalnız ilk ve son 4 karakter kalır, ortası `*` ile değiştirilir — GÖRÜNTÜLENEN kopyadan GERİ DÖNÜLEMEZ.',
                '`mask_pan()`: only the first and last 4 characters survive, the middle becomes `*` — this CANNOT be reversed from the displayed copy.'),
             { c: [4, { n: 5, note: T('out_size < n+1? HAYIR, arabellek yeterli', 'out_size < n+1? NO, the buffer is big enough') },
                    { n: 6, note: T('i < n? EVET, ' + n + ' karakter için yineleniyor', 'i < n? YES, iterating over ' + n + ' characters') },
                    { n: 7, note: T('i+4 < n? konuma göre değişir: * ya da gerçek karakter', 'i+4 < n? depends on position: * or the real character') }] });
    } else if (data.technique === 'tokenize') {
      var token = tokenOf(v);
      S.styleAll('dim', 'box');
      for (i = 0; i < token.length; i++) S.box('t' + i, { x: i * (CW - 6), y: Y1, w: CW - 8, h: 30, size: 12, mono: true, text: token[i], style: 'new' });
      S.label('tlbl', { x: -14, y: Y1 + 22, text: T('token =', 'token ='), anchor: 'end', size: 14, mono: true });
      S.region('vault', { x: (token.length) * (CW - 6) + 30, y: Y1 - 10, w: 200, h: 50, style: 'active', title: T('kasa (korumalı)', 'vault (protected)') });
      S.label('vaultval', { x: (token.length) * (CW - 6) + 130, y: Y1 + 22, text: T('token -> gerçek değer', 'token -> real value'), anchor: 'middle', size: 12 });
      S.result = reference(data);
      S.step(T('Tokenizasyon: uygulamanın geri kalanı yalnız `' + token + '` anlamsız simgesini görür; gerçek değer AYRI, korumalı bir kasada kalır.',
                'Tokenization: the rest of the application only ever sees the meaningless token `' + token + '`; the real value stays in a SEPARATE, protected vault.'),
             { c: [10, 11] });
    } else {
      var pn = pseudonymOf(v);
      S.styleAll('dim', 'box');
      for (i = 0; i < 16; i++) S.box('p' + i, { x: i * (CW - 8), y: Y1, w: CW - 10, h: 30, size: 11, mono: true, text: pn.charAt(i % pn.length) + pn.charAt((i + 4) % pn.length), style: 'hl' });
      S.label('plbl', { x: -14, y: Y1 + 22, text: T('takma ad =', 'pseudonym ='), anchor: 'end', size: 14, mono: true });
      S.result = reference(data);
      S.step(T('`crypto_hmac_sha256(anahtar, deger, ...)`: GİZLİ bir anahtarla türetilmiş sabit bir takma ad — anahtar olmadan geri döndürülemez, anahtarla eşleştirilebilir.',
                '`crypto_hmac_sha256(key, value, ...)`: a fixed pseudonym derived with a SECRET key — cannot be reversed without the key, but can be matched back with it.'),
             { c: [13, 14, 15, 16] });
    }
  }

  var CHARS_DIGIT = '0123456789';
  var CHARS_ID = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
  function randomDigits(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS_DIGIT[D.randInt(r, 0, 9)]; return s; }
  function randomId(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS_ID[D.randInt(r, 0, CHARS_ID.length - 1)]; return s; }

  D.define({
    id: 'masking',
    title: T('Veri maskeleme: kısmi maskeleme, tokenizasyon, takma adlandırma', 'Data masking: partial masking, tokenization, pseudonymization'),
    code: function () { return { c: SRC }; },
    presets: [
      { id: 'normal-partial', level: 'normal', name: T('Uyar: kart numarası kısmi maskeleme', 'Fits: partial masking of a card number'), data: mk('4242424242424242', 'partial') },
      { id: 'hard-tokenize', level: 'hard', name: T('Zor: kart numarası tokenizasyon', 'Hard: tokenization of a card number'), data: mk('5555444433332222', 'tokenize') },
      { id: 'edge-pseudonymize', level: 'edge', name: T('Uç durum: kimlik numarası takma adlandırma', 'Edge case: pseudonymizing an ID number'), data: mk('ID-000000001', 'pseudonymize') },
      { id: 'edge-too-short', level: 'edge', small: true, name: T('Uç durum: maskelemek için çok kısa bir değer', 'Edge case: a value too short to mask meaningfully'), data: mk('12345', 'partial') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.value.length; },
    random: function (level, r) {
      var techniques = ['partial', 'tokenize', 'pseudonymize'];
      var technique = techniques[D.randInt(r, 0, 2)];
      var ranges = { easy: [10, 12], normal: [12, 16], hard: [14, 18], extreme: [16, 20] };
      var rg = ranges[level] || ranges.normal;
      var len = D.randInt(r, rg[0], rg[1]);
      var value = technique === 'pseudonymize' ? randomId(r, len) : randomDigits(r, len);
      return mk(value, technique);
    },
    input: {
      hint: T('değer|partial, değer|tokenize, ya da değer|pseudonymize', 'value|partial, value|tokenize, or value|pseudonymize'),
      format: function (data) { return data.value + '|' + data.technique; },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('Biçim: değer|partial, değer|tokenize ya da değer|pseudonymize olmalı.', 'Format must be value|partial, value|tokenize, or value|pseudonymize.');
        var v = parts[0], technique = parts[1].trim().toLowerCase();
        if (!/^[A-Za-z0-9-]+$/.test(v)) throw T('Değer yalnızca harf, rakam ve tire içerebilir.', 'The value may only contain letters, digits, and hyphens.');
        if (v.length > 20) throw T('En fazla 20 karakter (gösterim için).', 'At most 20 characters (for display).');
        if (['partial', 'tokenize', 'pseudonymize'].indexOf(technique) < 0) throw T('İkinci alan partial, tokenize ya da pseudonymize olmalı.', 'The second field must be partial, tokenize, or pseudonymize.');
        return mk(v, technique);
      },
      bad: ['', 'ONLYONE', 'has space|partial', 'bad!char|partial', '4242424242424242|maybe']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
