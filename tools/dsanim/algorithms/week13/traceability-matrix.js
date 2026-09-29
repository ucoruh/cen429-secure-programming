// CEN429 — Week 13 — Demo 1 (code/week-13/01-compliance-matrix/compliance_matrix.c: process_line())
// Each requirement row carries a five-link chain: Requirement -> Design -> Code -> Test -> Evidence. The C
// program only ever LOOKS at two of those links (STATUS and the EVIDENCE text) but that is exactly the
// evaluator's shortcut: a chain with a requirement, a design section and a test id but NO evidence text is a
// GAP, and process_line() catches precisely that gap the same way an evaluator's eye would.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  // compliance_matrix.c lines 70-100 (the body of process_line()), byte-identical.
  var C = [
    '    char *field[MAX_FIELDS];',
    '    int n = split_fields(line, \'|\', field, MAX_FIELDS);',
    '    if (n < 3) return 0;                 /* malformed row -> skip */',
    '    char *id = field[0], *status = field[1], *evidence = (n >= 4) ? field[3] : (char *) "";',
    '    trim(id); trim(status); trim(evidence);',
    '',
    '    int finding = 0;',
    '    if (strcmp(status, "met") == 0) {',
    '        (*count_met)++;',
    '        if (evidence[0] == \'\\0\') {',
    '            printf("  [FINDING] %-14s \'met\' but EVIDENCE is empty -> counted as not met\\n", id);',
    '            finding = 1;',
    '        } else {',
    '            printf("  [OK]      %-14s met         (evidence: %s)\\n", id, evidence);',
    '        }',
    '    } else if (strcmp(status, "delegated") == 0) {',
    '        (*count_delegated)++;',
    '        if (evidence[0] == \'\\0\') {',
    '            printf("  [FINDING] %-14s \'delegated\' but who/why/how is missing\\n", id);',
    '            finding = 1;',
    '        } else {',
    '            printf("  [OK]      %-14s delegated   (%s)\\n", id, evidence);',
    '        }',
    '    } else if (strcmp(status, "not-met") == 0) {',
    '        (*count_not_met)++;',
    '        printf("  [RISK]    %-14s not-met -> must be recorded as residual risk (%s)\\n", id, evidence);',
    '    } else {',
    '        printf("  [FINDING] %-14s unknown status \'%s\'\\n", id, status);',
    '        return 1;',
    '    }',
    '    return finding;'
  ];
  // 1-based panel positions of the lines above that are worth naming here (kept in sync by hand with C[]):
  var L = { n3: 2, ifN3: 3, evidenceExpr: 4, ifMet: 8, metCnt: 9, ifMetEv: 10, metFind: 11, metFlag: 12,
            metElse: 13, metOk: 14, elifDel: 16, delCnt: 17, ifDelEv: 18, delFind: 19, delFlag: 20,
            delElse: 21, delOk: 22, elifNotMet: 24, notMetCnt: 25, notMetPrint: 26, elseUnknown: 27,
            unknownPrint: 28, unknownReturn: 29, ret: 31 };

  function mkRow(id, status, section, design, code, test, evidence) {
    return { id: id, status: status, section: section, design: design, code: code, test: test, evidence: evidence };
  }
  function mk(rows) { return { rows: rows.slice() }; }

  /** Independent reference: reconstructs the '|'-joined line text and classifies it with a fresh regex/switch
   * based reading of the rule (never calling the field-splitting loop build() below uses). */
  function reference(data) {
    var findings = 0, gaps = [];
    var verdicts = data.rows.map(function (row, idx) {
      var hasEvidence = !!(row.evidence && row.evidence.length);
      var verdict;
      switch (row.status) {
        case 'met': verdict = hasEvidence ? 'ok' : 'finding'; break;
        case 'delegated': verdict = hasEvidence ? 'ok' : 'finding'; break;
        case 'not-met': verdict = 'risk'; break;
        default: verdict = 'finding';
      }
      if (verdict === 'finding') { findings++; gaps.push(idx); }
      return verdict;
    });
    return { verdicts: verdicts, findings: findings, gaps: gaps };
  }

  /** Same classification, written as an independent left-to-right scan (not the switch reference() uses),
   * mirroring process_line()'s own if / else-if / else-if / else chain for the narration below. */
  function classifyForBuild(row) {
    var hasEvidence = !!(row.evidence && row.evidence.length);
    if (row.status === 'met') return { branch: 'met', verdict: hasEvidence ? 'ok' : 'finding' };
    if (row.status === 'delegated') return { branch: 'delegated', verdict: hasEvidence ? 'ok' : 'finding' };
    if (row.status === 'not-met') return { branch: 'not-met', verdict: 'risk' };
    return { branch: 'unknown', verdict: 'finding' };
  }

  var COLW = [110, 70, 90, 90, 150];
  var COLX = [0, COLW[0] + 8, COLW[0] + COLW[1] + 16, COLW[0] + COLW[1] + COLW[2] + 24, COLW[0] + COLW[1] + COLW[2] + COLW[3] + 32];
  var LABELS = [T('Gereksinim', 'Requirement'), T('Tasarım', 'Design'), T('Kod', 'Code'), T('Test', 'Test'), T('Kanıt', 'Evidence')];

  function build(S, data) {
    var H = 34, GAP = 10;
    for (var c = 0; c < 5; c++) {
      S.label('col' + c, { x: COLX[c] + COLW[c] / 2, y: -20, text: LABELS[c], anchor: 'middle', bold: true, size: 13 });
    }
    var rows = data.rows;
    for (var i = 0; i < rows.length; i++) {
      var y = i * (H + GAP);
      var r = rows[i];
      S.box('req' + i, { x: COLX[0], y: y, w: COLW[0], h: H, size: 11, mono: true, text: r.id, style: 'normal' });
      S.box('des' + i, { x: COLX[1], y: y, w: COLW[1], h: H, size: 11, mono: true, text: r.section, style: 'normal' });
      S.box('cod' + i, { x: COLX[2], y: y, w: COLW[2], h: H, size: 11, mono: true, text: r.code, style: 'normal' });
      S.box('tst' + i, { x: COLX[3], y: y, w: COLW[3], h: H, size: 11, mono: true, text: r.test, style: 'normal' });
      var hasEv = !!(r.evidence && r.evidence.length);
      S.box('evd' + i, { x: COLX[4], y: y, w: COLW[4], h: H, size: 11, mono: true,
        text: hasEv ? r.evidence : T('(kanıt yok)', '(no evidence)'), style: hasEv ? 'normal' : 'empty' });
      S.arrow('a1-' + i, { kind: 'center', from: 'req' + i, to: 'des' + i, head: true });
      S.arrow('a2-' + i, { kind: 'center', from: 'des' + i, to: 'cod' + i, head: true });
      S.arrow('a3-' + i, { kind: 'center', from: 'cod' + i, to: 'tst' + i, head: true });
      S.arrow('a4-' + i, { kind: 'center', from: 'tst' + i, to: 'evd' + i, head: true });
    }
    S.step(T('Her satır beş halkalı bir zincir: gereksinim -> tasarım -> kod -> test -> kanıt. Zayıf halka son ikisidir.',
              'Each row is a five-link chain: requirement -> design -> code -> test -> evidence. The last two links are the weak ones.'), {});

    var detailCount = Math.min(4, rows.length);
    var findings = 0, gapRows = [];
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      var cls = classifyForBuild(row);
      var isFinding = cls.verdict === 'finding';
      if (isFinding) { findings++; gapRows.push(i); }
      S.at(i);
      var evStyle = cls.verdict === 'ok' ? 'new' : (cls.verdict === 'finding' ? 'del' : 'dim');
      S.set('evd' + i, { style: evStyle });
      S.set('req' + i, { style: isFinding ? 'hl' : 'normal' });
      if (isFinding) {
        S.label('gap' + i, { x: COLX[4] + COLW[4] + 14, y: i * (H + GAP) + H / 2 + 4, text: T('BOŞLUK', 'GAP'), anchor: 'start', size: 12, bold: true });
      }

      if (i < detailCount) {
        if (row.status === 'met') {
          S.step(T('`' + row.id + '`: STATUS = "met". Sıradaki soru: kanıt sütunu dolu mu?', '`' + row.id + '`: STATUS = "met". Next question: is the evidence column filled?'),
                 { c: [1, 2, { n: L.ifN3, note: T('n < 3? hayır', 'n < 3? no') }, { n: L.evidenceExpr, note: T('n >= 4? evet', 'n >= 4? yes') }, 5, 6, 7,
                        { n: L.ifMet, note: T('status == "met"? evet', 'status == "met"? yes') }, L.metCnt] });
          if (cls.verdict === 'ok') {
            S.step(T('Kanıt var -> zincir tam, boşluk yok. [OK]', 'Evidence is present -> the chain is complete, no gap. [OK]'),
                   { c: [{ n: L.ifMetEv, note: T('evidence[0] == \'\\0\'? hayır', 'evidence[0] == \'\\0\'? no') }, { n: L.metFind, skip: true }, { n: L.metFlag, skip: true }, L.metElse, L.metOk, L.ret] });
          } else {
            S.step(T('Kanıt sütunu BOŞ -> zincir "test"te kopuyor: gereksinim ve tasarım var ama kanıt yok. [FINDING]',
                      'The evidence column is EMPTY -> the chain breaks at "evidence": the requirement and design exist, but there is no evidence. [FINDING]'),
                   { c: [{ n: L.ifMetEv, note: T('evidence[0] == \'\\0\'? evet', 'evidence[0] == \'\\0\'? yes') }, L.metFind, L.metFlag, { n: L.metElse, skip: true }, { n: L.metOk, skip: true }, L.ret] });
          }
        } else if (row.status === 'delegated') {
          S.step(T('`' + row.id + '`: STATUS = "delegated". "met" değil, "delegated" de değil mi? -> ikinci dal.',
                    '`' + row.id + '`: STATUS = "delegated". Not "met" -> the second branch.'),
                 { c: [1, 2, { n: L.ifN3, note: T('n < 3? hayır', 'n < 3? no') }, { n: L.evidenceExpr, note: T('n >= 4? evet', 'n >= 4? yes') }, 5, 6, 7,
                        { n: L.ifMet, note: T('status == "met"? hayır', 'status == "met"? no') }, { n: L.metCnt, skip: true }, { n: L.ifMetEv, skip: true },
                        { n: L.metFind, skip: true }, { n: L.metFlag, skip: true }, { n: L.metElse, skip: true }, { n: L.metOk, skip: true },
                        { n: L.elifDel, note: T('status == "delegated"? evet', 'status == "delegated"? yes') }, L.delCnt] });
          if (cls.verdict === 'ok') {
            S.step(T('Kanıt var (kimin/neden/nasıl yazılmış) -> zincir tam. [OK]', 'Evidence is present (who/why/how is written down) -> the chain is complete. [OK]'),
                   { c: [{ n: L.ifDelEv, note: T('evidence[0] == \'\\0\'? hayır', 'evidence[0] == \'\\0\'? no') }, { n: L.delFind, skip: true }, { n: L.delFlag, skip: true }, L.delElse, L.delOk, L.ret] });
          } else {
            S.step(T('Kanıt BOŞ -> sessiz devir: kime/neden/nasıl devredildiği yazılmamış. [FINDING]', 'Evidence is EMPTY -> a silent hand-off: who/why/how was never written down. [FINDING]'),
                   { c: [{ n: L.ifDelEv, note: T('evidence[0] == \'\\0\'? evet', 'evidence[0] == \'\\0\'? yes') }, L.delFind, L.delFlag, { n: L.delElse, skip: true }, { n: L.delOk, skip: true }, L.ret] });
          }
        } else if (row.status === 'not-met') {
          S.step(T('`' + row.id + '`: STATUS = "not-met" -> dürüstçe kaydedilmiş bir kalan risk, boşluk değil.',
                    '`' + row.id + '`: STATUS = "not-met" -> an honestly recorded residual risk, not a gap.'),
                 { c: [1, 2, { n: L.ifN3, note: T('n < 3? hayır', 'n < 3? no') }, { n: L.evidenceExpr, note: T('n >= 4? evet', 'n >= 4? yes') }, 5, 6, 7,
                        { n: L.ifMet, note: T('status == "met"? hayır', 'status == "met"? no') }, { n: L.metCnt, skip: true }, { n: L.ifMetEv, skip: true },
                        { n: L.metFind, skip: true }, { n: L.metFlag, skip: true }, { n: L.metElse, skip: true }, { n: L.metOk, skip: true },
                        { n: L.elifDel, note: T('status == "delegated"? hayır', 'status == "delegated"? no') }, { n: L.delCnt, skip: true }, { n: L.ifDelEv, skip: true },
                        { n: L.delFind, skip: true }, { n: L.delFlag, skip: true }, { n: L.delElse, skip: true }, { n: L.delOk, skip: true },
                        { n: L.elifNotMet, note: T('status == "not-met"? evet', 'status == "not-met"? yes') }, L.notMetCnt, L.notMetPrint, L.ret] });
        } else {
          S.step(T('`' + row.id + '`: STATUS = "' + row.status + '" -> bilinen üç sözcükten biri değil. Zincirin ilk halkası bile geçersiz. [FINDING]',
                    '`' + row.id + '`: STATUS = "' + row.status + '" -> not one of the three known words. Even the first link of the chain is invalid. [FINDING]'),
                 { c: [1, 2, { n: L.ifN3, note: T('n < 3? hayır', 'n < 3? no') }, { n: L.evidenceExpr, note: T('n >= 4? evet', 'n >= 4? yes') }, 5, 6, 7,
                        { n: L.ifMet, note: T('status == "met"? hayır', 'status == "met"? no') }, { n: L.metCnt, skip: true }, { n: L.ifMetEv, skip: true },
                        { n: L.metFind, skip: true }, { n: L.metFlag, skip: true }, { n: L.metElse, skip: true }, { n: L.metOk, skip: true },
                        { n: L.elifDel, note: T('status == "delegated"? hayır', 'status == "delegated"? no') }, { n: L.delCnt, skip: true }, { n: L.ifDelEv, skip: true },
                        { n: L.delFind, skip: true }, { n: L.delFlag, skip: true }, { n: L.delElse, skip: true }, { n: L.delOk, skip: true },
                        { n: L.elifNotMet, note: T('status == "not-met"? hayır', 'status == "not-met"? no') }, { n: L.notMetCnt, skip: true }, { n: L.notMetPrint, skip: true },
                        L.elseUnknown, L.unknownPrint, L.unknownReturn] });
        }
      } else {
        var shortNote = cls.verdict === 'ok' ? T('[OK]', '[OK]') : (cls.verdict === 'finding' ? T('[FINDING] boşluk', '[FINDING] gap') : T('[RISK] kalan risk', '[RISK] residual risk'));
        S.step(T('`' + row.id + '` (' + row.status + ') -> ' + shortNote.tr, '`' + row.id + '` (' + row.status + ') -> ' + shortNote.en),
               { c: [{ n: L.ifMet, note: T('status karşılaştırmaları', 'status comparisons') }] });
      }
    }
    S.at(null);
    S.result = reference(data);
    S.step(T('Uyum matrisi taraması bitti: ' + rows.length + ' satırdan ' + findings + ' tanesi BOŞLUK (bulgu).',
              'Compliance matrix scan done: ' + findings + ' of ' + rows.length + ' rows are a GAP (finding).'), { c: [L.ret] });
  }

  D.define({
    id: 'traceability-matrix',
    title: T('İzlenebilirlik zinciri: gereksinim → tasarım → kod → test → kanıt (compliance_matrix.c)',
              'Traceability chain: requirement → design → code → test → evidence (compliance_matrix.c)'),
    code: { c: C },
    presets: [
      { id: 'normal-mostly-ok', level: 'normal',
        name: T('Normal: çoğu satır kanıtlı, bir tanesi boşluklu', 'Normal: most rows have evidence, one has a gap'),
        data: mk([
          mkRow('CEN429-DR-01', 'met', 'S8', 'session.md#DR-01', 'session.c:88', 'T-05', 'T-05 test output'),
          mkRow('CEN429-CR-02', 'met', 'S8', 'crypto.md#CR-02', 'crypto.c:140', 'T-06', ''),
          mkRow('CEN429-DT-03', 'met', 'S11', 'transport.md#DT-03', 'tls_client.c:52', 'T-11', 'T-11 test'),
          mkRow('CEN429-AP-04', 'delegated', 'S14', 'update.md#AP-04', 'updater.c:20', 'T-14', 'MPA provides signed updates'),
          mkRow('CEN429-AS-05', 'not-met', 'S12', 'attest.md#AS-05', '-', '-', 'residual risk: rooted device'),
          mkRow('CEN429-DR-06', 'met', 'S8', 'session.md#DR-06', 'session.c:104', 'T-07', 'T-07 test output'),
          mkRow('CEN429-CR-07', 'delegated', 'S8', 'crypto.md#CR-07', 'crypto.c:200', 'T-08', 'OS keystore documented'),
          mkRow('CEN429-DT-08', 'met', 'S11', 'transport.md#DT-08', 'tls_client.c:70', 'T-12', 'T-12 test output'),
          mkRow('CEN429-AP-09', 'not-met', 'S14', 'update.md#AP-09', '-', '-', 'residual risk: legacy channel'),
          mkRow('CEN429-DU-10', 'met', 'S9', 'ui.md#DU-10', 'ui.c:33', 'T-09', 'T-09 test output')
        ]) },
      { id: 'hard-several-gaps', level: 'hard',
        name: T('Zor: birden çok boşluk ve bilinmeyen bir durum', 'Hard: several gaps and one unknown status'),
        data: mk([
          mkRow('CEN429-DR-01', 'met', 'S8', 'session.md#DR-01', 'session.c:88', 'T-05', ''),
          mkRow('CEN429-CR-02', 'delegated', 'S8', 'crypto.md#CR-02', 'crypto.c:140', 'T-06', ''),
          mkRow('CEN429-DT-03', 'met', 'S11', 'transport.md#DT-03', 'tls_client.c:52', 'T-11', 'T-11 test'),
          mkRow('CEN429-AP-04', 'reviewing', 'S14', 'update.md#AP-04', 'updater.c:20', 'T-14', 'note'),
          mkRow('CEN429-AS-05', 'not-met', 'S12', 'attest.md#AS-05', '-', '-', 'residual risk: rooted device'),
          mkRow('CEN429-DR-06', 'met', 'S8', 'session.md#DR-06', 'session.c:104', 'T-07', ''),
          mkRow('CEN429-CR-07', 'delegated', 'S8', 'crypto.md#CR-07', 'crypto.c:200', 'T-08', 'OS keystore documented'),
          mkRow('CEN429-DT-08', 'met', 'S11', 'transport.md#DT-08', 'tls_client.c:70', 'T-12', 'T-12 test output'),
          mkRow('CEN429-AP-09', 'not-met', 'S14', 'update.md#AP-09', '-', '-', 'residual risk: legacy channel'),
          mkRow('CEN429-DU-10', 'met', 'S9', 'ui.md#DU-10', 'ui.c:33', 'T-09', ''),
          mkRow('CEN429-DU-11', 'delegated', 'S9', 'ui.md#DU-11', 'ui.c:40', 'T-10', ''),
          mkRow('CEN429-AS-12', 'met', 'S12', 'attest.md#AS-12', 'attest.c:15', 'T-15', 'T-15 test output')
        ]) },
      { id: 'edge-all-gaps', level: 'edge',
        name: T('Uç durum: her satır boşluklu, hiçbiri OK değil', 'Edge case: every row has a gap, none are OK'),
        data: mk([
          mkRow('CEN429-DR-01', 'met', 'S8', 'session.md#DR-01', 'session.c:88', 'T-05', ''),
          mkRow('CEN429-CR-02', 'met', 'S8', 'crypto.md#CR-02', 'crypto.c:140', 'T-06', ''),
          mkRow('CEN429-DT-03', 'delegated', 'S11', 'transport.md#DT-03', 'tls_client.c:52', 'T-11', ''),
          mkRow('CEN429-AP-04', 'delegated', 'S14', 'update.md#AP-04', 'updater.c:20', 'T-14', ''),
          mkRow('CEN429-AS-05', 'met', 'S12', 'attest.md#AS-05', 'attest.c:15', 'T-15', ''),
          mkRow('CEN429-DR-06', 'delegated', 'S8', 'session.md#DR-06', 'session.c:104', 'T-07', ''),
          mkRow('CEN429-CR-07', 'met', 'S8', 'crypto.md#CR-07', 'crypto.c:200', 'T-08', ''),
          mkRow('CEN429-DT-08', 'delegated', 'S11', 'transport.md#DT-08', 'tls_client.c:70', 'T-12', ''),
          mkRow('CEN429-AP-09', 'met', 'S14', 'update.md#AP-09', 'updater.c:44', 'T-13', ''),
          mkRow('CEN429-DU-10', 'delegated', 'S9', 'ui.md#DU-10', 'ui.c:33', 'T-09', ''),
          mkRow('CEN429-DU-11', 'unknown', 'S9', 'ui.md#DU-11', 'ui.c:40', 'T-10', 'note')
        ]) },
      { id: 'edge-single-row', level: 'edge', small: true,
        name: T('Uç durum: tek satır, tek boşluk', 'Edge case: a single row, a single gap'),
        data: mk([mkRow('CEN429-CR-02', 'met', 'S8', 'crypto.md#CR-02', 'crypto.c:140', 'T-06', '')]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.rows.length; },
    random: function (level, r) {
      var families = ['DR', 'CR', 'DT', 'AP', 'AS', 'DU'];
      var statuses = ['met', 'delegated', 'not-met'];
      var n = level === 'easy' ? 10 : (level === 'normal' ? D.randInt(r, 10, 11) : (level === 'hard' ? D.randInt(r, 11, 13) : D.randInt(r, 12, 15)));
      var rows = [];
      for (var i = 0; i < n; i++) {
        var fam = families[D.randInt(r, 0, families.length - 1)];
        var num = String(D.randInt(r, 1, 99));
        var id = 'CEN429-' + fam + '-' + (num.length < 2 ? '0' + num : num);
        var status = statuses[D.randInt(r, 0, statuses.length - 1)];
        var gapChance = level === 'extreme' ? 2 : (level === 'hard' ? 1 : 3);
        var hasEvidence = status === 'not-met' ? true : (D.randInt(r, 0, gapChance) !== 0);
        var evidence = status === 'not-met' ? 'residual risk: noted' : (hasEvidence ? 'T-' + D.randInt(r, 1, 99) + ' test output' : '');
        rows.push(mkRow(id, status, 'S' + D.randInt(r, 1, 16), fam.toLowerCase() + '.md#' + id, fam.toLowerCase() + '.c:' + D.randInt(r, 1, 400), 'T-' + D.randInt(r, 1, 99), evidence));
      }
      return mk(rows);
    },
    input: {
      hint: T('ID|STATUS|SECTION|TASARIM|KOD|TEST|KANIT; …', 'ID|STATUS|SECTION|DESIGN|CODE|TEST|EVIDENCE; …'),
      format: function (data) {
        return data.rows.map(function (r) {
          return [r.id, r.status, r.section, r.design, r.code, r.test, r.evidence].join('|');
        }).join('; ');
      },
      tokens: function (data) { return data.rows.map(function (r) { return r.id; }); },
      parse: function (text) {
        var parts = String(text).split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!parts.length) throw T('En az bir satır girin.', 'Enter at least one row.');
        var rows = [];
        parts.forEach(function (p) {
          var f = p.split('|');
          if (f.length !== 7) throw T('"' + p + '" tam olarak 7 alan içermeli (ID|STATUS|SECTION|TASARIM|KOD|TEST|KANIT).',
                                       '"' + p + '" must have exactly 7 fields (ID|STATUS|SECTION|DESIGN|CODE|TEST|EVIDENCE).');
          var status = f[1];
          if (['met', 'delegated', 'not-met', 'unknown', 'reviewing'].indexOf(status) < 0) {
            throw T('"' + status + '" bilinen bir durum değil.', '"' + status + '" is not a known status.');
          }
          rows.push(mkRow(f[0], status, f[2], f[3], f[4], f[5], f[6]));
        });
        return mk(rows);
      },
      bad: ['', 'no-pipes-here', 'ID|badstatus|S8|d|c|t|ev', 'ID|met|only|three|fields']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
