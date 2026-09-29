// CEN429 — Week 2 — Demo 11 (code/week-02/11-tamper-evident-log/log_chain.c: record_mac(), evolve_key())
// A digest CHAIN: every record's MAC also covers the PREVIOUS record's MAC. The verifier always chains
// forward using the ACTUAL STORED mac (never a freshly recomputed one -- see log_chain.c's verify(),
// where `prev` is always `records[i].mac`), so tampering is caught LOCALLY: editing one record's message
// breaks only that record's own mac; deleting/reordering breaks the record(s) whose position or sequence
// no longer matches what was originally signed -- once the untouched original chain resumes, later
// records verify OK again (confirmed against the real log_chain.exe: modifying seq=4 alone leaves seq=5
// and seq=6 both OK). This animation uses a small, deterministic TOY mac/evolve function (clearly not
// real HMAC-SHA256) so each step can be followed by eye; the real demo uses HMAC-SHA256 from the OS
// crypto library (common/cen429_crypto.h) end to end.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (log_chain.c 77-100)
  var CHAIN_C = [
    'static void evolve_key(unsigned char k[32])',
    '{',
    '    unsigned char next[32];',
    '    crypto_hmac_sha256(k, 32, "cen429-evolve", 13, next);',
    '    memcpy(k, next, 32);',
    '    crypto_wipe(next, sizeof next);',
    '}',
    '',
    '/* A record\'s MAC: HMAC(K_i, prev_mac(32) || seq(4 BE) || message). */',
    'static void record_mac(const unsigned char k[32],',
    '                       const unsigned char prev[32],',
    '                       int seq, const char *message, unsigned char out[32])',
    '{',
    '    unsigned char buffer[32 + 4 + MSG_LEN];',
    '    size_t mlen = strlen(message);',
    '    if (mlen > MSG_LEN) mlen = MSG_LEN;',
    '    memcpy(buffer, prev, 32);',
    '    buffer[32] = (unsigned char)(seq >> 24);',
    '    buffer[33] = (unsigned char)(seq >> 16);',
    '    buffer[34] = (unsigned char)(seq >> 8);',
    '    buffer[35] = (unsigned char)(seq);',
    '    memcpy(buffer + 36, message, mlen);',
    '    crypto_hmac_sha256(k, 32, buffer, 36 + mlen, out);',
    '}'
  ];
  // CHAIN_C is shown whole in the code panel, so `{c:[N]}` addresses its own Nth displayed line.

  /** TOY mac/evolve — for the animation only; the real demo's crypto_hmac_sha256() is a proper
   * HMAC-SHA256 from the OS crypto library. Deterministic and one-way-ish (an LCG step), never used
   * for anything but teaching this chain's SHAPE. */
  function toyEvolve(k) { return (k * 1103515245 + 12345) % 99991; }
  function toyMac(k, prevMac, seq, message) {
    var s = 0;
    for (var i = 0; i < message.length; i++) s = (s * 131 + message.charCodeAt(i)) % 99991;
    return (k * 7 + prevMac * 13 + seq * 17 + s) % 99991;
  }
  function hex4(n) { return ('000' + n.toString(16)).slice(-4); }

  function mk(evolve, records, tamperIndex, tamperMessage) {
    return { evolve: evolve, records: records, tamperIndex: tamperIndex, tamperMessage: tamperMessage };
  }

  function computeChain(data) {
    var k0 = 4242, keys = [k0], macs = [];
    for (var i = 1; i < data.records.length; i++) keys.push(data.evolve ? toyEvolve(keys[i - 1]) : keys[0]);
    var prev = 0;
    for (i = 0; i < data.records.length; i++) {
      var mac = toyMac(keys[i], prev, data.records[i].seq, data.records[i].message);
      macs.push(mac);
      prev = mac;
    }
    return { keys: keys, macs: macs };
  }

  /** Independent reference mac/evolve: a DIFFERENT LCG (different multiplier/increment/modulus) for
   * key evolution, and a different accumulation order/modulus for the mac itself -- structurally
   * unrelated to toyEvolve()/toyMac() above, which build() (via computeChain()) uses to draw the
   * animation. Computes the WOULD-BE stored chain from the ORIGINAL messages, then re-verifies with
   * the CURRENT (possibly tampered) messages using the verifier's real rule: prevMac always comes
   * from the STORED value, never a freshly recomputed one (matches log_chain.c's verify(), where
   * `prev` is always `records[i].mac`) -- so tampering only ever breaks the directly-edited record,
   * confirmed against the real log_chain.exe (modifying seq=4 alone leaves seq=5/seq=6 both OK). */
  function referenceEvolve(k) { return (k * 48271 + 7) % 100003; }
  function referenceMac(k, prevMac, seq, message) {
    var acc = (k * 3 + 11) % 100003;
    for (var i = 0; i < message.length; i++) acc = (acc * 257 + message.charCodeAt(i) + i) % 100003;
    return (acc + prevMac * 19 + seq * 29) % 100003;
  }

  function reference(data) {
    var k0 = 4242, keys = [k0];
    for (var i = 1; i < data.records.length; i++) keys.push(data.evolve ? referenceEvolve(keys[i - 1]) : keys[0]);
    var storedMacs = [], prevStored = 0;
    for (i = 0; i < data.records.length; i++) {
      var stored = referenceMac(keys[i], prevStored, data.records[i].seq, data.records[i].message);
      storedMacs.push(stored);
      prevStored = stored;
    }
    var prevCheck = 0, ok = [];
    for (i = 0; i < data.records.length; i++) {
      var message = i === data.tamperIndex ? data.tamperMessage : data.records[i].message;
      var expected = referenceMac(keys[i], prevCheck, data.records[i].seq, message);
      ok.push(expected === storedMacs[i]);
      prevCheck = storedMacs[i];
    }
    return ok;
  }

  function build(S, data) {
    var n = data.records.length, w = 150, gap = 24;
    var chain = computeChain(data);
    var storedMacs = chain.macs.slice(), keys = chain.keys;

    for (var i = 0; i < n; i++) {
      S.box('rec' + i, { x: i * (w + gap), y: 0, w: w, h: 44, size: 12,
        text: '#' + data.records[i].seq + ' "' + data.records[i].message + '"', style: 'normal' });
      S.box('mac' + i, { x: i * (w + gap), y: 60, w: w, h: 28, size: 12, mono: true,
        text: 'mac=' + hex4(storedMacs[i]), style: 'normal', below: data.evolve ? 'K' + i : undefined });
      if (i > 0) S.arrow('link' + i, { from: 'mac' + (i - 1), to: 'rec' + i, kind: 'center', text: T('önceki mac', 'prev mac') });
    }
    S.label('title', { x: 0, y: -20, text: T((data.evolve ? 'ANAHTAR EVRİMİ' : 'SABİT ANAHTAR') + ': her kaydın mac\'i öncekinin mac\'ini de kapsar',
      (data.evolve ? 'KEY EVOLUTION' : 'STATIC KEY') + ': every record\'s mac also covers the previous one\'s'), anchor: 'start', size: 14, bold: true });
    S.at(0);
    S.step(T('Zincir oluşturuluyor: mac_i = f(K_i, mac_{i-1}, seq_i, message_i). ' + n + ' kayıt, ' + (data.evolve ? 'her adımda anahtar evriliyor.' : 'anahtar hiç değişmiyor.'),
              'The chain is built: mac_i = f(K_i, mac_{i-1}, seq_i, message_i). ' + n + ' records, ' + (data.evolve ? 'the key evolves every step.' : 'the key never changes.')),
           { c: [9, 10, 11, 12, 22] });

    if (data.tamperIndex < 0) {
      for (i = 0; i < n; i++) { S.set('rec' + i, { style: 'new' }); S.set('mac' + i, { style: 'new' }); }
      S.step(T('Doğrulama: her kayıt için mac yeniden hesaplanıyor, hepsi saklanan değerle eşleşiyor — zincir SAĞLAM.',
                'Verification: the mac is recomputed for every record, all match the stored value — the chain is INTACT.'),
             {});
      S.result = reference(data);
      return;
    }

    // Tamper: change the message at tamperIndex, but the stored MAC stays the same (the attacker
    // cannot compute a new one without the key at that point in the schedule).
    S.set('rec' + data.tamperIndex, { text: '#' + data.records[data.tamperIndex].seq + ' "' + data.tamperMessage + '"', style: 'del' });
    S.step(T('SALDIRI: kayıt ' + data.tamperIndex + '\'in mesajı "' + data.tamperMessage + '" olarak değiştiriliyor — mac DOKUNULMADI (saklanan değer eski).',
              'ATTACK: record ' + data.tamperIndex + '\'s message is changed to "' + data.tamperMessage + '" — the mac is NOT touched (the stored value is stale).'),
           { c: [22] });

    var current = data.records.map(function (r, i) { return { seq: r.seq, message: i === data.tamperIndex ? data.tamperMessage : r.message }; });
    var prevMac = 0, broken = false;
    for (i = 0; i < n; i++) {
      var expected = toyMac(keys[i], prevMac, current[i].seq, current[i].message);
      var ok = expected === storedMacs[i];
      S.set('mac' + i, { text: 'mac=' + hex4(storedMacs[i]) + (ok ? ' OK' : ' BROKEN'), style: ok ? 'new' : 'del' });
      S.set('rec' + i, { style: ok ? 'normal' : 'del' });
      if (!ok) broken = true;
      S.step(ok
        ? T('kayıt ' + i + ': yeniden hesaplanan mac saklananla eşleşiyor — OK.', 'record ' + i + ': the recomputed mac matches the stored one — OK.')
        : T('kayıt ' + i + ': yeniden hesaplanan mac saklanandan FARKLI — BOZULDU. (Doğrulayıcı bir sonraki kayıt için yine SAKLANAN mac\'i kullanır, o yüzden hasar burada yerelde kalır.)',
            'record ' + i + ': the recomputed mac is DIFFERENT from the stored one — BROKEN. (The verifier still uses the STORED mac for the next record, so the damage stays local here.)'),
        { c: [9, 10, 11, 12, 22] });
      prevMac = storedMacs[i]; // the verifier follows the chain by the ACTUAL stored macs, same as log_chain.c's verify()
    }
    S.at(null);
    S.step(broken
      ? T('>>> SONUÇ: günlük KURCALANMIŞ (doğrulama başarısız).', '>>> RESULT: the log has been TAMPERED WITH (verification failed).')
      : T('>>> SONUÇ: günlük SAĞLAM.', '>>> RESULT: the log is INTACT.'),
      {});
    S.result = reference(data);
  }

  D.define({
    id: 'tamper-evident-log-chain',
    title: T('Kurcalamaya dayanıklı günlük: HMAC zinciri (log_chain.c)', 'Tamper-evident log: an HMAC chain (log_chain.c)'),
    code: { c: CHAIN_C },
    presets: [
      { id: 'normal-clean-evolve', level: 'normal',
        name: T('Normal: sağlam zincir, anahtar evrimi açık', 'Normal: an intact chain, key evolution on'),
        data: mk(true, [
          { seq: 1, message: 'wallet opened' }, { seq: 2, message: 'card loaded' }, { seq: 3, message: 'payment started' },
          { seq: 4, message: 'payment approved' }, { seq: 5, message: 'balance checked' }, { seq: 6, message: 'card removed' },
          { seq: 7, message: 'receipt printed' }, { seq: 8, message: 'session extended' }, { seq: 9, message: 'session closed' },
          { seq: 10, message: 'logout' }
        ], -1, '') },
      { id: 'hard-tamper-early-record', level: 'hard',
        name: T('Zor: EN BAŞTAKİ kayıt değiştiriliyor — yine de yalnızca o kayıt bozuluyor',
                'Hard: the VERY FIRST record is changed — still only that one record breaks'),
        data: mk(true, [
          { seq: 1, message: 'wallet opened' }, { seq: 2, message: 'card loaded' }, { seq: 3, message: 'payment started' },
          { seq: 4, message: 'payment approved' }, { seq: 5, message: 'balance checked' }, { seq: 6, message: 'card removed' },
          { seq: 7, message: 'receipt printed' }, { seq: 8, message: 'record deleted' }, { seq: 9, message: 'session closed' },
          { seq: 10, message: 'logout' }
        ], 0, 'wallet opened by FORGED-user') },
      { id: 'edge-tamper-last-record', level: 'edge',
        name: T('Uç durum: SON kayıt değiştiriliyor — yalnızca o kayıt bozuluyor', 'Edge case: the LAST record is changed — only that one record breaks'),
        data: mk(true, [
          { seq: 1, message: 'wallet opened' }, { seq: 2, message: 'card loaded' }, { seq: 3, message: 'payment started' },
          { seq: 4, message: 'payment approved' }, { seq: 5, message: 'balance checked' }, { seq: 6, message: 'card removed' },
          { seq: 7, message: 'receipt printed' }, { seq: 8, message: 'session extended' }, { seq: 9, message: 'session closed' },
          { seq: 10, message: 'logout' }
        ], 9, 'logout FORGED') },
      { id: 'edge-static-key-same-tamper', level: 'edge',
        name: T('Uç durum: AYNI kayıt, SABİT anahtarla (evrim yok)', 'Edge case: the SAME record, with a STATIC key (no evolution)'),
        data: mk(false, [
          { seq: 1, message: 'wallet opened' }, { seq: 2, message: 'card loaded' }, { seq: 3, message: 'payment started' },
          { seq: 4, message: 'payment approved' }, { seq: 5, message: 'balance checked' }, { seq: 6, message: 'card removed' },
          { seq: 7, message: 'receipt printed' }, { seq: 8, message: 'session extended' }, { seq: 9, message: 'session closed' },
          { seq: 10, message: 'logout' }
        ], 2, 'payment started FORGED') },
      { id: 'edge-two-record-chain', level: 'edge', small: true,
        name: T('Uç durum: en kısa anlamlı zincir, 2 kayıt', 'Edge case: the shortest meaningful chain, 2 records'),
        data: mk(true, [{ seq: 1, message: 'wallet opened' }, { seq: 2, message: 'session closed' }], -1, '') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.records.length; },
    random: function (level, r) {
      var msgs = ['wallet opened', 'card loaded', 'payment started', 'payment approved', 'record deleted', 'session closed', 'logout', 'retry started'];
      var n = level === 'easy' ? 10 : level === 'normal' ? D.randInt(r, 10, 11) : level === 'hard' ? D.randInt(r, 11, 12) : D.randInt(r, 12, 14);
      var records = [];
      for (var i = 0; i < n; i++) records.push({ seq: i + 1, message: msgs[i % msgs.length] });
      var evolve = level === 'easy' ? true : r() < 0.6;
      var tamperIndex = level === 'easy' ? -1 : (r() < 0.6 ? D.randInt(r, 0, n - 1) : -1);
      var tamperMessage = tamperIndex >= 0 ? records[tamperIndex].message + ' FORGED' : '';
      return mk(evolve, records, tamperIndex, tamperMessage);
    },
    input: {
      hint: T('evolve|static : seq:mesaj, seq:mesaj, … [ | tamper=indeks:yeni-mesaj ]', 'evolve|static : seq:msg, seq:msg, … [ | tamper=index:new-message ]'),
      format: function (data) {
        var s = (data.evolve ? 'evolve' : 'static') + ' : ' + data.records.map(function (r) { return r.seq + ':' + r.message; }).join(', ');
        if (data.tamperIndex >= 0) s += ' | tamper=' + data.tamperIndex + ':' + data.tamperMessage;
        return s;
      },
      tokens: function (data) { return data.records.map(function (r) { return String(r.seq); }); },
      parse: function (text) {
        var parts = String(text).split('|');
        var head = parts[0].match(/^\s*(evolve|static)\s*:\s*([\s\S]+)$/);
        if (!head) throw T('"evolve|static : seq:mesaj, .." biçiminde olmalı.', 'Must be "evolve|static : seq:msg, ..".');
        var records = head[2].split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(function (t) {
          var m = t.match(/^(\d+):(.+)$/);
          if (!m) throw T('"' + t + '" "seq:mesaj" biçiminde olmalı.', '"' + t + '" must look like "seq:message".');
          return { seq: parseInt(m[1], 10), message: m[2] };
        });
        if (records.length < 2) throw T('En az 2 kayıt girin.', 'Enter at least 2 records.');
        var tamperIndex = -1, tamperMessage = '';
        if (parts[1]) {
          var tm = parts[1].trim().match(/^tamper=(\d+):(.+)$/);
          if (!tm) throw T('"tamper=indeks:yeni-mesaj" biçiminde olmalı.', 'Must look like "tamper=index:new-message".');
          tamperIndex = parseInt(tm[1], 10);
          if (tamperIndex < 0 || tamperIndex >= records.length) throw T('tamper indeksi aralık dışında.', 'the tamper index is out of range.');
          tamperMessage = tm[2];
        }
        return mk(head[1] === 'evolve', records, tamperIndex, tamperMessage);
      },
      bad: ['', 'maybe : 1:a, 2:b', 'evolve : onlyone:a', 'evolve : 1:a, 2:b | tamper=9:x']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
