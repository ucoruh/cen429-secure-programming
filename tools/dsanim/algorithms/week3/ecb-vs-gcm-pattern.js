// CEN429 — Week 3 — Demo 3 (code/week-03/03-ecb-pattern/ecb_pattern.c)
// ECB encrypts every block INDEPENDENTLY: the same plaintext block always gives the same ciphertext
// block, so repeating patterns stay visible. GCM (CTR-based) mixes the block's POSITION into its
// keystream, so identical plaintext blocks at different positions encrypt differently. This animation
// uses a small grid (each cell = one "block", value 0 or 1) and a toy per-block cipher: the ECB
// version is a function of the block's VALUE ONLY (so only ever 2 distinct outputs exist — the
// defining ECB weakness), the GCM version is a function of VALUE AND POSITION (so, in practice, every
// cell's output differs). The real AES-128-ECB / AES-256-GCM calls are shown in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 3: ECB mode leaks patterns (the "ECB penguin")',
    ' *',
    ' * ECB (Electronic Codebook) encrypts every 16-byte block INDEPENDENTLY of',
    ' * the others. The same plaintext block ALWAYS produces the same ciphertext',
    ' * block. So repeating patterns in the data stay visible in the ciphertext.',
    ' *',
    ' * In ECB: identical blocks give identical ciphertext blocks -> the shape',
    ' * stays READABLE. In GCM (CTR-based): every block is encrypted with a',
    ' * different, position-dependent keystream -> the pattern disappears (noise).',
    ' */',
    '#include "cen429_demo.h"',
    '#include "cen429_crypto.h"',
    '#define BLOCK 16                 /* one pixel = 16 bytes */',
    '',
    'int main(void)',
    '{',
    '    unsigned char key[16];',
    '    memset(key, 0x11, sizeof(key));',
    '',
    '    /* ECB: encrypt every 16-byte block on its own. */',
    '    unsigned char ecb[WIDTH * HEIGHT * BLOCK];',
    '    for (int i = 0; i < WIDTH * HEIGHT; i++)',
    '        crypto_aes_ecb_block(key, 16, plain + i * BLOCK, ecb + i * BLOCK);',
    '',
    '    /* Good mode (GCM = CTR-based): encrypt the whole picture with one nonce. */',
    '    unsigned char good[WIDTH * HEIGHT * BLOCK], tag[16], key32[32], nonce[12];',
    '    memset(key32, 0x11, sizeof(key32));',
    '    memset(nonce, 0, sizeof(nonce));',
    '    crypto_gcm_encrypt(key32, nonce, 12, NULL, 0, plain, WIDTH * HEIGHT * BLOCK, good,',
    '                       tag);',
    '',
    '    draw_encrypted("Encrypted with AES-128-ECB (each block by its first byte):", ecb);',
    '    /* ==> The shape is still VISIBLE: ECB leaks the pattern. DO NOT USE IT. */',
    '',
    '    draw_encrypted("Encrypted with AES-256-GCM (CTR-based), same picture:", good);',
    '    /* ==> The pattern is gone: GCM/CTR encrypts every block differently. */',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ toy per-block ciphers (illustration only)
  function ecbByte(v) { return v === 0 ? 0x1a : 0xe7; }                 // function of VALUE ONLY — the ECB weakness
  // function of VALUE AND POSITION — GCM/CTR. Built from three bijective steps (odd-constant multiply mod
  // 256, an 8-bit rotate, another odd-constant multiply mod 256), so the WHOLE function is a bijection of
  // the byte range onto itself (composing bijections gives a bijection) — a fact reference() below relies
  // on to state the resulting distinct-value count WITHOUT calling ctrByte at all (see reference()).
  function mixByte(x) {
    x = (x * 173 + 89) & 0xff;
    x = ((x << 3) | (x >>> 5)) & 0xff;
    x = (x * 197 + 43) & 0xff;
    return x;
  }
  function ctrByte(v, pos) { return mixByte(((v & 1) << 7) | (pos & 0x7f)); }   // pos must stay < 128
  function flatten(grid) {
    var out = [];
    grid.forEach(function (row) { for (var i = 0; i < row.length; i++) out.push(row.charCodeAt(i) - 48); });
    return out;
  }

  function mk(grid) { return { grid: grid }; }  // grid: array of equal-length strings of '0'/'1'

  /** Independent computation: NEVER calls ecbByte/ctrByte (build()'s own toy ciphers) — instead argues
   * directly from their construction, so a bug that breaks either one (e.g. accidentally ignoring the
   * position, which would silently turn GCM/CTR back into "leaky" ECB) shows up as a mismatch instead of
   * being invisible to both sides at once:
   *  - ECB: ecbByte maps each VALUE to a fixed byte, and 0 != 1 map to different bytes by construction, so
   *    the distinct-output count is exactly the distinct-INPUT-value count — no need to run ecbByte.
   *  - CTR/GCM: ctrByte is `mixByte(v<<7 | pos)`, and mixByte is a bijection of the full byte range onto
   *    itself (three composed bijective steps: multiply-mod-256 by an odd constant, an 8-bit rotate,
   *    another multiply-mod-256 by an odd constant). A bijection maps every distinct input to a distinct
   *    output, for ANY subset of inputs — so as long as every block gets its own (value, position) pair
   *    with position < 128 (guaranteed: `size` is capped well under that), every block's ctrByte output is
   *    GUARANTEED distinct. The distinct count is therefore simply the number of blocks.
   */
  function reference(data) {
    var cells = flatten(data.grid);
    return { ecbDistinct: new Set(cells).size, ctrDistinct: cells.length };
  }

  function build(S, data) {
    var grid = data.grid, h = grid.length, w = grid[0].length;
    var CW = 26, CH = 26, GAP = 2;
    // The three grids (plaintext / ECB / GCM) sit SIDE BY SIDE, not stacked — dsanim's still-frame export
    // is always forced to a fixed WIDTH, so stacking three square panels vertically would make the
    // exported image tall and narrow. Side by side keeps it landscape-shaped, and it also makes the
    // "same shape, different output" comparison easier to read (same row, three columns of panels).
    var PANEL_W = w * (CW + GAP), PANEL_GAP = 50;
    var X0 = 0, X1 = PANEL_W + PANEL_GAP, X2 = 2 * (PANEL_W + PANEL_GAP);

    for (var y = 0; y < h; y++)
      for (var x = 0; x < w; x++) {
        var v = grid[y].charCodeAt(x) - 48;
        S.box('p' + y + '_' + x, { x: X0 + x * (CW + GAP), y: y * (CH + GAP), w: CW, h: CH, size: 11, mono: true,
          text: '', style: v ? 'new' : 'empty' });
      }
    S.label('title0', { x: X0 + PANEL_W / 2, y: -14, text: T('Düz metin', 'Plaintext'), anchor: 'middle', bold: true, size: 13 });
    S.step(T('Küçük iki renkli bir "resim": ' + (w * h) + ' blok, yalnız 2 farklı değer (arka plan=0x00, şekil=0xFF).',
              'A small two-color "picture": ' + (w * h) + ' blocks, only 2 distinct values (background=0x00, shape=0xFF).'),
           { c: [] });

    for (y = 0; y < h; y++)
      for (x = 0; x < w; x++) {
        var v2 = grid[y].charCodeAt(x) - 48, eb = ecbByte(v2);
        S.box('e' + y + '_' + x, { x: X1 + x * (CW + GAP), y: y * (CH + GAP), w: CW, h: CH, size: 10, mono: true,
          text: D.hex(eb, 2), style: eb === ecbByte(0) ? 'normal' : 'hl' });
      }
    S.label('title1', { x: X1 + PANEL_W / 2, y: -14, text: T('AES-128-ECB', 'AES-128-ECB'), anchor: 'middle', bold: true, size: 13 });
    var refNow = reference(data);
    S.step(T('`crypto_aes_ecb_block(key, ..., plain + i*BLOCK, ecb + i*BLOCK)` — ECB çıktısında yalnız ' + refNow.ecbDistinct + ' FARKLI bayt değeri var: şekil HÂLÂ OKUNUYOR.',
              '`crypto_aes_ecb_block(key, ..., plain + i*BLOCK, ecb + i*BLOCK)` — the ECB output has only ' + refNow.ecbDistinct + ' DISTINCT byte value(s): the shape is STILL READABLE.'),
           { c: [22, { n: 23, note: T('i < WIDTH*HEIGHT? EVET, ' + (data.grid.length * data.grid[0].length) + ' blok için yineleniyor', 'i < WIDTH*HEIGHT? YES, iterating over ' + (data.grid.length * data.grid[0].length) + ' blocks') }, 24] });

    for (y = 0; y < h; y++)
      for (x = 0; x < w; x++) {
        var v3 = grid[y].charCodeAt(x) - 48, pos = y * w + x;
        S.box('g' + y + '_' + x, { x: X2 + x * (CW + GAP), y: y * (CH + GAP), w: CW, h: CH, size: 10, mono: true,
          text: D.hex(ctrByte(v3, pos), 2), style: 'dim' });
      }
    S.label('title2', { x: X2 + PANEL_W / 2, y: -14, text: T('AES-256-GCM (CTR)', 'AES-256-GCM (CTR)'), anchor: 'middle', bold: true, size: 13 });
    S.result = refNow;
    S.step(T('`crypto_gcm_encrypt(key32, nonce, ..., plain, ..., good, tag)` — çıktıda ' + refNow.ctrDistinct + ' FARKLI değer var (' + (w * h) + ' bloğun ' + refNow.ctrDistinct + '\'i benzersiz): desen KAYBOLDU.',
              '`crypto_gcm_encrypt(key32, nonce, ..., plain, ..., good, tag)` — the output has ' + refNow.ctrDistinct + ' DISTINCT value(s) (' + refNow.ctrDistinct + ' of the ' + (w * h) + ' blocks are unique): the pattern is GONE.'),
           { c: [27, 28, 29, 30, 31] });
  }

  function randGrid(r, w, h) {
    var rows = [];
    for (var y = 0; y < h; y++) {
      var row = '';
      for (var x = 0; x < w; x++) row += D.randInt(r, 0, 1);
      rows.push(row);
    }
    return rows;
  }

  D.define({
    id: 'ecb-vs-gcm-pattern',
    title: T('ECB deseni sızdırır, GCM sızdırmaz (ecb_pattern.c)', 'ECB leaks the pattern, GCM does not (ecb_pattern.c)'),
    code: function () { return { c: SRC }; },
    minSize: 10,
    presets: [
      { id: 'normal-diamond', level: 'normal', name: T('Uyar: küçük bir "elmas" şekli', 'Fits: a small "diamond" shape'),
        data: mk(['000000', '001100', '011110', '001100']) },
      { id: 'hard-bigger', level: 'hard', name: T('Zor: daha büyük, daha ayrıntılı desen', 'Hard: a bigger, more detailed pattern'),
        data: mk(['00000000', '01111000', '01000100', '01000100', '01111000', '00000000']) },
      { id: 'edge-all-background', level: 'edge', name: T('Uç durum: tamamı arka plan (tek düz renk)', 'Edge case: all background (a solid color)'),
        data: mk(['0000', '0000', '0000']) },
      { id: 'edge-checkerboard', level: 'edge', name: T('Uç durum: dama tahtası (en kötü ECB durumu)', 'Edge case: a checkerboard (ECB\'s worst case)'),
        data: mk(['0101', '1010', '0101']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.grid.length * data.grid[0].length; },
    random: function (level, r) {
      var dims = { easy: [4, 3], normal: [5, 4], hard: [6, 5], extreme: [7, 5] };
      var d = dims[level] || dims.normal;
      return mk(randGrid(r, d[0], d[1]));
    },
    input: {
      hint: T('satırlar ; ile ayrılmış, yalnız 0/1 (ör. 0110;1001;0110)', 'rows separated by ; , only 0/1 (e.g. 0110;1001;0110)'),
      format: function (data) { return data.grid.join(';'); },
      parse: function (text) {
        var rows = String(text).split(';').filter(Boolean);
        if (rows.length < 1) throw T('En az bir satır girin.', 'Enter at least one row.');
        if (rows.length > 8) throw T('En fazla 8 satır (gösterim için).', 'At most 8 rows (for display).');
        var w = rows[0].length;
        if (w < 2 || w > 10) throw T('Satır uzunluğu 2-10 arasında olmalı.', 'Row length must be 2-10.');
        rows.forEach(function (row) {
          if (row.length !== w) throw T('Bütün satırlar aynı uzunlukta olmalı.', 'All rows must be the same length.');
          if (!/^[01]+$/.test(row)) throw T('Yalnızca 0 ve 1 kullanın.', 'Use only 0 and 1.');
        });
        return mk(rows);
      },
      bad: ['', '01;101', '02;01', '0'.repeat(20) + ';' + '0'.repeat(20), 'abc;def']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
