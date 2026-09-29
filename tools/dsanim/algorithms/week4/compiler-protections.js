// CEN429 — Week 4 — Demo 5 (code/week-04/05-compiler-protections/overflow.c)
// strcpy(buffer, input) with no bound check. In a HARDENED build the compiler places a random
// CANARY value between buffer[64] and the saved frame pointer / return address, and checks it right
// before the function returns; an overflow that reaches the canary is caught ("stack smashing
// detected"). In a WEAK build there is no canary at all: the same overflow silently marches straight
// through the saved frame pointer into the return address.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/05-compiler-protections/overflow.c), full file, byte-identical.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 5: compiler and operating-system protections.',
    ' *',
    ' * The same overflow bug (unbounded strcpy into a 64-byte local buffer) is built two different ways:',
    ' *   weak     : protections OFF (no canary, no PIE/ASLR, no RELRO)',
    ' *   hardened : protections ON  (stack canary, _FORTIFY, PIE/ASLR, RELRO, CFG)',
    ' *',
    ' * When a long input overflows the buffer:',
    ' *   - in the hardened build the STACK CANARY is corrupted and the program stops safely:',
    ' *     Linux "*** stack smashing detected ***", Windows 0xC0000409.',
    ' *   - in the weak build the same overflow either silently corrupts something or crashes later.',
    ' *',
    ' * ETHICS: the overflow only ever stays on this program\'s own stack; it is bounded on Linux with',
    ' * prlimit+timeout, on Windows with demo_prepare().',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    'static void copy_in(const char *input)',
    '{',
    '    char buffer[64];',
    '    strcpy(buffer, input);            /* BUG: destination size is never checked */',
    '    printf("Copied (first bytes): %.16s\\n", buffer);',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    if (argc != 2) {',
    '        fprintf(stderr, "Usage: %s <text>\\n", argv[0]);',
    '        return 1;',
    '    }',
    '    copy_in(argv[1]);',
    '    printf("Function returned normally (canary not corrupted).\\n");',
    '    return 0;',
    '}'
  ];

  var BUF = 64, CANARY = 8, FRAME = 8, RETADDR = 8;

  function mk(name, hardened) { return { name: name, hardened: !!hardened }; }

  /** Independent: plain arithmetic on the input length against the 64-byte boundary — no byte walk. */
  function reference(data) {
    var overflow = Math.max(0, data.name.length - BUF);
    return { hardened: !!data.hardened, overflowBytes: overflow, detected: !!data.hardened && overflow > 0 };
  }

  function build(S, data) {
    var L = data.name.length, hardened = data.hardened;
    // Fixed, readable widths for every region (NOT scaled by byte count — 8 bytes drawn at 3px/byte
    // would be far too narrow to hold a label like "saved frame" without overlapping its neighbour).
    var regions = hardened ? [['buf', BUF, T('buffer[64]', 'buffer[64]'), 200], ['can', CANARY, T('KANARYA', 'CANARY'), 120], ['frm', FRAME, T('kayıtlı çerçeve', 'saved frame'), 130], ['ret', RETADDR, T('dönüş adresi', 'return address'), 130]]
                            : [['buf', BUF, T('buffer[64]', 'buffer[64]'), 200], ['frm', FRAME, T('kayıtlı çerçeve', 'saved frame'), 130], ['ret', RETADDR, T('dönüş adresi', 'return address'), 130]];
    var x = 0;
    regions.forEach(function (r) {
      S.box(r[0], { x: x, y: 0, w: r[3], h: 50, size: 11, mono: true, text: r[2], style: r[0] === 'can' ? 'hl' : 'dim', above: r[1] + ' B' });
      x += r[3] + 14;
    });
    S.label('title', { x: x / 2, y: -24, text: T('strcpy(buffer, input) — girdi 64 baytlık sınırı geçerse SIRAYLA komşu bölgelere yazar', 'strcpy(buffer, input) — once the input crosses the 64-byte bound, it writes into the neighbouring regions IN ORDER'), anchor: 'middle', bold: true, size: 12 });

    S.step(T('`copy_in("' + data.name.slice(0, 20) + (L > 20 ? '…' : '') + '")` çağrıldı (' + L + ' karakter). Yığında `buffer[64]` ayrıldı' + (hardened ? ', hemen ardından rastgele bir KANARYA yazıldı.' : '; bu yapıda kanarya YOK.'),
              '`copy_in("' + data.name.slice(0, 20) + (L > 20 ? '…' : '') + '")` is called (' + L + ' characters). `buffer[64]` is allocated on the stack' + (hardened ? ', and a random CANARY is written right after it.' : '; this build has NO canary.')),
           { c: [19, 20] });

    var filled = Math.min(L, BUF);
    S.set('buf', { style: 'new', text: T(filled + '/' + BUF + ' dolu', filled + '/' + BUF + ' filled') });
    S.step(T('`strcpy` ilk ' + filled + ' baytı `buffer`\'a yazıyor — bu kısım her zaman güvenli (henüz sınırı geçmedi).',
              '`strcpy` writes the first ' + filled + ' bytes into `buffer` — this part is always safe (the bound has not been crossed yet).'),
           { c: [21] });

    var overflow = Math.max(0, L - BUF);
    if (overflow === 0) {
      S.at(null);
      S.result = reference(data);
      S.step(T('`' + L + '` karakter tam olarak `buffer`\'a sığıyor (taşma yok). Fonksiyon normal döner; kanarya (varsa) hiç dokunulmamış olarak kalır.',
                data.name.length + ' characters fit inside `buffer` exactly (no overflow). The function returns normally; the canary (if present) is never touched.'),
             { c: [22, 29] });
      return;
    }

    var idx = BUF, order = [];
    if (hardened) order = order.concat(new Array(Math.min(overflow, CANARY)).fill('can'));
    var afterCanary = Math.max(0, overflow - (hardened ? CANARY : 0));
    order = order.concat(new Array(Math.min(afterCanary, FRAME)).fill('frm'));
    var afterFrame = Math.max(0, afterCanary - FRAME);
    order = order.concat(new Array(Math.min(afterFrame, RETADDR)).fill('ret'));
    var afterRet = Math.max(0, afterFrame - RETADDR);

    var canaryHit = false, region = null, count = {};
    order.forEach(function (reg, k) {
      count[reg] = (count[reg] || 0) + 1;
      if (reg !== region) {
        region = reg;
        var total = reg === 'can' ? CANARY : (reg === 'frm' ? FRAME : RETADDR);
        S.set(reg, { style: 'del' });
        var label = reg === 'can' ? T('KANARYA', 'CANARY') : (reg === 'frm' ? T('kaydedilmiş çerçeve', 'saved frame') : T('dönüş adresi', 'return address'));
        S.step(T('Taşma `' + label.tr + '` bölgesine ULAŞTI (' + total + ' bayt) — üzerine yazılmaya başlanıyor.',
                  'The overflow REACHES the `' + label.en + '` region (' + total + ' bytes) — it starts being overwritten.'),
               { c: [21] });
        if (reg === 'can') canaryHit = true;
      }
    });
    if (afterRet > 0) {
      S.region('rest', { x: x, y: -10, w: 160, h: 70, style: 'empty', title: T('yığının geri kalanı', 'rest of the stack') });
      S.label('restTxt', { x: x + 80, y: 30, text: T(afterRet + ' bayt daha ezildi…', afterRet + ' more byte(s) smashed…'), anchor: 'middle', size: 12 });
      S.step(T('Kalan ' + afterRet + ' bayt dönüş adresinin de ÖTESİNE geçip yığının geri kalanını eziyor — tanımsız davranış.',
                'The remaining ' + afterRet + ' byte(s) go PAST the return address too, smashing the rest of the stack — undefined behavior.'),
             {});
    }

    S.at(null);
    S.result = reference(data);
    if (hardened) {
      S.step(T('Fonksiyon dönerken kanarya denetlenir: okunan değer başlangıçtakiyle EŞLEŞMİYOR (üzerine yazıldı) → `__stack_chk_fail()` → "*** stack smashing detected ***" (Linux) / 0xC0000409 (Windows). Program GÜVENLE durdu.',
                'On return, the canary is checked: the value read does NOT match the starting value (it was overwritten) → `__stack_chk_fail()` → "*** stack smashing detected ***" (Linux) / 0xC0000409 (Windows). The program stopped SAFELY.'),
             { c: [22, 29] });
    } else {
      S.step(T('Bu yapıda denetleyecek bir kanarya YOK: fonksiyon "normal" döner ama kaydedilmiş çerçeve ve/veya dönüş adresi artık saldırganın verisi — bir SONRAKİ adımda (fonksiyon dönüşünde) çökme ya da daha kötüsü olabilir.',
                'This build has NO canary to check: the function returns "normally," but the saved frame pointer and/or return address are now the attacker\'s data — the NEXT step (the function returning) may crash, or worse.'),
             { c: [22, 29] });
    }
  }

  D.define({
    id: 'compiler-protections',
    title: T('Yığın kanaryası: buffer[64] taştığında ne olur? (overflow.c)', 'Stack canary: what happens when buffer[64] overflows? (overflow.c)'),
    code: { c: FULL_C },
    presets: [
      { id: 'fits', level: 'normal', name: T('Uyar: 20 karakter, taşma yok', 'Fits: 20 characters, no overflow'), data: mk('normal_input_string1', true) },
      { id: 'hardened-overflow', level: 'hard', name: T('Zor: 75 karakter, SERT sürüm kanaryayı yakalıyor', 'Hard: 75 characters, HARDENED build catches it via the canary'), data: mk('A'.repeat(75), true) },
      { id: 'weak-overflow', level: 'edge', name: T('Uç durum: aynı 75 karakter, ZAYIF sürümde kanarya yok', 'Edge case: the same 75 characters, WEAK build has no canary'), data: mk('A'.repeat(75), false) },
      { id: 'exact-fit', level: 'edge', name: T('Uç durum: tam 64 karakter, sınırda ama taşma yok', 'Edge case: exactly 64 characters, right at the edge but no overflow'), data: mk('B'.repeat(64), true) },
      { id: 'deep-overflow', level: 'edge', name: T('Uç durum: 90 karakter, dönüş adresine kadar ilerliyor', 'Edge case: 90 characters, reaches all the way to the return address'), data: mk('C'.repeat(90), true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.name.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 20], normal: [10, 40], hard: [65, 80], extreme: [65, 95] };
      var rg = ranges[level] || ranges.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      var s = ''; for (var i = 0; i < n; i++) s += chars[D.randInt(r, 0, chars.length - 1)];
      return mk(s, D.randInt(r, 0, 1) === 1);
    },
    input: {
      hint: T('[WEAK] metin (en az 10 karakter)', '[WEAK] text (at least 10 characters)'),
      format: function (data) { return (data.hardened ? '' : 'WEAK ') + data.name; },
      tokens: function (data) { return data.name.split(''); },
      parse: function (text) {
        var s = String(text), hardened = true;
        if (/^WEAK\s+/i.test(s)) { hardened = false; s = s.replace(/^WEAK\s+/i, ''); }
        if (s.length < 10) throw T('En az 10 karakter girin.', 'Enter at least 10 characters.');
        if (s.length > 120) throw T('En fazla 120 karakter (gösterim için).', 'At most 120 characters (for display).');
        if (/\s/.test(s)) throw T('Metinde boşluk olamaz (argv tek bir sözcüktür).', 'The text cannot contain whitespace (argv is a single token).');
        if (!/^[\x20-\x7e]+$/.test(s)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(s, hardened);
      },
      bad: ['', 'short', 'has space', 'WEAK', 'x'.repeat(200)]
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
