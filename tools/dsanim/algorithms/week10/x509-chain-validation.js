// CEN429 — Week 10 — Demo 1 (code/week-10/01-pki-chain/demo.sh)
// `openssl verify` answers four questions about a certificate chain, in order: does a path of valid
// SIGNATURES reach a TRUSTED root, is every certificate on that path still within its VALIDITY
// window, could every issuer on the path actually sign certificates (basicConstraints CA:TRUE), and
// — as a separate, application-level step — does the leaf's name match what was asked for? The shell
// script drives the real `openssl` CLI; this panel's second tab shows the logical algorithm (RFC 5280
// path validation) those commands are checking.
(function (D) {
  'use strict';
  var T = D.T;

  var SH = [
    'openssl verify -CAfile root.crt server.crt',                                        // 1
    'openssl verify -CAfile root.crt -untrusted intermediate.crt server.crt',             // 2
    'openssl verify -attime $FUTURE -CAfile root.crt -untrusted intermediate.crt server.crt', // 3
    'openssl verify -CAfile rogue-root.crt -untrusted intermediate.crt server.crt',       // 4
    'openssl verify -CAfile root.crt -untrusted intermediate.crt -untrusted server.crt other.crt', // 5
    'openssl verify -verify_hostname example.test -CAfile root.crt -untrusted intermediate.crt server.crt' // 6
  ];
  var PSEUDO = [
    'function verify_chain(leaf, chain, trust_roots, at_time, hostname):',        // 1
    '    path = build_path(leaf, chain)',                                          // 2
    '    if path is None:',                                                       // 3
    '        return REJECT "no path to a trust anchor"',                          // 4
    '    for cert in path:',                                                      // 5
    '        if at_time < cert.not_before or at_time > cert.not_after:',          // 6
    '            return REJECT "expired or not yet valid"',                       // 7
    '        if cert is not leaf and not cert.basicConstraints.CA:',              // 8
    '            return REJECT "issuer is not a CA"',                             // 9
    '    if path[-1].issuer not in trust_roots:',                                 // 10
    '        return REJECT "untrusted root"',                                     // 11
    '    if hostname and hostname not in leaf.subjectAltName:',                   // 12
    '        return REJECT "hostname mismatch"',                                  // 13
    '    return ACCEPT'                                                           // 14
  ];

  function mk(scenario) { return { scenario: scenario }; }

  function reference(data) {
    switch (data.scenario) {
      case 'missing-intermediate': return { accepted: false, reason: 'no-path' };
      case 'expired': return { accepted: false, reason: 'expired' };
      case 'ca-false-issuer': return { accepted: false, reason: 'not-ca' };
      case 'wrong-ca': return { accepted: false, reason: 'untrusted-root' };
      case 'wrong-hostname': return { accepted: false, reason: 'hostname' };
      default: return { accepted: true, reason: 'ok' };
    }
  }

  function build(S, data) {
    // ---- draw the chain: root -> intermediate -> server -------------------------------------------
    var hasIntermediate = data.scenario !== 'missing-intermediate';
    S.box('root', { x: 0, y: 0, w: 140, h: 40, size: 12, text: T('kök CA (güvenilir)', 'root CA (trusted)'), style: 'new' });
    if (data.scenario === 'wrong-ca') S.set('root', { style: 'del', text: T('YANLIŞ kök (güvensiz)', 'WRONG root (untrusted)') });
    if (hasIntermediate) {
      S.box('inter', { x: 180, y: 0, w: 160, h: 40, size: 12, text: data.scenario === 'ca-false-issuer' ? T('ara (CA:FALSE!)', 'intermediate (CA:FALSE!)') : T('ara CA', 'intermediate CA'),
        style: data.scenario === 'ca-false-issuer' ? 'del' : 'active' });
      S.arrow('a1', { from: 'inter', to: 'root', kind: 'center', text: T('imzalar', 'signs') });
    }
    S.box('leaf', { x: hasIntermediate ? 380 : 180, y: 0, w: 150, h: 40, size: 12, text: T('sunucu (example.test)', 'server (example.test)'), style: 'hl' });
    if (hasIntermediate) S.arrow('a2', { from: 'leaf', to: 'inter', kind: 'center', text: T('imzalar', 'signs') });
    S.step(T('Zincir: kök' + (hasIntermediate ? ' -> ara -> ' : ' -> ') + 'sunucu' + (hasIntermediate ? '.' : ' (ARA SERTİFİKA EKSİK).'),
              'Chain: root' + (hasIntermediate ? ' -> intermediate -> ' : ' -> ') + 'server' + (hasIntermediate ? '.' : ' (INTERMEDIATE IS MISSING).')),
           { sh: [], pseudo: [1] });

    // ---- 1) path to a trust anchor ------------------------------------------------------------------
    var pathOk = hasIntermediate;
    S.step(pathOk
      ? T('`build_path` — sunucudan köke kadar bir imza yolu bulundu.', '`build_path` — a signature path from the server up to the root is found.')
      : T('`build_path` — ara sertifika olmadan yol köke ULAŞAMIYOR.', '`build_path` — without the intermediate, the path does NOT reach the root.'),
      { sh: pathOk ? [2] : [1],
        pseudo: pathOk
          ? [2, { n: 3, note: T('yol bulunamadı mı? HAYIR', 'path is None? NO') }, { n: 4, skip: true }]
          : [2, { n: 3, note: T('yol bulunamadı mı? EVET', 'path is None? YES') }, 4] });
    if (!pathOk) { S.result = reference(data); return; }

    // ---- 2) validity dates ---------------------------------------------------------------------------
    var expired = data.scenario === 'expired';
    S.step(expired
      ? T('`-attime` — kontrol tarihinde sunucu sertifikası SÜRESİ DOLMUŞ.', '`-attime` — at the check time, the server certificate has EXPIRED.')
      : T('Tarih kontrolü — zincirdeki her sertifika hâlâ geçerlilik süresinde.', 'Date check — every certificate in the chain is still within its validity window.'),
      { sh: expired ? [3] : [], pseudo: (function () {
          var forNote = { n: 5, note: T('yoldaki her sertifika için', 'for every certificate on the path') };
          return expired
            ? [forNote, { n: 6, note: T('süresi dolmuş mu? EVET', 'expired? YES') }, 7]
            : [forNote, { n: 6, note: T('süresi dolmuş mu? HAYIR', 'expired? NO') }, { n: 7, skip: true }];
        })() });
    if (expired) { S.result = reference(data); return; }

    // ---- 3) basicConstraints / CA ---------------------------------------------------------------------
    var caFalse = data.scenario === 'ca-false-issuer';
    S.step(caFalse
      ? T('`basicConstraints` — bir ara imzalayıcı `CA:FALSE`; sertifika İMZALAYAMAZ.', '`basicConstraints` — an intermediate signer has `CA:FALSE`; it may NOT sign certificates.')
      : T('`basicConstraints` — yol üzerindeki her imzalayıcı `CA:TRUE`.', '`basicConstraints` — every signer on the path has `CA:TRUE`.'),
      { sh: caFalse ? [5] : [], pseudo: caFalse
          ? [{ n: 8, note: T('CA değil mi? EVET', 'not a CA? YES') }, 9]
          : [{ n: 8, note: T('CA değil mi? HAYIR', 'not a CA? NO') }, { n: 9, skip: true }] });
    if (caFalse) { S.result = reference(data); return; }

    // ---- 4) trust anchor -------------------------------------------------------------------------------
    var wrongCa = data.scenario === 'wrong-ca';
    S.step(wrongCa
      ? T('Güven çapası — yol GÜVENİLMEYEN bir köke ulaşıyor.', 'Trust anchor — the path reaches an UNTRUSTED root.')
      : T('Güven çapası — yol GÜVENİLEN köke ulaşıyor.', 'Trust anchor — the path reaches a TRUSTED root.'),
      { sh: wrongCa ? [4] : [2], pseudo: wrongCa
          ? [{ n: 10, note: T('güvenilmez kök mü? EVET', 'untrusted root? YES') }, 11]
          : [{ n: 10, note: T('güvenilmez kök mü? HAYIR', 'untrusted root? NO') }, { n: 11, skip: true }] });
    if (wrongCa) { S.result = reference(data); return; }

    // ---- 5) hostname (application-level) ----------------------------------------------------------------
    var wrongHost = data.scenario === 'wrong-hostname';
    S.result = reference(data);
    S.step(wrongHost
      ? T('`-verify_hostname` — istenen ad, SAN listesinde YOK.', '`-verify_hostname` — the requested name is NOT in the SAN list.')
      : T('`-verify_hostname example.test` — SAN eşleşiyor: ZİNCİR KABUL EDİLDİ.', '`-verify_hostname example.test` — the SAN matches: the CHAIN IS ACCEPTED.'),
      { sh: wrongHost ? [6] : [2, 6], pseudo: wrongHost
          ? [{ n: 12, note: T('ad uyuşmuyor mu? EVET', 'hostname mismatch? YES') }, 13]
          : [{ n: 12, note: T('ad uyuşmuyor mu? HAYIR', 'hostname mismatch? NO') }, { n: 13, skip: true }, 14] });
  }

  D.define({
    id: 'x509-chain-validation',
    title: T('X.509 zincir doğrulama: yol kurma (demo.sh)', 'X.509 chain validation: path building (demo.sh)'),
    code: function () { return { sh: SH, pseudo: PSEUDO }; },
    minSize: 4,
    presets: [
      { id: 'normal-complete', level: 'normal', name: T('Uyar: tam zincir, her kontrol geçer', 'Fits: complete chain, every check passes'), data: mk('complete') },
      { id: 'hard-missing', level: 'hard', name: T('Zor: ara sertifika eksik — köke ulaşılamıyor', 'Hard: intermediate missing — cannot reach the root'), data: mk('missing-intermediate') },
      { id: 'edge-expired', level: 'edge', name: T('Uç durum: sertifikanın süresi dolmuş', 'Edge case: the certificate has expired'), data: mk('expired') },
      { id: 'edge-wrongca', level: 'edge', name: T('Uç durum: yanlış (güvenilmeyen) kök', 'Edge case: the wrong (untrusted) root'), data: mk('wrong-ca') },
      { id: 'edge-cafalse', level: 'edge', name: T('Uç durum: imzalayıcı CA değil', 'Edge case: the signer is not a CA'), data: mk('ca-false-issuer') },
      { id: 'edge-hostname', level: 'edge', name: T('Uç durum: istenen ad SAN listesinde yok', 'Edge case: the requested name is not in the SAN list'), data: mk('wrong-hostname') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 4; },
    random: function (level, r) {
      var pools = {
        easy: ['complete', 'complete', 'missing-intermediate'],
        normal: ['complete', 'missing-intermediate', 'expired'],
        hard: ['missing-intermediate', 'expired', 'ca-false-issuer', 'wrong-ca'],
        extreme: ['expired', 'ca-false-issuer', 'wrong-ca', 'wrong-hostname']
      };
      var pool = pools[level] || pools.normal;
      return mk(pool[D.randInt(r, 0, pool.length - 1)]);
    },
    input: {
      hint: T('senaryo (complete/missing-intermediate/expired/wrong-ca/ca-false-issuer/wrong-hostname)',
              'scenario (complete/missing-intermediate/expired/wrong-ca/ca-false-issuer/wrong-hostname)'),
      format: function (data) { return data.scenario; },
      parse: function (text) {
        var s = String(text).trim().toLowerCase();
        var valid = ['complete', 'missing-intermediate', 'expired', 'wrong-ca', 'ca-false-issuer', 'wrong-hostname'];
        if (valid.indexOf(s) < 0) throw T('Senaryo şunlardan biri olmalı: ' + valid.join(', '), 'Scenario must be one of: ' + valid.join(', '));
        return mk(s);
      },
      bad: ['', 'maybe', 'complete-ish', 'MISSING', 'expired-cert']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
