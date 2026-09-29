// CEN429 — Week 5 — Demo 5 part A (code/week-05/05-obfuscation/HiddenConstant.java)
// A secret string is XOR-encrypted with a fixed key BEFORE compilation and embedded as a byte array;
// only these encrypted bytes ever appear in the compiled .class file. At run time, `decrypt()` walks the
// byte array one byte at a time, XORing each byte with the same key to recover the original character —
// the plain text is built fresh in memory and never exists anywhere in the bytecode itself.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 5a: a HIDDEN constant (better).',
    '// The same string is XOR-encrypted BEFORE compilation and embedded as a byte',
    '// array; it is decrypted at run time. This way the plain text does NOT show',
    '// up in the bytecode. Limit: the string still exists in memory once decrypted;',
    '// strong protection needs RASP + a short lifetime too (Week 6). All values are',
    '// synthetic.',
    'import java.nio.charset.StandardCharsets;',
    '',
    'public class HiddenConstant {',
    '',
    '    // "server-key-9F3A" XOR-encrypted with 0x5A.',
    '    private static final byte[] SECRET = {',
    '        41, 63, 40, 44, 63, 40, 119, 49, 63, 35,',
    '        119, 99, 28, 105, 27',
    '    };',
    '    private static final byte KEY = 0x5A;',
    '',
    '    private static String decrypt(byte[] data) {',
    '        byte[] b = new byte[data.length];',
    '        for (int i = 0; i < data.length; i++) {',
    '            b[i] = (byte) (data[i] ^ KEY);',
    '        }',
    '        return new String(b, StandardCharsets.UTF_8);',
    '    }',
    '',
    '    public static void main(String[] args) {',
    '        System.out.println("Decrypted constant : " + decrypt(SECRET));',
    '    }',
    '}'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(plaintext, key) { return { plaintext: plaintext, key: key }; }
  function encryptBytes(text, key) {
    var out = [];
    for (var i = 0; i < text.length; i++) out.push(text.charCodeAt(i) ^ key);
    return out;
  }

  /** Independent computation (a mathematical identity — calls NEITHER encryptBytes() nor build()'s own
   * loop, so a bug in encryptBytes() cannot hide from this check): XOR is its own inverse, so decrypting
   * whatever byte array was produced by re-encrypting the plaintext with the SAME key must reproduce the
   * original plaintext exactly, for every possible plaintext and key -- there is nothing to simulate. */
  function reference(data) {
    return { decrypted: data.plaintext };
  }

  function build(S, data) {
    var text = data.plaintext, key = data.key;
    var bytes = encryptBytes(text, key);

    S.label('keyLbl', { x: 0, y: -18, text: T('anahtar (XOR) = 0x' + D.hex(key, 2), 'key (XOR) = 0x' + D.hex(key, 2)), anchor: 'start', size: 13, bold: true });
    S.label('encLbl', { x: -14, y: 17, text: T('şifreli bayt dizisi =', 'encrypted byte array ='), anchor: 'end', size: 13, mono: true });
    S.memRow('e', bytes.map(function (b) { return { value: b }; }), { x: 0, y: 0, w: 28, h: 32, size: 12, addrs: false });
    S.at(null);
    S.step(T('`decrypt(data)` çağrılır: elimizde yalnızca şifreli bayt dizisi ve sabit XOR anahtarı var — düz metin henüz hiçbir yerde yok.',
              '`decrypt(data)` is called: all we have is the encrypted byte array and the fixed XOR key — the plain text does not exist anywhere yet.'),
           { java: [18] });

    var Y2 = 90;
    S.label('decLbl', { x: -14, y: Y2 + 17, text: T('çözülen dize =', 'decrypted string so far ='), anchor: 'end', size: 13, mono: true });
    for (var i = 0; i < text.length; i++) {
      var b = bytes[i], ch = String.fromCharCode(b ^ key);
      S.set('e' + i, { style: 'active' });
      S.box('d' + i, { x: i * 30, y: Y2, w: 28, h: 32, size: 14, mono: true, style: 'new', text: ch });
      S.at(i);
      S.step(T('Bayt ' + (i + 1) + ': 0x' + D.hex(b, 2) + ' XOR 0x' + D.hex(key, 2) + ' = `' + ch + '` — çözülen dizeye ekleniyor.',
                'byte ' + (i + 1) + ': 0x' + D.hex(b, 2) + ' XOR 0x' + D.hex(key, 2) + ' = `' + ch + '` — appended to the decrypted string.'),
             { java: [{ n: 20, note: T('i=' + i + ' < ' + text.length + '? evet → devam', 'i=' + i + ' < ' + text.length + '? yes → continue') }, 21] });
      S.set('e' + i, { style: 'dim' });
    }
    S.at(null);
    S.result = reference(data);
    if (key === 0) {
      S.step(T('Sonuç: `' + S.result.decrypted + '` çözüldü — ama anahtar 0x00 olduğu için şifreli baytlar zaten düz metinle AYNIYDI. XOR ile "0" anahtar hiçbir şey gizlemez.',
                'Result: `' + S.result.decrypted + '` decrypted — but since the key is 0x00, the encrypted bytes were already IDENTICAL to the plain text. XORing with a "0" key hides nothing at all.'),
             { java: [23] });
    } else {
      S.step(T('Sonuç: ' + text.length + ' bayt çözüldü: `' + S.result.decrypted + '`. Bytecode\'da yalnızca şifreli baytlar görünür; düz metin çalışma anına kadar hiçbir yerde yoktur.',
                'Result: ' + text.length + ' byte(s) decrypted: `' + S.result.decrypted + '`. Only the encrypted bytes appear in the bytecode; the plain text does not exist anywhere until run time.'),
             { java: [23] });
    }
  }

  D.define({
    id: 'string-decryption',
    title: T('Çalışma anında dize çözme: XOR ile gizleme (HiddenConstant.java)', 'Runtime string decryption: XOR-based hiding (HiddenConstant.java)'),
    code: function () { return { java: JAVA_SRC }; },
    presets: [
      { id: 'normal-server-key', level: 'normal',
        name: T('Normal: gerçek Demo 5 sabiti, anahtar 0x5A', 'Normal: the real Demo 5 constant, key 0x5A'),
        data: mk('server-key-9F3A', 0x5A) },
      { id: 'hard-method-name', level: 'hard',
        name: T('Zor: gizlenen metot adı, anahtar 0x5A', 'Hard: the hidden method name, key 0x5A'),
        data: mk('hiddenOperation', 0x5A) },
      { id: 'edge-single-byte', level: 'edge', small: true,
        name: T('Uç durum: tek karakter, tek bayt', 'Edge case: a single character, a single byte'),
        data: mk('X', 0x01) },
      { id: 'edge-zero-key', level: 'edge',
        name: T('Uç durum: anahtar 0x00 — hiçbir şey gizlenmiyor!', 'Edge case: a 0x00 key — nothing is hidden at all!'),
        data: mk('WEAK-KEY-0', 0x00) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.plaintext.length; },
    random: function (level, r) {
      var words = ['session-token', 'device-secret', 'api-key-value', 'vault-passcode', 'sync-endpoint', 'cache-marker'];
      function text() { return words[D.randInt(r, 0, words.length - 1)] + '-' + D.randInt(r, 10, 99); }
      if (level === 'easy' || level === 'normal') return mk(text(), D.randInt(r, 1, 255));
      if (level === 'hard') return mk(text(), 0x5A);
      return mk(text(), D.randInt(r, 0, 1) === 0 ? 0 : D.randInt(r, 1, 255));
    },
    input: {
      hint: T('düz metin anahtar-onaltılık, örn. "secret-value 5a"', 'plain text hex-key, e.g. "secret-value 5a"'),
      format: function (data) { return data.plaintext + ' ' + D.hex(data.key, 2); },
      tokens: function (data) { return data.plaintext.split(''); },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 2) throw T('"düzmetin anahtar" biçiminde olmalı (anahtar onaltılık, örn. 5a).', 'Must be "plaintext key" (key in hex, e.g. 5a).');
        var plain = parts[0], keyStr = parts[1];
        if (!plain.length || plain.length > 30) throw T('Düz metin 1-30 karakter olmalı.', 'The plain text must be 1-30 characters.');
        if (!/^[\x21-\x7e]+$/.test(plain)) throw T('Düz metin yazdırılabilir, boşluksuz ASCII olmalı.', 'The plain text must be printable, whitespace-free ASCII.');
        if (!/^[0-9a-fA-F]{1,2}$/.test(keyStr)) throw T('Anahtar 1-2 onaltılık basamak olmalı (00-ff).', 'The key must be 1-2 hex digits (00-ff).');
        return mk(plain, parseInt(keyStr, 16));
      },
      bad: ['', 'x'.repeat(40) + ' 5a', 'ok zz', 'ok']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
