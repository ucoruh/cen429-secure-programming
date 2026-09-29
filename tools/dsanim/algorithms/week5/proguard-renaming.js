// CEN429 — Week 5 — Demo 5 part C (code/week-05/05-obfuscation/DirectCall.java, proguard.pro)
// ProGuard/R8 walks every member of a class and renames it to a short, meaningless name (a, b, c, …) —
// UNLESS a `-keep` rule in the configuration protects it, in which case the name is left exactly as
// written. A `-keep` rule that is too broad (e.g. matching every member of a class) defeats shrinking
// and obfuscation for everything it covers, which is exactly why real `-keep` rules stay as narrow as
// the entry point actually requires.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 5b: a DIRECT call (comparison for the bad example).',
    '// hiddenOperation() is called directly; the bytecode plainly shows',
    '// \'invokestatic ... hiddenOperation\', which cross-reference tools follow easily.',
    'public class DirectCall {',
    '',
    '    private static String hiddenOperation() {',
    '        return "hidden-result-42";',
    '    }',
    '',
    '    public static void main(String[] args) {',
    '        System.out.println("Direct call: " + hiddenOperation());',
    '    }',
    '}'
  ];
  var PRO_SRC = [
    '# CEN429 - Week 5 - Demo 5: sample ProGuard configuration',
    '# Used by demo.sh / demo.ps1 (when ProGuard has been downloaded).',
    '# Goal: \'DirectCall.main\' is kept while the unused private member',
    '# (hiddenOperation) is removed by shrinking/optimization, and the remaining',
    '# members are renamed to short, obfuscated names.',
    '',
    '-injars  output/sample.jar',
    '-outjars output/sample-obfuscated.jar',
    '# JDK 9+ module system: provide java.base as a library.',
    '-libraryjars <java.home>/jmods/java.base.jmod(!**.jar;!module-info.class)',
    '-dontwarn',
    '',
    '# KEEP the entry point; everything else is shrunk/obfuscated.',
    '-keep public class DirectCall {',
    '    public static void main(java.lang.String[]);',
    '}',
    '',
    '-optimizationpasses 3',
    '-repackageclasses \'\'',
    '-allowaccessmodification',
    '-dontusemixedcaseclassnames'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(members, keepNames) { return { members: members.slice(), keepNames: keepNames.slice() }; }

  /** a, b, c, …, z, aa, ab, … — the short names ProGuard/R8 hands out, in order. */
  function shortName(i) {
    var s = '', n = i + 1;
    while (n > 0) {
      var r = (n - 1) % 26;
      s = String.fromCharCode(97 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  /** Independent computation (a plain left-to-right assignment, does NOT call build()'s own loop): every
   * member NOT named in keepNames gets the next short name in sequence; every kept member keeps its own
   * name exactly. */
  function reference(data) {
    var map = {}, idx = 0;
    data.members.forEach(function (m) {
      if (data.keepNames.indexOf(m) >= 0) map[m] = m;
      else { map[m] = shortName(idx); idx++; }
    });
    return { map: map };
  }

  function build(S, data) {
    var members = data.members, keepNames = data.keepNames;
    var RW = 190, OW = 130, GAP_X = 40, RH = 34, Y0 = 48;

    S.label('kwLbl', { x: 0, y: 0, text: T('-keep kuralı =', '-keep rule ='), anchor: 'start', size: 13, bold: true });
    S.box('kw', { x: 0, y: 10, w: RW + GAP_X + OW, h: 34, size: 12, mono: true, style: 'dim',
      text: '-keep class * { ' + keepNames.join(', ') + (keepNames.length ? ';' : '(nothing)') + ' }' });
    S.step(T('ProGuard/R8 çalıştırılır: yapılandırma dosyasındaki `-keep` kuralı hangi üyelerin adının KORUNACAĞINI belirler.',
              'ProGuard/R8 runs: the `-keep` rule in the configuration decides which members have their name PROTECTED.'),
           { pro: [14, 15, 16] });

    for (var i = 0; i < members.length; i++) {
      S.box('m' + i, { x: 0, y: Y0 + i * RH, w: RW, h: 30, size: 13, mono: true, style: 'dim', text: members[i] });
    }
    S.at(null);

    var ref = reference(data);
    for (i = 0; i < members.length; i++) {
      var name = members[i], kept = keepNames.indexOf(name) >= 0, newName = ref.map[name];
      S.set('m' + i, { style: 'active' });
      S.at(i);
      S.box('r' + i, { x: RW + GAP_X, y: Y0 + i * RH, w: OW, h: 30, size: 13, mono: true, style: kept ? 'new' : 'hl', text: newName });
      S.arrow('a' + i, { from: 'm' + i, to: 'r' + i, kind: 'center' });
      if (kept) {
        S.step(T('`' + name + '` -keep kuralıyla eşleşiyor: adı OLDUĞU GİBİ korunuyor.',
                  '`' + name + '` matches the -keep rule: its name is kept EXACTLY as written.'),
               { pro: [14, 15, 16] });
      } else {
        S.step(T('`' + name + '` hiçbir -keep kuralıyla eşleşmiyor: kısa, anlamsız bir adla değiştiriliyor — `' + newName + '`.',
                  '`' + name + '` matches no -keep rule: it is replaced with a short, meaningless name — `' + newName + '`.'),
               { pro: [14] });
      }
      S.set('m' + i, { style: kept ? 'new' : 'del' });
    }
    S.at(null);
    S.result = reference(data);

    var renamedCount = members.length - keepNames.length;
    if (renamedCount === 0) {
      S.step(T('Sonuç: `-keep` kuralı TÜM üyeleri kapsıyor — hiçbir şey yeniden adlandırılmadı. Kural bu kadar geniş olunca gizleme hiçbir işe yaramaz.',
                'Result: the `-keep` rule covers EVERY member — nothing was renamed at all. When a rule is this broad, obfuscation accomplishes nothing.'),
             { pro: [14, 15, 16] });
    } else {
      S.step(T('Sonuç: ' + renamedCount + ' üye kısa adlarla değiştirildi, ' + keepNames.length + ' üye korundu. Çapraz-referans araçları artık gerçek adları göremiyor.',
                'Result: ' + renamedCount + ' member(s) were replaced with short names, ' + keepNames.length + ' member(s) were kept. Cross-reference tools can no longer see the real names.'),
             { java: [4] });
    }
  }

  D.define({
    id: 'proguard-renaming',
    title: T('ProGuard/R8: üye yeniden adlandırma haritası (proguard.pro)', 'ProGuard/R8: the member-renaming map (proguard.pro)'),
    code: function () { return { java: JAVA_SRC, pro: PRO_SRC }; },
    minSize: 4,
    presets: [
      { id: 'normal-one-kept', level: 'normal',
        name: T('Normal: giriş noktası korunuyor, gerisi yeniden adlandırılıyor', 'Normal: the entry point is kept, the rest is renamed'),
        data: mk(['checkLicense', 'decryptKey', 'logAccess', 'cacheToken', 'retryLimit'], ['checkLicense']) },
      { id: 'hard-nothing-kept', level: 'hard',
        name: T('Zor: hiçbir şey korunmuyor, sekiz üyenin tamamı yeniden adlandırılıyor', 'Hard: nothing is kept, all eight members are renamed'),
        data: mk(['parseInput', 'validateInput', 'normalizeInput', 'buildQuery', 'executeQuery', 'logResult', 'cleanup', 'notifyListener'], []) },
      { id: 'edge-keep-everything', level: 'edge',
        name: T('Uç durum: `-keep` çok geniş — DÖRDÜ de korunuyor, gizleme boşa gidiyor', 'Edge case: the `-keep` rule is too broad — all four are kept, obfuscation is wasted'),
        data: mk(['run', 'start', 'stop', 'reset'], ['run', 'start', 'stop', 'reset']) },
      { id: 'edge-keep-last', level: 'edge',
        name: T('Uç durum: korunan üye listenin SONUNDA', 'Edge case: the kept member is at the END of the list'),
        data: mk(['helperA', 'helperB', 'helperC', 'entryPoint'], ['entryPoint']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.members.length; },
    random: function (level, r) {
      var pool = ['checkLicense', 'decryptKey', 'logAccess', 'cacheToken', 'retryLimit', 'parseInput', 'validateInput',
                  'normalizeInput', 'buildQuery', 'executeQuery', 'logResult', 'cleanup', 'notifyListener', 'run', 'start',
                  'stop', 'reset', 'helperA', 'helperB', 'helperC', 'entryPoint', 'loadConfig', 'saveState', 'dispatchEvent'];
      function pick(n) {
        var copy = pool.slice(), out = [];
        for (var i = 0; i < n && copy.length; i++) out.push(copy.splice(D.randInt(r, 0, copy.length - 1), 1)[0]);
        return out;
      }
      var n = level === 'easy' ? D.randInt(r, 4, 5) : level === 'normal' ? D.randInt(r, 4, 6)
            : level === 'hard' ? D.randInt(r, 6, 8) : D.randInt(r, 4, 8);
      var members = pick(n);
      var keepCount = level === 'extreme' ? D.randInt(r, 0, n) : D.randInt(r, 0, 1);
      var copy2 = members.slice(), keepNames = [];
      for (var i = 0; i < keepCount && copy2.length; i++) keepNames.push(copy2.splice(D.randInt(r, 0, copy2.length - 1), 1)[0]);
      // input.format() lists :keep tags in MEMBERS order, so parse(format(data)) would reconstruct
      // keepNames in that same order -- sort here too, or the round-trip check sees a different order.
      keepNames.sort(function (a, b) { return members.indexOf(a) - members.indexOf(b); });
      return mk(members, keepNames);
    },
    input: {
      hint: T('üye1, üye2:keep, üye3, … ("keep" korunacak üyeleri işaretler)', 'member1, member2:keep, member3, … ("keep" marks the members that are protected)'),
      format: function (data) { return data.members.map(function (m) { return data.keepNames.indexOf(m) >= 0 ? m + ':keep' : m; }).join(', '); },
      tokens: function (data) { return data.members; },
      parse: function (text) {
        var toks = String(text).split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir üye adı girin.', 'Enter at least one member name.');
        if (toks.length > 12) throw T('En fazla 12 üye girin.', 'Enter at most 12 members.');
        var members = [], keepNames = [];
        for (var i = 0; i < toks.length; i++) {
          var t = toks[i], keep = /:keep$/.test(t), name = t.replace(/:keep$/, '').trim();
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || name.length > 30) throw T('"' + t + '" geçerli bir tanımlayıcı değil.', '"' + t + '" is not a valid identifier.');
          members.push(name);
          if (keep) keepNames.push(name);
        }
        return mk(members, keepNames);
      },
      bad: ['', 'x'.repeat(80), '1bad, ok', 'has space, ok']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
