// CEN429 — Week 12 — the independent evaluation process, generalized to 13 steps in three phases
// (Preparation 1-4, Evaluation 5-9, Continuity 10-13 — see docs/week-12 section 2). The steps and their
// order are the same across most schemes (Common Criteria/CEM, EMVCo, PCI); no product/lab/company name is
// used. The pseudocode below is a generic, anonymized summary of the control flow — NOT a literal excerpt
// from any real product's or laboratory's source code.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'for (step = 1; step <= 9; step++)',
    '    run_step(step);',
    '',
    'if (findings_count > 0) {',
    '    write_impact_analysis();',
    '    for (step = 10; step <= 13; step++)',
    '        run_step(step);',
    '} else {',
    '    /* no delta cycle needed this time */',
    '}'
  ];

  var STAGES = [
    { phase: 'prep', name: T('1. Değerlendirme hedefi (TOE)', '1. Evaluation target (TOE)') },
    { phase: 'prep', name: T('2. Belgelerin teslimi', '2. Documents delivered') },
    { phase: 'prep', name: T('3. Gereksinim şablonu', '3. Requirement template') },
    { phase: 'prep', name: T('4. Atölye', '4. Workshop') },
    { phase: 'eval', name: T('5. Kaynak kod incelemesi', '5. Source code review') },
    { phase: 'eval', name: T('6. Zafiyet analizi', '6. Vulnerability analysis') },
    { phase: 'eval', name: T('7. Sızma testi', '7. Penetration testing') },
    { phase: 'eval', name: T('8. İşlevsel uygunluk', '8. Functional conformance') },
    { phase: 'eval', name: T('9. Bulgular', '9. Findings') },
    { phase: 'cont', name: T('10. Güvenlik etki analizi', '10. Security impact analysis') },
    { phase: 'cont', name: T('11. Delta değerlendirme', '11. Delta assessment') },
    { phase: 'cont', name: T('12. Ödünleşim / kalan risk', '12. Trade-off / residual risk') },
    { phase: 'cont', name: T('13. Değişiklik yönetimi', '13. Change management') }
  ];

  function mk(findings) { return { findings: findings }; }

  function reference(data) {
    return { findings: data.findings, deltaRan: data.findings > 0 };
  }

  function build(S, data) {
    var W = 250, H = 30, GAP = 6;
    for (var i = 0; i < STAGES.length; i++) {
      S.box('s' + i, { x: 0, y: i * (H + GAP), w: W, h: H, size: 12, text: STAGES[i].name, style: 'dim', above: i === 0 ? '' : undefined });
    }
    S.brace('prepB', { from: 's0', to: 's3', text: T('Hazırlık', 'Preparation'), side: 'left', dist: 10 });
    S.brace('evalB', { from: 's4', to: 's8', text: T('Değerlendirme', 'Evaluation'), side: 'left', dist: 10 });
    S.brace('contB', { from: 's9', to: 's12', text: T('Süreklilik', 'Continuity'), side: 'left', dist: 10 });
    S.step(T('Üç aşama, 13 adım: Hazırlık (1-4), Değerlendirme (5-9), Süreklilik (10-13).',
              'Three phases, 13 steps: Preparation (1-4), Evaluation (5-9), Continuity (10-13).'), {});

    for (i = 0; i < 4; i++) {
      S.at(i);
      S.set('s' + i, { style: 'new' });
      S.step(T('`' + STAGES[i].name.tr + '` tamamlandı.', '`' + STAGES[i].name.en + '` done.'),
             { c: [{ n: 1, note: T('step(' + (i + 1) + ') <= 9? evet', 'step(' + (i + 1) + ') <= 9? yes') }, 2] });
    }

    for (i = 4; i < 9; i++) S.set('s' + i, { style: 'new' });
    S.at(8);
    S.step(T('Değerlendirme aşaması tamamlandı: adım 7 (sızma testi) ' + data.findings + ' bulgu üretti.',
              'The evaluation phase is done: step 7 (penetration testing) produced ' + data.findings + ' finding(s).'),
           { c: [{ n: 1, note: T('step<=9? evet (5 adım daha)', 'step<=9? yes (5 more steps)') },
                  { n: 2, note: T('run_step(step) 5 kez daha çalışır', 'run_step(step) runs 5 more times') }] });

    S.at(null);
    if (data.findings > 0) {
      for (i = 9; i < 13; i++) S.set('s' + i, { style: 'new' });
      S.step(T('findings_count(' + data.findings + ') > 0: etki analizi yazılıyor, Süreklilik (10-13) çalışıyor.',
                'findings_count(' + data.findings + ') > 0: an impact analysis is written, Continuity (10-13) runs.'),
             { c: [{ n: 4, note: T('findings_count(' + data.findings + ') > 0? evet', 'findings_count(' + data.findings + ') > 0? yes') },
                    5, { n: 6, note: T('step(10) <= 13? evet', 'step(10) <= 13? yes') }, 7, { n: 9, skip: true }] });
    } else {
      for (i = 9; i < 13; i++) S.set('s' + i, { style: 'empty' });
      S.step(T('findings_count(0) > 0 değil: bu döngüde delta gerekmiyor, Süreklilik atlanıyor.',
                'findings_count(0) > 0 is false: no delta cycle is needed this time, Continuity is skipped.'),
             { c: [{ n: 4, note: T('findings_count(0) > 0? hayır', 'findings_count(0) > 0? no') },
                    { n: 5, skip: true }, { n: 6, skip: true }, { n: 7, skip: true }, 9] });
    }

    S.result = { findings: data.findings, deltaRan: data.findings > 0 };
    S.step(T('Sertifika, tanımlı bir sürüm + tanımlı bir standart + tekrarlanabilir bir süreçtir — bir anlık fotoğraf değil.',
              'A certificate is a defined version + a defined standard + a repeatable process — not a single snapshot.'), {});
  }

  D.define({
    id: 'evaluation-process-pipeline',
    title: T('Değerlendirme süreci: 13 adım, üç aşama (genelleştirilmiş)', 'The evaluation process: 13 steps, three phases (generalized)'),
    code: { c: C },
    minSize: 13,
    presets: [
      { id: 'normal-clean', level: 'normal', name: T('Normal: hiç bulgu yok, Süreklilik bu döngüde gerekmiyor', 'Normal: no findings, Continuity is not needed this cycle'), data: mk(0) },
      { id: 'hard-several-findings', level: 'hard', name: T('Zor: birkaç bulgu, tam 13 adım çalışıyor', 'Hard: several findings, the full 13 steps run'), data: mk(3) },
      { id: 'edge-one-finding', level: 'edge', name: T('Uç durum: tam olarak bir bulgu', 'Edge case: exactly one finding'), data: mk(1) },
      { id: 'edge-many-findings', level: 'edge', name: T('Uç durum: en yüksek gömülü bulgu sayısı', 'Edge case: the highest built-in finding count'), data: mk(6) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function () { return STAGES.length; },
    random: function (level, r) {
      var max = { easy: 0, normal: 2, hard: 4, extreme: 6 }[level];
      return mk(D.randInt(r, 0, max === undefined ? 2 : max));
    },
    input: {
      hint: T('findings=<0..6>', 'findings=<0..6>'),
      format: function (data) { return 'findings=' + data.findings; },
      tokens: function () { return STAGES.map(function (s) { return s.name; }); },
      parse: function (text) {
        var m = String(text).trim().match(/^findings=(\d+)$/i);
        if (!m) throw T('Biçim: "findings=<sayı>" olmalı.', 'Format must be "findings=<number>".');
        var n = parseInt(m[1], 10);
        if (n < 0 || n > 6) throw T('findings, 0..6 aralığında olmalı.', 'findings must be in the range 0..6.');
        return mk(n);
      },
      bad: ['', 'findings=-1', 'findings=7', 'findings=x', 'bulgu=2']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
