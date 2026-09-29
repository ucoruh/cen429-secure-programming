// CEN429 — Week 11 — Demo 1 (code/week-11/01-toy-table/toy_table.c): table-based whitebox crypto, toy scale.
// The key byte k is folded into a lookup table (T[x] = S[x XOR k], one miniature AES round). That table alone
// is naked: whoever holds it can read S[x XOR k] straight off the wire. Wrapping the OUTPUT with a secret
// bijection E (T2[x] = E[S[x XOR k]]) is the "input/output encoding" step of table-based WBC: the two tables
// compute the exact same function, but only T2's bytes are what a whitebox attacker actually observes.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (whole file)
  var TOY_TABLE_C = [
    "/*",
    " * CEN429 - Week 11 - Demo 1: toy whitebox table (DEFENSIVE lesson)",
    " *",
    " * Goal: SEE, in a small synthetic example, the rule \"folding a key into a lookup table does NOT",
    " * hide the key UNLESS the table is also encoded.\" This is NOT real WB-AES or a real attack tool;",
    " * it shows the concept on a toy 8-bit box.",
    " *",
    " * Setup (the miniature of the slide deck's 5 steps):",
    " *   - There is a public S-box (S) - not secret.",
    " *   - There is a secret key byte k.",
    " *   - A miniature of one AES round:  output = S[x XOR k].",
    " *   - NAIVE table:    T[x]  = S[x XOR k]           -> the key LEAKS",
    " *   - ENCODED table:  T2[x] = E( S[x XOR k] )      -> naive recovery FAILS",
    " *",
    " * SAFETY: every value is synthetic; no file/network/system operation.",
    " */",
    "#include <stdio.h>",
    "",
    "/* Public S-box: an affine transform with an odd multiplier is a bijection over 0..255. We use this",
    "   instead of copying the real AES S-box, to keep the bijection property without reproducing it. */",
    "static unsigned char S[256], Sinv[256];",
    "/* Secret output encoding E is also a bijection (odd multiplier 91). In WBC this is the",
    "   \"input/output encoding\" step. */",
    "static unsigned char E[256];",
    "",
    "static void build_tables(void)",
    "{",
    "    for (int x = 0; x < 256; x++) {",
    "        S[x] = (unsigned char)((167 * x + 13) & 0xFF);",
    "        E[x] = (unsigned char)((91 * x + 7) & 0xFF);",
    "    }",
    "    for (int x = 0; x < 256; x++) Sinv[S[x]] = (unsigned char)x;",
    "}",
    "",
    "/* Step 1: \"cook\" the key into the table -> T[x] = S[x ^ k]  (NO encoding) */",
    "static void naive_table(unsigned char k, unsigned char T[256])",
    "{",
    "    for (int x = 0; x < 256; x++) T[x] = S[x ^ k];",
    "}",
    "",
    "/* Steps 3-5: apply a secret encoding to the output -> T2[x] = E[S[x ^ k]] */",
    "static void encoded_table(unsigned char k, unsigned char T2[256])",
    "{",
    "    for (int x = 0; x < 256; x++) T2[x] = E[S[x ^ k]];",
    "}",
    "",
    "/*",
    " * NAIVE RECOVERY (for this lesson only, to test the defense):",
    " * \"T is the known S, shifted by x^k.\" For every x, check whether Sinv[T[x]] ^ x stays constant;",
    " * if it does, that constant is the key.",
    " * In the encoded table, Sinv[T2[x]] no longer corresponds to S's inverse -> the value is not",
    " * constant -> recovery collapses.",
    " */",
    "static int naive_recover(const unsigned char T[256], int *k_out)",
    "{",
    "    int k0 = Sinv[T[0]] ^ 0;",
    "    for (int x = 1; x < 256; x++)",
    "        if ((Sinv[T[x]] ^ x) != k0) return 0;   /* not constant -> could not recover */",
    "    *k_out = k0;",
    "    return 1;",
    "}",
    "",
    "int main(void)",
    "{",
    "    build_tables();",
    "    unsigned char k = 0x3C;   /* secret key (synthetic) */",
    "    unsigned char T[256], T2[256];",
    "    int found;",
    "",
    "    printf(\"=== Toy whitebox table (defensive lesson) ===\\n\");",
    "    printf(\"Secret key (for verification only): k = 0x%02X\\n\\n\", k);",
    "",
    "    naive_table(k, T);",
    "    printf(\"[1] NAIVE table  T[x] = S[x ^ k]  (NO encoding)\\n\");",
    "    if (naive_recover(T, &found))",
    "        printf(\"    -> Naive recovery FOUND the key: 0x%02X  ==> KEY LEAKED.\\n\\n\", found);",
    "    else",
    "        printf(\"    -> Recovery failed.\\n\\n\");",
    "",
    "    encoded_table(k, T2);",
    "    printf(\"[2] ENCODED table  T2[x] = E[S[x ^ k]]  (secret output encoding)\\n\");",
    "    if (naive_recover(T2, &found))",
    "        printf(\"    -> Naive recovery found: 0x%02X\\n\", found);",
    "    else",
    "        printf(\"    -> Naive recovery FAILED. The key cannot be read directly from this table.\\n\\n\");",
    "",
    "    printf(\"LESSON:\\n\");",
    "    printf(\"  * Folding the key into a table alone is not enough; an unencoded table gives the key away.\\n\");",
    "    printf(\"  * Input/output encoding stops naive reading -- but published WBC designs were still\\n\");",
    "    printf(\"    broken by general attacks such as DCA/DFA (see the slides). WBC = a LAYER, not a solution.\\n\");",
    "    return 0;",
    "}"
  ];

  // ------------------------------------------------------------------ data + reference (matches the C formulas exactly)
  function Sbox(x) { return (167 * x + 13) & 0xFF; }
  function Ebox(x) { return (91 * x + 7) & 0xFF; }
  function mk(k, n) { return { k: k, n: n }; }

  /** Independent computation (its own copy of the Sbox/Ebox formulas, not calling build()'s helpers). */
  function reference(data) {
    var T = [], T2 = [];
    for (var x = 0; x < data.n; x++) {
      var s = Sbox(x ^ data.k);
      T.push(s);
      T2.push(Ebox(s));
    }
    return { T: T, T2: T2 };
  }

  function build(S, data) {
    var k = data.k, n = data.n, W = 34, GX = 0;
    S.label('kLbl', { x: GX, y: -20, text: T('gizli anahtar k = 0x' + D.hex(k, 2), 'secret key k = 0x' + D.hex(k, 2)), anchor: 'start', size: 13, bold: true });
    S.at(null);
    S.step(T('`build_tables()` bir kez çalışır: herkese açık S-box ve gizli çıkış kodlaması E kuruluyor (256 girdinin tamamı için).',
              '`build_tables()` runs once: the public S-box and the secret output encoding E are built (for all 256 inputs).'),
           { c: [{ n: 29, note: T('x=0..255 (tablo bir kez kuruluyor)', 'x=0..255 (the table is built once)') },
                 { n: 33, note: T('x=0..255 (S’in tersi de bir kez kuruluyor)', 'x=0..255 (S’s inverse is also built once)') }] });

    S.label('tLbl', { x: GX - 14, y: 17, text: 'T[x] =', anchor: 'end', size: 13, mono: true, bold: true });
    S.label('t2Lbl', { x: GX - 14, y: 90 + 17, text: 'T2[x] =', anchor: 'end', size: 13, mono: true, bold: true });
    S.step(T('İki tablo da bomboş: `T` (naif, kodlanmamış) ve `T2` (kodlanmış). Aynı ' + n + ' girdi (`x`) için ikisini de dolduracağız.',
              'Both tables start empty: `T` (naive, unencoded) and `T2` (encoded). We will fill both for the same ' + n + ' inputs (`x`).'), {});

    var Y2 = 90;
    for (var x = 0; x < n; x++) {
      var s = Sbox(x ^ k), e = Ebox(s);
      S.at(x);
      S.box('t' + x, { x: GX + x * W, y: 0, w: W - 4, h: 32, size: 12, mono: true, style: 'new', text: D.hex(s, 2), above: String(x) });
      S.step(T('`T[' + x + '] = S[' + x + ' XOR ' + D.hex(k, 2).toLowerCase() + '] = S[0x' + D.hex(x ^ k, 2) + '] = 0x' + D.hex(s, 2) + '` — anahtar bu hücreye doğrudan pişirildi.',
                '`T[' + x + '] = S[' + x + ' XOR 0x' + D.hex(k, 2) + '] = S[0x' + D.hex(x ^ k, 2) + '] = 0x' + D.hex(s, 2) + '` — the key is baked straight into this cell.'),
             { c: [{ n: 39, note: T('x=' + x + ' < 256? evet', 'x=' + x + ' < 256? yes') }] });

      S.box('t2_' + x, { x: GX + x * W, y: Y2, w: W - 4, h: 32, size: 12, mono: true, style: 'hl', text: D.hex(e, 2), above: String(x) });
      S.step(T('`T2[' + x + '] = E[S[' + x + ' XOR ' + D.hex(k, 2).toLowerCase() + ']] = E[0x' + D.hex(s, 2) + '] = 0x' + D.hex(e, 2) + '` — aynı fonksiyon, ama çıktı gizli `E` ile sarılı; telin üstünde bu bayt dolaşır.',
                '`T2[' + x + '] = E[S[' + x + ' XOR 0x' + D.hex(k, 2) + ']] = E[0x' + D.hex(s, 2) + '] = 0x' + D.hex(e, 2) + '` — the same function, but the output is wrapped in secret `E`; this is the byte that travels on the wire.'),
             { c: [{ n: 45, note: T('x=' + x + ' < 256? evet', 'x=' + x + ' < 256? yes') }] });
      S.set('t' + x, { style: 'dim' });
      S.set('t2_' + x, { style: 'dim' });
    }
    S.at(null);
    S.result = reference(data);
    S.step(T('Her iki tablo da BİREBİR AYNI fonksiyonu hesaplıyor (`x -> S[x XOR k]`); tek fark `T2`nin çıktısının `E` ile sarılmış olması. Bir sonraki animasyon (`table-key-leak`), bunun `T`yi neden anında ele verdiğini gösteriyor.',
              'Both tables compute the EXACT SAME function (`x -> S[x XOR k]`); the only difference is that `T2`\'s output is wrapped in `E`. The next animation (`table-key-leak`) shows why this is exactly what makes `T` give the key away instantly.'), {});
  }

  D.define({
    id: 'toy-table-wbc',
    title: T('Tablo tabanlı beyaz kutu: anahtarı tabloya gömme + giriş/çıkış kodlaması (toy_table.c)',
              'Table-based whitebox: folding the key into a table + input/output encoding (toy_table.c)'),
    code: function () { return { c: TOY_TABLE_C }; },
    presets: [
      { id: 'normal-k3c', level: 'normal', name: T('Normal: gerçek demo anahtarı k=0x3C, 10 girdi', 'Normal: the real demo key k=0x3C, 10 inputs'), data: mk(0x3C, 10) },
      { id: 'hard-ka5-16', level: 'hard', name: T('Zor: başka bir anahtar k=0xA5, 16 girdi', 'Hard: a different key k=0xA5, 16 inputs'), data: mk(0xA5, 16) },
      { id: 'edge-zero-key', level: 'edge', name: T('Uç durum: sıfır anahtar k=0x00 — hâlâ pişiriliyor ve kodlanıyor', 'Edge case: a zero key k=0x00 — still baked in and still encoded'), data: mk(0x00, 10) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.n; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 12, hard: 16, extreme: 20 };
      return mk(D.randInt(r, 0, 255), counts[level] || 10);
    },
    input: {
      hint: T('anahtar(onaltılık) girdi-sayısı, örn. "3c 10"', 'key(hex) input-count, e.g. "3c 10"'),
      format: function (data) { return D.hex(data.k, 2) + ' ' + data.n; },
      tokens: function (data) { var t = []; for (var i = 0; i < data.n; i++) t.push('x=' + i); return t; },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 2) throw T('"anahtar sayı" biçiminde olmalı (anahtar onaltılık).', 'Must be "key count" (key in hex).');
        if (!/^[0-9a-fA-F]{1,2}$/.test(parts[0])) throw T('Anahtar 1-2 onaltılık basamak olmalı (00-ff).', 'The key must be 1-2 hex digits (00-ff).');
        var n = parseInt(parts[1], 10);
        if (!/^\d+$/.test(parts[1]) || n < 1 || n > 32) throw T('Girdi sayısı 1-32 arası bir tamsayı olmalı.', 'The input count must be an integer from 1 to 32.');
        return mk(parseInt(parts[0], 16), n);
      },
      bad: ['', 'zz 10', '3c 0', '3c 99', '3c']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
