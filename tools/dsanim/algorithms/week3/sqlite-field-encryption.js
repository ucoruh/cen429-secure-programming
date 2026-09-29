// CEN429 — Week 3 — Demo 7 (code/week-03/07-sqlite-field/sqlite_field.c)
// "Data at rest": the database file on disk can be stolen. The fix is field/column encryption: the
// sensitive column is AES-256-GCM-encrypted in the application layer BEFORE it is written to the
// database. The 'name' column stays plain (needed for lookups); 'card_encrypted' is a
// [nonce|ciphertext|tag] BLOB. Reading with the right key verifies the tag and decrypts; reading with
// the wrong key fails the tag check for EVERY row and never returns garbage. This animation uses a
// small deterministic stand-in cipher/tag so the accept/reject decision can be computed and checked
// exactly; the real gcm_pack()/gcm_unpack() (built on crypto_gcm_encrypt/decrypt) are in the code panel.
(function (D) {
  'use strict';
  var T = D.T;

  var SRC = [
    '/*',
    ' * CEN429 - Week 3 - Demo 7: encrypting a sensitive database field with AES-GCM',
    ' *',
    ' * The "name" field is PLAIN; the "card_encrypted" field is stored as an',
    ' * AES-256-GCM-encrypted BLOB (nonce + ciphertext + tag).',
    ' */',
    '#define NONCE_LEN 12',
    '#define TAG_LEN 16',
    '',
    '/* plain -> [nonce|ciphertext|tag]. */',
    'static int gcm_pack(const unsigned char *key,',
    '                    const unsigned char *plain, int plain_len,',
    '                    unsigned char *out)',
    '{',
    '    crypto_random(nonce, NONCE_LEN);',
    '    crypto_gcm_encrypt(key, nonce, NONCE_LEN, NULL, 0, plain,',
    '                       (size_t)plain_len, out + NONCE_LEN, tag);',
    '    return NONCE_LEN + plain_len + TAG_LEN;',
    '}',
    '',
    '/* [nonce|ciphertext|tag] -> plain. Returns -1 if verification fails. */',
    'static int gcm_unpack(const unsigned char *key, const unsigned char *data,',
    '                  int len, unsigned char *plain)',
    '{',
    '    if (!crypto_gcm_decrypt(key, nonce, NONCE_LEN, NULL, 0, ct,',
    '                        (size_t)ct_len, tag, plain))',
    '        return -1;',
    '    return ct_len;',
    '}',
    '',
    '/* read_db(): for each row */',
    'int pn = gcm_unpack(key, ct, ctn, plain);',
    'if (pn < 0)',
    '    printf("%2d | %-13s | (COULD NOT DECRYPT - wrong key?)\\n", id, name);',
    'else',
    '    printf("%2d | %-13s | %s\\n", id, name, plain);'
  ];

  // ------------------------------------------------------------------ toy field cipher (illustration only)
  function ks(keyId, i) {
    var x = ((keyId * 2654435761) ^ (i * 40503 + 7)) >>> 0;
    x ^= x >>> 13; x = Math.imul(x, 0x85ebca6b) >>> 0; x ^= x >>> 16;
    return x & 0xff;
  }
  function tagOf(bytes, keyId) {
    var h = (0x811c9dc5 ^ keyId) >>> 0;
    for (var i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= h >>> 15; return h >>> 0;
  }
  function toBytes(s) { var b = []; for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); return b; }
  function bytesToText(b) { return b.map(function (c) { return (c >= 32 && c < 127) ? String.fromCharCode(c) : '.'; }).join(''); }
  function hexShort(bytes) { return bytes.slice(0, 4).map(function (v) { return D.hex(v, 2); }).join(''); }

  var REAL_KEY = 1, WRONG_KEY = 7;

  function mk(row1, row2, keyOk) { return { row1: row1, row2: row2, keyOk: keyOk }; }   // row = {name, card}

  /** Independent computation: derived algebraically, NEVER calling ks/tagOf/toBytes (build()'s own
   * toy-cipher helpers) — a bug in either one (e.g. forgetting to compare key ids) then shows up as a
   * mismatch instead of hiding on both sides of the same buggy call at once. XOR is self-cancelling
   * (xorring twice with the SAME keystream returns the original bytes, for ANY keystream), so:
   *  - keyOk === true: gcm_unpack() is attempted with the SAME key id the row was encrypted with, so the
   *    recomputed tag is guaranteed to match (ANY deterministic function of the same input values gives
   *    the same output) — the card is guaranteed to decrypt back to exactly the stored value, no hashing
   *    needed to know this.
   *  - keyOk === false: the attempt uses a DIFFERENT key id (WRONG_KEY vs REAL_KEY), and tagOf mixes the
   *    key id into its seed, so a wrong-key tag matching the real one is as unlikely as two unrelated
   *    hashes agreeing by chance (roughly 1 in 4 billion) — REJECTED on every row is the correct
   *    prediction for every practical input this animation ever generates.
   */
  function reference(data) {
    var rows = [data.row1, data.row2].map(function (row) {
      return { name: row.name, decrypted: data.keyOk ? row.card : null };
    });
    return { rows: rows, allOk: data.keyOk };
  }

  function build(S, data) {
    var rows = [data.row1, data.row2];
    var ROW_H = 40, NAME_W = 160, CARD_W = 280;
    S.label('h0', { x: NAME_W / 2, y: -14, text: T('ad', 'name'), anchor: 'middle', size: 13, bold: true });
    S.label('h1', { x: NAME_W + 20 + CARD_W / 2, y: -14, text: T('kart_şifreli (kilitli)', 'card_encrypted (locked)'), anchor: 'middle', size: 13, bold: true });

    var cipherRows = [];
    for (var r = 0; r < 2; r++) {
      var y = r * (ROW_H + 10);
      S.box('name' + r, { x: 0, y: y, w: NAME_W, h: ROW_H, size: 13, text: rows[r].name, style: 'normal' });
      var c = toBytes(rows[r].card).map(function (v, i) { return v ^ ks(REAL_KEY, i); });
      cipherRows.push(c);
      S.box('cipher' + r, { x: NAME_W + 20, y: y, w: CARD_W, h: ROW_H, size: 12, mono: true, text: hexShort(c) + '...', style: 'dim' });
    }
    S.step(T('Veritabanı satırları: `name` AÇIK, `card_encrypted` bir `[nonce|şifreli metin|etiket]` BLOB.',
              'The database rows: `name` is PLAIN, `card_encrypted` is a `[nonce|ciphertext|tag]` BLOB.'),
           { c: [9, 15, 16] });

    var attemptKey = data.keyOk ? REAL_KEY : WRONG_KEY;
    S.label('keyLbl', { x: (NAME_W + 20 + CARD_W) / 2, y: -34,
      text: data.keyOk ? T('DOĞRU anahtarla okunuyor', 'reading with the CORRECT key') : T('YANLIŞ anahtarla okunuyor', 'reading with the WRONG key'),
      anchor: 'middle', size: 13, bold: true, style: data.keyOk ? 'new' : 'del' });
    S.step(T('`SIM_KEY` ortam değişkeni: ' + (data.keyOk ? 'gerçek anahtar.' : 'YANLIŞ bir anahtar.'),
              '`SIM_KEY` environment variable: ' + (data.keyOk ? 'the real key.' : 'a WRONG key.')),
           { c: [] });

    var refResult = reference(data);
    for (r = 0; r < 2; r++) {
      var storedTag = tagOf(cipherRows[r], REAL_KEY), recomputed = tagOf(cipherRows[r], attemptKey);
      var ok = recomputed === storedTag;
      if (ok) {
        S.set('cipher' + r, { text: rows[r].card, style: 'new' });
      } else {
        S.set('cipher' + r, { text: T('(ÇÖZÜLEMEDİ - yanlış anahtar?)', '(COULD NOT DECRYPT - wrong key?)'), style: 'del' });
      }
    }
    S.result = refResult;
    S.step(refResult.allOk
      ? T('`gcm_unpack()`: her satırda yeniden hesaplanan etiket = saklanan etiket — DOĞRULANDI, kart numaraları çözüldü.',
          '`gcm_unpack()`: for every row, the recomputed tag = the stored tag — VERIFIED, the card numbers are decrypted.')
      : T('`gcm_unpack()`: yeniden hesaplanan etiket saklanan etikete UYMUYOR — HER satırda REDDEDİLDİ. Çöp veri asla dönmez.',
          '`gcm_unpack()`: the recomputed tag does NOT match the stored tag — REJECTED on EVERY row. Garbage is never returned.'),
      refResult.allOk
        ? { c: [32, { n: 25, note: T('!crypto_gcm_decrypt(...)? HAYIR (çözüldü)', '!crypto_gcm_decrypt(...)? NO (decrypted)') }, 26,
                 { n: 27, skip: true }, { n: 33, note: T('pn < 0? HAYIR', 'pn < 0? NO') }, { n: 34, skip: true }, 35, 36] }
        : { c: [32, { n: 25, note: T('!crypto_gcm_decrypt(...)? EVET (etiket tutmadı)', '!crypto_gcm_decrypt(...)? YES (tag did not hold)') }, 26,
                 27, { n: 33, note: T('pn < 0? EVET', 'pn < 0? YES') }, 34, { n: 35, skip: true }, { n: 36, skip: true }] });
  }

  var CHARS = '0123456789';
  function randomCard(r) {
    var s = '';
    for (var g = 0; g < 4; g++) { if (g) s += '-'; for (var i = 0; i < 4; i++) s += CHARS[D.randInt(r, 0, 9)]; }
    return s;
  }
  var NAMES = ['Alice Brown', 'Bob Carter', 'Carla Diaz', 'Dan Evans', 'Ella Frost', 'Finn Grant'];

  D.define({
    id: 'sqlite-field-encryption',
    title: T('SQLite alan şifreleme: doğru ve yanlış anahtar (sqlite_field.c)', 'SQLite field encryption: correct and wrong key (sqlite_field.c)'),
    code: function () { return { c: SRC }; },
    minSize: 16,
    presets: [
      { id: 'normal-ok', level: 'normal', name: T('Uyar: gerçek demonun kayıtları, doğru anahtar', 'Fits: the real demo\'s records, correct key'),
        data: mk({ name: 'Jane Doe', card: '4242-4242-4242-4242' }, { name: 'John Smith', card: '5555-4444-3333-2222' }, true) },
      { id: 'hard-ok', level: 'hard', name: T('Zor: farklı kayıtlar, doğru anahtar', 'Hard: different records, correct key'),
        data: mk({ name: 'Alice Brown', card: '1111-2222-3333-4444' }, { name: 'Bob Carter', card: '9999-8888-7777-6666' }, true) },
      { id: 'edge-wrong-key', level: 'edge', name: T('Uç durum: YANLIŞ anahtar — iki satır da reddedilir', 'Edge case: WRONG key — both rows are rejected'),
        data: mk({ name: 'Jane Doe', card: '4242-4242-4242-4242' }, { name: 'John Smith', card: '5555-4444-3333-2222' }, false) },
      { id: 'edge-short-cards', level: 'edge', small: true, name: T('Uç durum: çok kısa kart alanları', 'Edge case: very short card fields'),
        data: mk({ name: 'Ed', card: '11' }, { name: 'Fi', card: '22' }, true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.row1.card.length + data.row2.card.length; },
    random: function (level, r) {
      var name1 = NAMES[D.randInt(r, 0, NAMES.length - 1)], name2 = NAMES[D.randInt(r, 0, NAMES.length - 1)];
      var keyOk = D.randInt(r, 0, 3) !== 0;   // mostly correct key, sometimes wrong
      return mk({ name: name1, card: randomCard(r) }, { name: name2, card: randomCard(r) }, keyOk);
    },
    input: {
      hint: T('ad1:kart1;ad2:kart2;ok ya da bad (ör. Jane:4242-4242-4242-4242;John:5555-4444-3333-2222;ok)',
              'name1:card1;name2:card2;ok or bad (e.g. Jane:4242-4242-4242-4242;John:5555-4444-3333-2222;ok)'),
      format: function (data) { return data.row1.name + ':' + data.row1.card + ';' + data.row2.name + ':' + data.row2.card + ';' + (data.keyOk ? 'ok' : 'bad'); },
      parse: function (text) {
        var parts = String(text).split(';');
        if (parts.length !== 3) throw T('Biçim: ad1:kart1;ad2:kart2;ok/bad olmalı.', 'Format must be name1:card1;name2:card2;ok/bad.');
        var r1 = parts[0].split(':'), r2 = parts[1].split(':'), flag = parts[2].trim().toLowerCase();
        if (r1.length !== 2 || r2.length !== 2) throw T('Her kayıt ad:kart biçiminde olmalı.', 'Each record must be name:card.');
        if (!r1[1].length || !r2[1].length) throw T('Kart alanları boş olamaz.', 'Card fields cannot be empty.');
        if (r1[1].length > 20 || r2[1].length > 20) throw T('Kart alanı en fazla 20 karakter olabilir.', 'A card field may be at most 20 characters.');
        if (flag !== 'ok' && flag !== 'bad') throw T('Üçüncü alan ok ya da bad olmalı.', 'The third field must be ok or bad.');
        return mk({ name: r1[0], card: r1[1] }, { name: r2[0], card: r2[1] }, flag === 'ok');
      },
      bad: ['', 'onlyone;field', 'Jane;John;ok', 'Jane:;John:5555;ok', 'Jane:4242;John:5555;maybe']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
