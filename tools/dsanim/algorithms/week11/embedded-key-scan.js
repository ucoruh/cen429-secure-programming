// CEN429 — Week 11 — Demo 2 (code/week-11/02-embedded-key/embedded_key.c): a key embedded in software sits
// PHYSICALLY in the compiled binary. search_bytes() slides a 16-byte window across the file and compares it
// to the known key pattern — the same plain byte-window scan a white-box attacker (or an "entropy scanner"
// looking for a suspiciously non-repeating 16-byte block, Week 2 §6) runs against a real binary in seconds.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (whole file)
  var EMBEDDED_KEY_C = [
    "/*",
    " * CEN429 - Week 11 - Demo 2: an embedded key sits PHYSICALLY in the binary.",
    " * \"Embedding the key in the software\" (the naive fix) is not protection: the program scans its",
    " * own binary file and finds the embedded (synthetic) key -> the key can be extracted.",
    " *",
    " * LESSON: a white-box attacker performs the exact same scan. A key that lives in software cannot",
    " *         be hidden without whitebox techniques (Demo 1) or hardware (TEE/HSM).",
    " * SAFE: the key is SYNTHETIC; the program only reads its OWN file; no network/system operation.",
    " */",
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <string.h>",
    "",
    "/* Naive embedded (synthetic) key. NOT a real secret; a recognizable pattern. */",
    "static const unsigned char KEY[16] = {",
    "    0xC3, 0x9A, 0x71, 0x2E, 0x55, 0xF0, 0x18, 0xBD,",
    "    0x4C, 0xA6, 0x37, 0xE9, 0x02, 0x8F, 0xD1, 0x64",
    "};",
    "",
    "/* Simple byte-array search (instead of memmem, for portability). Returns the offset of the first",
    "   match, or -1 if the needle does not occur (including the degenerate empty-needle case). */",
    "static long search_bytes(const unsigned char *haystack, long hn, const unsigned char *needle, long nn)",
    "{",
    "    if (nn <= 0 || hn < nn) return -1;",
    "    for (long p = 0; p + nn <= hn; p++)",
    "        if (memcmp(haystack + p, needle, (size_t)nn) == 0) return p;",
    "    return -1;",
    "}",
    "",
    "/* Pure helper (kept separate from pseudo_use() so it can be unit-tested on its own). */",
    "static unsigned key_checksum(void)",
    "{",
    "    unsigned s = 0;",
    "    for (int i = 0; i < 16; i++) s = (s + KEY[i]) & 0xFF;",
    "    return s;",
    "}",
    "",
    "static void pseudo_use(void)",
    "{",
    "    /* Pretend to use the key, so the compiler does not discard it. */",
    "    printf(\"Pseudo-operation done (key checksum = 0x%02X).\\n\", key_checksum());",
    "}",
    "",
    "int main(int argc, char **argv)",
    "{",
    "    if (argc < 2 || strcmp(argv[1], \"--scan\") != 0) {",
    "        pseudo_use();",
    "        printf(\"To search the binary file for the key:  %s --scan\\n\", argv[0]);",
    "        return 0;",
    "    }",
    "",
    "    /* Open our own binary file and search for the embedded key. */",
    "    FILE *f = fopen(argv[0], \"rb\");",
    "    char path[1024];",
    "    if (!f) { snprintf(path, sizeof path, \"%s.exe\", argv[0]); f = fopen(path, \"rb\"); }",
    "    if (!f) { fprintf(stderr, \"Could not open binary: %s\\n\", argv[0]); return 2; }",
    "",
    "    fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);",
    "    if (n <= 0 || n > 64L * 1024 * 1024) { fclose(f); return 2; }",
    "    unsigned char *buf = malloc((size_t)n);",
    "    if (!buf) { fclose(f); return 2; }",
    "    if (fread(buf, 1, (size_t)n, f) != (size_t)n) { free(buf); fclose(f); return 2; }",
    "    fclose(f);",
    "",
    "    long off = search_bytes(buf, n, KEY, 16);",
    "    if (off >= 0) {",
    "        printf(\"LEAKED: the 16-byte embedded key was found in the binary at offset 0x%lX:\\n  \", off);",
    "        for (int i = 0; i < 16; i++) printf(\"%02X \", buf[off + i]);",
    "        printf(\"\\n-> A white-box attacker performs the exact same scan. A key in software is not protected.\\n\");",
    "    } else {",
    "        printf(\"Key not found (unexpected).\\n\");",
    "    }",
    "    free(buf);",
    "    return 0;",
    "}"
  ];
  var KEY = [0xC3, 0x9A, 0x71, 0x2E, 0x55, 0xF0, 0x18, 0xBD, 0x4C, 0xA6, 0x37, 0xE9, 0x02, 0x8F, 0xD1, 0x64];

  // ------------------------------------------------------------------ data + reference
  function filler(i) { return (0x11 * i + 0x07) & 0xFF; }
  /** plantAt < 0 means the key is absent from this "binary" (the not-found scenario). */
  function mk(hn, plantAt) {
    var buf = [];
    for (var i = 0; i < hn; i++) buf.push(filler(i));
    if (plantAt >= 0) for (var j = 0; j < 16; j++) buf[plantAt + j] = KEY[j];
    return { buf: buf, plantAt: plantAt };
  }

  /** Independent computation: its own double loop over the buffer, never build()'s p-by-p walk. */
  function reference(data) {
    var buf = data.buf, hn = buf.length, nn = 16;
    for (var p = 0; p + nn <= hn; p++) {
      var allEqual = true;
      for (var i = 0; i < nn; i++) if (buf[p + i] !== KEY[i]) { allEqual = false; break; }
      if (allEqual) return { offset: p };
    }
    return { offset: -1 };
  }

  function build(S, data) {
    var buf = data.buf, hn = buf.length, nn = 16, BW = 28;
    S.memRow('h', buf.map(function (v, i) { return { value: v, addr: 0x1000 + i }; }), { x: 0, y: 0, w: BW, h: 30, size: 11 });
    S.label('hLbl', { x: -14, y: 17, text: T('ikili dosya (bayt) =', 'binary file (bytes) ='), anchor: 'end', size: 13, mono: true });
    var YN = 110;
    S.memRow('k', KEY.map(function (v) { return { value: v }; }), { x: 0, y: YN, w: BW, h: 30, size: 11 });
    S.label('kLbl', { x: -14, y: YN + 17, text: T('aranan KEY[16] =', 'looked-for KEY[16] ='), anchor: 'end', size: 13, mono: true });
    S.at(null);
    S.step(T('`search_bytes(haystack, hn, needle, 16)`: önce koruma sınaması yapılır (boş ihtiyaç ya da haystack çok kısa mı).',
              '`search_bytes(haystack, hn, needle, 16)`: the guard check runs first (empty needle, or a haystack too short).'),
           { c: [{ n: 24, note: T('nn<=0? hayır; hn<nn? hayır -> taramaya devam', 'nn<=0? no; hn<nn? no -> keep scanning') }] });

    var cap = 14, shown = 0, foundAt = -1;
    for (var p = 0; p + nn <= hn && shown < cap; p++) {
      shown++;
      var win = [];
      for (var i = 0; i < nn; i++) win.push('h' + (p + i));
      win.forEach(function (id) { S.set(id, { style: 'active' }); });
      var eq = true;
      for (i = 0; i < nn; i++) if (buf[p + i] !== KEY[i]) { eq = false; break; }
      if (eq) {
        foundAt = p;
        win.forEach(function (id) { S.set(id, { style: 'new' }); });
        S.step(T('`p=' + p + '`: `memcmp(haystack+' + p + ', needle, 16) == 0` — TAM EŞLEŞME. `return ' + p + ';`',
                  '`p=' + p + '`: `memcmp(haystack+' + p + ', needle, 16) == 0` — EXACT MATCH. `return ' + p + ';`'),
               { c: [{ n: 25, note: T('p+16 <= hn? evet', 'p+16 <= hn? yes') },
                     { n: 26, note: T('eşleşti mi? evet -> return p', 'equal? yes -> return p') }] });
        win.forEach(function (id) { S.set(id, { style: 'dim' }); });
        break;
      } else {
        S.step(T('`p=' + p + '`: pencere `0x' + D.hex(buf[p], 2) + '..` eşleşmiyor — devam.',
                  '`p=' + p + '`: window `0x' + D.hex(buf[p], 2) + '..` does not match — keep going.'),
               { c: [{ n: 25, note: T('p+16 <= hn? evet', 'p+16 <= hn? yes') },
                     { n: 26, note: T('eşleşti mi? hayır', 'equal? no') }] });
        win.forEach(function (id) { S.set(id, { style: 'dim' }); });
      }
    }
    if (foundAt < 0 && shown >= cap && shown < hn - nn + 1) {
      S.step(T('…ve bu şekilde `p=' + shown + '`den itibaren de sürüyor.', '…and it keeps going the same way from p=' + shown + ' on.'), {});
    }
    S.at(null);
    S.result = reference(data);

    if (foundAt >= 0) {
      S.step(T('`main()`: `off = ' + foundAt + '` (>= 0) — anahtar bulundu, 16 baytın tamamı ekrana yazdırılıyor.',
                '`main()`: `off = ' + foundAt + '` (>= 0) — the key was found, all 16 bytes are printed.'),
             { c: [{ n: 66, note: T('off >= 0? evet', 'off >= 0? yes') }, 67,
                   { n: 68, note: T('i=0..15 (16 kez, anahtarın tamamı)', 'i=0..15 (16 times, the whole key)') }, 69,
                   { n: 70, skip: true }, { n: 71, skip: true }] });
      S.step(T('SONUÇ: `LEAKED` — gömülü anahtar, kendi ikili dosyasında bulundu. Beyaz kutu saldırgan aynı taramayı çalıştırır.',
                'RESULT: `LEAKED` — the embedded key was found inside its own binary file. A white-box attacker runs the exact same scan.'), {});
    } else {
      S.step(T('`main()`: `off = -1` (< 0) — bu "ikili"de anahtar hiç yok (bu senaryonun kendisi).',
                '`main()`: `off = -1` (< 0) — this "binary" never contained the key at all (this scenario\'s own setup).'),
             { c: [{ n: 66, note: T('off >= 0? hayır', 'off >= 0? no') },
                   { n: 67, skip: true }, { n: 68, skip: true }, { n: 69, skip: true }, 71] });
      S.step(T('Gerçek demoda bu asla olmaz: anahtar KENDİ derlenmiş ikilisinin içinde durur, tarama onu her zaman bulur.',
                'In the real demo this never happens: the key sits inside its OWN compiled binary, so the scan always finds it.'), {});
    }
  }

  D.define({
    id: 'embedded-key-scan',
    title: T('İkili dosyada gömülü anahtarı bulma: bayt penceresi taraması (embedded_key.c)',
              'Finding an embedded key in a binary: a byte-window scan (embedded_key.c)'),
    code: function () { return { c: EMBEDDED_KEY_C }; },
    presets: [
      { id: 'normal-early', level: 'normal', name: T('Normal: 24 bayt, anahtar 4. konumda', 'Normal: 24 bytes, key planted at position 4'), data: mk(24, 4) },
      { id: 'hard-late', level: 'hard', name: T('Zor: 32 bayt, anahtar sona yakın (12. konum)', 'Hard: 32 bytes, key planted near the end (position 12)'), data: mk(32, 12) },
      { id: 'edge-not-found', level: 'edge', name: T('Uç durum: 20 bayt, anahtar hiç yok — tarama -1 döner', 'Edge case: 20 bytes, key absent entirely — the scan returns -1'), data: mk(20, -1) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.buf.length; },
    random: function (level, r) {
      var lens = { easy: 20, normal: 24, hard: 32, extreme: 40 };
      var hn = lens[level] || 20;
      var found = D.randInt(r, 0, 3) > 0;   /* mostly present, sometimes absent, at every level */
      var plantAt = found ? D.randInt(r, 0, hn - 16) : -1;
      return mk(hn, plantAt);
    },
    input: {
      hint: T('bayt-sayısı konum (konum=-1 -> anahtar yok), örn. "24 4"', 'byte-count position (position=-1 -> key absent), e.g. "24 4"'),
      format: function (data) { return data.buf.length + ' ' + data.plantAt; },
      tokens: function (data) { var t = []; for (var i = 0; i < data.buf.length; i++) t.push('b' + i); return t; },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || !/^-?\d+$/.test(parts[1]))
          throw T('"bayt-sayısı konum" biçiminde iki tamsayı olmalı.', 'Must be two integers, "byte-count position".');
        var hn = parseInt(parts[0], 10), plantAt = parseInt(parts[1], 10);
        if (hn < 16 || hn > 48) throw T('Bayt sayısı 16-48 arası olmalı.', 'The byte count must be 16-48.');
        if (plantAt !== -1 && (plantAt < 0 || plantAt + 16 > hn)) throw T('Konum -1 olmalı ya da 16 baytın tamamı sığmalı.', 'Position must be -1, or the full 16 bytes must fit.');
        return mk(hn, plantAt);
      },
      bad: ['', '10 0', '24 40', '24 x', 'a b']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
