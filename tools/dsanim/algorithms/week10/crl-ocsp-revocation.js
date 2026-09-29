// CEN429 — Week 10 — Demo 10 (code/week-10/10-revocation/revocation.py)
// Two ways to ask "is this certificate still good?": OCSP asks the CA LIVE, right now, about ONE
// serial number, and always answers with current knowledge. A CRL is a signed SNAPSHOT the CA
// publishes periodically; a client checks a serial against an already-downloaded CRL, but must also
// check whether that CRL's own nextUpdate has passed — a STALE CRL is not proof that a certificate is
// still good, it just means nobody has checked recently.
(function (D) {
  'use strict';
  var T = D.T;

  var PY = [
    '    def ocsp_query(self, serial):',                                     // 1
    '        if serial not in self.issued:',                                  // 2
    '            return "unknown"',                                           // 3
    '        if serial in self.revoked:',                                     // 4
    '            return "revoked"',                                           // 5
    '        return "good"',                                                  // 6
    'def crl_check(serial, crl, at_time):',                                    // 7
    '    if at_time > crl["next_update"]:',                                    // 8
    '        return "stale"',                                                 // 9
    '    return "revoked" if serial in crl["revoked"] else "good"'            // 10
  ];

  function mk(scenario) { return { scenario: scenario }; }

  function reference(data) {
    var issued = data.scenario !== 'unknown';
    var revoked = data.scenario === 'revoked' || data.scenario === 'stale';
    var ocsp = !issued ? 'unknown' : (revoked ? 'revoked' : 'good');
    var stale = data.scenario === 'stale';
    var crl = stale ? 'stale' : (revoked ? 'revoked' : 'good');
    return { ocsp: ocsp, crl: crl };
  }

  function build(S, data) {
    var issued = data.scenario !== 'unknown';
    var revoked = data.scenario === 'revoked' || data.scenario === 'stale';
    var stale = data.scenario === 'stale';

    S.box('cert', { x: 0, y: 0, w: 160, h: 34, size: 12, text: T('sertifika, seri #4711', 'certificate, serial #4711'), style: issued ? (revoked ? 'del' : 'new') : 'empty' });
    S.label('state', { x: 180, y: 20, text: !issued ? T('hiç yayımlanmadı', 'never issued') : (revoked ? T('YAYIMLANDI, İPTAL EDİLDİ', 'ISSUED, REVOKED') : T('yayımlandı, iptal edilmedi', 'issued, not revoked')), anchor: 'start', size: 12, bold: true });
    S.step(T('CA durumu: ' + (!issued ? 'seri #4711 hiç yayımlanmadı.' : (revoked ? 'seri #4711 yayımlandı VE iptal edildi.' : 'seri #4711 yayımlandı, iptal EDİLMEDİ.')),
              'CA state: ' + (!issued ? 'serial #4711 was never issued.' : (revoked ? 'serial #4711 was issued AND revoked.' : 'serial #4711 was issued, NOT revoked.'))),
           { py: [] });

    // ---- OCSP: live, single-serial ------------------------------------------------------------------
    S.label('ocspTitle', { x: -14, y: 60, text: 'OCSP:', anchor: 'end', size: 13, bold: true });
    var ocspLines;
    var ocspResult;
    if (!issued) {
      ocspResult = 'unknown';
      ocspLines = [1, { n: 2, note: T('yayımlanmamış mı? EVET', 'not issued? YES') }, 3];
    } else if (revoked) {
      ocspResult = 'revoked';
      ocspLines = [1, { n: 2, note: T('yayımlanmamış mı? HAYIR', 'not issued? NO') }, { n: 3, skip: true },
                    { n: 4, note: T('iptal listesinde mi? EVET', 'in revoked list? YES') }, 5];
    } else {
      ocspResult = 'good';
      ocspLines = [1, { n: 2, note: T('yayımlanmamış mı? HAYIR', 'not issued? NO') }, { n: 3, skip: true },
                    { n: 4, note: T('iptal listesinde mi? HAYIR', 'in revoked list? NO') }, { n: 5, skip: true }, 6];
    }
    S.label('ocspResult', { x: 0, y: 70, text: 'ocsp_query(#4711) = "' + ocspResult + '"', anchor: 'start', size: 13, mono: true, style: ocspResult === 'revoked' ? 'del' : (ocspResult === 'good' ? 'new' : 'dim') });
    S.step(T('`ocsp_query(4711)` — CANLI sorgu, şu anki bilgiye göre sonuç: "' + ocspResult + '".',
              '`ocsp_query(4711)` — a LIVE query, answered with current knowledge: "' + ocspResult + '".'), { py: ocspLines });

    // ---- CRL: a downloaded snapshot, checked for staleness first ------------------------------------
    S.label('crlTitle', { x: -14, y: 110, text: 'CRL:', anchor: 'end', size: 13, bold: true });
    var crlLines, crlResult;
    if (stale) {
      crlResult = 'stale';
      crlLines = [7, { n: 8, note: T('CRL süresi dolmuş mu? EVET', 'CRL past nextUpdate? YES') }, 9];
    } else if (revoked) {
      crlResult = 'revoked';
      crlLines = [7, { n: 8, note: T('CRL süresi dolmuş mu? HAYIR', 'CRL past nextUpdate? NO') }, { n: 9, skip: true }, 10];
    } else {
      crlResult = 'good';
      crlLines = [7, { n: 8, note: T('CRL süresi dolmuş mu? HAYIR', 'CRL past nextUpdate? NO') }, { n: 9, skip: true }, 10];
    }
    S.label('crlResult', { x: 0, y: 120, text: 'crl_check(#4711) = "' + crlResult + '"', anchor: 'start', size: 13, mono: true, style: crlResult === 'revoked' ? 'del' : (crlResult === 'good' ? 'new' : 'dim') });
    S.result = reference(data);
    S.step(stale
      ? T('`crl_check(4711, crl, at_time)` — CRL\'in `nextUpdate`\'i GEÇMİŞ: "stale" (iptal listesine HİÇ bakılmadı).',
          '`crl_check(4711, crl, at_time)` — the CRL\'s `nextUpdate` has PASSED: "stale" (the revoked list is never even consulted).')
      : T('`crl_check(4711, crl, at_time)` — CRL hâlâ taze, sonuç: "' + crlResult + '".',
          '`crl_check(4711, crl, at_time)` — the CRL is still fresh, result: "' + crlResult + '".'), { py: crlLines });
  }

  D.define({
    id: 'crl-ocsp-revocation',
    title: T('İptal denetimi: CRL ve OCSP (revocation.py)', 'Revocation checking: CRL and OCSP (revocation.py)'),
    code: function () { return { py: PY }; },
    minSize: 4,
    presets: [
      { id: 'normal-good', level: 'normal', name: T('Uyar: sertifika iyi, iptal edilmemiş', 'Fits: the certificate is good, not revoked'), data: mk('good') },
      { id: 'hard-revoked', level: 'hard', name: T('Zor: sertifika iptal edilmiş', 'Hard: the certificate is revoked'), data: mk('revoked') },
      { id: 'edge-unknown', level: 'edge', name: T('Uç durum: seri numarası hiç yayımlanmadı', 'Edge case: the serial number was never issued'), data: mk('unknown') },
      { id: 'edge-stale', level: 'edge', name: T('Uç durum: CRL bayat — iptal görülmüyor', 'Edge case: the CRL is stale — the revocation is not seen'), data: mk('stale') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 4; },
    random: function (level, r) {
      var pools = { easy: ['good', 'good', 'revoked'], normal: ['good', 'revoked', 'unknown'], hard: ['revoked', 'unknown', 'stale'], extreme: ['unknown', 'stale', 'revoked'] };
      var pool = pools[level] || pools.normal;
      return mk(pool[D.randInt(r, 0, pool.length - 1)]);
    },
    input: {
      hint: T('senaryo (good/revoked/unknown/stale)', 'scenario (good/revoked/unknown/stale)'),
      format: function (data) { return data.scenario; },
      parse: function (text) {
        var s = String(text).trim().toLowerCase();
        var valid = ['good', 'revoked', 'unknown', 'stale'];
        if (valid.indexOf(s) < 0) throw T('Senaryo good, revoked, unknown ya da stale olmalı.', 'Scenario must be good, revoked, unknown, or stale.');
        return mk(s);
      },
      bad: ['', 'maybe', 'GOODISH', 'revoked-cert', 'unknown!']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
