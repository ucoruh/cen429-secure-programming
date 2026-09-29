// CEN429 — Week 11 — Demo 1 (code/week-11/01-toy-table/toy_table.c), naive_recover(): why an unencoded
// whitebox table leaks its key. "T is a known S-box shifted by x XOR k": for every x, Sinv[T[x]] XOR x stays
// the SAME constant only if T really is S[x XOR k] with NO encoding on top. That constant IS the key. The
// encoded table T2 breaks this the instant a secret output bijection E sits between S and the table — the
// check fails almost immediately, which is exactly the lesson that motivates input/output encoding.
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
  function buildSinv() { var inv = new Array(256); for (var x = 0; x < 256; x++) inv[Sbox(x)] = x; return inv; }
  function mk(k, n) { return { k: k, n: n }; }

  /** Independent computation: a full pass (no early exit) over all 256 x, using its own Sinv table build
   * and its own recover loop shape (never the step-by-step early-exit walk build() uses for narration). */
  function reference(data) {
    var k = data.k, sinv = buildSinv();
    var tabN = [], tabE = [];
    for (var x = 0; x < 256; x++) { var s = Sbox(x ^ k); tabN.push(s); tabE.push(Ebox(s)); }
    function recoverFullScan(arr) {
      var k0 = sinv[arr[0]] ^ 0, ok = true, failAt = -1;
      for (var x = 1; x < 256; x++) {
        var same = (sinv[arr[x]] ^ x) === k0;
        if (!same && ok) { ok = false; failAt = x; }
      }
      return ok ? { ok: true, k: k0, failAt: -1 } : { ok: false, k: null, failAt: failAt };
    }
    return { naive: recoverFullScan(tabN), encoded: recoverFullScan(tabE) };
  }

  function walk(S, label, arr, y, cap) {
    var sinv = arr.sinv, tab = arr.tab;
    var k0 = sinv[tab[0]] ^ 0;
    S.label(label + 'k0', { x: -14, y: y + 17, text: 'k0 =', anchor: 'end', size: 13, mono: true, bold: true });
    S.box(label + 'k0v', { x: 0, y: y, w: 40, h: 30, size: 13, mono: true, style: 'hl', text: '0x' + D.hex(k0, 2) });
    S.step(T('`k0 = Sinv[' + arr.name + '[0]] XOR 0 = 0x' + D.hex(k0, 2) + '` — aday anahtar. Şimdi bu sabitin GERÇEKTEN sabit kalıp kalmadığını x=1den başlayıp tek tek sınayacağız.',
              '`k0 = Sinv[' + arr.name + '[0]] XOR 0 = 0x' + D.hex(k0, 2) + '` — the candidate key. We now test, one x at a time from x=1, whether this constant really stays constant.'),
           { c: [56] });

    var x = 1, failAt = -1, shown = 0;
    for (; x < 256 && shown < cap; x++) {
      var val = sinv[tab[x]] ^ x, ok = val === k0;
      shown++;
      S.box(label + 'v' + x, { x: (x % 16) * 34, y: y + 46 + Math.floor((x - 1) / 16) * 40, w: 30, h: 30, size: 11, mono: true, style: ok ? 'new' : 'del', text: '0x' + D.hex(val, 2), above: 'x=' + x });
      if (ok) {
        S.step(T('`Sinv[' + arr.name + '[' + x + ']] XOR ' + x + ' = 0x' + D.hex(val, 2) + ' == k0` — hâlâ sabit; anahtar adayı hâlâ ayakta.',
                  '`Sinv[' + arr.name + '[' + x + ']] XOR ' + x + ' = 0x' + D.hex(val, 2) + ' == k0` — still constant; the key candidate still stands.'),
               { c: [{ n: 57, note: T('x=' + x + ' < 256? evet', 'x=' + x + ' < 256? yes') },
                     { n: 58, note: T('!= k0? hayır (sabit)', '!= k0? no (still constant)') }] });
      } else {
        failAt = x;
        S.step(T('`Sinv[' + arr.name + '[' + x + ']] XOR ' + x + ' = 0x' + D.hex(val, 2) + ' != k0 (0x' + D.hex(k0, 2) + ')` — sabitlik BOZULDU: bu tablo `S[x XOR k]` biçiminde DEĞİL, `return 0` ile hemen çıkılıyor.',
                  '`Sinv[' + arr.name + '[' + x + ']] XOR ' + x + ' = 0x' + D.hex(val, 2) + ' != k0 (0x' + D.hex(k0, 2) + ')` — the constant just BROKE: this table is not of the form `S[x XOR k]`, so the loop exits with `return 0` right here.'),
               { c: [{ n: 57, note: T('x=' + x + ' < 256? evet', 'x=' + x + ' < 256? yes') },
                     { n: 58, note: T('!= k0? evet -> return 0', '!= k0? yes -> return 0') }] });
        S.step(T('`*k_out` hiç yazılmaz, `return 1`e hiç gelinmez — bu çağrıda 59-60. satırlar ÇALIŞMAZ.',
                  '`*k_out` is never written, `return 1` is never reached — lines 59-60 do NOT run on this call.'),
               { c: [{ n: 59, skip: true }, { n: 60, skip: true }] });
        break;
      }
    }
    if (failAt < 0 && x < 256) {
      S.step(T('…ve x=' + x + 'den x=255e kadar da aynı şekilde sabit kalıyor (gerçek fonksiyon tamamını dener) — döngü hiç kırılmadan biter.',
                '…and it stays just as constant all the way from x=' + x + ' to x=255 (the real function tries every one) — the loop finishes without ever breaking.'), {});
    }
    return { k0: k0, failAt: failAt };
  }

  function build(S, data) {
    var k = data.k, n = data.n, sinv = buildSinv();
    var tabN = [], tabE = [];
    for (var x = 0; x < 256; x++) { var s = Sbox(x ^ k); tabN.push(s); tabE.push(Ebox(s)); }

    S.label('title1', { x: 0, y: -20, text: T('[1] NAİF tablo T — Sinv[T[x]] XOR x sabit mi?', '[1] NAIVE table T — is Sinv[T[x]] XOR x constant?'), anchor: 'start', size: 14, bold: true });
    S.at(null);
    var r1 = walk(S, 'n', { tab: tabN, sinv: sinv, name: 'T' }, 0, Math.max(n, 10));
    S.step(T('`naive_recover(T, &found)` DOĞRU döner: `found = 0x' + D.hex(r1.k0, 2) + '`.',
              '`naive_recover(T, &found)` returns TRUE: `found = 0x' + D.hex(r1.k0, 2) + '`.'),
           { c: [{ n: 75, note: T('naive_recover(...)!=0? evet', 'naive_recover(...)!=0? yes') },
                 76,
                 { n: 77, skip: true }, { n: 78, skip: true }] });
    S.step(T('SONUÇ: `KEY LEAKED` — anahtar 0x' + D.hex(r1.k0, 2) + ', kodlanmamış tablodan doğrudan geri kazanıldı.',
              'RESULT: `KEY LEAKED` — the key 0x' + D.hex(r1.k0, 2) + ' was recovered straight from the unencoded table.'), {});

    var ROWS1 = Math.ceil(Math.max(n, 10) / 16);
    var Y2 = 46 + ROWS1 * 40 + 90;
    S.label('title2', { x: 0, y: Y2 - 20, text: T('[2] KODLANMIŞ tablo T2 — Sinv[T2[x]] XOR x sabit mi?', '[2] ENCODED table T2 — is Sinv[T2[x]] XOR x constant?'), anchor: 'start', size: 14, bold: true });
    var r2 = walk(S, 'e', { tab: tabE, sinv: sinv, name: 'T2' }, Y2, Math.max(n, 10));
    S.step(T('`naive_recover(T2, &found)` YANLIŞ döner (0): x=' + r2.failAt + '\'te sabitlik bozuldu.',
              '`naive_recover(T2, &found)` returns FALSE (0): the constant broke at x=' + r2.failAt + '.'),
           { c: [{ n: 82, note: T('naive_recover(...)!=0? hayır', 'naive_recover(...)!=0? no') },
                 { n: 83, skip: true }, 84,
                 85] });
    S.at(null);
    S.result = reference(data);
    S.step(T('SONUÇ: `Naive recovery FAILED` — gizli çıkış kodlaması `E`, S-boxun tersini anlamsız hale getirdi; anahtar bu tablodan DOĞRUDAN okunamıyor.',
              'RESULT: `Naive recovery FAILED` — the secret output encoding `E` makes S\'s inverse meaningless; the key cannot be read straight from this table.'), {});
  }

  D.define({
    id: 'table-key-leak',
    title: T('Neden tablo anahtarı ele verir: naif kurtarma (toy_table.c)', 'Why a table leaks the key: naive recovery (toy_table.c)'),
    code: function () { return { c: TOY_TABLE_C }; },
    presets: [
      { id: 'normal-k3c', level: 'normal', name: T('Normal: gerçek demo anahtarı k=0x3C, 10 adım', 'Normal: the real demo key k=0x3C, 10 steps'), data: mk(0x3C, 10) },
      { id: 'hard-ka5-16', level: 'hard', name: T('Zor: başka bir anahtar k=0xA5, 16 adım', 'Hard: a different key k=0xA5, 16 steps'), data: mk(0xA5, 16) },
      { id: 'edge-zero-key', level: 'edge', name: T('Uç durum: sıfır anahtar k=0x00 — yine de sızar / yine de engellenir', 'Edge case: a zero key k=0x00 — still leaks / still blocked'), data: mk(0x00, 10) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.n; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 12, hard: 16, extreme: 20 };
      return mk(D.randInt(r, 0, 255), counts[level] || 10);
    },
    input: {
      hint: T('anahtar(onaltılık) adım-sayısı, örn. "3c 10"', 'key(hex) step-count, e.g. "3c 10"'),
      format: function (data) { return D.hex(data.k, 2) + ' ' + data.n; },
      tokens: function (data) { var t = []; for (var i = 0; i < data.n; i++) t.push('x=' + i); return t; },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 2) throw T('"anahtar sayı" biçiminde olmalı (anahtar onaltılık).', 'Must be "key count" (key in hex).');
        if (!/^[0-9a-fA-F]{1,2}$/.test(parts[0])) throw T('Anahtar 1-2 onaltılık basamak olmalı (00-ff).', 'The key must be 1-2 hex digits (00-ff).');
        var n = parseInt(parts[1], 10);
        if (!/^\d+$/.test(parts[1]) || n < 1 || n > 32) throw T('Adım sayısı 1-32 arası bir tamsayı olmalı.', 'The step count must be an integer from 1 to 32.');
        return mk(parseInt(parts[0], 16), n);
      },
      bad: ['', 'zz 10', '3c 0', '3c 99', '3c']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
