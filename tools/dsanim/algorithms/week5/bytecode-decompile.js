// CEN429 — Week 5 — Demo 4 (code/week-05/04-bytecode-decompile/LicenseCheck.java)
// javac compiles a source method into a short sequence of bytecode instructions; javap -c -p reads that
// sequence back WITHOUT the source and shows exactly what it does. Each bytecode instruction maps
// one-to-one onto a fragment of the original source: a decompiler (or a human reading javap's output)
// reconstructs the method from these fragments alone — constants, names and logic all come back.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 4: bytecode and decompiling',
    '//',
    '// A small "license/PIN check". Purpose: to show how openly a compiled .class',
    '// file reads even without source, using \'javap -c -p\'. Constant strings (PIN,',
    '// license key), private field/method names and the branch logic are all',
    '// plainly visible in the bytecode.',
    '//',
    '// ALL values are synthetic; none of them is a real product/key.',
    'public class LicenseCheck {',
    '',
    '    // Secrets EMBEDDED in the code: plainly visible in the bytecode (bad example).',
    '    private static final String VALID_PIN = "4729";',
    '    private static final String LICENSE_KEY = "PRO-2026-DEMO";',
    '',
    '    static boolean pinCorrect(String entered) {',
    '        return VALID_PIN.equals(entered);',
    '    }',
    '',
    '    static boolean licenseValid(String key) {',
    '        return LICENSE_KEY.equals(key);',
    '    }',
    '',
    '    public static void main(String[] args) {',
    '        String pin = (args.length > 0) ? args[0] : "0000";',
    '        System.out.println("Entered PIN     : " + pin);',
    '        System.out.println("PIN correct?    : " + pinCorrect(pin));',
    '        System.out.println("License PRO?    : "',
    '                + (licenseValid(LICENSE_KEY) ? "YES (PRO)" : "NO"));',
    '    }',
    '}'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(method, candidate) { return { method: method, candidate: candidate }; }

  var METHODS = {
    pin: {
      line: 16, sig: 'pinCorrect(String entered)', constant: 'VALID_PIN', constantValue: '4729', param: 'entered',
      bytecode: [
        { off: '0', text: 'ldc      #9   // String "4729"' },
        { off: '2', text: 'aload_0        // entered' },
        { off: '3', text: 'invokevirtual  // String.equals' },
        { off: '6', text: 'ireturn' }
      ],
      decompiled: ['VALID_PIN', 'entered', 'VALID_PIN.equals(entered)', 'return ...;']
    },
    license: {
      line: 20, sig: 'licenseValid(String key)', constant: 'LICENSE_KEY', constantValue: 'PRO-2026-DEMO', param: 'key',
      bytecode: [
        { off: '0', text: 'ldc      #17  // String "PRO-2026-DEMO"' },
        { off: '2', text: 'aload_0        // key' },
        { off: '3', text: 'invokevirtual  // String.equals' },
        { off: '6', text: 'ireturn' }
      ],
      decompiled: ['LICENSE_KEY', 'key', 'LICENSE_KEY.equals(key)', 'return ...;']
    }
  };

  /** Independent computation (a plain string comparison against the two constants, does NOT call
   * build()'s own instruction-by-instruction walkthrough): pinCorrect/licenseValid both do exactly
   * one thing -- compare the candidate against one fixed constant. */
  function reference(data) {
    var m = METHODS[data.method];
    return { match: data.candidate === m.constantValue };
  }

  function build(S, data) {
    var m = METHODS[data.method];
    var BW = 250, DW = 220, GAP_X = 40, RH = 24, Y0 = 4;

    S.label('sigLbl', { x: 0, y: -10, text: T('bayt kodu (javap -c -p) — kaynak kod OLMADAN', 'bytecode (javap -c -p) — WITHOUT the source'), anchor: 'start', size: 12, bold: true });
    S.label('decLbl', { x: BW + GAP_X, y: -10, text: T('yeniden kurulan kaynak parçası', 'reconstructed source fragment'), anchor: 'start', size: 12, bold: true });

    for (var i = 0; i < m.bytecode.length; i++) {
      S.box('bc' + i, { x: 0, y: Y0 + i * RH, w: BW, h: 20, size: 12, mono: true, style: 'dim', text: m.bytecode[i].off + ': ' + m.bytecode[i].text });
    }
    S.step(T('`javap -c -p` çağrılır: `' + m.sig + '` metodunun bayt kodu, kaynak kod hiç OLMADAN listeleniyor.',
              '`javap -c -p` is invoked: the bytecode of `' + m.sig + '` is listed WITHOUT the source ever being available.'),
           { java: [m.line] });

    for (i = 0; i < m.bytecode.length; i++) {
      S.set('bc' + i, { style: 'active' });
      S.box('dc' + i, { x: BW + GAP_X, y: Y0 + i * RH, w: DW, h: 20, size: 12, mono: true, style: 'hl', text: m.decompiled[i] });
      S.arrow('ar' + i, { from: 'bc' + i, to: 'dc' + i, kind: 'center' });
      S.at(i);
      var capMap = [
        T('`ldc` bir sabiti yığına ittiriyor — bu, kaynakta `' + m.constant + '` sabitine karşılık gelir (değeri `' + m.constantValue + '`).',
          '`ldc` pushes a constant onto the stack — in the source this corresponds to the `' + m.constant + '` constant (value `' + m.constantValue + '`).'),
        T('`aload_0` metodun ilk parametresini yığına ittiriyor — kaynakta bu, `' + m.param + '` parametresidir.',
          '`aload_0` pushes the method\'s first parameter onto the stack — in the source this is the `' + m.param + '` parameter.'),
        T('`invokevirtual` yığındaki iki değer üzerinde `.equals(...)` çağırıyor — kaynakta `' + m.decompiled[2] + '`.',
          '`invokevirtual` calls `.equals(...)` on the two stack values — in the source, `' + m.decompiled[2] + '`.'),
        T('`ireturn` sonucu döndürüyor — kaynakta `return` deyimi.',
          '`ireturn` returns the result — in the source, the `return` statement.')
      ];
      S.step(capMap[i], { java: [m.line] });
      S.set('bc' + i, { style: 'new' });
    }
    S.at(null);

    var summaryY = Y0 + m.bytecode.length * RH + 4;
    S.box('recon', { x: 0, y: summaryY, w: BW + GAP_X + DW, h: 24, size: 12, mono: true, style: 'new',
      text: 'return ' + m.decompiled[2] + ';' });
    S.step(T('Dört bayt kodu komutundan kaynak TAMAMEN yeniden kurulabiliyor: `return ' + m.decompiled[2] + ';` — bu, `LicenseCheck.java`\'nın gerçek satırıyla birebir aynı.',
              'From these four bytecode instructions the source is FULLY reconstructed: `return ' + m.decompiled[2] + ';` — this is byte-for-byte the same as the real line in `LicenseCheck.java`.'),
           { java: [m.line] });

    S.result = reference(data);
    S.box('run', { x: 0, y: summaryY + 28, w: BW + GAP_X + DW, h: 24, size: 12, mono: true, style: S.result.match ? 'new' : 'del',
      text: m.sig.split('(')[0] + '("' + data.candidate + '") = ' + S.result.match });
    S.step(T('Bu mantığı `"' + data.candidate + '"` ile çalıştırırsak: `' + (S.result.match ? 'true' : 'false') + '` — bytecode\'dan okuduğumuz mantık, programın gerçek çalışma zamanı davranışıyla birebir eşleşir.',
              'Running this logic with `"' + data.candidate + '"`: `' + (S.result.match ? 'true' : 'false') + '` — the logic we read from the bytecode matches the program\'s real run-time behaviour exactly.'),
           { java: [m.line] });
  }

  D.define({
    id: 'bytecode-decompile',
    title: T('Bayt kodundan kaynağa: javap ile eşleme (LicenseCheck.java)', 'From bytecode to source: mapping with javap (LicenseCheck.java)'),
    code: function () { return { java: JAVA_SRC }; },
    minSize: 4,
    presets: [
      { id: 'normal-pin-wrong-guess', level: 'normal',
        name: T('Normal: PIN kontrolü, yanlış tahmin ("1234")', 'Normal: the PIN check, a wrong guess ("1234")'),
        data: mk('pin', '1234') },
      { id: 'hard-pin-correct', level: 'hard',
        name: T('Zor: PIN kontrolü, DOĞRU değer ("4729")', 'Hard: the PIN check, the CORRECT value ("4729")'),
        data: mk('pin', '4729') },
      { id: 'edge-license-correct', level: 'edge',
        name: T('Uç durum: lisans kontrolü, doğru anahtar', 'Edge case: the license check, the correct key'),
        data: mk('license', 'PRO-2026-DEMO') },
      { id: 'edge-license-wrong-year', level: 'edge',
        name: T('Uç durum: lisans kontrolü, yanlış yıl', 'Edge case: the license check, the wrong year'),
        data: mk('license', 'PRO-2025-DEMO') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return 4; },
    random: function (level, r) {
      var method = D.randInt(r, 0, 1) === 0 ? 'pin' : 'license';
      var m = METHODS[method];
      var correct = D.randInt(r, 0, 1) === 0;
      if (correct) return mk(method, m.constantValue);
      if (method === 'pin') {
        var digits = '0123456789', s = '';
        for (var i = 0; i < 4; i++) s += digits.charAt(D.randInt(r, 0, 9));
        return mk(method, s === m.constantValue ? '0000' : s);
      }
      var years = ['2024', '2025', '2027', '2028'];
      return mk(method, 'PRO-' + years[D.randInt(r, 0, years.length - 1)] + '-DEMO');
    },
    input: {
      hint: T('metot ve aday değer, örn. "pin 4729" ya da "license PRO-2026-DEMO"', 'method and candidate, e.g. "pin 4729" or "license PRO-2026-DEMO"'),
      format: function (data) { return data.method + ' ' + data.candidate; },
      tokens: function (data) { return METHODS[data.method].bytecode.map(function (b) { return b.off + ': ' + b.text; }); },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 2) throw T('"pin <değer>" ya da "license <değer>" biçiminde olmalı.', 'Must be "pin <value>" or "license <value>".');
        var method = parts[0].toLowerCase();
        if (method !== 'pin' && method !== 'license') throw T('Metot "pin" ya da "license" olmalı.', 'Method must be "pin" or "license".');
        var candidate = parts[1];
        if (candidate.length > 20) throw T('Aday değer en fazla 20 karakter olabilir.', 'The candidate may be at most 20 characters.');
        if (!/^[\x21-\x7e]+$/.test(candidate)) throw T('Yalnızca yazdırılabilir, boşluksuz ASCII karakterler kullanın.', 'Use only printable, non-whitespace ASCII characters.');
        return mk(method, candidate);
      },
      bad: ['', 'badmethod 123', 'pin', 'pin has space']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
