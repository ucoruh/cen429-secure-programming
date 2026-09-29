// CEN429 — Week 4 — Demo 4 (code/week-04/04-fuzzing/parser.c, parser_secure.c)
// A tiny length-prefixed record format: [type][length][data...]. The buggy parser reads the length
// byte without checking there even IS one (CWE-125), then copies `length` bytes into a fixed 16-byte
// buffer without checking `length` against the buffer OR the remaining input (CWE-787). The fixed
// parser checks both bounds BEFORE touching memory — an allow-list of "known good" shapes: only a
// complete header, a length that fits the destination, and enough input left, is accepted.
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/04-fuzzing/parser.c), full file, byte-identical.
  var VULN_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 4: BUGGY document parser.',
    ' *',
    ' * Format:  [type][length][data...]   (a simple length-prefixed record)',
    ' * If type == 0x42 (\'B\'): the second byte gives the length, then that many bytes are copied into a',
    ' * local buffer. There are two classic bugs:',
    ' *   1) data[1] is read without checking n>=2 (out-of-bounds read on a short input).',
    ' *   2) length is checked against neither the remaining input nor the 16-byte destination',
    ' *      (out-of-bounds read + stack buffer overflow).',
    ' * These bugs trigger within seconds on random input — that is exactly the fuzzer\'s job.',
    ' */',
    '#include "parser.h"',
    '',
    'int parse_document(const unsigned char *data, size_t n)',
    '{',
    '    if (n < 1)',
    '        return 0;',
    '    unsigned char type = data[0];',
    '    if (type == 0x42) {',
    '        unsigned char length = data[1];       /* BUG 1: n>=2 was never checked */',
    '        unsigned char dest[16];',
    '        for (unsigned i = 0; i < length; i++)',
    '            dest[i] = data[2 + i];            /* BUG 2: out-of-bounds + overflow */',
    '        return dest[0];',
    '    }',
    '    return 0;',
    '}'
  ];
  // Exact source (code/week-04/04-fuzzing/parser_secure.c), full file, byte-identical.
  var SECURE_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 4: FIXED document parser.',
    ' *',
    ' * Principle: never trust external input (Recipe 3.1). Before every access, check BOTH the',
    ' * remaining input length AND the destination buffer\'s bound.',
    ' */',
    '#include "parser.h"',
    '#include <string.h>',
    '',
    'int parse_document(const unsigned char *data, size_t n)',
    '{',
    '    if (n < 2)',
    '        return 0;                          /* need at least 2 bytes for type + length */',
    '    unsigned char type = data[0];',
    '    if (type == 0x42) {',
    '        size_t length = data[1];',
    '        unsigned char dest[16];',
    '        if (length > sizeof(dest))         /* destination bound check */',
    '            return -1;',
    '        if ((size_t)2 + length > n)        /* input bound check */',
    '            return -1;',
    '        memcpy(dest, data + 2, length);',
    '        return length > 0 ? dest[0] : 0;',
    '    }',
    '    return 0;',
    '}'
  ];

  // ------------------------------------------------------------------ data
  function genRecord(kind, i) {
    switch (kind) {
      case 'empty': return [];
      case 'header-only': return [0x42];
      case 'valid-zero': return [0x42, 0];
      case 'valid-small': return [0x42, 3, 0x41 + (i % 20), 0x42 + (i % 20), 0x43 + (i % 20)];
      case 'valid-boundary': {
        var b = [0x42, 16];
        for (var k = 0; k < 16; k++) b.push(0x30 + ((k + i) % 90));
        return b;
      }
      case 'invalid-len-too-big': return [0x42, 17 + (i % 3)];
      case 'invalid-input-short': return [0x42, 10, 1, 2, 3];
      case 'unrelated-type': return [0x10 + (i % 30), 5, 1, 2, 3, 4, 5];
      default: return [0x42, 1, 0x41];
    }
  }
  function mk(secure, kinds) { return { secure: !!secure, kinds: kinds.slice() }; }
  function records(data) { return data.kinds.map(genRecord); }

  // Per-record annotated line walks (for the code panel), with {n, note} on every executed
  // condition line and {n, skip: true} on the representative not-taken alternative.
  function secureLines(bytes) {
    var n = bytes.length;
    var out = [{ n: 12, note: T('n=' + n + ' < 2? ' + (n < 2 ? 'evet' : 'hayır'), 'n=' + n + ' < 2? ' + (n < 2 ? 'yes' : 'no')) }];
    if (n < 2) { out.push(13); return out; }
    out.push({ n: 13, skip: true });
    out.push(14);
    var type = bytes[0];
    out.push({ n: 15, note: T('type=0x' + D.hex(type, 2) + ' == 0x42? ' + (type === 0x42 ? 'evet' : 'hayır'), 'type=0x' + D.hex(type, 2) + ' == 0x42? ' + (type === 0x42 ? 'yes' : 'no')) });
    if (type !== 0x42) { out.push({ n: 16, skip: true }); out.push(25); return out; }
    out.push(16); out.push(17);
    var length = bytes[1], tooLong = length > 16;
    out.push({ n: 18, note: T('length=' + length + ' > 16? ' + (tooLong ? 'evet → reddet' : 'hayır'), 'length=' + length + ' > 16? ' + (tooLong ? 'yes → reject' : 'no')) });
    if (tooLong) { out.push(19); return out; }
    out.push({ n: 19, skip: true });
    var tooFar = (2 + length) > n;
    out.push({ n: 20, note: T('2+' + length + ' > ' + n + '? ' + (tooFar ? 'evet → reddet' : 'hayır'), '2+' + length + ' > ' + n + '? ' + (tooFar ? 'yes → reject' : 'no')) });
    if (tooFar) { out.push(21); return out; }
    out.push({ n: 21, skip: true });
    out.push(22);
    out.push({ n: 23, note: T('length>0 ? dest[0] : 0 → ' + (length > 0 ? 'dest[0]' : '0'), 'length>0 ? dest[0] : 0 → ' + (length > 0 ? 'dest[0]' : '0')) });
    return out;
  }
  function vulnLines(bytes) {
    var n = bytes.length;
    var out = [{ n: 16, note: T('n=' + n + ' < 1? ' + (n < 1 ? 'evet' : 'hayır'), 'n=' + n + ' < 1? ' + (n < 1 ? 'yes' : 'no')) }];
    if (n < 1) { out.push(17); return out; }
    out.push({ n: 17, skip: true });
    out.push(18);
    var type = bytes[0];
    out.push({ n: 19, note: T('type=0x' + D.hex(type, 2) + ' == 0x42? ' + (type === 0x42 ? 'evet' : 'hayır'), 'type=0x' + D.hex(type, 2) + ' == 0x42? ' + (type === 0x42 ? 'yes' : 'no')) });
    if (type !== 0x42) { out.push({ n: 20, skip: true }); out.push(26); return out; }
    out.push(20); out.push(21);
    if (n < 2) return out;   // the OOB read of data[1] already happened at line 20
    var length = bytes[1], fits = (2 + length) <= n;
    out.push({ n: 22, note: T('i < ' + length + '? sınır: 2+' + length + (fits ? ' <= ' : ' > ') + n + (fits ? ' (sınır içinde)' : ' (SINIR DIŞI)'), 'i < ' + length + '? bound: 2+' + length + (fits ? ' <= ' : ' > ') + n + (fits ? ' (in bounds)' : ' (OUT OF BOUNDS)')) });
    if (length === 0) { out.push({ n: 23, skip: true }); out.push(24); return out; }
    out.push(23);
    if (fits) out.push(24);
    return out;
  }

  /** Used only by build() for the step-by-step, branch-by-branch narration (mirrors parse_document's
   * own if/return shape so the captions can say "this is the line that rejects it"). */
  function checkSecure(bytes) {
    var n = bytes.length;
    if (n < 2) return { accepted: true, result: 0 };
    var type = bytes[0], length = bytes[1];
    if (type !== 0x42) return { accepted: true, result: 0 };
    if (length > 16) return { accepted: false, result: null };
    if (2 + length > n) return { accepted: false, result: null };
    return { accepted: true, result: length > 0 ? bytes[2] : 0 };
  }
  function checkVuln(bytes) {
    var n = bytes.length;
    if (n < 1) return { unsafe: false, result: 0 };
    var type = bytes[0];
    if (type !== 0x42) return { unsafe: false, result: 0 };
    if (n < 2) return { unsafe: true, result: null };
    var length = bytes[1];
    if (2 + length > n) return { unsafe: true, result: null };
    return { unsafe: false, result: length > 0 ? bytes[2] : 0 };
  }

  /** Independent record materialization for reference(): a lookup table (not the switch genRecord()
   * uses), and never calling genRecord()/records() — build() calls those. A mistake in genRecord's
   * byte layout must not silently pass on both paths. */
  var REF_KIND_BYTES = {
    'empty': function () { return []; },
    'header-only': function () { return [0x42]; },
    'valid-zero': function () { return [0x42, 0]; },
    'valid-small': function (i) { return [0x42, 3, 0x41 + (i % 20), 0x42 + (i % 20), 0x43 + (i % 20)]; },
    'valid-boundary': function (i) { var b = [0x42, 16]; for (var k = 0; k < 16; k++) b.push(0x30 + ((k + i) % 90)); return b; },
    'invalid-len-too-big': function (i) { return [0x42, 17 + (i % 3)]; },
    'invalid-input-short': function () { return [0x42, 10, 1, 2, 3]; },
    'unrelated-type': function (i) { return [0x10 + (i % 30), 5, 1, 2, 3, 4, 5]; }
  };
  function refRecordBytes(kind, i) { var f = REF_KIND_BYTES[kind]; return f ? f(i) : [0x42, 1, 0x41]; }
  function refRecords(data) { return data.kinds.map(refRecordBytes); }

  /** Independent computation for reference(): a single boolean-algebra formula (no early returns,
   * no branch-by-branch walk) — a different shape than checkSecure/checkVuln above, so a mistake in
   * build()'s branch narration would not silently also be "correct" here. */
  function refSecure(bytes) {
    var n = bytes.length, hasHeader = n >= 2;
    var type = hasHeader ? bytes[0] : -1, length = hasHeader ? bytes[1] : -1;
    var isB = type === 0x42, fitsDest = hasHeader && length <= 16, fitsInput = hasHeader && (2 + length) <= n;
    var accepted = !hasHeader || !isB || (fitsDest && fitsInput);
    var result = (!hasHeader || !isB) ? 0 : ((fitsDest && fitsInput) ? (length > 0 ? bytes[2] : 0) : null);
    return { accepted: accepted, result: result };
  }
  function refVuln(bytes) {
    var n = bytes.length, hasType = n >= 1;
    var type = hasType ? bytes[0] : -1, isB = type === 0x42;
    var hasLenByte = n >= 2, length = hasLenByte ? bytes[1] : -1;
    var inBounds = hasLenByte && (2 + length) <= n;
    var unsafe = isB && (!hasLenByte || !inBounds);
    var result = !isB ? 0 : (unsafe ? null : (length > 0 ? bytes[2] : 0));
    return { unsafe: unsafe, result: result };
  }
  function reference(data) {
    var recs = refRecords(data), out = [];
    recs.forEach(function (bytes) { out.push(data.secure ? refSecure(bytes) : refVuln(bytes)); });
    return { secure: !!data.secure, results: out };
  }

  function build(S, data) {
    var recs = records(data);
    S.label('title', { x: 300, y: -22,
      text: data.secure ? T('parser_secure: her kayıt için önce SINIRLAR denetlenir, SONRA belleğe dokunulur', 'parser_secure: for every record, BOUNDS are checked BEFORE memory is touched')
                         : T('parser (hatalı): denetim yok — uzunluk ve veri doğrudan okunur', 'parser (buggy): no checks — the length and data are read directly'),
      anchor: 'middle', bold: true, size: 13 });
    var results = [];
    var y0 = 10;
    recs.forEach(function (bytes, i) {
      var y = y0 + i * 46;
      var ids = S.memRow('r' + i + '_', bytes.map(function (b) { return { value: b }; }), { x: 0, y: y, w: 26, h: 30, size: 11, gap: 2, addrs: false });
      if (!bytes.length) S.label('r' + i + '_empty', { x: 20, y: y + 20, text: T('(boş girdi)', '(empty input)'), anchor: 'start', size: 12, style: 'dim' });
      S.at(i);
      var res;
      if (data.secure) {
        res = checkSecure(bytes);
        results.push(res);
        ids.forEach(function (id) { S.set(id, { style: res.accepted ? 'new' : 'del' }); });
        var msg;
        if (bytes.length < 2) msg = T('n<2: başlık eksik → güvenle 0 döner (hiçbir bayt daha okunmaz)', 'n<2: header incomplete → safely returns 0 (no further byte is read)');
        else if (bytes[0] !== 0x42) msg = T('type ≠ 0x42: bu kayıt yok sayılır, uzunluğa hiç bakılmaz', 'type != 0x42: this record is ignored, length is never even inspected');
        else if (bytes[1] > 16) msg = T('length=' + bytes[1] + ' > 16: HEDEF sınırı aşıyor → reddedildi (kopyalama hiç başlamaz)', 'length=' + bytes[1] + ' > 16: exceeds the DESTINATION bound → rejected (the copy never starts)');
        else if (2 + bytes[1] > bytes.length) msg = T('2+length=' + (2 + bytes[1]) + ' > n=' + bytes.length + ': GİRDİ sınırını aşıyor → reddedildi', '2+length=' + (2 + bytes[1]) + ' > n=' + bytes.length + ': exceeds the INPUT bound → rejected');
        else msg = T('her iki sınır da tamam → memcpy ile güvenle kopyalanır, sonuç=' + res.result, 'both bounds are fine → safely copied with memcpy, result=' + res.result);
        S.label('lbl' + i, { x: (Math.max(bytes.length, 3)) * 28 + 20, y: y + 20, text: msg, anchor: 'start', size: 11 });
        S.step(T('Kayıt #' + (i + 1) + ' (' + bytes.length + ' bayt): ' + msg.tr, 'Record #' + (i + 1) + ' (' + bytes.length + ' bytes): ' + msg.en), { c: secureLines(bytes) });
      } else {
        res = checkVuln(bytes);
        results.push(res);
        ids.forEach(function (id) { S.set(id, { style: res.unsafe ? 'del' : 'normal' }); });
        var msg2;
        if (bytes.length < 1) msg2 = T('n<1: güvenle 0 döner', 'n<1: safely returns 0');
        else if (bytes[0] !== 0x42) msg2 = T('type ≠ 0x42: yok sayılır', 'type != 0x42: ignored');
        else if (bytes.length < 2) msg2 = T('n=1: `data[1]` OKUNUYOR ama yok — SINIR DIŞI OKUMA (tanımsız davranış)', 'n=1: `data[1]` is READ but does not exist — OUT-OF-BOUNDS READ (undefined behavior)');
        else if (2 + bytes[1] > bytes.length) msg2 = T('length=' + bytes[1] + ' denetlenmedi: döngü `data[2..' + (1 + bytes[1]) + ']`\'e kadar okuyor — SINIR DIŞI (girdi ve/veya 16 baytlık hedef aşılıyor)', 'length=' + bytes[1] + ' was never checked: the loop reads up to `data[2..' + (1 + bytes[1]) + ']` — OUT OF BOUNDS (past the input and/or the 16-byte destination)');
        else msg2 = T('bu girdi için sınırlar rastlantıyla tutuyor, sonuç=' + res.result, 'for this particular input the bounds happen to hold, result=' + res.result);
        S.label('lbl' + i, { x: (Math.max(bytes.length, 3)) * 28 + 20, y: y + 20, text: msg2, anchor: 'start', size: 11 });
        S.step(T('Kayıt #' + (i + 1) + ' (' + bytes.length + ' bayt): ' + msg2.tr, 'Record #' + (i + 1) + ' (' + bytes.length + ' bytes): ' + msg2.en), { c: vulnLines(bytes) });
      }
    });
    S.at(null);
    S.result = data.secure
      ? { secure: true, results: results }
      : { secure: false, results: results };
    var badCount = results.filter(function (r) { return data.secure ? !r.accepted : r.unsafe; }).length;
    S.step(data.secure
             ? T(badCount + '/' + recs.length + ' kayıt reddedildi — hiçbiri belleğe zarar vermedi. Bu, bir İZİN LİSTESİdir: yalnız TAM olarak biçime uyan girdi kabul edilir.',
                 badCount + '/' + recs.length + ' records were rejected — none of them touched memory unsafely. This is an ALLOW-LIST: only input that FULLY matches the shape is accepted.')
             : T(badCount + '/' + recs.length + ' kayıt sınır dışı erişime yol açtı (ASan bunları "heap-buffer-overflow" olarak yakalar). Kalanları "şanslıyız" diye güvenli saymak yanlıştır.',
                 badCount + '/' + recs.length + ' records caused an out-of-bounds access (ASan flags these as "heap-buffer-overflow"). Treating the rest as safe "because we got lucky" would be wrong.'),
           {});
  }

  D.define({
    id: 'input-validation',
    title: T('Girdi doğrulama: izin listesi ayrıştırıcı (parser.c)', 'Input validation: an allow-list parser (parser.c)'),
    code: function (data) { return { c: data && data.secure ? SECURE_C : VULN_C }; },
    presets: [
      { id: 'normal-benign', level: 'normal', name: T('Normal: 10 kayıt, hepsi iyi biçimli', 'Normal: 10 records, all well-formed'),
        data: mk(false, ['valid-small', 'valid-zero', 'unrelated-type', 'valid-small', 'valid-boundary', 'unrelated-type', 'valid-small', 'valid-zero', 'valid-small', 'unrelated-type']) },
      { id: 'hard-mixed', level: 'hard', name: T('Zor: 12 kayıt, geçerli/geçersiz karışık', 'Hard: 12 records, valid/invalid mixed'),
        data: mk(false, ['valid-small', 'invalid-len-too-big', 'valid-zero', 'invalid-input-short', 'unrelated-type', 'valid-boundary', 'invalid-len-too-big', 'valid-small', 'invalid-input-short', 'header-only', 'valid-zero', 'unrelated-type']) },
      { id: 'edge-all-bad', level: 'edge', name: T('Uç durum: 10 kayıt, hepsi bozuk/eksik', 'Edge case: 10 records, all malformed/short'),
        data: mk(false, ['empty', 'header-only', 'invalid-len-too-big', 'invalid-input-short', 'empty', 'header-only', 'invalid-len-too-big', 'invalid-input-short', 'empty', 'header-only']) },
      { id: 'edge-secure-mix', level: 'edge', name: T('Uç durum: güvenli sürüm aynı zor karışımı işliyor', 'Edge case: the secure version handles the same hard mix'),
        data: mk(true, ['valid-small', 'invalid-len-too-big', 'valid-zero', 'invalid-input-short', 'unrelated-type', 'valid-boundary', 'invalid-len-too-big', 'valid-small', 'invalid-input-short', 'header-only', 'valid-zero', 'unrelated-type']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.kinds.length; },
    random: function (level, r) {
      var pool = { easy: ['valid-small', 'valid-zero', 'unrelated-type'],
                   normal: ['valid-small', 'valid-zero', 'unrelated-type', 'invalid-len-too-big'],
                   hard: ['valid-small', 'invalid-len-too-big', 'invalid-input-short', 'unrelated-type', 'valid-boundary', 'header-only'],
                   extreme: ['empty', 'header-only', 'invalid-len-too-big', 'invalid-input-short', 'valid-boundary', 'unrelated-type'] };
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 14] };
      var options = pool[level] || pool.normal, rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]), kinds = [];
      for (var i = 0; i < n; i++) kinds.push(options[D.randInt(r, 0, options.length - 1)]);
      return mk(D.randInt(r, 0, 3) === 0, kinds);
    },
    input: {
      hint: T('[SECURE] kind1,kind2,… (≥10; valid-small|valid-zero|valid-boundary|invalid-len-too-big|invalid-input-short|unrelated-type|header-only|empty)', '[SECURE] kind1,kind2,… (>=10; same kind names)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.kinds.join(','); },
      tokens: function (data) { return data.kinds.slice(); },
      parse: function (text) {
        var s = String(text).trim(), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        var kinds = s.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        var valid = ['valid-small', 'valid-zero', 'valid-boundary', 'invalid-len-too-big', 'invalid-input-short', 'unrelated-type', 'header-only', 'empty'];
        if (kinds.length < 10) throw T('En az 10 kayıt türü girin.', 'Enter at least 10 record kinds.');
        for (var i = 0; i < kinds.length; i++) if (valid.indexOf(kinds[i]) < 0) throw T('"' + kinds[i] + '" geçerli bir kayıt türü değil.', '"' + kinds[i] + '" is not a valid record kind.');
        return mk(secure, kinds);
      },
      bad: ['', 'valid-small,valid-zero', 'SECURE', 'bogus,bogus,bogus,bogus,bogus,bogus,bogus,bogus,bogus,bogus']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
