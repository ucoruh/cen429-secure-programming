// CEN429 — Week 13 — the six-step process that turns a vague sentence into a testable requirement (docs/
// week-13 Section 1, "Worked example: improving a bad requirement step by step"). Every step removes exactly
// one kind of ambiguity: WHICH data/asset, WHICH threat/goal, WHICH technical criterion, WHICH state and
// obligation word, and finally an id that lets the sentence enter the traceability chain (the previous
// animation). No code panel: this is a course-content process, not a running program.
(function (D) {
  'use strict';
  var T = D.T;

  var STEP_NAMES = [
    T('1. Belirsiz sözcükleri işaretle', '1. Flag the vague words'),
    T('2. Varlık tablosuna bağla', '2. Link it to the asset table'),
    T('3. Koruma hedefini netleştir', '3. Clarify the protection goal'),
    T('4. Ölçülebilir teknik kriter ekle', '4. Add a measurable technical criterion'),
    T('5. Durum ve zorunluluk sözcüğü ekle', '5. Add the state and obligation word'),
    T('6. Kimlik ver, tehdide bağla', '6. Give it an id, link it to the threat')
  ];

  function mk(vague, asset, goal, criterion, state, id, threat) {
    return { vague: vague, asset: asset, goal: goal, criterion: criterion, state: state, id: id, threat: threat };
  }

  /** Independent reference: the final sentence is just the concatenation of the five filled fields plus the
   * id — computed here directly from the data fields, never by re-running build()'s label-drawing loop. */
  function reference(data) {
    var finalText = data.id + ' — sensitive data (' + data.asset + '), ' + data.state +
      ', must be protected with ' + data.criterion + ' (goal: ' + data.goal + ').';
    return { steps: 6, finalText: finalText, hasId: data.id.length > 0, hasThreat: data.threat.length > 0 };
  }

  function build(S, data) {
    var W = 620;
    S.box('before', { x: 0, y: 0, w: W, h: 40, size: 13, text: data.vague, style: 'del' });
    S.label('beforeLbl', { x: -14, y: 25, text: T('Önce:', 'Before:'), anchor: 'end', size: 13, bold: true });
    for (var s = 0; s < STEP_NAMES.length; s++) {
      S.box('s' + s, { x: 0, y: 60 + s * 26, w: 320, h: 22, size: 11, text: STEP_NAMES[s], style: 'dim' });
    }
    S.step(T('Belirsiz bir cümleyle başlıyoruz: "' + data.vague + '" — hiçbir kelimesi ölçülemez.',
              'We start from a vague sentence: "' + data.vague + '" — none of its words are measurable.'), {});

    S.at(0);
    S.set('s0', { style: 'new' });
    S.label('note0', { x: 340, y: 60 + 15, text: T('hangi VERİ? hangi ölçüde "korumak"?', 'which DATA? what does "protect" even mean?'), anchor: 'start', size: 12 });
    S.step(T('Adım 1: belirsiz sözcükleri işaretle — "veri" ve "korumak" test edilemez.', 'Step 1: flag the vague words — "data" and "protect" cannot be tested.'), {});

    S.at(1);
    S.set('s1', { style: 'new' });
    S.label('note1', { x: 340, y: 60 + 26 + 15, text: T('varlık tablosu -> "' + data.asset + '"', 'asset table -> "' + data.asset + '"'), anchor: 'start', size: 12 });
    S.step(T('Adım 2: "veri" tek bir şey değil — varlık tablosunda "' + data.asset + '" satırına indirgiyoruz.',
              'Step 2: "data" is not one thing — we narrow it to the "' + data.asset + '" row in the asset table.'), {});

    S.at(2);
    S.set('s2', { style: 'new' });
    S.label('note2', { x: 340, y: 60 + 52 + 15, text: T('tehdit modeli -> hedef: ' + data.goal, 'threat model -> goal: ' + data.goal), anchor: 'start', size: 12 });
    S.step(T('Adım 3: tehdit modeli hangi hedefi gerektiriyor? -> ' + data.goal + '.', 'Step 3: which goal does the threat model call for? -> ' + data.goal + '.'), {});

    S.at(3);
    S.set('s3', { style: 'new' });
    S.label('note3', { x: 340, y: 60 + 78 + 15, text: T('teknik kriter -> ' + data.criterion, 'technical criterion -> ' + data.criterion), anchor: 'start', size: 12 });
    S.step(T('Adım 4: ölçülebilir teknik kriter -> "' + data.criterion + '".', 'Step 4: a measurable technical criterion -> "' + data.criterion + '".'), {});

    S.at(4);
    S.set('s4', { style: 'new' });
    S.label('note4', { x: 340, y: 60 + 104 + 15, text: T('durum: ' + data.state + ', zorunluluk: MUST', 'state: ' + data.state + ', obligation: MUST'), anchor: 'start', size: 12 });
    S.step(T('Adım 5: durumu (' + data.state + ') ve zorunluluk sözcüğünü (MUST) ekle.', 'Step 5: add the state (' + data.state + ') and the obligation word (MUST).'), {});

    S.at(5);
    S.set('s5', { style: 'new' });
    S.label('note5', { x: 340, y: 60 + 130 + 15, text: T('kimlik: ' + data.id + ', tehdit: ' + data.threat, 'id: ' + data.id + ', threat: ' + data.threat), anchor: 'start', size: 12 });
    S.step(T('Adım 6: bir kimlik ver (' + data.id + ') ve tehdide bağla (' + data.threat + ') — artık izlenebilirlik zincirine girebilir.',
              'Step 6: give it an id (' + data.id + ') and link it to the threat (' + data.threat + ') — now it can enter the traceability chain.'), {});

    S.at(null);
    var result = reference(data);
    var afterY = 60 + STEP_NAMES.length * 26 + 30;
    var shortFinal = result.finalText.length > 78 ? result.finalText.slice(0, 75) + '...' : result.finalText;
    S.box('after', { x: 0, y: afterY, w: W, h: 40, size: 12, mono: true, text: shortFinal, style: 'new' });
    S.label('afterLbl', { x: -14, y: afterY + 25, text: T('Sonra:', 'After:'), anchor: 'end', size: 13, bold: true });
    S.result = result;
    S.step(T('Altı adımın her biri bir belirsizliği giderdi: "' + result.finalText + '" — herhangi biri eksikse gereksinim tartışmaya açık kalır.',
              'Each of the six steps removed one ambiguity: "' + result.finalText + '" — if any one is missing, the requirement stays open to debate.'), {});
  }

  D.define({
    id: 'requirement-lifecycle',
    title: T('Bir gereksinimin yaşamı: belirsiz cümleden test edilebilir gereksinime', 'A requirement\'s life: from a vague sentence to a testable requirement'),
    minSize: 6,
    presets: [
      { id: 'normal-data-protection', level: 'normal',
        name: T('Normal: "veriyi koru" -> CEN429-DR-01', 'Normal: "protect user data" -> CEN429-DR-01'),
        data: mk('The application must protect user data.', 'sensitive fields in the local database (class C)',
                 'confidentiality + integrity', 'authenticated encryption (AEAD)',
                 'at rest', 'CEN429-DR-01', 'T-03') },
      { id: 'hard-login-speed', level: 'hard',
        name: T('Zor: iki gereksinim bir cümlede — "hızlı ve güvenli"', 'Hard: two requirements in one sentence — "fast and secure"'),
        data: mk('The application must be fast and secure.', 'the authentication flow',
                 'cannot be bypassed', 'server-side validation on every attempt',
                 'on every login attempt', 'CEN429-ID-04', 'client-side-check bypass') },
      { id: 'edge-minimal', level: 'edge', small: true,
        name: T('Uç durum: tek sözcüklük belirsizlik — "güvenli olmalı"', 'Edge case: a one-word vagueness — "should be secure"'),
        data: mk('The module should be secure.', 'the update package', 'integrity',
                 'a detached Ed25519 signature', 'in transit', 'CEN429-AP-07', 'unsigned-update-tamper') },
      { id: 'edge-key-erasure', level: 'edge',
        name: T('Uç durum: "anahtar temizlenmeli" -> CEN429-CR-03', 'Edge case: "keys must be cleaned up" -> CEN429-CR-03'),
        data: mk('Keys must be cleaned up properly.', 'the vault-file key', 'confidentiality',
                 'zeroization immediately after use', 'in use', 'CEN429-CR-03', 'T-01') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return STEP_NAMES.length; },
    random: function (level, r) {
      var pool = [
        mk('The system must handle data properly.', 'session tokens', 'confidentiality', 'AEAD encryption', 'at rest', 'CEN429-DR-02', 'T-04'),
        mk('The backend must be reachable securely.', 'the transport channel', 'confidentiality + integrity', 'TLS 1.3 with certificate pinning', 'in transit', 'CEN429-DT-03', 'T-06'),
        mk('Logs should not leak anything sensitive.', 'application log records', 'confidentiality', 'redaction of secret fields before logging', 'in use', 'CEN429-RP-01', 'T-08'),
        mk('The build should be trustworthy.', 'the release binary', 'integrity', 'a signed SBOM and a reproducible build', 'in transit', 'CEN429-DV-04', 'T-09'),
        mk('Randomness must be good enough.', 'session key material', 'confidentiality', 'a CSPRNG seeded from the OS entropy source', 'in use', 'CEN429-CR-04', 'T-02'),
        mk('The app should resist tampering.', 'the runtime integrity check', 'integrity', 'a startup hash compared against a build-time value', 'in use', 'CEN429-AP-04', 'T-05')
      ];
      var idx = D.randInt(r, 0, pool.length - 1);
      return pool[idx];
    },
    input: {
      hint: T('VAGUE|ASSET|GOAL|CRITERION|STATE|ID|THREAT', 'VAGUE|ASSET|GOAL|CRITERION|STATE|ID|THREAT'),
      format: function (data) { return [data.vague, data.asset, data.goal, data.criterion, data.state, data.id, data.threat].join('|'); },
      tokens: function () { return STEP_NAMES.slice(); },
      parse: function (text) {
        var f = String(text).split('|');
        if (f.length !== 7) throw T('Tam olarak 7 alan gerekir (VAGUE|ASSET|GOAL|CRITERION|STATE|ID|THREAT).', 'Exactly 7 fields are required (VAGUE|ASSET|GOAL|CRITERION|STATE|ID|THREAT).');
        if (!f[0].trim()) throw T('İlk alan (belirsiz cümle) boş olamaz.', 'The first field (the vague sentence) cannot be empty.');
        if (!f[5].trim()) throw T('ID alanı boş olamaz.', 'The ID field cannot be empty.');
        return mk(f[0], f[1], f[2], f[3], f[4], f[5], f[6]);
      },
      bad: ['', 'only|two', '|asset|goal|crit|state|id|threat', 'vague|asset|goal|crit|state||threat']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
