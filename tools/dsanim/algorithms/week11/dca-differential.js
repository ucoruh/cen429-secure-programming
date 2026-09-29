// CEN429 — Week 11 — Section 4 prerequisite: a toy-scale differential/fault idea (conceptual).
// Real attacks: Differential Fault Analysis (DFA) glitches a device mid-computation and compares the
// faulty output to the correct one; Differential Computation Analysis (Bos, Hubain, Michiels, Teuwen,
// 2016) instead compares many ORDINARY execution traces (memory accesses) with no fault at all, the
// software analogue of classic power-analysis DPA. Neither is implemented here — this toy only compares
// one correct output to one deliberately "glitched" output for the SAME input, using the same public toy
// S-box as code/week-11/01-toy-table/toy_table.c, to show WHY comparing runs leaks structure at all.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ illustrative pseudocode (teaching
  // structure only, not a real attack tool; reuses toy_table.c's public S-box formula).
  var COMPARE_C = [
    "/* Toy differential/fault comparison (conceptual). DFA injects a fault; DCA correlates many",
    "   ordinary traces instead. Same public S-box formula as toy_table.c: S[x] = (167*x+13) & 0xFF. */",
    "",
    "static uint8_t run_correct(uint8_t x, uint8_t k)",
    "{",
    "    uint8_t t = x ^ k;",
    "    return sbox(t);",
    "}",
    "",
    "static uint8_t run_faulted(uint8_t x, uint8_t k, uint8_t fault_mask)",
    "{",
    "    uint8_t t = x ^ k;",
    "    t ^= fault_mask;            /* a bit flips mid-computation, e.g. a voltage glitch */",
    "    return sbox(t);",
    "}",
    "",
    "static void compare_traces(uint8_t x, uint8_t k, uint8_t fault_mask)",
    "{",
    "    uint8_t y  = run_correct(x, k);",
    "    uint8_t yf = run_faulted(x, k, fault_mask);",
    "    uint8_t d  = y ^ yf;",
    "    if (d == 0)",
    "        record_useless(x);          /* this input's fault left no visible difference */",
    "    else",
    "        record_informative(x, d);   /* the difference carries information about S's wiring */",
    "}"
  ];

  // ------------------------------------------------------------------ data + reference
  function sbox(x) { return (167 * x + 13) & 0xFF; }
  function mk(k, faultMask, n) { return { k: k, faultMask: faultMask, n: n }; }

  /** Independent computation: its own array-based pass (never build()'s per-x step loop). */
  function reference(data) {
    var k = data.k, fm = data.faultMask, out = [];
    for (var x = 0; x < data.n; x++) {
      var t = x ^ k, y = sbox(t), yf = sbox(t ^ fm), d = y ^ yf;
      out.push({ x: x, y: y, yf: yf, d: d, informative: d !== 0 });
    }
    return { rows: out, informativeCount: out.filter(function (r) { return r.informative; }).length };
  }

  function build(S, data) {
    var k = data.k, fm = data.faultMask, n = data.n, W = 34;
    S.label('kLbl', { x: 0, y: -34, text: T('anahtar k = 0x' + D.hex(k, 2) + ' (saldırgana GÖRÜNMEZ)', 'key k = 0x' + D.hex(k, 2) + ' (NEVER visible to the attacker)'), anchor: 'start', size: 13, bold: true });
    S.label('fLbl', { x: 0, y: -16, text: T('hata maskesi = 0x' + D.hex(fm, 2) + ' (tek bit çevrilir)', 'fault mask = 0x' + D.hex(fm, 2) + ' (one bit flips)'), anchor: 'start', size: 13 });
    S.label('yLbl', { x: -14, y: 17, text: 'y =', anchor: 'end', size: 13, mono: true, bold: true });
    S.label('yfLbl', { x: -14, y: 60, text: 'yf =', anchor: 'end', size: 13, mono: true, bold: true });
    S.label('dLbl', { x: -14, y: 103, text: 'd =', anchor: 'end', size: 13, mono: true, bold: true });
    S.at(null);
    S.step(T('Aynı `x` girdisi için iki çalıştırma: `run_correct` DOĞRU sonucu üretir, `run_faulted` aynı hesaba, S-box\'tan ÖNCE tek bir hata biti ekler.',
              'Two runs of the same input `x`: `run_correct` produces the true result, `run_faulted` injects one fault bit into the same computation BEFORE the S-box.'), {});

    var infoCount = 0;
    for (var x = 0; x < n; x++) {
      var t = x ^ k, y = sbox(t), yf = sbox(t ^ fm), d = y ^ yf, informative = d !== 0;
      S.at(x);
      S.box('y' + x, { x: x * W, y: 0, w: W - 4, h: 32, size: 11, mono: true, style: 'normal', text: D.hex(y, 2), above: 'x=' + x });
      S.box('yf' + x, { x: x * W, y: 43, w: W - 4, h: 32, size: 11, mono: true, style: 'active', text: D.hex(yf, 2) });
      S.box('d' + x, { x: x * W, y: 86, w: W - 4, h: 32, size: 11, mono: true, style: informative ? 'new' : 'dim', text: D.hex(d, 2) });
      if (informative) {
        infoCount++;
        S.step(T('`x=' + x + '`: `y=0x' + D.hex(y, 2) + '`, `yf=0x' + D.hex(yf, 2) + '`, fark `d=y XOR yf=0x' + D.hex(d, 2) + '` — SIFIR DEĞİL: bu girdi S-box\'ın iç yapısı hakkında bilgi taşıyor.',
                  '`x=' + x + '`: `y=0x' + D.hex(y, 2) + '`, `yf=0x' + D.hex(yf, 2) + '`, difference `d=y XOR yf=0x' + D.hex(d, 2) + '` — NOT zero: this input\'s difference carries information about the S-box\'s internal wiring.'),
               { c: [{ n: 22, note: T('d==0? hayır', 'd==0? no') }, { n: 23, skip: true }, 25] });
      } else {
        S.step(T('`x=' + x + '`: `y=0x' + D.hex(y, 2) + '`, `yf=0x' + D.hex(yf, 2) + '`, fark `d=0` — bu girdide hata GÖRÜNMEZ hâle geldi, bilgi taşımıyor.',
                  '`x=' + x + '`: `y=0x' + D.hex(y, 2) + '`, `yf=0x' + D.hex(yf, 2) + '`, difference `d=0` — for this input the fault became INVISIBLE, it carries no information.'),
               { c: [{ n: 22, note: T('d==0? evet', 'd==0? yes') }, 23, { n: 25, skip: true }] });
      }
    }
    S.at(null);
    S.result = reference(data);
    S.step(T(n + ' girdiden ' + infoCount + '\'i bilgi taşıyan (`d != 0`) bir fark verdi. TEK BAŞINA hiçbiri anahtarı vermez; gerçek DFA/DCA bunun gibi YÜZLERCE-BİNLERCE karşılaştırmayı istatistiksel olarak birleştirir (Bölüm 0\'daki korelasyon fikri). Bu yüzden bu animasyon kavramsaldır — çalışan bir saldırı aracı DEĞİLDİR.',
              n + ' of ' + infoCount + ' inputs gave an informative (`d != 0`) difference. NONE of them alone reveals the key; real DFA/DCA statistically combines HUNDREDS to THOUSANDS of comparisons like this one (the correlation idea from Section 0). That is why this animation is conceptual — it is NOT a working attack tool.'), {});
  }

  D.define({
    id: 'dca-differential',
    title: T('Fark/hata karşılaştırması, oyuncak ölçekte (DFA/DCA fikri, kavramsal)', 'A differential/fault comparison at toy scale (the DFA/DCA idea, conceptual)'),
    code: function () { return { c: COMPARE_C }; },
    presets: [
      { id: 'normal-bit0', level: 'normal', name: T('Normal: k=0x3C, hata bit 0, 10 girdi', 'Normal: k=0x3C, fault bit 0, 10 inputs'), data: mk(0x3C, 0x01, 10) },
      { id: 'hard-bit7-16', level: 'hard', name: T('Zor: k=0xA5, hata bit 7, 16 girdi', 'Hard: k=0xA5, fault bit 7, 16 inputs'), data: mk(0xA5, 0x80, 16) },
      { id: 'edge-zero-fault', level: 'edge', name: T('Uç durum: hata maskesi 0x00 — fark HER ZAMAN sıfır', 'Edge case: fault mask 0x00 — the difference is ALWAYS zero'), data: mk(0x3C, 0x00, 10) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.n; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 12, hard: 16, extreme: 20 };
      var bit = D.randInt(r, 0, 7);
      return mk(D.randInt(r, 0, 255), 1 << bit, counts[level] || 10);
    },
    input: {
      hint: T('anahtar(hex) hata-maskesi(hex) girdi-sayısı, örn. "3c 01 10"', 'key(hex) fault-mask(hex) input-count, e.g. "3c 01 10"'),
      format: function (data) { return D.hex(data.k, 2) + ' ' + D.hex(data.faultMask, 2) + ' ' + data.n; },
      tokens: function (data) { var t = []; for (var i = 0; i < data.n; i++) t.push('x=' + i); return t; },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 3) throw T('"anahtar hata-maskesi sayı" biçiminde olmalı.', 'Must be "key fault-mask count".');
        if (!/^[0-9a-fA-F]{1,2}$/.test(parts[0])) throw T('Anahtar 1-2 onaltılık basamak olmalı.', 'The key must be 1-2 hex digits.');
        if (!/^[0-9a-fA-F]{1,2}$/.test(parts[1])) throw T('Hata maskesi 1-2 onaltılık basamak olmalı.', 'The fault mask must be 1-2 hex digits.');
        var n = parseInt(parts[2], 10);
        if (!/^\d+$/.test(parts[2]) || n < 1 || n > 32) throw T('Girdi sayısı 1-32 arası bir tamsayı olmalı.', 'The input count must be an integer from 1 to 32.');
        return mk(parseInt(parts[0], 16), parseInt(parts[1], 16), n);
      },
      bad: ['', 'zz 01 10', '3c zz 10', '3c 01 0', '3c 01 99']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
