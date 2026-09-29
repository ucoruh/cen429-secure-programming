// CEN429 — Week 3 — Demo 6 (code/week-03/06-tls-pinning/tls_client.c) + notes §9.1
// TLS 1.3 finishes its handshake in ONE round trip (fast) and always uses ephemeral ECDHE key
// exchange, so forward secrecy is on by default (RFC 8446). This animation draws the message sequence
// as two lifelines (Client, Server) using S.lifelines()/S.message(): a normal handshake, a mutual-TLS
// (client-authenticated) handshake, a handshake the client ABORTS after certificate verification fails
// (the real `verify` mode's reject path), and an INSECURE client that skips verification entirely (the
// real `insecure` mode) and completes the handshake anyway — which is exactly what makes a MITM
// possible. The single high-level SSL_connect() call that runs this whole exchange inside OpenSSL is
// shown in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/* code/week-03/06-tls-pinning/tls_client.c */',
    'SSL_CTX_set_min_proto_version(ctx, TLS1_2_VERSION);',
    'if (verify) {',
    '    SSL_CTX_load_verify_locations(ctx, ca_pem, NULL);   /* trusted CA */',
    '    SSL_CTX_set_verify(ctx, SSL_VERIFY_PEER, NULL);',
    '    SSL_set1_host(ssl, host);                            /* hostname check */',
    '} else {',
    '    SSL_CTX_set_verify(ctx, SSL_VERIFY_NONE, NULL);       /* INSECURE: accepts anything */',
    '}',
    '',
    '/* One call runs the ENTIRE TLS 1.3 1-RTT handshake shown in this animation: */',
    '/* ClientHello -> ServerHello, EncryptedExtensions, Certificate,             */',
    '/* CertificateVerify, Finished -> client Finished -> Application Data.       */',
    'int r = SSL_connect(ssl);',
    'if (r != 1) {',
    '    printf("[%s] HANDSHAKE FAILED - connection REJECTED.\\n", mode);',
    '    /* certificate verification error, e.g. self-signed certificate */',
    '} else if (verify) {',
    '    printf("[verify] chain + hostname VERIFIED - ACCEPTED.\\n");',
    '} else {',
    '    printf("[insecure] no verification - ACCEPTS whatever it gets (DANGEROUS).\\n");',
    '}'
  ];

  function mk(scenario) { return { scenario: scenario }; }   // normal | mutual | aborted | insecure

  /** Independent computation: the outcome is a direct, hand-checked function of the scenario name —
   * no state from build()'s drawing loop is read back. */
  function reference(data) {
    var s = data.scenario;
    return {
      established: s !== 'aborted',
      clientAuthenticated: s === 'mutual',
      messageCount: s === 'mutual' ? 9 : (s === 'aborted' ? 5 : 7)
    };
  }

  function build(S, data) {
    // Wide (not tall) on purpose: dsanim's still-frame export is always forced to a fixed WIDTH, so the
    // exported image's HEIGHT is whatever the content's native aspect ratio implies. A classic sequence
    // diagram with two lifelines close together is tall and narrow, which blows up the exported height —
    // so the two lifelines are spread far apart horizontally to keep the export landscape-shaped.
    var CX = 0, SX = 1400, Y0 = 20;
    S.lifelines('ln', { x: [CX, SX], labels: [T('İstemci', 'Client'), T('Sunucu', 'Server')], y0: Y0, y1: Y0 + 300 });
    S.step(T('İki uç: İstemci ve Sunucu. Her ok bir el sıkışma mesajıdır; sıra yukarıdan aşağıdır.',
              'Two endpoints: Client and Server. Every arrow is a handshake message; order runs top to bottom.'), { c: [] });

    var y = Y0 + 26, STEP = 27;
    function msg(id, from, to, text, style) {
      // The text is drawn as its own label ABOVE the line (not ON it, via S.message's `text`): that
      // built-in label pill is sized for short 1-2 character values and a long protocol message name
      // would have the arrow's line strike straight through it.
      S.message(id, { x1: from, x2: to, y: y, style: style || 'normal' });
      S.label(id + 'txt', { x: (from + to) / 2, y: y - 10, text: text, anchor: 'middle', size: 13, mono: true, style: style || 'normal' });
      y += STEP;
    }

    msg('m1', CX, SX, 'ClientHello (+key_share)', 'active');
    S.step(T('İstemci: `ClientHello` — desteklenen sürümler ve geçici (ephemeral) ECDHE `key_share` ile.',
              'Client: `ClientHello` — with supported versions and an ephemeral ECDHE `key_share`.'), { c: [14] });

    msg('m2', SX, CX, 'ServerHello (+key_share)', 'active');
    S.step(T('Sunucu: `ServerHello` — kendi geçici `key_share`\'i ile; paylaşılan gizli artık HER İKİ tarafta da hesaplanabilir (ECDHE -> ileri gizlilik).',
              'Server: `ServerHello` — with its own ephemeral `key_share`; the shared secret can now be computed on BOTH sides (ECDHE -> forward secrecy).'), { c: [14] });

    msg('m3', SX, CX, '{EncryptedExtensions}', 'dim');
    S.step(T('Sunucu: `{EncryptedExtensions}` — bu noktadan sonra el sıkışmanın GERİ KALANI da şifrelidir.',
              'Server: `{EncryptedExtensions}` — from this point on, the REST of the handshake is encrypted too.'), { c: [] });

    msg('m4', SX, CX, '{Certificate}', 'dim');
    S.step(T('Sunucu: `{Certificate}` — sunucunun sertifika zinciri.', 'Server: `{Certificate}` — the server\'s certificate chain.'), { c: [] });

    msg('m5', SX, CX, '{CertificateVerify}', 'dim');
    S.step(T('Sunucu: `{CertificateVerify}` — sertifikanın ÖZEL anahtarıyla el sıkışmanın bir imzası: sertifikanın sahibi olduğunu kanıtlar.',
              'Server: `{CertificateVerify}` — a signature over the handshake with the certificate\'s PRIVATE key: proves ownership of the certificate.'), { c: [] });

    if (data.scenario === 'aborted') {
      S.message('mAbort', { x1: CX, x2: SX, y: y, style: 'del' });
      S.label('mAborttxt', { x: (CX + SX) / 2, y: y - 10, text: T('Alert: bad_certificate', 'Alert: bad_certificate'), anchor: 'middle', size: 13, mono: true, style: 'del' });
      y += STEP;
      S.result = reference(data);
      S.step(T('İstemci (`verify` modu): sertifika zinciri güvenilir CA\'ya çıkmıyor (kendi imzalı) — `SSL_connect()` başarısız döner, bağlantı REDDEDİLİR. `Finished` hiç gönderilmez.',
                'Client (`verify` mode): the certificate chain does not lead to a trusted CA (self-signed) — `SSL_connect()` returns failure, the connection is REJECTED. `Finished` is never sent.'),
             { c: [14, { n: 15, note: T('r != 1? EVET (el sıkışma başarısız)', 'r != 1? YES (handshake failed)') }, 16] });
      return;
    }

    msg('m6', SX, CX, '{Finished}', 'active');
    var verifyNote = data.scenario === 'insecure'
      ? T('İstemci (`insecure` modu): sertifika HİÇ doğrulanmadı — ne gelirse kabul edilir (TEHLİKELİ).',
          'Client (`insecure` mode): the certificate was NEVER verified — accepts whatever it gets (DANGEROUS).')
      : T('İstemci (`verify` modu): zincir + ana makine adı DOĞRULANDI.', 'Client (`verify` mode): the chain + hostname were VERIFIED.');
    S.step(verifyNote, { c: data.scenario === 'insecure'
      ? [{ n: 3, note: T('verify? HAYIR', 'verify? NO') }, { n: 4, skip: true }, { n: 5, skip: true }, { n: 6, skip: true }, 7, 8]
      : [{ n: 3, note: T('verify? EVET', 'verify? YES') }, 4, 5, 6, { n: 7, skip: true }, { n: 8, skip: true }] });

    if (data.scenario === 'mutual') {
      msg('mCR', SX, CX, 'CertificateRequest', 'hl');
      S.step(T('Sunucu ayrıca `CertificateRequest` gönderdi — karşılıklı TLS (mTLS): istemcinin de kimliğini kanıtlaması isteniyor.',
                'The server also sent `CertificateRequest` — mutual TLS (mTLS): the client is asked to prove its identity too.'), { c: [] });
      msg('mCC', CX, SX, '{Certificate, CertificateVerify}', 'hl');
      S.step(T('İstemci: kendi sertifikasını ve imzasını gönderdi.', 'Client: sends its own certificate and signature.'), { c: [] });
    }

    msg('m7', CX, SX, '{Finished}', 'active');
    S.step(T('İstemci: `{Finished}` — el sıkışma tek gidiş-dönüşte TAMAMLANDI (TLS 1.3\'ün hız avantajı).',
              'Client: `{Finished}` — the handshake COMPLETES in a single round trip (TLS 1.3\'s speed advantage).'), { c: [] });

    msg('m8', CX, SX, T('Uygulama verisi (şifreli)', 'Application data (encrypted)'), 'new');
    S.result = reference(data);
    S.step(data.scenario === 'insecure'
      ? T('Kanal artık şifreli AMA doğrulanmamış: bir saldırgan araya girip kendi sertifikasını sunsaydı istemci fark etmezdi (MITM).',
          'The channel is now encrypted BUT unverified: if an attacker had sat in the middle with their own certificate, the client would not have noticed (MITM).')
      : (data.scenario === 'mutual'
          ? T('Kanal şifreli VE her iki taraf da doğrulandı (mTLS): sunucu istemcinin kimliğini de biliyor.',
              'The channel is encrypted AND both sides are verified (mTLS): the server also knows the client\'s identity.')
          : T('Kanal şifreli VE sunucu doğrulandı: uygulama verisi güvenle akabilir.',
              'The channel is encrypted AND the server is verified: application data can flow safely.')),
      data.scenario === 'insecure'
        ? { c: [{ n: 15, note: T('r != 1? HAYIR (başarılı)', 'r != 1? NO (succeeded)') }, { n: 18, note: T('verify? HAYIR', 'verify? NO') }, { n: 19, skip: true }, 21] }
        : { c: [{ n: 15, note: T('r != 1? HAYIR (başarılı)', 'r != 1? NO (succeeded)') }, { n: 18, note: T('verify? EVET', 'verify? YES') }, 19, { n: 21, skip: true }] });
  }

  D.define({
    id: 'tls13-handshake',
    title: T('TLS 1.3 el sıkışması: mesaj sırası (tls_client.c)', 'TLS 1.3 handshake: message sequence (tls_client.c)'),
    code: function () { return { c: SRC }; },
    minSize: 5,
    presets: [
      { id: 'normal', level: 'normal', small: true, name: T('Uyar: normal 1-RTT el sıkışma, sunucu doğrulanıyor', 'Fits: a normal 1-RTT handshake, server verified'), data: mk('normal') },
      { id: 'hard-mutual', level: 'hard', small: true, name: T('Zor: karşılıklı TLS (istemci de kimlik kanıtlıyor)', 'Hard: mutual TLS (the client proves its identity too)'), data: mk('mutual') },
      { id: 'edge-aborted', level: 'edge', small: true, name: T('Uç durum: sertifika reddedildi, el sıkışma YARIDA KESİLDİ', 'Edge case: certificate rejected, handshake ABORTED'), data: mk('aborted') },
      { id: 'edge-insecure', level: 'edge', small: true, name: T('Uç durum: doğrulamasız istemci — tamamlanıyor ama güvensiz', 'Edge case: an unverifying client — completes but insecure'), data: mk('insecure') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 8; },
    random: function (level, r) {
      var scenarios = ['normal', 'normal', 'mutual', 'aborted', 'insecure'];
      return mk(scenarios[D.randInt(r, 0, scenarios.length - 1)]);
    },
    input: {
      hint: T('normal, mutual, aborted, ya da insecure', 'normal, mutual, aborted, or insecure'),
      format: function (data) { return data.scenario; },
      parse: function (text) {
        var s = String(text).trim().toLowerCase();
        if (['normal', 'mutual', 'aborted', 'insecure'].indexOf(s) < 0) throw T('Senaryo normal, mutual, aborted ya da insecure olmalı.', 'Scenario must be normal, mutual, aborted, or insecure.');
        return mk(s);
      },
      bad: ['', 'maybe', '123', 'normal!', 'mutual-tls']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
