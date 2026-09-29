// CEN429 — Week 13 — the requirement-block pattern (docs/week-13 Section 3) and what changes when a
// requirement is DELEGATED (handed to the parent application, the OS, or hardware) instead of met directly.
// Every guide section opens with blocks shaped "[Family] Id — Status", then Requirement / Compliance /
// Verification / Evidence. A delegated block still needs a Compliance-shaped answer — but it answers three
// different questions: TO WHOM, WHY, and HOW the other party meets it. Skipping any of the three is a silent
// hand-off, which an evaluator reads as a finding, not as a deferral. No code panel: a guide-writing pattern,
// not a running program.
(function (D) {
  'use strict';
  var T = D.T;

  function mkMet(id, family, requirement, compliance, verification, evidence) {
    return { kind: 'met', id: id, family: family, requirement: requirement, whoWhyHow: ['', '', ''],
             compliance: compliance, verification: verification, evidence: evidence, residualRisk: '' };
  }
  function mkDelegated(id, family, requirement, whom, why, how) {
    return { kind: 'delegated', id: id, family: family, requirement: requirement, whoWhyHow: [whom, why, how],
             compliance: '', verification: '', evidence: '', residualRisk: '' };
  }
  function mkNotMet(id, family, requirement, residualRisk) {
    return { kind: 'not-met', id: id, family: family, requirement: requirement, whoWhyHow: ['', '', ''],
             compliance: '', verification: '', evidence: '', residualRisk: residualRisk };
  }

  /** Independent reference: a block is VALID when every field its own kind requires is non-empty — read
   * straight off the data fields, never by re-running build()'s field-by-field drawing loop. */
  function reference(data) {
    var valid;
    if (data.kind === 'met') {
      valid = !!(data.compliance && data.verification && data.evidence);
    } else if (data.kind === 'delegated') {
      valid = data.whoWhyHow.every(function (x) { return !!x; });
    } else {
      valid = !!data.residualRisk;
    }
    return { kind: data.kind, valid: valid };
  }

  /** The scene draws box text on a single line (no wrapping); the real block fields are full sentences, so
   * the ON-SCREEN box shows a short, truncated form while the step caption underneath (built from the full
   * data field, never from this truncated string) carries the complete text. */
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 3) + '...' : s; }

  function build(S, data) {
    var W = 560;
    S.box('header', { x: 0, y: 0, w: W, h: 34, size: 13, mono: true,
      text: '[' + data.family + '] ' + data.id + ' — ' + data.kind.toUpperCase(), style: 'hl' });
    S.step(T('Her blok aynı başlıkla açılır: `[Aile] Kimlik — Durum`. Değerlendiricinin gözü önce buraya gider.',
              'Every block opens with the same header: `[Family] Id — Status`. The evaluator\'s eye goes here first.'), {});

    S.at(null);
    S.box('req', { x: 0, y: 50, w: W, h: 44, size: 12, text: truncate(data.requirement, 72), style: 'normal' });
    S.label('reqLbl', { x: -14, y: 72, text: T('Gereksinim:', 'Requirement:'), anchor: 'end', size: 12, bold: true });
    S.step(T('"Gereksinim" satırı standarttan/tehdit modelinden geldiği gibi kopyalanır — yeniden yorumlanmaz: "' + data.requirement + '"',
              'The "Requirement" line is copied as-is from the standard/threat model — never reinterpreted: "' + data.requirement + '"'), {});

    var y = 110;
    if (data.kind === 'met') {
      S.box('compliance', { x: 0, y: y, w: W, h: 56, size: 11, text: truncate(data.compliance, 90), style: 'new' });
      S.label('compLbl', { x: -14, y: y + 28, text: T('Uygunluk:', 'Compliance:'), anchor: 'end', size: 12, bold: true });
      S.step(T('"Uygunluk" bu ürünün gereksinimi NASIL karşıladığını, somut dosya/bölüm adlarıyla anlatır: "' + data.compliance + '"',
                'The "Compliance" paragraph describes HOW this product meets it, with concrete file/section names: "' + data.compliance + '"'), {});
      y += 76;
      S.box('verify', { x: 0, y: y, w: W, h: 40, size: 11, text: truncate(data.verification, 82), style: 'new' });
      S.label('verLbl', { x: -14, y: y + 20, text: T('Doğrulama:', 'Verification:'), anchor: 'end', size: 12, bold: true });
      S.step(T('"Doğrulama" satırı test yöntemini adlandırır: "' + data.verification + '"',
                'The "Verification" line names the test method: "' + data.verification + '"'), {});
      y += 60;
      S.box('evidence', { x: 0, y: y, w: W, h: 30, size: 11, mono: true, text: truncate(data.evidence, 60), style: 'new' });
      S.label('evLbl', { x: -14, y: y + 15, text: T('Kanıt:', 'Evidence:'), anchor: 'end', size: 12, bold: true });
      S.step(T('"Kanıt" zincirin son halkasıdır — bulunabilir, adlandırılmış bir referans: "' + data.evidence + '"',
                'The "Evidence" is the chain\'s last link — a findable, named reference: "' + data.evidence + '"'), {});
      y += 50;
    } else if (data.kind === 'delegated') {
      var qLabels = [T('Kime?', 'To whom?'), T('Neden?', 'Why?'), T('Nasıl?', 'How?')];
      for (var i = 0; i < 3; i++) {
        var filled = !!data.whoWhyHow[i];
        S.box('q' + i, { x: 0, y: y, w: W, h: 30, size: 11, text: filled ? truncate(data.whoWhyHow[i], 78) : T('(yazılmamış)', '(not written)'), style: filled ? 'new' : 'del' });
        S.label('qLbl' + i, { x: -14, y: y + 15, text: qLabels[i], anchor: 'end', size: 12, bold: true });
        S.step(filled
          ? T(qLabels[i].tr + ' "' + data.whoWhyHow[i] + '" — cevaplandı.', qLabels[i].en + ' "' + data.whoWhyHow[i] + '" — answered.')
          : T(qLabels[i].tr + ' YAZILMAMIŞ — bu sessiz bir devirdir, değerlendirici bulgu yazar.',
              qLabels[i].en + ' NOT WRITTEN — this is a silent hand-off, the evaluator writes a finding.'), {});
        y += 40;
      }
      y += 10;
    } else {
      S.box('risk', { x: 0, y: y, w: W, h: 56, size: 11, text: data.residualRisk ? truncate(data.residualRisk, 90) : T('(kalan risk yazılmamış)', '(no residual risk written)'), style: data.residualRisk ? 'del' : 'empty' });
      S.label('riskLbl', { x: -14, y: y + 28, text: T('Kalan risk:', 'Residual risk:'), anchor: 'end', size: 12, bold: true });
      S.step(data.residualRisk
        ? T('"Karşılanmadı" durumunda "Uygunluk" yerine "Kalan risk" alanı doldurulur — dürüstçe kaydedilir: "' + data.residualRisk + '"',
            'In the "not met" state, the "Residual risk" field is filled instead of "Compliance" — honestly recorded: "' + data.residualRisk + '"')
        : T('Kalan risk BOŞ bırakılmış — satırı matristen silmekten bile daha kötü: değerlendirici bunu kendi bulur.',
            'The residual risk is left EMPTY — worse than removing the row from the matrix: the evaluator finds it themselves.'), {});
      y += 76;
    }

    S.at(null);
    var result = reference(data);
    S.label('verdict', { x: 0, y: y + 20, text: result.valid ? T('Blok TAM.', 'Block COMPLETE.') : T('Blok EKSİK -> BULGU.', 'Block INCOMPLETE -> FINDING.'),
      anchor: 'start', size: 14, bold: true });
    S.result = result;
    S.step(result.valid
      ? T('Blok tam: her alan dolduruldu, değerlendirici gereksinimden kanıta tek bakışta gidebilir.',
          'The block is complete: every field is filled, the evaluator can go from requirement to evidence in one glance.')
      : T('Blok eksik: en az bir zorunlu alan boş kaldı -> bu bir bulgudur.',
          'The block is incomplete: at least one required field is empty -> this is a finding.'), {});
  }

  D.define({
    id: 'requirement-block-deferral',
    title: T('Gereksinim bloğu kalıbı ve devredilen (ertelenen) bir gereksinim', 'The requirement-block pattern and a delegated (deferred) requirement'),
    minSize: 4,
    presets: [
      { id: 'normal-met', level: 'normal',
        name: T('Normal: CEN429-DR-01 — Karşılandı bloğu', 'Normal: the CEN429-DR-01 "Met" block'),
        data: mkMet('CEN429-DR-01', 'CEN429-DR',
          'Class-C sensitive data at rest must be protected with authenticated encryption (AEAD).',
          'The local vault file is encrypted with AES-256-GCM (S7.2 "Vault file encryption"); the key is derived from the device secure-storage unit and never stored as plaintext outside memory.',
          'Unit test test_integrity.c: changing one byte of the encrypted file and decrypting it is rejected.',
          'CI run #482, evidence/week13/test_integrity_ci482.log') },
      { id: 'hard-delegated-complete', level: 'hard',
        name: T('Zor: CEN429-AP-07 — tam doldurulmuş devir bloğu', 'Hard: the CEN429-AP-07 "Delegated" block, fully filled in'),
        data: mkDelegated('CEN429-AP-07', 'CEN429-AP',
          'The application must be installed and updated securely.',
          'the parent application\'s developer',
          'the library has no API-level access to installation or the file system',
          'official app-store signature verification, or a signed update channel (Week 6 scheme)') },
      { id: 'edge-silent-handoff', level: 'edge', small: true,
        name: T('Uç durum: sessiz devir — "neden" yazılmamış', 'Edge case: a silent hand-off — "why" was never written'),
        data: mkDelegated('CEN429-AP-08', 'CEN429-AP',
          'Application isolation from other apps must be provided.', 'the operating system', '', 'sandboxing') },
      { id: 'edge-not-met', level: 'edge',
        name: T('Uç durum: CEN429-DT-04 — Karşılanmadı, kalan risk yazılı', 'Edge case: CEN429-DT-04 "Not met", residual risk recorded'),
        data: mkNotMet('CEN429-DT-04', 'CEN429-DT', 'The server certificate must be pinned.',
          'if an attacker obtains a fraudulent certificate from a trusted root CA, MITM may become possible (S16.4); pinning is planned for v1.1 (task #217).') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 4; },
    random: function (level, r) {
      var mets = [
        mkMet('CEN429-DR-02', 'CEN429-DR', 'Data must be securely erased once no longer needed.',
          'crypto_wipe() overwrites the session key buffer with zeros immediately after use.',
          'Memory-dump analysis confirms no residual key bytes.', 'CI run #501, evidence/week13/wipe_ci501.log'),
        mkMet('CEN429-DT-01', 'CEN429-DT', 'Transport must use at least TLS 1.2 with certificate validation.',
          'The client rejects any handshake with an invalid or self-signed certificate (tls_client.c).',
          'A test server with a self-signed certificate is rejected.', 'CI run #339, evidence/week13/tls_ci339.log')
      ];
      var delegateds = [
        mkDelegated('CEN429-ID-05', 'CEN429-ID', 'The device must be bound to the account.', 'the operating system',
          'the app has no access to hardware attestation APIs below the minimum supported OS version', 'OS-level device-binding API, minimum version 12'),
        mkDelegated('CEN429-AS-04', 'CEN429-AS', 'Hardware-backed key storage must be used where available.', 'the secure element',
          'the application only calls the platform key-store API, it cannot implement hardware protection itself', 'Android Keystore / iOS Secure Enclave')
      ];
      var notMets = [
        mkNotMet('CEN429-AS-06', 'CEN429-AS', 'A hardware secure element must protect the signing key.',
          'no supported device in this release has a secure element; a software-only mitigation is planned for v1.2.'),
        mkNotMet('CEN429-DU-03', 'CEN429-DU', 'Clipboard contents must be cleared after a sensitive paste.',
          'the OS clipboard API does not expose a clear function on the minimum supported version; tracked as a known gap.')
      ];
      var silent = [
        mkDelegated('CEN429-AP-09', 'CEN429-AP', 'Rollback to a vulnerable version must be rejected.', '', '', ''),
        mkDelegated('CEN429-CR-05', 'CEN429-CR', 'Key material must be protected against physical extraction.', 'hardware', '', '')
      ];
      var pool = level === 'easy' ? mets : (level === 'normal' ? mets.concat(delegateds) : (level === 'hard' ? delegateds.concat(notMets) : delegateds.concat(notMets, silent)));
      return pool[D.randInt(r, 0, pool.length - 1)];
    },
    input: {
      hint: T('kind|id|family|requirement|f1|f2|f3', 'kind|id|family|requirement|f1|f2|f3'),
      format: function (data) {
        if (data.kind === 'met') return ['met', data.id, data.family, data.requirement, data.compliance, data.verification, data.evidence].join('|');
        if (data.kind === 'delegated') return ['delegated', data.id, data.family, data.requirement].concat(data.whoWhyHow).join('|');
        return ['not-met', data.id, data.family, data.requirement, data.residualRisk].join('|');
      },
      tokens: function (data) { return [data.id]; },
      parse: function (text) {
        var f = String(text).split('|');
        if (f.length < 4) throw T('En az kind|id|family|requirement gerekir.', 'At least kind|id|family|requirement is required.');
        var kind = f[0];
        if (kind === 'met') {
          if (f.length !== 7) throw T('"met" için tam olarak 7 alan gerekir.', '"met" needs exactly 7 fields.');
          return mkMet(f[1], f[2], f[3], f[4], f[5], f[6]);
        }
        if (kind === 'delegated') {
          if (f.length !== 7) throw T('"delegated" için tam olarak 7 alan gerekir.', '"delegated" needs exactly 7 fields.');
          return mkDelegated(f[1], f[2], f[3], f[4], f[5], f[6]);
        }
        if (kind === 'not-met') {
          if (f.length !== 5) throw T('"not-met" için tam olarak 5 alan gerekir.', '"not-met" needs exactly 5 fields.');
          return mkNotMet(f[1], f[2], f[3], f[4]);
        }
        throw T('İlk alan "met", "delegated" ya da "not-met" olmalı.', 'The first field must be "met", "delegated" or "not-met".');
      },
      bad: ['', 'unknown|id|fam|req', 'met|id|fam|req|only-four', 'delegated|id|fam|req|who|why']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
