// CEN429 — Week 13 — Demo 2 (code/week-13/02-requirement-quality/requirement_quality.c: check_requirement())
// A requirement sentence is WEAK for one of two independent reasons: it uses a VAGUE phrase ("should be
// secure", "properly", ...) that no two reviewers would verify the same way, or it has NO MEASURABLE BASIS
// (no number, no concrete technical term such as AES/TLS/RELRO). Either reason alone is enough; both checks
// run every time, and the printed reason tells you which one fired.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  // requirement_quality.c lines 42-52 (the body of check_requirement()), byte-identical.
  var C = [
    '    char low[512];',
    '    to_lower(requirement, low, sizeof low);',
    '    int vague = contains_any(low, VAGUE_PHRASES);',
    '    int measurable = has_digit(low) || contains_any(low, CONCRETE_TERMS);',
    '    int weak = vague || !measurable;',
    '    printf("  [%s] %s\\n", weak ? "WEAK" : " OK ", requirement);',
    '    if (weak) {',
    '        if (vague) printf("        reason: vague phrase (not verifiable). Rewrite it as measurable/testable.\\n");',
    '        else       printf("        reason: no measurable basis (add a number or a concrete technical term).\\n");',
    '    }',
    '    return weak;'
  ];

  // Same two word lists as requirement_quality.c (VAGUE_PHRASES / CONCRETE_TERMS), copied for the reference
  // computation only — build() below re-checks each sentence with its own independent loop, not by calling
  // this list through a shared classify() helper both would trust blindly.
  var VAGUE = ['should be secure', 'well managed', 'should be good', 'properly', 'sufficiently',
               'as required', 'as much as possible', 'should be robust'];
  var CONCRETE = ['aes', 'gcm', 'sha-256', 'sha256', 'relro', 'pie', 'bit', '128', '256',
                  'tls 1.3', 'hmac', 'pbkdf2', 'ed25519', 'static analysis', 'checksec'];

  function mk(sentences) { return { sentences: sentences.slice() }; }

  function hasDigitRef(low) { return /[0-9]/.test(low); }

  /** Independent reference: Array.some() over the two word lists, never the for-loop build() below uses. */
  function reference(data) {
    var verdicts = data.sentences.map(function (s) {
      var low = s.toLowerCase();
      var vague = VAGUE.some(function (w) { return low.indexOf(w) >= 0; });
      var measurable = hasDigitRef(low) || CONCRETE.some(function (w) { return low.indexOf(w) >= 0; });
      return vague || !measurable;
    });
    var weakCount = verdicts.reduce(function (a, b) { return a + (b ? 1 : 0); }, 0);
    return { verdicts: verdicts, weakCount: weakCount };
  }

  /** Same rule, written with plain for-loops (mirrors the C source's contains_any()/has_digit() loops)
   * instead of reference()'s Array.some() — an independently written check, not a shared helper. */
  function classifyForBuild(sentence) {
    var low = sentence.toLowerCase();
    var vague = false;
    for (var i = 0; i < VAGUE.length; i++) if (low.indexOf(VAGUE[i]) >= 0) { vague = true; break; }
    var hasDigit = false;
    for (var k = 0; k < low.length; k++) if (low.charAt(k) >= '0' && low.charAt(k) <= '9') { hasDigit = true; break; }
    var concrete = false;
    for (var j = 0; j < CONCRETE.length; j++) if (low.indexOf(CONCRETE[j]) >= 0) { concrete = true; break; }
    var measurable = hasDigit || concrete;
    return { vague: vague, measurable: measurable, weak: vague || !measurable };
  }

  function build(S, data) {
    var W = 560, H = 30, GAP = 10;
    S.label('title', { x: W / 2, y: -22,
      text: T('Her cümle iki bağımsız kuraldan geçer: belirsiz ifade mi? ölçülebilir mi?',
              'Every sentence passes two independent rules: vague phrase? measurable?'),
      anchor: 'middle', bold: true, size: 14 });
    var rowY = [];
    for (var i = 0; i < data.sentences.length; i++) {
      rowY.push(i * (H + GAP));
      S.box('r' + i, { x: 0, y: rowY[i], w: W, h: H, size: 12, mono: true, text: data.sentences[i], style: 'normal' });
    }

    var detailCount = Math.min(3, data.sentences.length);
    var weakCount = 0;
    for (i = 0; i < data.sentences.length; i++) {
      S.at(i);
      var v = classifyForBuild(data.sentences[i]);
      if (v.weak) weakCount++;
      S.set('r' + i, { style: v.weak ? 'del' : 'new' });
      S.label('v' + i, { x: W + 16, y: rowY[i] + H / 2 + 5, text: v.weak ? T('ZAYIF', 'WEAK') : T('İYİ', 'OK'), anchor: 'start', size: 13, bold: true });

      if (i < detailCount) {
        // Full walk-through for the first few sentences: show the ternary print decision, the outer
        // "if (weak)" test, and — only when it is actually entered — the inner "vague?" test.
        var weakNote = v.weak ? T('weak? doğru -> "WEAK" yazdırılır', 'weak? true -> prints "WEAK"')
                               : T('weak? yanlış -> " OK " yazdırılır', 'weak? false -> prints " OK "');
        S.step(T('`' + data.sentences[i] + '` -> belirsiz=' + (v.vague ? 'evet' : 'hayır') + ', ölçülebilir=' + (v.measurable ? 'evet' : 'hayır') + '.',
                  '`' + data.sentences[i] + '` -> vague=' + (v.vague ? 'yes' : 'no') + ', measurable=' + (v.measurable ? 'yes' : 'no') + '.'),
               { c: [1, 2, 3, 4, 5, { n: 6, note: weakNote }] });
        if (v.weak) {
          if (v.vague) {
            S.step(T('`if (weak)` doğru; `if (vague)` de doğru -> "belirsiz ifade" nedeni yazdırılır.',
                      '`if (weak)` is true; `if (vague)` is also true -> the "vague phrase" reason is printed.'),
                   { c: [{ n: 7, note: T('weak? evet', 'weak? yes') }, { n: 8, note: T('vague? evet', 'vague? yes') }, { n: 9, skip: true }, 11] });
          } else {
            S.step(T('`if (weak)` doğru ama `if (vague)` yanlış -> "ölçülebilir dayanak yok" nedeni yazdırılır (else dalı).',
                      '`if (weak)` is true but `if (vague)` is false -> the "no measurable basis" reason is printed (the else branch).'),
                   { c: [{ n: 7, note: T('weak? evet', 'weak? yes') }, { n: 8, note: T('vague? hayır', 'vague? no') }, 9, 11] });
          }
        } else {
          S.step(T('`if (weak)` yanlış: iç blok (8-9. satırlar) hiç çalışmaz, hiçbir neden yazdırılmaz.',
                    '`if (weak)` is false: the inner block (lines 8-9) never runs, no reason is printed.'),
                 { c: [{ n: 7, note: T('weak? hayır', 'weak? no') }, { n: 8, skip: true }, { n: 9, skip: true }, 11] });
        }
      } else {
        // Later sentences: one compact step, still noting the two decisions that actually fired.
        var short = v.weak
          ? (v.vague ? T('ZAYIF (belirsiz ifade).', 'WEAK (vague phrase).') : T('ZAYIF (ölçülebilir dayanak yok).', 'WEAK (no measurable basis).'))
          : T('İYİ (belirsiz değil, ölçülebilir).', 'OK (not vague, measurable).');
        S.step(T('`' + data.sentences[i] + '` -> ' + short.tr, '`' + data.sentences[i] + '` -> ' + short.en),
               { c: [{ n: 6, note: v.weak ? T('weak? doğru', 'weak? true') : T('weak? yanlış', 'weak? false') },
                      { n: 7, note: v.weak ? T('weak? evet', 'weak? yes') : T('weak? hayır', 'weak? no') }] });
      }
    }
    S.at(null);
    S.result = reference(data);
    S.step(T('Özet: ' + weakCount + '/' + data.sentences.length + ' gereksinim ZAYIF. Zayıf bir gereksinim test edilemez.',
              'Summary: ' + weakCount + '/' + data.sentences.length + ' requirements are WEAK. A weak requirement cannot be tested.'), {});
  }

  D.define({
    id: 'requirement-quality-checker',
    title: T('Gereksinim kalitesi denetleyicisi (requirement_quality.c)', 'Requirement quality checker (requirement_quality.c)'),
    code: { c: C },
    presets: [
      { id: 'normal-mixed', level: 'normal',
        name: T('Normal: karışık — bazıları belirsiz, bazıları ölçülebilir', 'Normal: a mix — some vague, some measurable'),
        data: mk(['The application should be secure.', 'Keys should be well managed.',
                  'The release build must use a stack protector, PIE and full RELRO.',
                  'Every Class C asset at rest must use at least 128-bit AES-GCM.',
                  'Data should be stored properly.', 'Sessions must expire after 15 minutes of inactivity.',
                  'The API should respond sufficiently fast.', 'Passwords must be hashed with a modern algorithm.',
                  'Logs must be retained for at least 90 days.', 'The team should do this as required.']) },
      { id: 'hard-all-vague', level: 'hard',
        name: T('Zor: on ikisi de belirsiz ifade içeriyor', 'Hard: all twelve contain a vague phrase'),
        data: mk(['The system should be secure at all times.', 'Access should be well managed by the admin.',
                  'The UI should be good enough for users.', 'Backups must be handled properly.',
                  'The service must respond sufficiently quickly.', 'Configuration must be set as required by policy.',
                  'The design should be as much as possible resilient.', 'The module should be robust.',
                  'Keys should be well managed across environments.', 'The report should look properly formatted.',
                  'The pipeline must run sufficiently often.', 'The team should behave as required.']) },
      { id: 'edge-all-ok', level: 'edge',
        name: T('Uç durum: on biri de ölçülebilir, hiçbiri ZAYIF değil', 'Edge case: all eleven are measurable, none WEAK'),
        data: mk(['Keys must be at least 256 bits.', 'The digest must use SHA-256.', 'The channel must use TLS 1.3.',
                  'Passwords must be derived with PBKDF2.', 'Signing keys must use Ed25519.',
                  'The build must pass a static analysis scan.', 'The binary must pass checksec with PIE set.',
                  'The cipher must be AES-GCM with a 128-bit key.', 'The HMAC must cover the full payload.',
                  'The build must be reproducible within 256 bytes.', 'The session token must be at least 128 bits.']) },
      { id: 'edge-single-weak', level: 'edge', small: true,
        name: T('Uç durum: tek cümle, tek kural tetikleniyor', 'Edge case: a single sentence, a single rule fires'),
        data: mk(['The interface must look clean and modern.']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.sentences.length; },
    random: function (level, r) {
      var vaguePool = ['should be secure', 'should be well managed', 'should be good', 'handled properly',
                        'done sufficiently well', 'set as required', 'as much as possible resilient', 'should be robust'];
      var concretePool = ['must use AES-GCM with a 128-bit key', 'must use SHA-256', 'must use TLS 1.3',
                           'must use HMAC with PBKDF2', 'must use Ed25519 signatures', 'must pass a static analysis scan',
                           'must pass checksec with PIE and RELRO', 'must expire after 30 minutes',
                           'must retain 90 days of logs', 'must use a 256-bit key'];
      var subjects = ['The application', 'The service', 'The module', 'The interface', 'The pipeline',
                       'The backup job', 'The API', 'The session store', 'The report generator', 'The key store',
                       'The audit log', 'The update channel', 'The mobile client', 'The admin console'];
      var n = level === 'easy' ? 10 : (level === 'normal' ? D.randInt(r, 10, 11) : (level === 'hard' ? D.randInt(r, 11, 13) : D.randInt(r, 12, 15)));
      var out = [];
      for (var i = 0; i < n; i++) {
        var subject = subjects[D.randInt(r, 0, subjects.length - 1)];
        var wantVague = level === 'hard' ? true : (level === 'extreme' ? (D.randInt(r, 0, 1) === 0) : (D.randInt(r, 0, 2) === 0));
        var phrase = wantVague ? vaguePool[D.randInt(r, 0, vaguePool.length - 1)] : concretePool[D.randInt(r, 0, concretePool.length - 1)];
        out.push(subject + ' ' + phrase + '.');
      }
      return mk(out);
    },
    input: {
      hint: T('cümle 1 | cümle 2 | …', 'sentence 1 | sentence 2 | …'),
      format: function (data) { return data.sentences.join(' | '); },
      tokens: function (data) { return data.sentences.slice(); },
      parse: function (text) {
        var parts = String(text).split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!parts.length) throw T('En az bir cümle girin.', 'Enter at least one sentence.');
        parts.forEach(function (p) {
          if (p.length > 200) throw T('Bir cümle 200 karakterden uzun olamaz.', 'A sentence cannot be longer than 200 characters.');
        });
        return mk(parts);
      },
      bad: ['', '   ', '|||', 'x'.repeat(201)]
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
