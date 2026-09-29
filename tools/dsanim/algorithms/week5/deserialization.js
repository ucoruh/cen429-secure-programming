// CEN429 — Week 5 — Demo 7 (code/week-05/07-deserialization/SerializationDemo.java)
// A serialized byte stream carries its own class descriptor: whoever built the bytes decides which class
// gets instantiated, not the program reading them (CWE-502). Deserializing without a filter builds
// WHATEVER class the stream names. An allow-list filter (ObjectInputFilter) checks that class name
// against a pattern BEFORE the object graph is built, and rejects anything not on the list.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var JAVA_SRC = [
    '// CEN429 - Week 5 - Demo 7: safe deserialization',
    '//',
    '// Deserializing untrusted data without a filter is DANGEROUS: the incoming',
    '// byte stream can construct classes we never expected (a gadget chain ->',
    '// remote code execution). This demo does NOT write a malicious chain; it only',
    '// shows the fix: use ObjectInputFilter to allow-list only the EXPECTED',
    '// classes and reject everything else.',
    '//',
    '// Every class here is harmless (it only holds data). Nothing touches disk,',
    '// network or the system.',
    'import java.io.ByteArrayInputStream;',
    'import java.io.ByteArrayOutputStream;',
    'import java.io.InvalidClassException;',
    'import java.io.ObjectInputFilter;',
    'import java.io.ObjectInputStream;',
    'import java.io.ObjectOutputStream;',
    'import java.io.Serializable;',
    '',
    'public class SerializationDemo {',
    '',
    '    // EXPECTED (allowed) class: holds just two fields.',
    '    static class Setting implements Serializable {',
    '        private static final long serialVersionUID = 1L;',
    '        String name;',
    '        int value;',
    '        Setting(String name, int value) { this.name = name; this.value = value; }',
    '        public String toString() { return "Setting(name=" + name + ", value=" + value + ")"; }',
    '    }',
    '',
    '    // UNEXPECTED class: in a real attack this would be a "gadget"; harmless here.',
    '    static class OtherClass implements Serializable {',
    '        private static final long serialVersionUID = 1L;',
    '        String payload = "unexpected-class";',
    '        public String toString() { return "OtherClass(payload=" + payload + ")"; }',
    '    }',
    '',
    '    static void line() {',
    '        System.out.println("--------------------------------------------"',
    '                + "------------------");',
    '    }',
    '',
    '    static byte[] serialize(Object o) throws Exception {',
    '        ByteArrayOutputStream bos = new ByteArrayOutputStream();',
    '        try (ObjectOutputStream oos = new ObjectOutputStream(bos)) {',
    '            oos.writeObject(o);',
    '        }',
    '        return bos.toByteArray();',
    '    }',
    '',
    '    // BAD: no filter. EVERY class in the stream gets instantiated.',
    '    static void deserializeBad(byte[] data, String label) {',
    '        try (ObjectInputStream ois = new ObjectInputStream(',
    '                new ByteArrayInputStream(data))) {',
    '            Object o = ois.readObject();',
    '            System.out.println("   [" + label + "] ACCEPTED -> " + o',
    '                    + "  (" + o.getClass().getSimpleName() + ")");',
    '        } catch (Exception e) {',
    '            System.out.println("   [" + label + "] error: " + e.getClass()',
    '                    .getSimpleName());',
    '        }',
    '    }',
    '',
    '    // GOOD (the allow-list itself, as a pure function so it is unit-testable',
    '    // without needing a stream): only Setting + java.base classes are allowed,',
    '    // everything else is rejected.',
    '    static ObjectInputFilter buildAllowListFilter() {',
    '        return ObjectInputFilter.Config.createFilter(',
    '                "SerializationDemo$Setting;java.base/*;!*");',
    '    }',
    '',
    '    // GOOD: only allow Setting + java.base classes; reject everything else.',
    '    static void deserializeSecure(byte[] data, String label) {',
    '        ObjectInputFilter filter = buildAllowListFilter();',
    '        try (ObjectInputStream ois = new ObjectInputStream(',
    '                new ByteArrayInputStream(data))) {',
    '            ois.setObjectInputFilter(filter);',
    '            Object o = ois.readObject();',
    '            System.out.println("   [" + label + "] ACCEPTED -> " + o);',
    '        } catch (InvalidClassException e) {',
    '            System.out.println("   [" + label + "] REJECTED (filter): "',
    '                    + "unexpected class blocked.");',
    '        } catch (Exception e) {',
    '            System.out.println("   [" + label + "] REJECTED: "',
    '                    + e.getClass().getSimpleName());',
    '        }',
    '    }',
    '',
    '    public static void main(String[] args) throws Exception {',
    '        byte[] expected = serialize(new Setting("timeout", 30));',
    '        byte[] unexpected = serialize(new OtherClass());',
    '',
    '        line();',
    '        System.out.println("STEP 1 - UNFILTERED deserialization (bad): every class accepted");',
    '        deserializeBad(expected, "expected Setting");',
    '        deserializeBad(unexpected, "unexpected OtherClass");',
    '        System.out.println("   ^ Without a filter, EVERY class in the stream is built;");',
    '        System.out.println("     in a real attack this could have been a gadget chain.");',
    '',
    '        line();',
    '        System.out.println("STEP 2 - With ObjectInputFilter (good): allow-list");',
    '        deserializeSecure(expected, "expected Setting");',
    '        deserializeSecure(unexpected, "unexpected OtherClass");',
    '        System.out.println("   ^ Only the expected class got through; the other was rejected.");',
    '',
    '        line();',
    '        System.out.println("Result: do not deserialize untrusted data without a filter.");',
    '        System.out.println("Best: use a DATA format like JSON instead of Java serialization;");',
    '        System.out.println("if you must, allow-list the classes with ObjectInputFilter.");',
    '    }',
    '}'
  ];

  // ------------------------------------------------------------------ data + reference
  function mk(className, secure) { return { className: className, secure: !!secure }; }
  var FILTER_PATTERN = 'SerializationDemo$Setting;java.base/*;!*';

  /** build()'s own per-className decision, used for the ON-SCREEN styling and captions only. */
  function isAllowedClass(className) {
    return className === 'SerializationDemo$Setting' || className.indexOf('java.base/') === 0;
  }

  /** Independent computation for the TEST (does NOT call isAllowedClass() — that helper is also used by
   * build() for its own styling decision, so a bug in it must not be able to hide from this check):
   * splits the pattern string "SerializationDemo$Setting;java.base/*;!*" into its ';'-separated clauses
   * by hand and matches each clause against the class name using a DIFFERENT primitive (substring
   * comparison via indexOf/slice, never the shared function above). */
  var FILTER_CLAUSES = FILTER_PATTERN.split(';'); // ['SerializationDemo$Setting', 'java.base/*', '!*']
  function clauseMatches(clause, className) {
    if (clause.charAt(clause.length - 1) === '*') {
      var prefix = clause.slice(0, -1);
      return className.slice(0, prefix.length) === prefix;
    }
    return className === clause;
  }
  function reference(data) {
    if (!data.secure) return { instantiated: true, rejected: false };
    var ok = false;
    for (var i = 0; i < FILTER_CLAUSES.length; i++) {
      var clause = FILTER_CLAUSES[i];
      if (clause.charAt(0) === '!') break;      // '!*' : default-deny, stop matching allow clauses
      if (clauseMatches(clause, data.className)) { ok = true; break; }
    }
    return { instantiated: ok, rejected: !ok };
  }

  function build(S, data) {
    var cn = data.className, secure = data.secure;
    var bytes = [];
    for (var i = 0; i < 8; i++) bytes.push({ value: (cn.charCodeAt(i % cn.length) + i * 7) & 0xff });
    S.label('streamLbl', { x: -14, y: 17, text: T('gelen bayt akışı =', 'incoming byte stream ='), anchor: 'end', size: 13, mono: true });
    S.memRow('b', bytes, { x: 0, y: 0, w: 26, h: 32, size: 12, addrs: false });
    S.at(null);
    S.step(T((secure ? '`deserializeSecure(data, label)`' : '`deserializeBad(data, label)`') + ' çağrılır: `readObject()` bayt akışını okumaya başlar.',
              (secure ? '`deserializeSecure(data, label)`' : '`deserializeBad(data, label)`') + ' is called: `readObject()` starts reading the byte stream.'),
           secure ? { java: [72, 77] } : { java: [51, 54] });

    var clsW = Math.max(150, cn.length * 9 + 20);
    S.label('clsLbl', { x: -14, y: 90, text: T('akıştaki sınıf adı =', 'class name in the stream ='), anchor: 'end', size: 13, mono: true });
    S.box('cls', { x: 0, y: 70, w: clsW, h: 36, size: 13, mono: true, style: 'hl', text: cn });
    S.arrow('a1', { from: 'b3', to: 'cls', kind: 'center' });
    S.step(T('Akış, hangi sınıfın örnekleneceğini KENDİSİ bildiriyor: `' + cn + '`. Bu bilgi güvenilmez veriden geliyor, programdan değil.',
              'The stream itself declares which class to instantiate: `' + cn + '`. This comes from UNTRUSTED data, not from the program.'),
           secure ? { java: [77] } : { java: [54] });

    if (!secure) {
      S.set('cls', { style: 'del' });
      S.box('outcome', { x: 0, y: 140, w: 260, h: 40, size: 13, style: 'del', text: T('nesne oluşturuldu — DENETİMSİZ', 'object created — UNCHECKED') });
      S.arrow('a2', { from: 'cls', to: 'outcome', kind: 'center' });
      S.result = reference(data);
      S.step(T('Filtre YOK: akıştaki sınıf, ne olursa olsun örneklenir. Gerçek bir saldırıda bu bir "gadget" olabilirdi.',
                'NO filter: whatever class is in the stream gets instantiated, no matter what it is. In a real attack this could have been a "gadget".'),
             { java: [54, 55, 56] });
      return;
    }

    S.label('filterLbl', { x: clsW + 40, y: 54, text: T('izin listesi kalıbı =', 'allow-list pattern ='), anchor: 'start', size: 12, bold: true });
    S.box('filter', { x: clsW + 40, y: 70, w: 260, h: 36, size: 11, mono: true, style: 'dim', text: FILTER_PATTERN });
    S.step(T('`buildAllowListFilter()` bir İZİN LİSTESİ döndürür: yalnızca `Setting` ve `java.base` sınıflarına izin verilir, gerisi reddedilir.',
              '`buildAllowListFilter()` returns an ALLOW-LIST: only `Setting` and `java.base` classes are allowed, everything else is rejected.'),
           { java: [66] });

    var allowed = isAllowedClass(cn);
    S.set('cls', { style: allowed ? 'new' : 'del' });
    S.box('outcome', { x: 0, y: 140, w: 280, h: 40, size: 13, style: allowed ? 'new' : 'del',
      text: allowed ? T('nesne oluşturuldu — İZİN VERİLDİ', 'object created — ALLOWED') : T('REDDEDİLDİ — InvalidClassException', 'REJECTED — InvalidClassException') });
    S.arrow('a2', { from: 'cls', to: 'outcome', kind: 'center' });
    S.result = reference(data);
    if (allowed) {
      S.step(T('`' + cn + '` kalıpla eşleşiyor: filtre İZİN VERİR, nesne normal şekilde oluşturulur.',
                '`' + cn + '` matches the pattern: the filter ALLOWS it, the object is built normally.'),
             { java: [76, 77, 78] });
    } else {
      S.step(T('`' + cn + '` kalıbın hiçbir parçasıyla eşleşmiyor: filtre `InvalidClassException` fırlatır, nesne HİÇ oluşturulmaz.',
                '`' + cn + '` matches no part of the pattern: the filter throws `InvalidClassException`, the object is never built at all.'),
             { java: [76, 79, 80] });
    }
  }

  D.define({
    id: 'deserialization',
    title: T('Güvensiz seri durumdan çıkarma: allow-list denetimi (SerializationDemo.java)', 'Unsafe deserialization: the allow-list check (SerializationDemo.java)'),
    code: function () { return { java: JAVA_SRC }; },
    presets: [
      { id: 'normal-expected-class', level: 'normal',
        name: T('Normal: filtresiz — beklenen sınıf zaten geçiyor', 'Normal: unfiltered — the expected class already gets through'),
        data: mk('SerializationDemo$Setting', false) },
      { id: 'hard-unfiltered-gadget', level: 'hard',
        name: T('Zor: filtresiz — şüpheli bir sınıf da geçiyor', 'Hard: unfiltered — a suspicious class gets through too'),
        data: mk('com.example.evil.GadgetChain', false) },
      { id: 'edge-filtered-rejects-other', level: 'edge',
        name: T('Uç durum: allow-list — beklenmeyen sınıf reddediliyor', 'Edge case: allow-list — an unexpected class is rejected'),
        data: mk('SerializationDemo$OtherClass', true) },
      { id: 'edge-filtered-allows-javabase', level: 'edge',
        name: T('Uç durum: allow-list — bir `java.base` sınıfı yine de geçiyor', 'Edge case: allow-list — a `java.base` class still gets through'),
        data: mk('java.base/java.lang.String', true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.className.length; },
    random: function (level, r) {
      var words = ['Setting', 'OtherClass', 'Handler', 'Loader', 'ChainNode', 'Factory', 'CacheItem', 'Session'];
      function name() { return 'com.example.' + words[D.randInt(r, 0, words.length - 1)] + D.randInt(r, 10, 99); }
      if (level === 'easy' || level === 'normal' || level === 'hard') return mk(name(), false);
      return mk(D.randInt(r, 0, 1) === 0 ? 'SerializationDemo$Setting' : name(), true);
    },
    input: {
      hint: T('sınıf adı (isteğe bağlı: "SECURE " ile başlat → allow-list)', 'class name (optionally start with "SECURE " → allow-list)'),
      format: function (data) { return (data.secure ? 'SECURE ' : '') + data.className; },
      parse: function (text) {
        var s = String(text), secure = false;
        if (/^SECURE\s+/i.test(s)) { secure = true; s = s.replace(/^SECURE\s+/i, ''); }
        if (!s.length) throw T('Sınıf adı boş olamaz.', 'The class name cannot be empty.');
        if (s.length > 50) throw T('Sınıf adı en fazla 50 karakter olabilir.', 'The class name may be at most 50 characters.');
        if (!/^[A-Za-z0-9_.$\/]+$/.test(s)) throw T('Yalnızca harf, rakam, `_`, `.`, `$` ve `/` kullanın.', 'Use only letters, digits, `_`, `.`, `$` and `/`.');
        return mk(s, secure);
      },
      bad: ['', 'x'.repeat(60), 'bad name', 'weird*name']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
