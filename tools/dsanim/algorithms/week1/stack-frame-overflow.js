// CEN429 — Week 1 — A stack frame, and what an overflow overwrites
// Reference: docs/week-1/cen429-week-1.{tr,en}.md, section 14, "Yigin (stack) bir tasma adim adim". A stack
// frame holds, side by side, the function's local variables, the saved frame pointer (the caller's frame) and
// the return address (where execution resumes when the function ends). strcpy(buffer, name) never checks the
// 16-byte bound: a little overflow flips `authorized`; a lot corrupts the saved frame pointer and, eventually,
// the return address itself — the classic "smashing the stack" (Aleph One, 1996).
(function (D) {
  'use strict';
  var T = D.T;

  var CODE_C = [
    'void greet_user(const char *name)',
    '{',
    '    int  authorized = 0;',
    '    char buffer[16];',
    '',
    '    strcpy(buffer, name);          /* what if name is longer than 16 bytes? */',
    '    printf("Hello %s\\n", buffer);',
    '    if (authorized) { /* ... */ }',
    '}'
  ];
  var L = { init: 3, decl: 4, strcpy: 6, printf: 7, ifauth: 8 };

  function mk(name) { return { name: name }; }

  function hexByte(n) { return D.hex(n & 0xff, 2); }

  /** Independent computation (a flat byte-array overlay), distinct from build()'s per-byte drawing loop. */
  function reference(data) {
    var name = data.name, total = name.length + 1;   // strcpy copies name.length chars, then one NUL
    var buf = [];
    for (var i = 0; i < total; i++) buf[i] = i < name.length ? name.charCodeAt(i) : 0;
    var b16 = buf[16] || 0, b17 = buf[17] || 0, b18 = buf[18] || 0, b19 = buf[19] || 0;
    var authorizedValue = (b16 | (b17 << 8) | (b18 << 16) | (b19 << 24)) >>> 0;
    return {
      fits: total <= 16,
      authorizedValue: authorizedValue,
      framePointerCorrupted: total > 20,
      returnAddressCorrupted: total > 28
    };
  }

  function build(S, data) {
    var name = data.name;
    var SW = 30, SGAP = 3, SY = 0;
    var BW = 28, BGAP = 2, BY = 110;

    S.label('srcLbl', { x: -14, y: SY + 22, text: 'name =', anchor: 'end', size: 14, mono: true });
    for (var k = 0; k < name.length; k++) {
      S.box('s' + k, { x: k * (SW + SGAP), y: SY, w: SW, h: 30, size: 14, mono: true, text: name[k], style: 'normal' });
    }

    var initBytes = [];
    for (k = 0; k < 16; k++) initBytes.push(k % 4 === 0 ? { addr: 0x7000 + k, above: String(k) } : {});
    S.memRow('b', initBytes, { x: 0, y: BY, w: BW, h: 34, size: 12, gap: BGAP });
    var authX = 16 * (BW + BGAP);
    S.box('authorized', { x: authX, y: BY, w: 4 * BW, h: 34, size: 12, mono: true, text: '00 00 00 00', style: 'normal' });
    var fpX = authX + 4 * BW + 10;
    S.box('savedfp', { x: fpX, y: BY, w: 8 * BW, h: 34, size: 12, mono: true, text: T('kaydedilmiş çerçeve göstericisi', 'saved frame pointer'), style: 'normal' });
    var raX = fpX + 8 * BW + 10;
    S.box('retaddr', { x: raX, y: BY, w: 8 * BW, h: 34, size: 12, mono: true, text: T('dönüş adresi', 'return address'), style: 'normal' });

    S.brace('brBuf', { from: 'b0', to: 'b15', text: 'buffer[16]', side: 'bottom' });
    S.brace('brAuth', { from: 'authorized', to: 'authorized', text: 'authorized (4)', side: 'bottom' });
    S.brace('brFp', { from: 'savedfp', to: 'savedfp', text: T('çerçeve göstericisi (8)', 'frame pointer (8)'), side: 'bottom' });
    S.brace('brRa', { from: 'retaddr', to: 'retaddr', text: T('dönüş adresi (8)', 'return address (8)'), side: 'bottom' });

    S.step(T('`greet_user` çağrılır. Yığında bir çerçeve oluşur: `buffer[16]`, `authorized`, çağıranın çerçeve göstericisi, ve fonksiyon bitince gidilecek `dönüş adresi` — hepsi YAN YANA.',
              '`greet_user` is called. A stack frame is created: `buffer[16]`, `authorized`, the caller\'s saved frame pointer, and the `return address` to jump to when the function ends — all SIDE BY SIDE.'),
           { c: [L.init, L.decl] });

    var pointer = S.pointer('cursor', { target: 'b0', side: 'top', text: T('yazılıyor', 'writing') });
    var total = name.length + 1, tail = ['authorized', 'savedfp', 'retaddr'];
    var authBytes = [0, 0, 0, 0];
    var reachedAuth = false, reachedFp = false, reachedRa = false;
    for (var i = 0; i < total; i++) {
      var isNul = i === name.length;
      var ch = isNul ? 0 : name.charCodeAt(i);
      var chDisplay = isNul ? '\\0' : name[i];
      if (i < 16) {
        S.set('b' + i, { text: hexByte(ch), above: chDisplay, style: i + 1 === total ? 'new' : 'new' });
        S.set('cursor', { target: 'b' + i });
        if (i < name.length) S.at(i);
        var cap = isNul
          ? T('`strcpy` sonlandırıcı `\\0`\'ı yazıyor — henüz `buffer` içinde, sınırlar içinde.', 'strcpy writes the terminating `\\0` — still inside `buffer`, in bounds.')
          : T('`strcpy` bayt ' + (i + 1) + ': `' + chDisplay + '` — `buffer[' + i + ']` içinde.', 'strcpy byte ' + (i + 1) + ': `' + chDisplay + '` — inside `buffer[' + i + ']`.');
        S.step(cap, { c: [L.strcpy] });
      } else if (i < 20) {
        if (!reachedAuth) { reachedAuth = true; S.set('authorized', { style: 'del', text: '' }); }
        authBytes[i - 16] = ch;
        S.set('authorized', { text: authBytes.map(hexByte).join(' ') });
        S.set('cursor', { target: 'authorized' });
        if (i < name.length) S.at(i);
        S.step(T('`strcpy` bayt ' + (i + 1) + ': `buffer[16]` YOK — bu bayt `authorized`\'ın içine taşıyor (offset ' + i + ').',
                  'strcpy byte ' + (i + 1) + ': there is no `buffer[16]` — this byte spills into `authorized` (offset ' + i + ').'),
               { c: [L.strcpy] });
      } else if (i < 28) {
        if (!reachedFp) { reachedFp = true; S.set('savedfp', { style: 'del', text: T('BOZULDU', 'CORRUPTED') }); }
        S.set('cursor', { target: 'savedfp' });
        if (i < name.length) S.at(i);
        S.step(T('`strcpy` bayt ' + (i + 1) + ': `authorized`\'ın da ötesine geçti — şimdi çağıranın kaydedilmiş çerçeve göstericisini eziyor.',
                  'strcpy byte ' + (i + 1) + ': past `authorized` too — now smashing the caller\'s saved frame pointer.'),
               { c: [L.strcpy] });
      } else {
        if (!reachedRa) { reachedRa = true; S.set('retaddr', { style: 'del', text: T('BOZULDU', 'CORRUPTED') }); }
        S.set('cursor', { target: 'retaddr' });
        if (i < name.length) S.at(i);
        S.step(T('`strcpy` bayt ' + (i + 1) + ': DÖNÜŞ ADRESİNİ eziyor — fonksiyon bitince işlemci artık rastgele bir adrese atlayacak.',
                  'strcpy byte ' + (i + 1) + ': smashing the RETURN ADDRESS itself — when the function ends the processor will jump to an unpredictable address.'),
               { c: [L.strcpy] });
      }
    }
    S.remove('cursor');
    S.at(null);
    S.result = reference(data);

    if (S.result.returnAddressCorrupted) {
      S.step(T('Fonksiyon `return` yapmaya çalışır: dönüş adresi geçerli bir kod adresi değil -> **çökme** (korumasız bir sistemde akış ele geçirilebilir).',
                'The function tries to `return`: the return address is not a valid code address -> **crash** (on an unprotected system, control flow can be hijacked).'),
             { c: [] });
    } else if (S.result.framePointerCorrupted) {
      S.step(T('Çerçeve göstericisi bozuldu; fonksiyon dönünce çağıranın YEREL DEĞİŞKENLERİ artık yanlış yerden okunur.',
                'The frame pointer is corrupted; once the function returns, the CALLER\'S LOCAL VARIABLES are now read from the wrong place.'),
             { c: [] });
    } else if (!S.result.fits && S.result.authorizedValue !== 0) {
      S.step(T('`authorized` = ' + S.result.authorizedValue + ' (0x' + D.hex(S.result.authorizedValue, 8) + ') — sıfır değil: **mantık bozuldu**, yetkisiz kullanıcı yetkili sayılır.',
                'authorized = ' + S.result.authorizedValue + ' (0x' + D.hex(S.result.authorizedValue, 8) + ') — nonzero: **the logic breaks**, an unauthorized user is treated as authorized.'),
             { c: [{ n: L.ifauth, note: T('authorized (' + S.result.authorizedValue + ') != 0? evet → koşullu blok çalışır', 'authorized (' + S.result.authorizedValue + ') != 0? yes -> the conditional block runs') }] });
    } else if (!S.result.fits) {
      S.step(T('Taşma oldu (sınır dışı yazma, tanımsız davranış) ama rastlantıyla `authorized` yine 0 — yine de bu bir hata, ASan "stack-buffer-overflow" der.',
                'An overflow happened (out-of-bounds write, undefined behavior) but by coincidence authorized is still 0 — still a bug, ASan calls it a "stack-buffer-overflow".'),
             { c: [{ n: L.ifauth, note: T('authorized (0) != 0? hayır → koşullu blok atlanır (rastlantı)', 'authorized (0) != 0? no -> the conditional block is skipped (coincidence)') }] });
    } else {
      S.step(T(name.length + ' karakter 16 baytlık `buffer`\'a rahatça sığıyor; taşma yok, `authorized` = 0, program doğru çalışır.',
                name.length + ' characters fit comfortably in the 16-byte `buffer`; no overflow, authorized = 0, the program works correctly.'),
             { c: [L.printf, { n: L.ifauth, note: T('authorized (0) != 0? hayır → koşullu blok atlanır', 'authorized (0) != 0? no -> the conditional block is skipped') }] });
    }
  }

  D.define({
    id: 'stack-frame-overflow',
    title: T('Yığın çerçevesi ve dönüş adresi (greet_user)', 'A stack frame and the return address (greet_user)'),
    code: { c: CODE_C },
    presets: [
      { id: 'fits', level: 'normal', name: T('Uyar: 12 karakter, sınırlar içinde', 'Fits: 12 characters, in bounds'), data: mk('alice_baker1') },
      { id: 'authorized-flip', level: 'hard', name: T('Zor: 17 bayt, authorized eziliyor', 'Hard: 17 bytes, authorized is smashed'), data: mk('attacker_name_pwn'.slice(0, 17)) },
      { id: 'frame-corrupt', level: 'edge', name: T('Uç durum: 24 bayt, çerçeve göstericisi bozuluyor', 'Edge case: 24 bytes, the frame pointer is corrupted'), data: mk('B'.repeat(24)) },
      { id: 'return-corrupt', level: 'edge', name: T('Uç durum: 34 bayt, dönüş adresi eziliyor (çökme)', 'Edge case: 34 bytes, the return address is smashed (crash)'), data: mk('C'.repeat(34)) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.name.length; },
    random: function (level, r) {
      var ranges = { easy: [10, 15], normal: [10, 20], hard: [17, 28], extreme: [17, 45] };
      var rg = ranges[level] || ranges.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
      var s = '';
      for (var i = 0; i < n; i++) s += chars[D.randInt(r, 0, chars.length - 1)];
      return mk(s);
    },
    input: {
      hint: T('name (10-48 karakter)', 'name (10-48 characters)'),
      format: function (data) { return data.name; },
      tokens: function (data) { return data.name.split(''); },
      parse: function (text) {
        var s = String(text);
        if (!s.length) throw T('İsim boş olamaz.', 'The name cannot be empty.');
        if (s.length > 48) throw T('İsim en fazla 48 karakter olabilir (gösterim için).', 'The name may be at most 48 characters (for display).');
        if (/\s/.test(s)) throw T('İsimde boşluk olamaz.', 'The name cannot contain whitespace.');
        if (!/^[\x20-\x7e]+$/.test(s)) throw T('Yalnızca yazdırılabilir ASCII karakterler kullanın.', 'Use printable ASCII characters only.');
        return mk(s);
      },
      bad: ['', '   ', 'has space', 'x'.repeat(60)]
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
