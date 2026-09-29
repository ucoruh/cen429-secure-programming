// CEN429 — Week 11 — Section 0/3 prerequisite: one AES round, from scratch, on a 4x4 byte state.
// AES (Rijndael, Daemen & Rijmen) was selected by NIST in 2001 to replace DES (1977). Its 16-byte block is
// arranged as a 4x4 matrix of bytes, filled COLUMN BY COLUMN (FIPS-197); a round is SubBytes (a fixed
// substitution table, real AES uses its own S-box), ShiftRows (row r rotates left by r bytes — this part is
// the REAL AES structure), MixColumns (real AES mixes each column with GF(2^8) arithmetic; SIMPLIFIED here
// to a small XOR-based diffusion for teaching, since the exam does not cover finite-field arithmetic — see
// docs/week-11 section 0, "GF(2) and matrix") and AddRoundKey (XOR with the round's key bytes). This
// structure — not the exact math — is what table-based WBC (next animation) folds into lookup tables.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ illustrative pseudocode (teaching
  // structure only; a toy S-box and a simplified MixColumns stand in for the real AES math, as in
  // code/week-11/01-toy-table/toy_table.c's own toy S-box).
  var AES_ROUND_C = [
    "/* One AES round, structure only (SubBytes / ShiftRows / MixColumns / AddRoundKey). */",
    "/* Teaching version: a toy S-box (same formula as toy_table.c) and a simplified, XOR-based",
    "   MixColumns stand in for AES's real GF(2^8) tables and matrix -- the STRUCTURE is real,",
    "   the arithmetic inside two of the four steps is not. */",
    "",
    "static void sub_bytes(uint8_t state[4][4])",
    "{",
    "    for (int r = 0; r < 4; r++)",
    "        for (int c = 0; c < 4; c++)",
    "            state[r][c] = sbox[state[r][c]];   /* one lookup per byte */",
    "}",
    "",
    "static void shift_rows(uint8_t state[4][4])",
    "{",
    "    for (int r = 1; r < 4; r++)",
    "        rotate_left(state[r], r);   /* row r rotates left by r bytes; row 0 never moves */",
    "}",
    "",
    "static void mix_columns(uint8_t state[4][4])",
    "{",
    "    for (int c = 0; c < 4; c++)",
    "        mix_one_column(state, c);   /* simplified diffusion (real AES: GF(2^8) matrix) */",
    "}",
    "",
    "static void add_round_key(uint8_t state[4][4], const uint8_t key[4][4])",
    "{",
    "    for (int r = 0; r < 4; r++)",
    "        for (int c = 0; c < 4; c++)",
    "            state[r][c] ^= key[r][c];",
    "}",
    "",
    "static void aes_round_toy(uint8_t state[4][4], const uint8_t key[4][4])",
    "{",
    "    add_round_key(state, key);   /* initial whitening, before round 1 */",
    "    sub_bytes(state);",
    "    shift_rows(state);",
    "    mix_columns(state);",
    "    add_round_key(state, key);   /* the round's own key addition */",
    "}"
  ];

  // ------------------------------------------------------------------ data + reference
  function sbox(x) { return (167 * x + 13) & 0xFF; }
  function mk(plain, key) { return { plain: plain, key: key }; }
  /** column-major fill, exactly as FIPS-197 defines the state: byte i -> row i%4, col floor(i/4). */
  function toGrid(bytes) {
    var g = [[], [], [], []];
    for (var i = 0; i < 16; i++) g[i % 4][Math.floor(i / 4)] = bytes[i];
    return g;
  }
  function fromGrid(g) {
    var out = [];
    for (var i = 0; i < 16; i++) out.push(g[i % 4][Math.floor(i / 4)]);
    return out;
  }
  function xorGrid(a, b) {
    var g = [[], [], [], []];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) g[r][c] = a[r][c] ^ b[r][c];
    return g;
  }
  function subGrid(g) {
    var o = [[], [], [], []];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) o[r][c] = sbox(g[r][c]);
    return o;
  }
  function shiftGrid(g) {
    var o = [g[0].slice()];
    for (var r = 1; r < 4; r++) { var row = g[r]; o.push(row.slice(r).concat(row.slice(0, r))); }
    return o;
  }
  function mixGrid(g) {
    var o = [[], [], [], []];
    for (var c = 0; c < 4; c++) {
      var col = [g[0][c], g[1][c], g[2][c], g[3][c]];
      for (var r = 0; r < 4; r++) o[r][c] = col[r] ^ col[(r + 1) % 4];
    }
    return o;
  }

  /** Independent computation: applies the same public formulas in one straight-line pass (no per-cell
   * narration loop, never build()'s step-by-step version). */
  function reference(data) {
    var s0 = toGrid(data.plain), k = toGrid(data.key);
    var s1 = xorGrid(s0, k);          // initial AddRoundKey
    var s2 = subGrid(s1);             // SubBytes
    var s3 = shiftGrid(s2);           // ShiftRows
    var s4 = mixGrid(s3);             // MixColumns
    var s5 = xorGrid(s4, k);          // AddRoundKey
    return { state: fromGrid(s5) };
  }

  function drawGrid(S, prefix, g, y0, labels) {
    var ids = [];
    for (var r = 0; r < 4; r++) {
      S.label(prefix + 'rl' + r, { x: -14, y: y0 + r * 40 + 20, text: 'r' + r, anchor: 'end', size: 12, mono: true });
      for (var c = 0; c < 4; c++) {
        var id = prefix + r + '_' + c;
        S.box(id, { x: c * 40, y: y0 + r * 40, w: 36, h: 36, size: 13, mono: true, text: D.hex(g[r][c], 2), style: 'normal', above: r === 0 ? 'c' + c : undefined });
        ids.push(id);
      }
    }
    if (labels) S.label(prefix + 'ttl', { x: 0, y: y0 - 16, text: labels, anchor: 'start', size: 13, bold: true });
    return ids;
  }
  function updateGrid(S, prefix, g) {
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) S.set(prefix + r + '_' + c, { text: D.hex(g[r][c], 2), style: 'new' });
  }
  function dimGrid(S, prefix) {
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) S.set(prefix + r + '_' + c, { style: 'dim' });
  }

  function build(S, data) {
    var s0 = toGrid(data.plain), k = toGrid(data.key);
    drawGrid(S, 'g', s0, 0, T('durum (girdi, 4x4, sütun sütun dolduruldu)', 'state (input, 4x4, filled column by column)'));
    drawGrid(S, 'k', k, 220, T('tur anahtarı (4x4)', 'round key (4x4)'));
    S.at(null);
    S.step(T('16 baytlık blok, FIPS-197 kuralınca SÜTUN SÜTUN 4x4 bir "durum" matrisine yerleştirilir; tur anahtarı da aynı biçimde.',
              'The 16-byte block is placed into a 4x4 "state" matrix COLUMN BY COLUMN, per FIPS-197; the round key uses the same layout.'), {});

    var s1 = xorGrid(s0, k);
    updateGrid(S, 'g', s1);
    S.step(T('İlk AddRoundKey ("whitening"): her hücre `durum[r][c] XOR anahtar[r][c]`. Turlar başlamadan önce yapılır.',
              'Initial AddRoundKey ("whitening"): every cell is `state[r][c] XOR key[r][c]`. This happens before the rounds begin.'),
           { c: [{ n: 27, note: T('r=0..3? evet', 'r=0..3? yes') }, { n: 28, note: T('c=0..3? evet (16 hücre)', 'c=0..3? yes (16 cells)') }, 29] });
    dimGrid(S, 'k');

    for (var r = 0; r < 4; r++) {
      var before = s1[r].slice();
      for (var c = 0; c < 4; c++) s1[r][c] = sbox(s1[r][c]);
      S.set('g' + r + '_0', { text: D.hex(s1[r][0], 2), style: 'hl' });
      S.set('g' + r + '_1', { text: D.hex(s1[r][1], 2), style: 'hl' });
      S.set('g' + r + '_2', { text: D.hex(s1[r][2], 2), style: 'hl' });
      S.set('g' + r + '_3', { text: D.hex(s1[r][3], 2), style: 'hl' });
      S.step(T('SubBytes, satır r=' + r + ': her bayt sabit bir S-box\'tan geçer (`0x' + D.hex(before[0], 2) + ' -> 0x' + D.hex(s1[r][0], 2) + '`, …) — tıpkı toy_table.c\'nin S-box\'ı gibi, ama ayrı bir toy tablo.',
                'SubBytes, row r=' + r + ': every byte passes through a fixed S-box (`0x' + D.hex(before[0], 2) + ' -> 0x' + D.hex(s1[r][0], 2) + '`, …) — the same style of S-box as toy_table.c, a separate toy table.'),
             { c: [{ n: 8, note: T('r=' + r + ' < 4? evet', 'r=' + r + ' < 4? yes') }, { n: 9, note: T('c=0..3 < 4? evet (4 kez)', 'c=0..3 < 4? yes (4 times)') }, 10] });
    }

    var s2 = shiftGrid(s1);
    for (r = 1; r < 4; r++) {
      updateGrid(S, 'g', s2);
      S.step(T('ShiftRows, satır r=' + r + ': satır sola ' + r + ' bayt döner (satır 0 hiç kaymaz).',
                'ShiftRows, row r=' + r + ': the row rotates left by ' + r + ' byte(s) (row 0 never moves).'),
             { c: [{ n: 15, note: T('r=' + r + ' < 4? evet', 'r=' + r + ' < 4? yes') }, 16] });
      break; // one representative narrated step; the grid above already shows the FULL result of all 4 rows
    }
    S.step(T('…ve satır 2 sola 2, satır 3 sola 3 bayt kayar (aynı döngü, r=2,3). Sonuç yukarıdaki durumda.',
              '…and row 2 shifts left by 2, row 3 by 3 (the same loop, r=2,3). The result is the state shown above.'), {});
    dimGrid(S, 'g');
    updateGrid(S, 'g', s2);

    var s3 = mixGrid(s2);
    for (c = 0; c < 4; c++) {
      var colBefore = [s2[0][c], s2[1][c], s2[2][c], s2[3][c]];
      S.set('g0_' + c, { text: D.hex(s3[0][c], 2), style: 'hl' });
      S.set('g1_' + c, { text: D.hex(s3[1][c], 2), style: 'hl' });
      S.set('g2_' + c, { text: D.hex(s3[2][c], 2), style: 'hl' });
      S.set('g3_' + c, { text: D.hex(s3[3][c], 2), style: 'hl' });
      S.step(T('MixColumns (BASİTLEŞTİRİLMİŞ), sütun c=' + c + ': `0x' + D.hex(colBefore[0], 2) + '..` karışıyor. Gerçek AES burada GF(2⁸) matrisi kullanır (Bölüm 0); bu yalnız yapıyı gösterir.',
                'MixColumns (SIMPLIFIED), column c=' + c + ': `0x' + D.hex(colBefore[0], 2) + '..` gets mixed. Real AES uses a GF(2^8) matrix here (Section 0); this only shows the structure.'),
             { c: [{ n: 21, note: T('c=' + c + ' < 4? evet', 'c=' + c + ' < 4? yes') }, 22] });
    }
    dimGrid(S, 'g');
    updateGrid(S, 'g', s3);

    drawGrid(S, 'k2', k, 220, null);
    dimGrid(S, 'k2');
    var s4 = xorGrid(s3, k);
    updateGrid(S, 'g', s4);
    S.step(T('İkinci AddRoundKey: tur anahtarıyla tekrar XOR. Bir tur bitti: AddRoundKey -> SubBytes -> ShiftRows -> MixColumns -> AddRoundKey.',
              'Second AddRoundKey: XOR with the round key again. One round is complete: AddRoundKey -> SubBytes -> ShiftRows -> MixColumns -> AddRoundKey.'),
           { c: [{ n: 27, note: T('r=0..3? evet', 'r=0..3? yes') }, { n: 28, note: T('c=0..3? evet (16 hücre)', 'c=0..3? yes (16 cells)') }, 29] });

    S.step(T('AES-128 bu tam turu 10 kez tekrarlar — TEK FARKLA: SON (10.) turda MixColumns hiç çalışmaz, doğrudan atlanır.',
              'AES-128 repeats this exact round 10 times — with ONE difference: in the FINAL (10th) round, MixColumns never runs; it is skipped entirely.'),
           { c: [34, 35, 36, { n: 37, skip: true }, 38] });

    S.at(null);
    S.result = reference(data);
    S.step(T('Tablo tabanlı whitebox, tam olarak BU yapıyı arama tablolarına gömer — bir sonraki animasyon.',
              'AES-128 repeats this 10 times (the final round skips MixColumns). Table-based whitebox folds EXACTLY this structure into lookup tables — the next animation.'), {});
  }

  D.define({
    id: 'aes-round-structure',
    title: T('AES tur yapısı sıfırdan: SubBytes, ShiftRows, MixColumns, AddRoundKey', 'The AES round structure from scratch: SubBytes, ShiftRows, MixColumns, AddRoundKey'),
    code: function () { return { c: AES_ROUND_C }; },
    minSize: 16,
    presets: [
      { id: 'normal-sequential', level: 'normal', name: T('Normal: ardışık bayt değerleri', 'Normal: sequential byte values'), data: mk([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], [0x2b,0x7e,0x15,0x16,0x28,0xae,0xd2,0xa6,0xab,0xf7,0x15,0x88,0x09,0xcf,0x4f,0x3c]) },
      { id: 'hard-mixed', level: 'hard', name: T('Zor: karışık, tekrarsız bayt değerleri', 'Hard: mixed, non-repeating byte values'), data: mk([0x19,0xa0,0x9a,0xe9,0x3d,0xf4,0xc6,0xf8,0xe3,0xe2,0x8d,0x48,0xbe,0x2b,0x2a,0x08], [0xa0,0x88,0x23,0x2a,0xfa,0x54,0xa3,0x6c,0xfe,0x2c,0x39,0x76,0x17,0xb1,0x39,0x05]) },
      { id: 'edge-all-zero', level: 'edge', name: T('Uç durum: durum ve anahtar tamamen sıfır', 'Edge case: an all-zero state and key'), data: mk(new Array(16).fill(0), new Array(16).fill(0)) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 16; },
    random: function (level, r) {
      function block() { var b = []; for (var i = 0; i < 16; i++) b.push(D.randInt(r, 0, 255)); return b; }
      return mk(block(), block());
    },
    input: {
      hint: T('16 durum baytı ; 16 anahtar baytı (onaltılık, boşlukla)', '16 state bytes ; 16 key bytes (hex, space-separated)'),
      format: function (data) { return data.plain.map(function (b) { return D.hex(b, 2); }).join(' ') + ' ; ' + data.key.map(function (b) { return D.hex(b, 2); }).join(' '); },
      tokens: function (data) { var t = []; for (var i = 0; i < 16; i++) t.push('s' + i); return t; },
      parse: function (text) {
        var halves = String(text).split(';');
        if (halves.length !== 2) throw T('"16 bayt ; 16 bayt" biçiminde olmalı.', 'Must be "16 bytes ; 16 bytes".');
        function parseBytes(s) {
          var toks = s.trim().split(/\s+/).filter(Boolean);
          if (toks.length !== 16) throw T('Tam olarak 16 onaltılık bayt gerekir.', 'Exactly 16 hex bytes are required.');
          return toks.map(function (t) {
            if (!/^[0-9a-fA-F]{1,2}$/.test(t)) throw T('"' + t + '" geçerli bir onaltılık bayt değil.', '"' + t + '" is not a valid hex byte.');
            return parseInt(t, 16);
          });
        }
        return mk(parseBytes(halves[0]), parseBytes(halves[1]));
      },
      bad: ['', '00 01', new Array(16).fill('zz').join(' ') + ' ; ' + new Array(16).fill('00').join(' '), new Array(15).fill('00').join(' ') + ' ; ' + new Array(16).fill('00').join(' ')]
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
