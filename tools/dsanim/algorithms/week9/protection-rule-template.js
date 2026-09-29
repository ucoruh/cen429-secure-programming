// CEN429 — Week 9 — Section 4 (code/week-09/01-manual-obfuscation/obfuscated.c)
// The "protection rule" template (section 4): every technique is written up as Protects / Threat
// / How / Cost / Limit / Measure — six lines, never "obfuscation: yes/no". This animation fills
// the template for the 5 real rules this week's demo applies (R-01, R-04, R-05, R-07, R-08),
// against TWO assets: `grant_access` (this week's own, real code — measured for real) and the
// note's own worked "lisans_dogrula" (license-check) example (section 9) — kept explicitly
// CONCEPTUAL/unmeasured here, exactly as the note itself presents it, never given invented numbers.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-09/01-manual-obfuscation/obfuscated.c), full file, byte-identical.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 9 - Demo 1: OBFUSCATED version (same behavior, hand-hardened).',
    ' * Rules applied (same names as the slides/notes):',
    ' *   R-01 opaque predicate  : the branch is tied to an always-true arithmetic identity.',
    ' *   R-04 flattening        : control flow is moved into a single switch dispatcher.',
    ' *   R-05 randomized exit   : on failure, the state variable is pushed to an undefined value,',
    ' *                            exiting through the default case.',
    ' *   R-07 constant encoding : the valid token string stays XOR-encoded, is decoded only at use,',
    ' *                            and is wiped IMMEDIATELY after use.',
    ' *   R-08 opaque boolean    : the result is not a plain 0/1; it is derived from two fields.',
    ' * Behavior is IDENTICAL to clean.c; only readability drops and cost rises.',
    ' */',
    '#include <string.h>',
    '#include "common.h"',
    '',
    '/* Encoded "CEN429-OK" (each byte ^ 0x5A). Not plainly visible with `strings`. */',
    'static const unsigned char ENCODED[] = {',
    '    0x19, 0x1F, 0x14, 0x6E, 0x68, 0x63, 0x77, 0x15, 0x11  /* "CEN429-OK", each byte ^ 0x5A */',
    '};',
    '#define ENCODED_LEN ((unsigned)(sizeof ENCODED))',
    '',
    '/* R-01: x*(x+1) is always even -> always 0. Hard for static analysis to prove. */',
    'static int opaque_zero(unsigned x) { return (int)((x * (x + 1u)) & 1u); }',
    '',
    '/* R-08: opaque boolean; a ^ b == 0xFFFF -> GRANTED. */',
    'typedef struct { unsigned a, b; } Decision;',
    'static int decision_grants(Decision d) { return (d.a ^ d.b) == 0xFFFFu; }',
    '',
    'static int constant_time_equals(const unsigned char *a, const char *b, unsigned n)',
    '{',
    '    unsigned diff = 0;',
    '    for (unsigned i = 0; i < n; i++)',
    '        diff |= (unsigned)(a[i] ^ (unsigned char)b[i]);',
    '    return diff == 0;',
    '}',
    '',
    'int grant_access(const char *token)',
    '{',
    '    enum { START, LENGTH, DECODE, COMPARE, GRANT, DENY, DONE = 99 };',
    '    int state = START + opaque_zero((unsigned)strlen(token)); /* opaque: still START */',
    '    unsigned n = ENCODED_LEN;',
    '    char decoded[ENCODED_LEN + 1];',
    '    Decision d = { 0, 0 };',
    '    int result = DENIED;',
    '',
    '    for (;;) {',
    '        switch (state) {',
    '        case START:',
    '            state = LENGTH;',
    '            break;',
    '        case LENGTH:',
    '            /* R-05: on a length mismatch, jump to an undefined state -> default -> DENY */',
    '            state = (strlen(token) == n) ? DECODE : (DONE + 7);',
    '            break;',
    '        case DECODE:',
    '            for (unsigned i = 0; i < n; i++) decoded[i] = (char)(ENCODED[i] ^ 0x5A);',
    '            decoded[n] = \'\\0\';',
    '            state = COMPARE;',
    '            break;',
    '        case COMPARE:',
    '            if (constant_time_equals((const unsigned char *)token, decoded, n))',
    '                d.a = 0xA3C1u, d.b = 0x5C3Eu;   /* a^b == 0xFFFF -> grant */',
    '            else',
    '                d.a = 0x1111u, d.b = 0x2222u;   /* not granted */',
    '            memset(decoded, 0, sizeof decoded);  /* R-07: wipe the decoded string IMMEDIATELY */',
    '            state = decision_grants(d) ? GRANT : DENY;',
    '            break;',
    '        case GRANT:',
    '            result = GRANTED;',
    '            state = -1;                          /* default -> exit (success also exits via default) */',
    '            break;',
    '        case DENY:',
    '            result = DENIED;',
    '            state = -2;',
    '            break;',
    '        default:                                  /* R-05 randomized exit point */',
    '            return result;',
    '        }',
    '    }',
    '}'
  ];

  // Catalog: 5 real rules x 2 assets = 10 filled templates. Asset A (grant_access) is THIS
  // week's own, real, measured code. Asset B (lisans_dogrula) is the note's own section-9 worked
  // example, kept explicitly conceptual/unmeasured — no invented numbers for it.
  var CATALOG = {
    'R01-A': { rule: 'R-01', name: T('opak yüklem', 'opaque predicate'), asset: 'grant_access', protects: T('dallanma kararının kendisi', 'the branch decision itself'), threat: T('statik analiz / tersine derleme', 'static analysis / disassembly'), how: T('`state = START + opaque_zero(...)`; `opaque_zero` her zaman 0', '`state = START + opaque_zero(...)`; `opaque_zero` is always 0'), limit: T('sembolik yürütme/periyodik kanıtla kırılır (deobfuscation animasyonu)', 'broken by symbolic execution / a periodicity proof (deobfuscation animation)'), lines: [22, 23, 40] },
    'R04-A': { rule: 'R-04', name: T('düzleştirme', 'flattening'), asset: 'grant_access', protects: T('algoritmanın adım sırası (CFG)', "the algorithm's step order (CFG)"), threat: T('CFG okuma / adım adım tersine mühendislik', 'reading the CFG / step-by-step reverse engineering'), how: T('tüm mantık tek bir `switch` dağıtıcısına taşınır', 'all logic moves into a single `switch` dispatcher'), limit: T('kalıp tanıma dağıtıcı biçimini tanıyabilir (bölüm 10)', 'pattern recognition can spot the dispatcher shape (section 10)'), lines: [{ n: 47, note: T('tek dağıtıcı: sıradaki adım state\'e göre seçilir', 'single dispatcher: the next step is chosen by state') }] },
    'R05-A': { rule: 'R-05', name: T('rastgele çıkış', 'randomized exit'), asset: 'grant_access', protects: T("dağıtıcının 'gerçek' çıkışının hangisi olduğu", "which dispatcher exit is the 'real' one"), threat: T('otomatik araç (hangi case asıl?)', 'automated tooling (which case is real?)'), how: T('uzunluk uymazsa `state` tanımsız bir değere (`DONE+7`) sıçrar', 'on a length mismatch `state` jumps to an invalid, unmapped value (`DONE+7`)'), limit: T('tek bir `default:` çıkışı olduğu görülünce zayıflar', 'weakens once the single `default:` exit is spotted'), lines: [52, { n: 53, note: T('uzunluk uymazsa DONE+7\'ye (geçersiz) sıçrar', 'on a length mismatch it jumps to DONE+7 (invalid)') }, 76] },
    'R07-A': { rule: 'R-07', name: T('dize kodlama', 'string encoding'), asset: 'grant_access', protects: T('geçerli jetonun kendisi (içerik)', 'the valid token itself (content)'), threat: T('`strings` ile statik tarama', 'static scanning with `strings`'), how: T('`ENCODED[]` XOR 0x5A kodlu durur, yalnız kullanım anında çözülür ve HEMEN silinir', '`ENCODED[]` stays XOR-0x5A encoded, decoded only at use, wiped IMMEDIATELY'), limit: T('çalışan programda bellek dökümü çözülmüş hâli yakalayabilir', 'a live memory dump can still catch the decoded form while running'), lines: [17, 18, { n: 56, note: T('9 bayt tek tek çözülür', 'the 9 bytes are decoded one at a time') }, 65] },
    'R08-A': { rule: 'R-08', name: T('opak boolean', 'opaque boolean'), asset: 'grant_access', protects: T('sonucun anlamı (GRANTED/DENIED nerede?)', "the result's meaning (where is GRANTED/DENIED?)"), threat: T('bellek dökümünde tek baytı arama', 'searching a memory dump for a single byte'), how: T('sonuç `Decision{a,b}`dan türetilir: `a^b==0xFFFF`', 'the result is derived from `Decision{a,b}`: `a^b==0xFFFF`'), limit: T('kod okunursa (statik) ilişki yine çözülür', "reading the code (statically) still reveals the relationship"), lines: [26, 27, { n: 66, note: T('a^b==0xFFFF mi? GRANT/DENY burada ayrılır', 'a^b==0xFFFF? GRANT/DENY is decided here') }] },
    'R01-B': { rule: 'R-01', name: T('opak yüklem', 'opaque predicate'), asset: 'lisans_dogrula', protects: T('lisans denetiminin dal kararı', "the license check's branch decision"), threat: T('statik analiz', 'static analysis'), how: T('aynı fikir: daima-doğru bir aritmetik özdeşlik', 'same idea: an always-true arithmetic identity'), limit: T('tek başına yetersiz; K-04/K-05 ile katmanlanır (bölüm 9 karar kuralı)', 'not enough alone; layered with R-04/R-05 (section 9 decision rule)'), lines: null },
    'R04-B': { rule: 'R-04', name: T('düzleştirme', 'flattening'), asset: 'lisans_dogrula', protects: T('lisans denetiminin akışı', "the license check's flow"), threat: T('CFG okuma', 'reading the CFG'), how: T('tek dağıtıcıya taşıma (bölüm 9\'daki gibi Tigress `Flatten`)', 'move to one dispatcher (Tigress `Flatten`, as in section 9)'), limit: T('kalıp tanımaya karşı tek başına yeterli değil', 'not enough against pattern recognition alone'), lines: null },
    'R05-B': { rule: 'R-05', name: T('rastgele çıkış', 'randomized exit'), asset: 'lisans_dogrula', protects: T('hangi çıkışın "asıl" olduğu', 'which exit is the "real" one'), threat: T('otomatik araç', 'automated tooling'), how: T('başarısızlıkta tanımsız bir duruma sıçrama', 'jump to an invalid, unmapped state on failure'), limit: T('tek çıkış noktası görülünce zayıflar', 'weakens once a single exit point is spotted'), lines: null },
    'R07-B': { rule: 'R-07', name: T('dize kodlama', 'string encoding'), asset: 'lisans_dogrula', protects: T('lisans anahtarının kendisi', 'the license key itself'), threat: T('`strings` taraması', '`strings` scanning'), how: T('anahtar kodlu tutulur, kullanımda çözülür', 'the key stays encoded, decoded at use'), limit: T('gerçek anahtar gizliliği için kriptografi/whitebox gerekir (bölüm 3, 11. hafta)', 'real key secrecy needs cryptography/whitebox (section 3, week 11)'), lines: null },
    'R08-B': { rule: 'R-08', name: T('opak boolean', 'opaque boolean'), asset: 'lisans_dogrula', protects: T("'lisans geçerli mi' sonucunun anlamı", "the meaning of the 'license valid' result"), threat: T('bellek dökümü tarama', 'memory-dump scanning'), how: T('sonuç iki alandan türetilir', 'the result is derived from two fields'), limit: T('kaynak koda erişimle yine çözülür', 'still resolved with access to the source'), lines: null }
  };
  var KEYS = Object.keys(CATALOG);

  function mk(rowKeys) { return { rowKeys: rowKeys.slice() }; }

  /** Independent: for each row key, "measured for real" is true iff the asset is grant_access
   * (this week's own compiled+measured demo) — a plain lookup, not shared with build()'s narration. */
  function reference(data) {
    return { measuredForReal: data.rowKeys.map(function (k) { return CATALOG[k] && CATALOG[k].asset === 'grant_access'; }) };
  }

  function build(S, data) {
    var n = data.rowKeys.length;
    S.label('title', { x: 250, y: -30, text: T('Koruma kuralı şablonu: Neyi korur? / Tehdit / Nasıl? / Sınır / Ölçüm', 'Protection rule template: Protects? / Threat / How? / Limit / Measure'), anchor: 'middle', bold: true, size: 13 });
    var fields = ['rule', 'protects', 'threat', 'how', 'limit', 'measure'];
    var ids = {};
    fields.forEach(function (f, i) { ids[f] = S.box('f' + f, { x: 0, y: i * 40, w: 640, h: 34, size: 12, mono: false, text: '…', style: 'dim' }); });

    var results = [];
    for (var i = 0; i < n; i++) {
      var key = data.rowKeys[i];
      var row = CATALOG[key];
      var measuredReal = row.asset === 'grant_access';
      results.push(measuredReal);
      S.at(i);
      S.set(ids.rule, { text: T('KURAL ' + row.rule + ' — ' + row.name.tr + '  [' + row.asset + ']', 'RULE ' + row.rule + ' — ' + row.name.en + '  [' + row.asset + ']'), style: 'hl' });
      S.set(ids.protects, { text: T('Neyi korur: ' + row.protects.tr, 'Protects: ' + row.protects.en) });
      S.set(ids.threat, { text: T('Tehdit: ' + row.threat.tr, 'Threat: ' + row.threat.en) });
      S.set(ids.how, { text: T('Nasıl: ' + row.how.tr, 'How: ' + row.how.en) });
      S.set(ids.limit, { text: T('Sınır: ' + row.limit.tr, 'Limit: ' + row.limit.en) });
      var measureText = measuredReal
        ? T('Ölçüm: 5 kural BİRLİKTE ölçüldü (27→49 komut); bu kural TEK BAŞINA izole edilmedi.', 'Measure: all 5 rules measured TOGETHER (27->49 instr); this rule NOT isolated alone.')
        : T('Ölçüm: bölüm 9\'un kavramsal örneği — burada ölçülmedi (sayı UYDURULMADI).', "Measure: section 9's conceptual example -- not measured here (no number invented).");
      S.set(ids.measure, { text: measureText, style: measuredReal ? 'new' : 'dim' });
      var lines = row.lines ? row.lines.slice() : [];
      S.step(T('Satır #' + (i + 1) + ': `' + row.rule + '` — `' + row.asset + '` için şablon dolduruldu' + (measuredReal ? ' (gerçek ölçüm mevcut).' : ' (kavramsal, ölçülmedi).'),
                'Row #' + (i + 1) + ': `' + row.rule + '` — the template is filled for `' + row.asset + '`' + (measuredReal ? ' (real measurement available).' : ' (conceptual, not measured).')),
             { c: lines });
    }
    S.at(null);
    S.result = reference(data);
    var measuredCount = results.filter(Boolean).length;
    S.step(T(n + ' satırdan `' + measuredCount + '` tanesi gerçek ölçümle destekleniyor (`grant_access`), `' + (n - measuredCount) + '` tanesi bölüm 9\'dan kavramsal (`lisans_dogrula`) — ikisini KARIŞTIRMAYIN: birini "ölçtük" diğerini "örnekledik" olarak ayrı raporlayın.',
              measuredCount + ' of ' + n + ' rows are backed by a real measurement (`grant_access`), ' + (n - measuredCount) + ' are conceptual, from section 9 (`lisans_dogrula`) — do NOT conflate the two: report one as "measured", the other as "illustrated".'),
           {});
  }

  D.define({
    id: 'protection-rule-template',
    title: T('"Koruma kuralı" şablonu: 5 kural, 2 varlık, 10 dolu satır', 'The "protection rule" template: 5 rules, 2 assets, 10 filled rows'),
    code: { c: FULL_C },
    presets: [
      { id: 'normal-all-rows', level: 'normal', name: T('Normal: 10 satırın tamamı (5 kural x 2 varlık)', 'Normal: all 10 rows (5 rules x 2 assets)'), data: mk(KEYS) },
      { id: 'hard-asset-a-repeat', level: 'hard', name: T('Zor: 11 satır, yalnız `grant_access` (ölçülmüş) tekrarlı', 'Hard: 11 rows, only `grant_access` (measured), repeated'), data: mk(['R01-A', 'R04-A', 'R05-A', 'R07-A', 'R08-A', 'R01-A', 'R04-A', 'R05-A', 'R07-A', 'R08-A', 'R01-A']) },
      { id: 'edge-asset-b-only', level: 'edge', name: T('Uç durum: 10 satır, yalnız `lisans_dogrula` (kavramsal, hiç ölçüm yok)', 'Edge case: 10 rows, only `lisans_dogrula` (conceptual, no measurement at all)'), data: mk(['R01-B', 'R04-B', 'R05-B', 'R07-B', 'R08-B', 'R01-B', 'R04-B', 'R05-B', 'R07-B', 'R08-B']) },
      { id: 'edge-single-rule-both-assets', level: 'edge', name: T('Uç durum: yalnız R-07, iki varlıkta tekrarlı (10 satır)', 'Edge case: only R-07, repeated across both assets (10 rows)'), data: mk(['R07-A', 'R07-B', 'R07-A', 'R07-B', 'R07-A', 'R07-B', 'R07-A', 'R07-B', 'R07-A', 'R07-B']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.rowKeys.length; },
    random: function (level, r) {
      var counts = { easy: [10, 10], normal: [10, 11], hard: [11, 12], extreme: [12, 14] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var rows = [];
      for (var i = 0; i < n; i++) rows.push(KEYS[D.randInt(r, 0, KEYS.length - 1)]);
      return mk(rows);
    },
    input: {
      hint: T('satır1,satır2,…(≥10 kod, örn. R01-A,R07-B)', 'row1,row2,…(>=10 codes, e.g. R01-A,R07-B)'),
      format: function (data) { return data.rowKeys.join(','); },
      tokens: function (data) { return data.rowKeys.slice(); },
      parse: function (text) {
        var parts = String(text).split(',').map(function (t) { return t.trim().toUpperCase(); });
        if (parts.length < 10) throw T('En az 10 satır kodu girin.', 'Enter at least 10 row codes.');
        for (var i = 0; i < parts.length; i++) if (KEYS.indexOf(parts[i]) < 0) throw T('"' + parts[i] + '" bilinen bir satır kodu değil (örn. R01-A).', '"' + parts[i] + '" is not a known row code (e.g. R01-A).');
        return mk(parts);
      },
      bad: ['', 'R01-A,R04-A', 'R99-A,R01-A,R04-A,R05-A,R07-A,R08-A,R01-B,R04-B,R05-B,R07-B', 'r01a,R04-A,R05-A,R07-A,R08-A,R01-B,R04-B,R05-B,R07-B,R08-B', 'R01-A;R04-A;R05-A;R07-A;R08-A;R01-B;R04-B;R05-B;R07-B;R08-B']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
