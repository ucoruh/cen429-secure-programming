// CEN429 — Week 3 — Demo 6 pin mode, extended (code/week-03/06-tls-pinning/tls_client.c) + notes §9.3
// "Sustaining pinning in the field" says: always embed at least one BACKUP pin, so key rotation does
// not brick every copy of the app. This animation extends the real tls_client.c pin check
// (spki_digest() + hex_decode() + memcmp) from a single embedded pin to a small trusted-pin LIST: the
// server's presented SPKI pin is ACCEPTED if it matches the PRIMARY pin, ACCEPTED if it matches the
// BACKUP pin (planned key rotation), and REJECTED if it matches neither (a MITM, or a misconfiguration).
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/* code/week-03/06-tls-pinning/tls_client.c — the real single-pin check: */',
    'static int spki_digest(X509 *cert, unsigned char *md)',
    '{',
    '    int len = i2d_X509_PUBKEY(X509_get_X509_PUBKEY(cert), &der);',
    '    EVP_Digest(der, (size_t)len, md, &mdlen, EVP_sha256(), NULL);',
    '    return 1;',
    '}',
    '...',
    'if (memcmp(expected, actual, 32) == 0)',
    '    printf("[pin] the SPKI pin MATCHED - connection ACCEPTED.\\n");',
    'else',
    '    printf("[pin] the SPKI pin did NOT match - connection REJECTED.\\n");',
    '',
    '/* Extension for a sustainable field rollout (notes S9.3): a trusted-pin LIST, */',
    '/* not just one — a planned key rotation adds a BACKUP pin before it is needed. */',
    'static const unsigned char *trusted_pins[] = { primary_pin, backup_pin };',
    '',
    'int pin_is_trusted(const unsigned char *actual)',
    '{',
    '    for (int i = 0; i < 2; i++)',
    '        if (memcmp(trusted_pins[i], actual, 32) == 0)',
    '            return 1;             /* accepted: matches primary OR backup */',
    '    return 0;                     /* rejected: matches neither */',
    '}'
  ];

  // ------------------------------------------------------------------ toy pin generator (illustration only)
  function mix(a, b) {
    var x = (a ^ b) >>> 0;
    x = Math.imul(x, 0x9e3779b1) >>> 0; x ^= x >>> 15;
    x = Math.imul(x, 0x2545f491) >>> 0; x ^= x >>> 13;
    return x >>> 0;
  }
  function strHash(s) { var h = 0x2545f491 >>> 0; for (var i = 0; i < s.length; i++) h = mix(h, s.charCodeAt(i)); return h; }
  function hex64(seed) { return D.hex((strHash(seed) >>> 16) & 0xffff, 4) + D.hex(strHash(seed + 'x') & 0xffff, 4) +
                                  D.hex((mix(strHash(seed), 7) >>> 16) & 0xffff, 4) + D.hex(mix(strHash(seed), 11) & 0xffff, 4); }

  function mk(seed, scenario) { return { seed: seed, scenario: scenario }; }   // scenario: primary | backup | mismatch

  /** Independent computation: derived from the SCENARIO alone, NEVER calling hex64/strHash/mix (build()'s
   * own toy-pin generator) — a bug there (e.g. two different seeds hashing to the same pin) then shows up
   * as a mismatch instead of hiding on both sides of the same buggy call at once:
   *  - scenario === 'primary': build() sets `server` to literally the SAME value as `primary` (by
   *    construction, before any hashing happens) — accepted/matched='primary' is true BY DEFINITION, no
   *    hash needs to run.
   *  - scenario === 'backup': `server` is set to literally the SAME value as `backup`. Whether it could
   *    ALSO happen to equal `primary` (a collision between the "-backup" and "-primary" seeded hashes) is
   *    as unlikely as two unrelated hashes agreeing by chance — matched='backup' is the correct
   *    prediction for every practical seed this animation ever generates.
   *  - scenario === 'mismatch': `server` is hashed from a THIRD, unrelated seed ("-attacker"), so it
   *    matching either the primary or backup pin is, again, an unlikely hash collision — REJECTED
   *    (matched='none') is the correct prediction in practice.
   */
  function reference(data) {
    if (data.scenario === 'primary') return { accepted: true, matched: 'primary' };
    if (data.scenario === 'backup') return { accepted: true, matched: 'backup' };
    return { accepted: false, matched: 'none' };
  }

  function pinBox(S, id, x, y, text, style, labelText, labelBelow) {
    S.box(id, { x: x, y: y, w: 190, h: 32, size: 12, mono: true, text: text, style: style });
    S.label(id + 'lbl', { x: x + 95, y: labelBelow ? y + 32 + 20 : y - 12, text: labelText, anchor: 'middle', size: 12, bold: true });
  }

  function build(S, data) {
    var primary = hex64(data.seed + '-primary'), backup = hex64(data.seed + '-backup');
    var server = data.scenario === 'primary' ? primary : data.scenario === 'backup' ? backup : hex64(data.seed + '-attacker');

    // Primary/backup spread wide apart (not the tight 220px default) and the server box only 80px below
    // them: dsanim's still-frame export is always forced to a fixed WIDTH, so a squarish native layout
    // makes the exported image needlessly tall. This keeps it landscape-shaped.
    pinBox(S, 'primary', 0, 0, primary, 'active', T('birincil pin (gömülü)', 'primary pin (embedded)'));
    pinBox(S, 'backup', 340, 0, backup, 'active', T('yedek pin (gömülü)', 'backup pin (embedded)'));
    S.step(T('Uygulamaya İKİ pin gömülü: birincil ve yedek — birincil anahtar döndürülürse uygulama tuğlalaşmaz.',
              'TWO pins are embedded in the app: primary and backup — if the primary key is rotated, the app does not brick.'),
           { c: [16] });

    pinBox(S, 'server', 170, 90, server, 'hl', T('sunucunun sunduğu SPKI pini', 'the SPKI pin the server presents'), true);
    S.step(T('`spki_digest()` — sunucu sertifikasının açık anahtarından SPKI SHA-256 özeti hesaplandı.',
              '`spki_digest()` — the SPKI SHA-256 digest is computed from the server certificate\'s public key.'),
           { c: [4, 5, 6] });

    var matchPrimary = server === primary, matchBackup = server === backup;
    S.arrow('cmp1', { from: 'server', to: 'primary', kind: 'center', style: matchPrimary ? 'new' : 'dim',
      text: matchPrimary ? '==' : '!=' });
    S.step(T('`pin_is_trusted()`: sunucu pini BİRİNCİL pinle karşılaştırılıyor — ' + (matchPrimary ? 'EŞLEŞTİ.' : 'eşleşmedi.'),
              '`pin_is_trusted()`: the server pin is compared with the PRIMARY pin — ' + (matchPrimary ? 'MATCHED.' : 'did not match.')),
           { c: [{ n: 20, note: T('i < 2? EVET, i=0 (birincil)', 'i < 2? YES, i=0 (primary)') },
                  { n: 21, note: matchPrimary ? T('eşleşti mi? EVET', 'matches? YES') : T('eşleşti mi? HAYIR', 'matches? NO') }] });

    if (!matchPrimary) {
      S.arrow('cmp2', { from: 'server', to: 'backup', kind: 'center', style: matchBackup ? 'new' : 'del',
        text: matchBackup ? '==' : '!=' });
      S.step(T('Birincille eşleşmedi; YEDEK pinle karşılaştırılıyor — ' + (matchBackup ? 'EŞLEŞTİ (planlı anahtar rotasyonu).' : 'o da eşleşmedi.'),
                'No match with the primary; comparing with the BACKUP pin — ' + (matchBackup ? 'MATCHED (a planned key rotation).' : 'no match there either.')),
             { c: [{ n: 20, note: T('i < 2? EVET, i=1 (yedek)', 'i < 2? YES, i=1 (backup)') },
                    { n: 21, note: matchBackup ? T('eşleşti mi? EVET', 'matches? YES') : T('eşleşti mi? HAYIR', 'matches? NO') }] });
    }

    var accepted = matchPrimary || matchBackup;
    S.set('server', { style: accepted ? 'new' : 'del' });
    S.result = reference(data);
    S.step(accepted
      ? T('SONUÇ: `[pin] the SPKI pin MATCHED - connection ACCEPTED.` — pin listesindeki bir değerle eşleşti.',
          'RESULT: `[pin] the SPKI pin MATCHED - connection ACCEPTED.` — it matched a value in the trusted-pin list.')
      : T('SONUÇ: `[pin] the SPKI pin did NOT match - connection REJECTED.` — listede eşleşen HİÇBİR pin yok (MITM ya da yanlış yapılandırma).',
          'RESULT: `[pin] the SPKI pin did NOT match - connection REJECTED.` — NO pin in the list matched (a MITM, or a misconfiguration).'),
      { c: accepted ? [22] : [{ n: 20, skip: true }, 23] });
  }

  var CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
  function randomWord(r, len) { var s = ''; for (var i = 0; i < len; i++) s += CHARS[D.randInt(r, 0, CHARS.length - 1)]; return s; }

  D.define({
    id: 'certificate-pinning',
    title: T('Sertifika sabitleme: birincil, yedek, uyuşmazlık', 'Certificate pinning: primary, backup, mismatch'),
    code: function () { return { c: SRC }; },
    minSize: 10,
    presets: [
      { id: 'normal-primary', level: 'normal', name: T('Uyar: sunucu birincil pinle eşleşiyor', 'Fits: the server matches the primary pin'), data: mk('example-server-1', 'primary') },
      { id: 'hard-backup', level: 'hard', name: T('Zor: anahtar döndü, sunucu yedek pinle eşleşiyor', 'Hard: key rotated, the server matches the backup pin'), data: mk('rotated-server-2', 'backup') },
      { id: 'edge-mismatch', level: 'edge', name: T('Uç durum: hiçbir pinle eşleşmiyor — REDDEDİLİR', 'Edge case: matches neither pin — REJECTED'), data: mk('attacker-server-3', 'mismatch') },
      { id: 'edge-short-seed', level: 'edge', name: T('Uç durum: çok kısa bir sunucu adı', 'Edge case: a very short server name'), data: mk('srv', 'primary') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 16; },
    random: function (level, r) {
      var ranges = { easy: [6, 10], normal: [8, 14], hard: [10, 16], extreme: [12, 18] };
      var rg = ranges[level] || ranges.normal;
      var seed = randomWord(r, D.randInt(r, rg[0], rg[1]));
      var scenarios = ['primary', 'primary', 'backup', 'mismatch'];
      return mk(seed, scenarios[D.randInt(r, 0, scenarios.length - 1)]);
    },
    input: {
      hint: T('sunucu_adı:senaryo (senaryo = primary, backup ya da mismatch)', 'server_name:scenario (scenario = primary, backup, or mismatch)'),
      format: function (data) { return data.seed + ':' + data.scenario; },
      parse: function (text) {
        var parts = String(text).split(':');
        if (parts.length !== 2) throw T('Biçim: sunucu_adı:senaryo olmalı.', 'Format must be server_name:scenario.');
        var seed = parts[0], scenario = parts[1].trim().toLowerCase();
        if (!/^[a-z0-9-]+$/.test(seed)) throw T('Sunucu adı yalnızca küçük harf, rakam ve tire içerebilir.', 'The server name may only contain lowercase letters, digits, and hyphens.');
        if (seed.length > 24) throw T('En fazla 24 karakter olabilir.', 'At most 24 characters.');
        if (['primary', 'backup', 'mismatch'].indexOf(scenario) < 0) throw T('Senaryo primary, backup ya da mismatch olmalı.', 'Scenario must be primary, backup, or mismatch.');
        return mk(seed, scenario);
      },
      bad: ['', 'ONLYONE', 'Server:primary', 'bad char!:primary', 'server:maybe']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
