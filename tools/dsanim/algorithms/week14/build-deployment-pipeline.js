// CEN429 — Week 14 — Demo 1 (code/week-14/01-source-to-source/demo.sh) + docs/week-14 §9 (S15)
// Placing obfuscation into the BUILD AND DEPLOYMENT pipeline: one CI run per release, each with its
// OWN seed. Six stages per release (docs/week-14 §9's S15 skeleton): build the clean source and run
// unit tests -> obfuscate with a NEW seed -> rebuild the obfuscated source and run the SAME unit
// tests (CI stops here if they fail) -> measure cost -> sign (last) -> record the version (seed +
// pipeline + digest + signature, the TOE identity from week 12 plus a seed field). The one CI-wide
// rule this animation checks across the whole release history: never reuse a seed.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'line; echo "STEP 1 - Baseline: the plain, already-built program"',
    '  echo "STEP 2 - Tigress FOUND: running the real transform pipeline"',
    'line; echo "STEP 3 - Behavior preserved? (compile both variants, compare against the baseline)"',
    'line; echo "STEP 4 - Cost: instructions/branches in grant_access() alone (objdump)"',
    'line; echo "STEP 5 - Diversification: same source, two seeds, different binaries"'
  ];
  var STAGES = ['build+test', 'obfuscate(seed)', 'rebuild+test', 'measure', 'sign', 'record-version'];

  function mk(releases) { return { releases: releases.slice() }; }
  function rel(version, seed, testsPass) { return { version: version, seed: seed, testsPass: testsPass === undefined ? true : testsPass }; }

  function reference(data) {
    var seenSeeds = [], results = [];
    for (var i = 0; i < data.releases.length; i++) {
      var r = data.releases[i];
      var reused = seenSeeds.indexOf(r.seed) >= 0;
      seenSeeds.push(r.seed);
      results.push({ version: r.version, seedReused: reused, ciPassed: r.testsPass && !reused });
    }
    return { results: results, allOk: results.every(function (x) { return x.ciPassed; }) };
  }

  function build(S, data) {
    var releases = data.releases, n = releases.length;
    S.label('lbl', { x: 0, y: -18, text: T('Her sürüm: kendi tohumuyla bir CI çalışması', 'Every release: one CI run, its own seed'), anchor: 'start', bold: true, size: 15 });
    S.step(T('demo.sh\'nin beş adımı, S15\'in CI iskeletinin temelidir (bölüm 9).', "demo.sh's five steps are the basis of S15's CI skeleton (§9)."), { sh: [1, 3, 4, 5] });

    var seenSeeds = [];
    var RY = 40, RH = 34, COLW = 118;
    var detail = Math.min(2, n);
    for (var i = 0; i < n; i++) {
      var r = releases[i];
      var y = RY + i * (RH + 40);
      S.label('vlbl' + i, { x: 0, y: y - 8, text: T('sürüm ' + r.version + ' (tohum ' + r.seed + '):', 'release ' + r.version + ' (seed ' + r.seed + '):'), anchor: 'start', bold: true, size: 12 });
      var reused = seenSeeds.indexOf(r.seed) >= 0;
      seenSeeds.push(r.seed);
      // A failing test stops the release at `rebuild+test` (stage 2); a reused seed does NOT stop
      // the earlier stages (they all still run) but is CAUGHT at the final `record-version` stage,
      // when that stage compares this release's seed against the log of every earlier release.
      var lastReached = !r.testsPass ? 2 : STAGES.length - 1;
      for (var st = 0; st < STAGES.length; st++) {
        var reached = st <= lastReached;
        var failingHere = reached && ((st === 2 && !r.testsPass) || (st === STAGES.length - 1 && reused));
        var style = !reached ? 'dim' : (failingHere ? 'del' : 'normal');
        S.box('r' + i + 's' + st, { x: st * COLW, y: y, w: COLW - 6, h: RH, size: 10, text: STAGES[st], style: style });
      }
      if (i < detail) {
        if (!r.testsPass)
          S.step(T('sürüm ' + r.version + ': `rebuild+test` başarısız — CI burada DURUR (imzalanmaz, kaydedilmez).',
                    'release ' + r.version + ': `rebuild+test` fails — CI STOPS here (never signed, never recorded).'), {});
        else if (reused)
          S.step(T('sürüm ' + r.version + ': tohum ' + r.seed + ' DAHA ÖNCE kullanılmış — `record-version` bunu yakalar.',
                    'release ' + r.version + ': seed ' + r.seed + ' was used BEFORE — `record-version` catches this.'), {});
        else
          S.step(T('sürüm ' + r.version + ': altı aşama da geçti — imzalandı ve kaydedildi.',
                    'release ' + r.version + ': all six stages passed — signed and recorded.'), {});
      }
    }

    var ref = reference(data);
    if (ref.allOk)
      S.step(T(n + '/' + n + ' sürüm başarıyla yayınlandı; hiçbir tohum tekrarlanmadı.', n + '/' + n + ' releases shipped cleanly; no seed was ever reused.'), {});
    else
      S.step(T('En az bir sürüm CI\'yi geçemedi — yukarıdaki adımlara bakın.', 'At least one release failed CI — see the steps above.'), {});
    S.result = ref;
  }

  D.define({
    id: 'build-deployment-pipeline',
    title: T('Gizlemeyi derleme/dağıtım hattına yerleştirmek: CI, sürüm başına tohum',
              'Placing obfuscation in the build/deployment pipeline: CI, per-release seed'),
    code: function () { return { sh: C }; },
    presets: [
      { id: 'three-clean-releases', level: 'normal', name: T('Normal: üç temiz sürüm (v1.0/v1.1/v1.2, S15 örneğiyle aynı)', 'Normal: three clean releases (v1.0/v1.1/v1.2, same as the S15 worked example)'),
        data: mk([rel('v1.0', 1001), rel('v1.1', 4832), rel('v1.2', 9214)]) },
      { id: 'one-test-failure', level: 'hard', name: T('Zor: dört sürüm, biri testte başarısız', 'Hard: four releases, one fails its tests'),
        data: mk([rel('v1.0', 1001), rel('v1.1', 4832), rel('v1.2', 9214, false), rel('v1.3', 5150)]) },
      { id: 'edge-seed-reused', level: 'edge', name: T('Uç durum: v1.3 yanlışlıkla v1.0 ile aynı tohumu kullanıyor', 'Edge case: v1.3 accidentally reuses v1.0\'s seed'),
        data: mk([rel('v1.0', 1001), rel('v1.1', 4832), rel('v1.2', 9214), rel('v1.3', 1001)]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.releases.length * STAGES.length; },
    random: function (level, r) {
      var n = { easy: 2, normal: 3, hard: 4, extreme: 6 }[level] || 2;
      var releases = [], usedSeeds = [];
      for (var i = 0; i < n; i++) {
        var forceReuse = i > 0 && D.randInt(r, 0, 7) === 0;
        var seed = forceReuse ? usedSeeds[D.randInt(r, 0, usedSeeds.length - 1)] : D.randInt(r, 1000, 9999);
        usedSeeds.push(seed);
        var testsPass = D.randInt(r, 0, 9) > 0;   // rare failure, like a real test suite
        releases.push(rel('v1.' + i, seed, testsPass));
      }
      return mk(releases);
    },
    input: {
      hint: T('v1.0:1001:pass,v1.1:4832:fail,…', 'v1.0:1001:pass,v1.1:4832:fail,…'),
      format: function (data) {
        return data.releases.map(function (r) { return r.version + ':' + r.seed + ':' + (r.testsPass ? 'pass' : 'fail'); }).join(',');
      },
      parse: function (text) {
        var parts = String(text).trim().split(',').filter(Boolean);
        if (parts.length < 1) throw T('En az bir sürüm gerekir.', 'At least one release is required.');
        var releases = parts.map(function (p) {
          var m = p.match(/^([^:]+):(\d+):(pass|fail)$/);
          if (!m) throw T('Her sürüm "sürüm:tohum:pass|fail" biçiminde olmalı.', 'Each release must be "version:seed:pass|fail".');
          return rel(m[1], parseInt(m[2], 10), m[3] === 'pass');
        });
        return mk(releases);
      },
      bad: ['', 'v1.0', 'v1.0:abc:pass', 'v1.0:1001:maybe', 'v1.0:1001']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
