// CEN429 — Week 2 — Demo 10 (code/week-02/10-log-injection/logtool.c: escape())
// CWE-117: a log line built from an untrusted field, written RAW, lets a line ending (CR/LF) inside
// that field FORGE a brand-new, standalone log record. escape() neutralizes every byte outside
// printable ASCII as \xNN — the forged text can still appear, but only trapped, visibly mangled,
// inside the real submitter's own single line.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (logtool.c 53-67, 72-95)
  var UNSAFE_C = [
    '/* UNSAFE: writes the username into the log exactly as it is (raw). */',
    'static void write_unsafe(const char *log_path, const unsigned char *name,',
    '                         size_t name_len)',
    '{',
    '    FILE *f = fopen(log_path, "ab");',
    '    if (!f) {',
    '        perror(log_path);',
    '        return;',
    '    }',
    '    /* A fixed format string; but the field\'s content is NEVER checked. */',
    '    fprintf(f, "%s AUDIT login user=", TIMESTAMP);',
    '    fwrite(name, 1, name_len, f);      /* raw: CR/LF leaks through here */',
    '    fprintf(f, " result=FAILURE\\n");',
    '    fclose(f);',
    '}'
  ];
  // UNSAFE_C is shown first in the code panel (positions 1-15), so `{c:[N]}` against it needs no offset.
  var ESCAPE_C = [
    'static void escape(const unsigned char *name, size_t name_len,',
    '                   char *out, size_t cap)',
    '{',
    '    size_t j = 0;',
    '    const size_t LIMIT = 64;          /* max logical length per field */',
    '    size_t usable = (name_len < LIMIT) ? name_len : LIMIT;',
    '    for (size_t i = 0; i < usable && j + 5 < cap; i++) {',
    '        unsigned char c = name[i];',
    '        if (c >= 0x20 && c <= 0x7E && c != \'\\\\\') {',
    '            out[j++] = (char)c;',
    '        } else if (c == \'\\\\\') {',
    '            out[j++] = \'\\\\\';',
    '            out[j++] = \'\\\\\';',
    '        } else {',
    '            j += (size_t)snprintf(out + j, cap - j, "\\\\x%02X", c);',
    '        }',
    '    }',
    '    if (name_len > LIMIT && j + 3 < cap) {',
    '        out[j++] = \'.\';',
    '        out[j++] = \'.\';',
    '        out[j++] = \'.\';',
    '    }',
    '    out[j] = \'\\0\';',
    '}'
  ];
  // ESCAPE_C is concatenated AFTER UNSAFE_C (15 lines) + 2 filler lines below, so in the combined
  // code panel it starts at position 18 (15 + 2 + 1) — see `code:` at the bottom of this file.
  var EBASE = 17; // add EBASE to escape()'s OWN 1-based line number (1..24) to get the panel position

  function mk(mode, name) { return { mode: mode, name: name }; } // name: array of {ch, code} — code = char code

  function escapeStr(bytes) {
    var LIMIT = 64, out = '';
    var usable = Math.min(bytes.length, LIMIT);
    for (var i = 0; i < usable; i++) {
      var c = bytes[i];
      if (c >= 0x20 && c <= 0x7E && c !== 0x5C) out += String.fromCharCode(c);
      else if (c === 0x5C) out += '\\\\';
      else out += '\\x' + ('0' + c.toString(16).toUpperCase()).slice(-2);
    }
    if (bytes.length > LIMIT) out += '...';
    return out;
  }

  /** Independent: counts real newline bytes (0x0A) directly to decide "how many lines would this
   * produce raw", never by calling escape()/write_unsafe() or splitting a string build() assembled. */
  function reference(data) {
    var bytes = data.name.split('').map(function (c) { return c.charCodeAt(0); });
    if (data.mode === 'unsafe') {
      var lines = 1;
      for (var i = 0; i < bytes.length; i++) if (bytes[i] === 0x0A) lines++;
      return { lines: lines, forged: bytes.indexOf(0x0A) >= 0 };
    }
    return { lines: 1, forged: false, escaped: escapeStr(bytes) };
  }

  function isPrintable(c) { return c >= 0x20 && c <= 0x7E; }
  function glyph(c) {
    if (c === 0x0A) return '\\n';
    if (c === 0x0D) return '\\r';
    if (c === 0x1B) return 'ESC';
    if (c === 0x09) return '\\t';
    return String.fromCharCode(c);
  }

  function build(S, data) {
    var bytes = data.name.split('').map(function (c) { return c.charCodeAt(0); });
    var n = bytes.length, w = 28, gap = 3, perRow = 16;
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / perRow), col = i % perRow;
      S.box('c' + i, { x: col * (w + gap), y: row * 60, w: w, h: 30, size: 12,
        text: isPrintable(bytes[i]) ? glyph(bytes[i]) : glyph(bytes[i]), style: isPrintable(bytes[i]) ? 'normal' : 'del' });
    }
    S.label('title', { x: 0, y: -20, text: T('kullanıcı alanı (dosyadan ham bayt) = ', 'the user field (raw bytes from a file) = '), anchor: 'start', size: 13, bold: true });
    S.at(0);

    if (data.mode === 'unsafe') {
      S.step(T('UNSAFE: `fwrite` alanı OLDUĞU GİBİ yazar — hiçbir bayt kontrol edilmez.',
                'UNSAFE: `fwrite` writes the field EXACTLY AS IS — not a single byte is checked.'),
             { c: [{ n: 17, note: T('!f? hayır (açma başarılı)', '!f? no (open succeeded)') }, { n: 18, skip: true }, 10, 11, 12] });
      var out = '2026-09-25 09:15:42 AUDIT login user=';
      var lineCount = 1;
      for (i = 0; i < n; i++) {
        if (bytes[i] === 0x0A) {
          S.set('c' + i, { style: 'del' });
          lineCount++;
          S.step(T('Bayt ' + i + ': satır sonu (\\n) — burada YENİ, sahte bir günlük satırı başlıyor!',
                    'Byte ' + i + ': a line ending (\\n) — a NEW, forged log line begins right here!'),
                 { c: [12] });
        } else {
          S.set('c' + i, { style: 'hl' });
        }
      }
      out += ' result=FAILURE';
      S.step(T('Sonuç: dosyada ' + lineCount + ' satır oluştu (girilen tek alan yerine) — biri sahte, bağımsız bir kayıt.',
                'Result: the file ended up with ' + lineCount + ' line(s) (instead of one field) — one of them a forged, standalone record.'),
             { c: [13] });
      S.result = reference(data);
      return;
    }

    // safe
    var usableLen = Math.min(n, 64);
    S.step(T('SAFE: her bayt önce `escape()`\'ten geçer — yazdırılabilir olmayan HER şey \\xNN olur.',
              'SAFE: every byte first goes through `escape()` — EVERYTHING non-printable becomes \\xNN.'),
           { c: [EBASE + 5, { n: EBASE + 6, note: T('name_len(' + n + ') < LIMIT(64)? ' + (n < 64 ? 'evet' : 'hayır'), 'name_len(' + n + ') < LIMIT(64)? ' + (n < 64 ? 'yes' : 'no')) },
                 { n: EBASE + 7, note: T('i(0) < usable(' + usableLen + ')? ' + (usableLen > 0 ? 'evet' : 'hayır'), 'i(0) < usable(' + usableLen + ')? ' + (usableLen > 0 ? 'yes' : 'no')) }] });
    var escaped = '';
    var limit = Math.min(n, 64);
    for (i = 0; i < limit; i++) {
      var c = bytes[i];
      S.set('c' + i, { style: 'hl' });
      if (isPrintable(c) && c !== 0x5C) {
        escaped += String.fromCharCode(c);
        if (i < 3 || !isPrintable(bytes[i - 1])) S.step(T('bayt ' + i + ' (`' + String.fromCharCode(c) + '`) yazdırılabilir — olduğu gibi kopyalanır.',
                  'byte ' + i + ' (`' + String.fromCharCode(c) + '`) is printable — copied as is.'),
                 { c: [{ n: EBASE + 9, note: T('0x20<=c<=0x7E && c!=\'\\\\\'? evet', '0x20<=c<=0x7E && c!=\'\\\\\'? yes') }, EBASE + 10, { n: EBASE + 11, skip: true }] });
      } else if (c === 0x5C) {
        escaped += '\\\\';
        S.step(T('bayt ' + i + ': ters eğik çizgi — ikiye katlanır (\\\\\\\\), böylece \\xNN ile karışmaz.',
                  'byte ' + i + ': a backslash — it is doubled (\\\\\\\\) so it can never be confused with \\xNN.'),
               { c: [{ n: EBASE + 9, note: T('yazdırılabilir && != \'\\\\\'? hayır (backslash)', 'printable && != \'\\\\\'? no (backslash)') },
                     { n: EBASE + 11, note: T('c == \'\\\\\'? evet', 'c == \'\\\\\'? yes') }, EBASE + 12, EBASE + 13] });
      } else {
        var hex = '\\x' + ('0' + c.toString(16).toUpperCase()).slice(-2);
        escaped += hex;
        S.set('c' + i, { style: 'new' });
        S.step(T('bayt ' + i + ' (' + glyph(c) + '): yazdırılamaz — `' + hex + '` olarak kaçışlanıyor.',
                  'byte ' + i + ' (' + glyph(c) + '): not printable — escaped as `' + hex + '`.'),
               { c: [{ n: EBASE + 9, note: T('yazdırılabilir mi? hayır', 'printable? no') },
                     { n: EBASE + 11, note: T('c == \'\\\\\'? hayır', 'c == \'\\\\\'? no') }, EBASE + 14, EBASE + 15] });
      }
    }
    for (i = 0; i < limit; i++) S.set('c' + i, { style: 'dim' });
    var truncated = n > 64;
    if (truncated) {
      escaped += '...';
      S.step(T('Alan 64 baytı geçiyor: geri kalanı kesilir, "..." eklenir.',
                'The field exceeds 64 bytes: the rest is truncated, "..." is appended.'),
             { c: [{ n: EBASE + 18, note: T('name_len(' + n + ') > LIMIT(64)? evet', 'name_len(' + n + ') > LIMIT(64)? yes') }, EBASE + 19, EBASE + 20, EBASE + 21] });
    } else {
      S.step(T('Alan 64 baytı geçmiyor: kesme işareti eklenmez.', 'The field does not exceed 64 bytes: no truncation marker is appended.'),
             { c: [{ n: EBASE + 18, note: T('name_len(' + n + ') > LIMIT(64)? hayır', 'name_len(' + n + ') > LIMIT(64)? no') }, { n: EBASE + 19, skip: true }] });
    }
    S.label('escaped', { x: 0, y: Math.ceil(n / perRow) * 60 + 20, text: 'user=' + escaped, anchor: 'start', size: 13, mono: true, style: 'new' });
    S.step(T('Sonuç: TEK satır garanti — kaçışlanmış metin, gönderenin kendi satırının İÇİNDE kalıyor.',
              'Result: a SINGLE line, guaranteed — the escaped text stays TRAPPED inside the submitter\'s own line.'),
           { c: [EBASE + 23] });
    S.result = reference(data);
  }

  var PRINTABLE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function randPrintable(r) { return PRINTABLE.charAt(D.randInt(r, 0, PRINTABLE.length - 1)); }

  D.define({
    id: 'log-injection',
    title: T('Günlük enjeksiyonu ve kaçışlama (logtool.c)', 'Log injection and escaping (logtool.c)'),
    code: { c: UNSAFE_C.concat(['', '// -- the SAFE path escapes first (logtool.c 72-95): --']).concat(ESCAPE_C) },
    presets: [
      { id: 'normal-unsafe-injection', level: 'normal',
        name: T('Normal: UNSAFE — satır sonu sahte bir kayıt oluşturuyor', 'Normal: UNSAFE — a line ending forges a new record'),
        data: mk('unsafe', 'bob\n2026-09-25 09:15:42 AUDIT login user=admin result=SUCCESS') },
      { id: 'hard-safe-same-injection', level: 'hard',
        name: T('Zor: SAFE — AYNI saldırı, kaçışlanınca zararsız', 'Hard: SAFE — the SAME attack, harmless once escaped'),
        data: mk('safe', 'bob\n2026-09-25 09:15:42 AUDIT login user=admin result=SUCCESS') },
      { id: 'edge-control-characters', level: 'edge',
        name: T('Uç durum: SAFE — ANSI kaçış dizisi + satırbaşı', 'Edge case: SAFE — an ANSI escape sequence + carriage return'),
        data: mk('safe', 'carol\u001b[2K\rhidden-admin-takeover-attempt') },
      { id: 'edge-plain-name-no-attack', level: 'edge',
        name: T('Uç durum: SAFE — sıradan bir kullanıcı adı, kaçışlama görünmez', 'Edge case: SAFE — an ordinary username, escaping is invisible'),
        data: mk('safe', 'alice.johnson-2026') },
      { id: 'edge-too-long-truncated', level: 'edge',
        name: T('Uç durum: SAFE — 70 baytlık alan, 64\'te kesiliyor', 'Edge case: SAFE — a 70-byte field, truncated at 64'),
        data: mk('safe', new Array(71).join('A')) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.name.length; },
    random: function (level, r) {
      var mode = level === 'hard' || level === 'extreme' ? (r() < 0.5 ? 'unsafe' : 'safe') : 'safe';
      var n = level === 'easy' ? D.randInt(r, 10, 16) : level === 'normal' ? D.randInt(r, 12, 20) :
              level === 'hard' ? D.randInt(r, 16, 30) : D.randInt(r, 20, 40);
      var s = '';
      for (var i = 0; i < n; i++) {
        var roll = r();
        if (level !== 'easy' && roll < 0.08) s += '\n';
        else if (level === 'extreme' && roll < 0.13) s += String.fromCharCode(D.randInt(r, 0, 8));
        else s += randPrintable(r);
      }
      return mk(mode, s);
    },
    input: {
      hint: T('unsafe|safe : "tırnak içinde JSON dizgesi" (kontrol karakterleri \\n, \\r, \\u001b olarak yazılır)',
              'unsafe|safe : "a JSON-quoted string" (control characters as \\n, \\r, \\u001b)'),
      // A JSON-quoted string (not a raw \n-only replace) round-trips EVERY control byte correctly —
      // including \r and ESC (0x1B), which a plain "." regex cannot span (JS treats them as line
      // terminators for "."), unlike \n which was the only byte the simpler version handled.
      format: function (data) { return data.mode + ' : ' + JSON.stringify(data.name); },
      tokens: function (data) { return data.name.split(''); },
      parse: function (text) {
        var m = String(text).match(/^(unsafe|safe)\s*:\s*([\s\S]+)$/);
        if (!m) throw T('"unsafe|safe : "metin"" biçiminde olmalı.', 'Must be \'unsafe|safe : "text"\'.');
        var name;
        try { name = JSON.parse(m[2].trim()); } catch (e) { throw T('metin tırnak içinde geçerli bir JSON dizgesi olmalı.', 'the text must be a valid, quoted JSON string.'); }
        if (typeof name !== 'string' || !name) throw T('Metin boş olamaz.', 'The text cannot be empty.');
        return mk(m[1], name);
      },
      bad: ['', 'maybe : "text"', 'unsafe : ', 'safe : notquoted']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
