// CEN429 — Week 4 — Demo 6 (code/week-04/06-symbol-strings/secret.c)
// A "hidden" build XORs a sensitive string with a fixed key at compile time and decodes it only at
// run time: the PLAIN TEXT is never present in the binary as consecutive readable bytes, so `strings`
// finds nothing meaningful. `strip` removes the symbol table, so `nm` finds no function names either.
// Obfuscation does not make the value unrecoverable (the key and the algorithm both ship in the same
// binary) — it only raises the cost of finding it with the cheapest, first tools a reverse engineer
// reaches for.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/06-symbol-strings/secret.c), full file, byte-identical. The g[] array
  // here is that ONE real string's ("CEN429-LICENSE-2026") XOR-0x5A bytes; this animation's own
  // presets apply the SAME technique to other (text, key) pairs to show it generalizes.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 6: symbol and string leakage.',
    ' *',
    ' * The same source is built twice:',
    ' *   exposed : LOG macros on, meaningful function names, the SECRET STRING sits in the binary as',
    ' *             OPEN plain text (not stripped)     -> strings/nm leak a lot',
    ' *   hidden  : LOG is compiled out, the SECRET STRING is XOR-obfuscated at compile time and',
    ' *             decoded at run time, symbols are stripped, -fvisibility=hidden',
    ' *',
    ' * This closes off what \'strings\' and \'nm\' would otherwise leak.',
    ' * All values are SYNTHETIC (made up for the demo).',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    '/* A logging macro that disappears completely from the release build. */',
    '#ifdef CEN429_LOG',
    '#define LOG(...) fprintf(stderr, "[LOG] " __VA_ARGS__)',
    '#else',
    '#define LOG(...) ((void)0)',
    '#endif',
    '',
    '/* The synthetic license/build string that must not leak: "CEN429-LICENSE-2026". */',
    'static const char *secret_text(void)',
    '{',
    '#ifdef CEN429_HIDE',
    '    /* XOR\'d with 0x5A at compile time; the PLAIN TEXT is NOT visible in the binary.',
    '       Decoded at run time (a simple compile-time string obfuscation). */',
    '    static const unsigned char g[] = {',
    '        0x19,0x1f,0x14,0x6e,0x68,0x63,0x77,0x16,0x13,',
    '        0x19,0x1f,0x14,0x09,0x1f,0x77,0x68,0x6a,0x68,0x6c',
    '    };',
    '    static char decoded[sizeof(g) + 1];',
    '    for (size_t i = 0; i < sizeof(g); i++)',
    '        decoded[i] = (char)(g[i] ^ 0x5A);',
    '    decoded[sizeof(g)] = \'\\0\';',
    '    return decoded;',
    '#else',
    '    return "CEN429-LICENSE-2026";   /* PLAIN text: visible with \'strings\' */',
    '#endif',
    '}',
    '',
    '/* A simple license check (meaningful name: visible with \'nm\'). */',
    'int license_verify(const char *key)',
    '{',
    '    LOG("verifying key: %s\\n", key);',
    '    int ok = (strcmp(key, secret_text()) == 0);',
    '    LOG("result = %d\\n", ok);',
    '    return ok;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    const char *key = (argc >= 2) ? argv[1] : "WRONG-KEY";',
    '    int ok = license_verify(key);',
    '    printf("License: %s\\n", ok ? "VALID" : "invalid");',
    '    return ok ? 0 : 1;',
    '}'
  ];

  // key only matters (and is only ever formatted back out) when hidden is true; normalizing it to a
  // fixed default otherwise keeps parse(format(data)) a true round trip.
  function mk(text, key, hidden) { return { text: text, key: hidden ? (key & 0xff) : 0x5A, hidden: !!hidden }; }

  function isPrintable(b) { return b >= 0x20 && b <= 0x7e; }

  /** Independent: recompute the XOR byte-by-byte with a map/reduce style (not the for-loop
   * build() uses for its animated walk), and count printable bytes with .filter(). */
  function reference(data) {
    var codes = data.text.split('').map(function (c) { return c.charCodeAt(0); });
    var encoded = data.hidden ? codes.map(function (c) { return c ^ data.key; }) : codes.slice();
    var readableCount = encoded.filter(isPrintable).length;
    return { hidden: !!data.hidden, encoded: encoded, readableCount: readableCount, symbolsVisible: data.hidden ? 0 : 2 };
  }

  function build(S, data) {
    var n = data.text.length, W = 30, GAP = 3;
    S.label('title', { x: (n * (W + GAP)) / 2, y: -60,
      text: data.hidden ? T('KAPALI sürüm: her bayt derleme anında anahtarla XOR\'lanmış', 'HIDDEN build: every byte is XOR\'d with a key at compile time')
                         : T('AÇIK sürüm: dize ikilide DÜZ metin olarak duruyor', 'EXPOSED build: the string sits in the binary as PLAIN text'),
      anchor: 'middle', bold: true, size: 14 });
    S.label('keyLbl', { x: 0, y: -36, text: 'XOR key = 0x' + D.hex(data.key, 2), anchor: 'start', size: 12, style: 'dim' });
    S.step(T('Gizli dize: `"' + data.text + '"` (' + n + ' karakter). ' + (data.hidden ? 'Anahtar 0x' + D.hex(data.key, 2) + ' ile XOR uygulanacak.' : 'Hiçbir dönüşüm yapılmayacak.'),
              'Secret string: `"' + data.text + '"` (' + n + ' characters). ' + (data.hidden ? 'It will be XOR\'d with key 0x' + D.hex(data.key, 2) + '.' : 'No transformation will be applied.')),
           { c: data.hidden ? [30, 36] : [40] });

    var encoded = [];
    for (var i = 0; i < n; i++) {
      var code = data.text.charCodeAt(i);
      var enc = data.hidden ? (code ^ data.key) : code;
      encoded.push(enc);
      S.box('b' + i, { x: i * (W + GAP), y: 0, w: W, h: 34, size: 12, mono: true, above: data.text[i], text: D.hex(enc, 2), style: isPrintable(enc) && data.hidden ? 'hl' : (data.hidden ? 'new' : 'normal') });
      S.at(i);
      if (data.hidden) {
        S.step(T('`\'' + data.text[i] + '\' (0x' + D.hex(code, 2) + ') ^ 0x' + D.hex(data.key, 2) + ' = 0x' + D.hex(enc, 2) + '`' + (isPrintable(enc) ? ' — rastlantıyla yine yazdırılabilir bir bayt.' : ' — yazdırılamaz bir bayt, `strings` bunu göstermez.'),
                  '`\'' + data.text[i] + '\' (0x' + D.hex(code, 2) + ') ^ 0x' + D.hex(data.key, 2) + ' = 0x' + D.hex(enc, 2) + '`' + (isPrintable(enc) ? ' — happens to land on a printable byte anyway.' : ' — a non-printable byte; `strings` will not show it.')),
               { c: [36] });
      } else {
        S.step(T('Bayt `' + (i + 1) + '`: `\'' + data.text[i] + '\'` = 0x' + D.hex(code, 2) + ' — dönüşümsüz, ikilide AYNEN duruyor.',
                  'Byte ' + (i + 1) + ': `\'' + data.text[i] + '\'` = 0x' + D.hex(code, 2) + ' — untransformed, sits in the binary EXACTLY like this.'),
               { c: [40] });
      }
    }
    S.at(null);

    var symY = 60;
    S.label('symTitle', { x: 0, y: symY, text: T('nm ile görünen semboller:', 'symbols visible with nm:'), anchor: 'start', size: 12, bold: true });
    ['license_verify', 'secret_text'].forEach(function (fn, k) {
      S.box('sym' + k, { x: k * 200, y: symY + 14, w: 180, h: 30, size: 12, mono: true, text: data.hidden ? T('(strip: sembol yok)', '(stripped: no symbol)') : fn, style: data.hidden ? 'empty' : 'new' });
    });
    S.step(data.hidden
             ? T('`strip`/`/DEBUG:NONE` ile semboller kaldırıldı: `nm` "no symbols" der, fonksiyon adları tersine mühendise ipucu vermez.',
                 'With `strip`/`/DEBUG:NONE` the symbols are removed: `nm` says "no symbols," the function names give a reverse engineer no hints.')
             : T('Semboller yerinde: `nm` her iki fonksiyon adını da doğrudan listeler.',
                 'Symbols are intact: `nm` lists both function names directly.'),
           {});

    S.result = reference(data);
    var readable = encoded.filter(isPrintable).length;
    S.step(T('Özet: ' + readable + '/' + n + ' bayt hâlâ yazdırılabilir aralıkta' + (data.hidden ? ' — ama ardışık dizinin TAMAMI ender rastlar; `strings` bunu tek bir okunur sözcük olarak GÖRMEZ.' : ' — dizinin tamamı `strings` çıktısında AYNEN görünür.'),
              'Summary: ' + readable + '/' + n + ' bytes are still in the printable range' + (data.hidden ? ' — but the WHOLE run landing there is rare; `strings` will NOT see this as one readable word.' : ' — the whole string appears EXACTLY as-is in `strings` output.')),
           {});
  }

  D.define({
    id: 'symbol-string-hiding',
    title: T('Dize ve sembol gizleme: XOR + strip (secret.c)', 'String and symbol hiding: XOR + strip (secret.c)'),
    code: { c: FULL_C },
    presets: [
      { id: 'exposed-license', level: 'normal', name: T('Normal: açık sürüm, lisans dizesi', 'Normal: exposed build, the license string'), data: mk('CEN429-LICENSE-2026', 0x5A, false) },
      { id: 'hidden-license', level: 'hard', name: T('Zor: aynı dize, KAPALI sürüm (XOR 0x5A)', 'Hard: the same string, HIDDEN build (XOR 0x5A)'), data: mk('CEN429-LICENSE-2026', 0x5A, true) },
      { id: 'edge-short-key', level: 'edge', name: T('Uç durum: küçük anahtar (0x01), çoğu bayt hâlâ yazdırılabilir', 'Edge case: a small key (0x01), most bytes stay printable'), data: mk('SECRET-KEY-STRING12', 0x01, true) },
      { id: 'edge-zero-key', level: 'edge', small: false, name: T('Uç durum: anahtar 0x00 — hiç gizlemiyor (kötü seçim)', 'Edge case: key 0x00 — hides nothing (a bad choice)'), data: mk('WEAK-XOR-KEY-DEMO01', 0x00, true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.text.length; },
    random: function (level, r) {
      var lens = { easy: [10, 12], normal: [12, 18], hard: [15, 22], extreme: [18, 26] };
      var rg = lens[level] || lens.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
      var s = ''; for (var i = 0; i < n; i++) s += chars[D.randInt(r, 0, chars.length - 1)];
      var key = D.randInt(r, 1, 255);
      return mk(s, key, D.randInt(r, 0, 1) === 1);
    },
    input: {
      hint: T('[HIDDEN key-hex] METİN (en az 10 yazdırılabilir ASCII karakter)', '[HIDDEN key-hex] TEXT (at least 10 printable ASCII characters)'),
      format: function (data) { return (data.hidden ? 'HIDDEN ' + D.hex(data.key, 2) + ' ' : '') + data.text; },
      tokens: function (data) { return data.text.split(''); },
      parse: function (text) {
        var s = String(text), hidden = false, key = 0x5A;
        var m = s.match(/^HIDDEN\s+([0-9a-fA-F]{1,2})\s+/);
        if (m) { hidden = true; key = parseInt(m[1], 16); s = s.slice(m[0].length); }
        if (s.length < 10) throw T('En az 10 karakter girin.', 'Enter at least 10 characters.');
        if (s.length > 40) throw T('En fazla 40 karakter (gösterim için).', 'At most 40 characters (for display).');
        if (!/^[\x20-\x7e]+$/.test(s)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(s, key, hidden);
      },
      bad: ['', 'short', 'HIDDEN', 'bad-tëxt-non-ascii-1', 'x'.repeat(60)]
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
