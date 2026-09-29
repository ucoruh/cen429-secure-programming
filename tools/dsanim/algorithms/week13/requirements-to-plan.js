// CEN429 — Week 13 — carrying a requirement into the software plan and the asset list (docs/week-13 Section
// 7). Reading a requirement set is the easy part; the real work is applying six steps to EVERY requirement:
// (1) Applicability, (2) Responsibility (met ourselves or delegated), (3) Linking to assets, (4) Linking to
// threats, (5) Control and verification, (6) Release plan. At the end, both a compliance-matrix row AND a task
// in the project plan come out of it. No code panel: a planning process, not a running program.
(function (D) {
  'use strict';
  var T = D.T;

  var STEP_NAMES = [
    T('1. Uygulanabilirlik', '1. Applicability'),
    T('2. Sorumluluk', '2. Responsibility'),
    T('3. Varlıklara bağlama', '3. Linking to assets'),
    T('4. Tehditlere bağlama', '4. Linking to threats'),
    T('5. Önlem ve doğrulama', '5. Control and verification'),
    T('6. Sürüm planı', '6. Release plan')
  ];

  function mk(id, requirement, applicable, ownedByUs, asset, threat, control, verification, release, status) {
    return { id: id, requirement: requirement, applicable: applicable, ownedByUs: ownedByUs, asset: asset,
             threat: threat, control: control, verification: verification, release: release, status: status };
  }

  /** Independent reference: the planning outcome is read directly off the data fields (applicable + status),
   * never by re-running build()'s step-by-step narration. */
  function reference(data) {
    var enters_plan = data.applicable && (data.status === 'met' || data.status === 'planned');
    return { id: data.id, entersPlan: enters_plan, status: data.status, hasTask: data.status === 'planned' };
  }

  function build(S, data) {
    var W = 640;
    S.box('req', { x: 0, y: 0, w: W, h: 34, size: 12, mono: true, text: data.id + ': ' + data.requirement, style: 'hl' });
    S.step(T('Bir gereksinimle başlıyoruz: `' + data.id + '`. Altı adımı sırayla uyguluyoruz.',
              'We start from one requirement: `' + data.id + '`. We apply the six steps in order.'), {});

    var y = 60;
    for (var s = 0; s < STEP_NAMES.length; s++) {
      S.box('s' + s, { x: 0, y: y + s * 32, w: 260, h: 26, size: 11, text: STEP_NAMES[s], style: 'dim' });
    }

    S.at(0);
    S.set('s0', { style: data.applicable ? 'new' : 'del' });
    S.label('n0', { x: 280, y: y + 13, text: data.applicable ? T('uygulanır', 'applies') : T('uygulanmaz', 'does not apply'), anchor: 'start', size: 12 });
    S.step(data.applicable
      ? T('Adım 1: bu ürün ilgili varlığı/mekanizmayı kullanıyor mu? Evet -> uygulanır.', 'Step 1: does this product use the relevant asset/mechanism? Yes -> it applies.')
      : T('Adım 1: bu ürün ilgili varlığı/mekanizmayı kullanmıyor -> uygulanmaz, gerekçesiyle işaretlenir; kalan adımlar atlanır.',
          'Step 1: this product does not use the relevant asset/mechanism -> does not apply, marked with its rationale; the remaining steps are skipped.'), {});

    if (!data.applicable) {
      S.at(null);
      var resultNA = reference(data);
      S.result = resultNA;
      S.step(T('"Uygulanmaz" kanıtla desteklenmeli (kod taraması, mimari şeması) — aksi halde değerlendirici sorgular.',
                'A "does not apply" must be backed by evidence (a code scan, an architecture diagram) — otherwise the evaluator questions it.'), {});
      return;
    }

    S.at(1);
    S.set('s1', { style: 'new' });
    S.label('n1', { x: 280, y: y + 32 + 13, text: data.ownedByUs ? T('kendimiz karşılıyoruz', 'we meet it ourselves') : T('devrediliyor', 'delegated'), anchor: 'start', size: 12 });
    S.step(T('Adım 2: sorumluluk kimde? -> ' + (data.ownedByUs ? T('kendi kodumuz', 'our own code').tr : T('başka bir tarafa devir', 'delegated to another party').tr) + '.',
              'Step 2: who owns responsibility? -> ' + (data.ownedByUs ? 'our own code.' : 'delegated to another party.')), {});

    S.at(2);
    S.set('s2', { style: 'new' });
    S.label('n2', { x: 280, y: y + 64 + 13, text: T('varlık: ' + data.asset, 'asset: ' + data.asset), anchor: 'start', size: 12 });
    S.step(T('Adım 3: varlık tablosuna bağla -> "' + data.asset + '" satırı. Sütun boşsa, boşluk burada fark edilir.',
              'Step 3: link it to the asset table -> the "' + data.asset + '" row. If a column is empty, the gap is noticed right here.'), {});

    S.at(3);
    S.set('s3', { style: 'new' });
    S.label('n3', { x: 280, y: y + 96 + 13, text: T('tehdit: ' + data.threat, 'threat: ' + data.threat), anchor: 'start', size: 12 });
    S.step(T('Adım 4: hangi tehdide bağlanıyor? -> ' + data.threat + '. Bağlanamıyorsa, tehdit modeli eksik ya da gereksinim gereksizdir.',
              'Step 4: which threat does it link to? -> ' + data.threat + '. If it cannot be linked, either the threat model is missing something or the requirement is unnecessary.'), {});

    S.at(4);
    S.set('s4', { style: 'new' });
    S.label('n4', { x: 280, y: y + 128 + 13, text: T('önlem+doğrulama planlandı', 'control+verification planned'), anchor: 'start', size: 12 });
    S.step(T('Adım 5: önlem -> "' + data.control + '"; doğrulama -> "' + data.verification + '".',
              'Step 5: control -> "' + data.control + '"; verification -> "' + data.verification + '".'), {});

    S.at(5);
    S.set('s5', { style: data.status === 'met' ? 'new' : 'active' });
    S.label('n5', { x: 280, y: y + 160 + 13, text: data.release, anchor: 'start', size: 12 });
    S.step(T('Adım 6: sürüm planı -> "' + data.release + '", durum: ' + data.status.toUpperCase() + '.',
              'Step 6: release plan -> "' + data.release + '", status: ' + data.status.toUpperCase() + '.'), {});

    S.at(null);
    var result = reference(data);
    S.result = result;
    S.box('outcome', { x: 0, y: y + STEP_NAMES.length * 32 + 20, w: W, h: 34, size: 12,
      text: result.hasTask
        ? T('Çıktı: bir uyum matrisi satırı + proje planında bir görev.', 'Outcome: a compliance-matrix row + a task in the project plan.')
        : T('Çıktı: bir uyum matrisi satırı (KARŞILANDI).', 'Outcome: a compliance-matrix row (MET).'),
      style: 'new' });
    S.step(T('"Gereksinimi okumak" ile "gereksinimi ürüne dönüştürmek" arasındaki fark bu: altı adımın sonunda somut bir görev de çıkıyor.',
              'This is the difference between "reading a requirement" and "turning it into the product": a concrete task comes out at the end of the six steps too.'), {});
  }

  D.define({
    id: 'requirements-to-plan',
    title: T('Gereksinimi yazılım planına ve varlık yönetimine aktarmak: altı adım', 'Carrying a requirement into the software plan and asset management: six steps'),
    minSize: 6,
    presets: [
      { id: 'normal-key-erasure', level: 'normal',
        name: T('Normal: CEN429-CR-03 — anahtar temizleme, altı adım', 'Normal: CEN429-CR-03 — key erasure, all six steps'),
        data: mk('CEN429-CR-03', 'Keys must be erased once their job is done.', true, true, 'vault-file key',
                 'T-01: an attacker with physical access takes a memory dump', 'crypto_wipe() after use',
                 'memory-dump analysis confirms no residual key bytes', 'planned for v1.0', 'planned') },
      { id: 'hard-review-process', level: 'hard',
        name: T('Zor: süreç gereksinimi — CEN429-DV-02, her değişiklik incelenmeli', 'Hard: a process requirement — CEN429-DV-02, every change must be reviewed'),
        data: mk('CEN429-DV-02', 'Every change must be reviewed.', true, true, 'the development process (not an asset row)',
                 'a malicious or faulty change entering the main branch unnoticed', 'a pull-request rule: at least one approval',
                 'last 20 merges checked for an approval record', 'already in effect, continuous monitoring', 'met') },
      { id: 'edge-not-applicable', level: 'edge', small: true,
        name: T('Uç durum: uygulanmaz, gerekçeli', 'Edge case: not applicable, with a rationale'),
        data: mk('CEN429-DT-02', 'Data must pass only through defined network interfaces.', false, false, '-', '-', '-', '-', '-', 'not-applicable') },
      { id: 'edge-delegated', level: 'edge',
        name: T('Uç durum: devredilen sorumluluk — güncelleme kanalı', 'Edge case: delegated responsibility — the update channel'),
        data: mk('CEN429-AP-07', 'The application must be installed and updated securely.', true, false, 'the update package',
                 'an unsigned or tampered update package', 'delegated: parent app uses store signature verification',
                 'the parent app developer\'s own test suite', 'delegated, documented in S14', 'met') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return STEP_NAMES.length; },
    random: function (level, r) {
      var pool = [
        mk('CEN429-DR-02', 'Data must be securely erased once no longer needed.', true, true, 'session cache',
           'T-04: leftover plaintext readable after logout', 'zeroize on logout', 'memory scan after logout',
           'in v0.9', 'met'),
        mk('CEN429-AS-02', 'Compromising a single copy must not affect other copies.', true, true, 'per-device key',
           'T-07: a shared static key found on one device compromises all', 'per-device key derivation',
           'two devices compared, keys differ', 'in v0.9', 'met'),
        mk('CEN429-RP-01', 'Sensitive data must not be written to logs in the clear.', true, true, 'application logs',
           'T-08: logs collected by a support tool leak secrets', 'redaction filter before logging',
           'log output scanned for known secret patterns', 'planned for v1.1', 'planned'),
        mk('CEN429-ID-03', 'Sensitive data must be bound to the device and the version.', false, false, '-', '-', '-', '-', '-', 'not-applicable'),
        mk('CEN429-AS-01', 'Hardware-backed key storage must be used where available.', true, false, 'signing key',
           'T-02: physical key extraction', 'delegated: platform secure-storage API',
           'platform vendor\'s own conformance tests', 'delegated, documented in S14', 'met'),
        mk('CEN429-DU-02', 'Session data must be erased from memory immediately after use.', true, true, 'session buffer',
           'T-01: memory dump after use', 'explicit wipe call after the session ends',
           'memory-dump analysis', 'planned for v1.0', 'planned')
      ];
      var idx = D.randInt(r, 0, pool.length - 1);
      return pool[idx];
    },
    input: {
      hint: T('id|requirement|applicable|ownedByUs|asset|threat|control|verification|release|status', 'id|requirement|applicable|ownedByUs|asset|threat|control|verification|release|status'),
      format: function (data) {
        return [data.id, data.requirement, data.applicable ? '1' : '0', data.ownedByUs ? '1' : '0',
                data.asset, data.threat, data.control, data.verification, data.release, data.status].join('|');
      },
      tokens: function () { return STEP_NAMES.slice(); },
      parse: function (text) {
        var f = String(text).split('|');
        if (f.length !== 10) throw T('Tam olarak 10 alan gerekir.', 'Exactly 10 fields are required.');
        if (['met', 'planned', 'not-applicable'].indexOf(f[9]) < 0) throw T('Durum "met", "planned" ya da "not-applicable" olmalı.', 'Status must be "met", "planned" or "not-applicable".');
        return mk(f[0], f[1], f[2] === '1', f[3] === '1', f[4], f[5], f[6], f[7], f[8], f[9]);
      },
      bad: ['', 'only|three|fields', 'id|req|1|1|a|t|c|v|r|badstatus', 'id|req|1|1|a|t|c|v|r|met|extra']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
