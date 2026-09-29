// CEN429 — Week 2 — Demo 9 (code/week-02/09-outbreak-simulation/outbreak.c: scenario())
// The Susceptible-Infected (SI) model: at every step, the number of NEWLY infected machines is
// proportional to how many are ALREADY infected (i) times how many are STILL vulnerable (1 - i/N).
// Growth starts slow, is fastest around 50% saturation, then flattens out as few targets remain —
// the same S-curve shape for a slow scanning worm (Code Red) and a fast one (SQL Slammer); only the
// SPEED (beta) differs.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (outbreak.c 88-103)
  var LOOP_C = [
    '    while (step < MAX_STEPS && printed < samples) {',
    '        if (t + 1e-9 >= next_sample) {',
    '            double frac = i / N;',
    '            bar(frac, b, 30);',
    '            format_time(t, sbuf, sizeof sbuf);',
    '            printf("      %s %10.0f  %5.1f%% |%s|\\n", sbuf, i, frac * 100.0, b);',
    '            next_sample += sample_interval;',
    '            printed++;',
    '        }',
    '        /* the SI difference equation (an Euler step) */',
    '        i = i + beta * i * (1.0 - i / N) * dt;',
    '        if (i > N)',
    '            i = N;',
    '        t += dt;',
    '        step++;',
    '    }'
  ];
  // LOOP_C is shown whole in the code panel, so `{c:[N]}` addresses its own Nth displayed line
  // (outbreak.c 88-103 in the real file — no arithmetic offset needed against the true file line).
  var BASE = 1;

  var STEPS = 10;

  function mk(N, i0, beta) { return { N: N, i0: i0, beta: beta }; }

  /** Independent: a functional fold (Array.from + reduce-style accumulation) instead of the
   * imperative while-loop build() animates box by box. */
  function reference(data) {
    var series = [data.i0];
    for (var s = 0; s < STEPS; s++) {
      var prev = series[series.length - 1];
      var next = prev + data.beta * prev * (1 - prev / data.N) * 1.0;
      if (next > data.N) next = data.N;
      series.push(next);
    }
    return series.map(function (x) { return Math.round(x); });
  }

  function bar(frac, width) {
    var filled = Math.round(frac * width);
    var s = '';
    for (var i = 0; i < width; i++) s += i < filled ? '#' : '.';
    return s;
  }

  function build(S, data) {
    var N = data.N, cols = Math.min(N, 20), rowGap = 30, w = 26, gap = 4;
    for (var k = 0; k < N; k++) {
      var row = Math.floor(k / cols), col = k % cols;
      S.box('m' + k, { x: col * (w + gap), y: row * rowGap, w: w, h: 24, size: 10, text: String(k), style: 'normal' });
    }
    var rows = Math.ceil(N / cols);
    S.label('barLbl', { x: 0, y: rows * rowGap + 20, text: '', anchor: 'start', size: 13, mono: true });
    S.label('title', { x: (cols * (w + gap)) / 2, y: -20,
      text: T('N=' + N + ' savunmasız makine, i0=' + data.i0 + ' başlangıç, beta=' + data.beta.toFixed(2),
              'N=' + N + ' vulnerable machines, i0=' + data.i0 + ' initial, beta=' + data.beta.toFixed(2)),
      anchor: 'middle', bold: true, size: 14 });

    var infected = data.i0;
    for (k = 0; k < infected; k++) S.set('m' + k, { style: 'del' });
    S.set('barLbl', { text: bar(infected / N, 30) + '  ' + infected + '/' + N + ' (' + (infected / N * 100).toFixed(0) + '%)' });
    S.step(T('t=0: ' + infected + ' makine zaten bulaşmış (i0). Kalan ' + (N - infected) + ' makine savunmasız (S).',
              't=0: ' + infected + ' machine(s) already infected (i0). The remaining ' + (N - infected) + ' are still susceptible (S).'),
           { c: [{ n: BASE, note: T('step(0) < MAX_STEPS && printed < samples? evet', 'step(0) < MAX_STEPS && printed < samples? yes') }] });

    var series = [infected];
    for (var s = 0; s < STEPS; s++) {
      var prev = series[series.length - 1];
      var beforeClamp = prev + data.beta * prev * (1 - prev / N) * 1.0;
      var clamped = beforeClamp > N;
      var raw = clamped ? N : beforeClamp;
      var newInfected = Math.round(raw);
      series.push(raw);
      var delta = newInfected - infected;
      for (k = infected; k < newInfected; k++) S.set('m' + k, { style: s === 0 ? 'hl' : 'del' });
      infected = newInfected;
      S.set('barLbl', { text: bar(infected / N, 30) + '  ' + infected + '/' + N + ' (' + (infected / N * 100).toFixed(0) + '%)' });
      if (s === 0) {
        S.step(T('Adım 1: i = i + beta*i*(1-i/N)*dt = ' + prev.toFixed(2) + ' + ' + data.beta.toFixed(2) + '*' + prev.toFixed(2) + '*(1-' + (prev / N).toFixed(2) + ') = ' + raw.toFixed(2) + ' -> +' + delta + ' yeni bulaşma.',
                  'Step 1: i = i + beta*i*(1-i/N)*dt = ' + prev.toFixed(2) + ' + ' + data.beta.toFixed(2) + '*' + prev.toFixed(2) + '*(1-' + (prev / N).toFixed(2) + ') = ' + raw.toFixed(2) + ' -> +' + delta + ' new infection(s).'),
               { c: [{ n: BASE, note: T('step(1) < MAX_STEPS && printed < samples? evet', 'step(1) < MAX_STEPS && printed < samples? yes') },
                     BASE + 9, BASE + 10, { n: BASE + 11, note: T('i(' + beforeClamp.toFixed(1) + ') > N(' + N + ')? ' + (clamped ? 'evet' : 'hayır'), 'i(' + beforeClamp.toFixed(1) + ') > N(' + N + ')? ' + (clamped ? 'yes' : 'no')) },
                     clamped ? BASE + 12 : { n: BASE + 12, skip: true }] });
        for (k = 0; k < infected; k++) S.set('m' + k, { style: 'del' });
      } else {
        S.step(T('Adım ' + (s + 1) + ': i -> ' + raw.toFixed(2) + ' (+' + delta + ').',
                  'Step ' + (s + 1) + ': i -> ' + raw.toFixed(2) + ' (+' + delta + ').'),
               { c: [{ n: BASE, note: T('step(' + (s + 1) + ') < MAX_STEPS && printed < samples? evet', 'step(' + (s + 1) + ') < MAX_STEPS && printed < samples? yes') },
                     BASE + 10, { n: BASE + 11, note: T('i(' + beforeClamp.toFixed(1) + ') > N(' + N + ')? ' + (clamped ? 'evet' : 'hayır'), 'i(' + beforeClamp.toFixed(1) + ') > N(' + N + ')? ' + (clamped ? 'yes' : 'no')) },
                     clamped ? BASE + 12 : { n: BASE + 12, skip: true }] });
      }
    }
    S.result = series.map(function (x) { return Math.round(x); });
    var mid = series.findIndex(function (x) { return x / N >= 0.5; });
    S.step(mid >= 0
      ? T('Büyüme en hızlı %50 dolayında oldu — sonrasında yavaşladı, çünkü kalan hedef sayısı azaldı.',
          'Growth was fastest around 50% — it slowed afterward, because fewer un-infected targets remained.')
      : T(STEPS + ' adımda doygunluğa ulaşılmadı; beta bu popülasyon için görece yavaş.',
          'Saturation was not reached in ' + STEPS + ' steps; beta is relatively slow for this population.'),
      {});
  }

  D.define({
    id: 'epidemic-spread',
    title: T('SI salgın modeli: yayılma adım adım (outbreak.c)', 'The SI epidemic model: spread, step by step (outbreak.c)'),
    code: { c: LOOP_C },
    presets: [
      { id: 'normal-moderate-spread', level: 'normal',
        name: T('Normal: orta hızda yayılma, doygunluğa yaklaşıyor', 'Normal: moderate spread, approaching saturation'),
        data: mk(16, 1, 0.5) },
      { id: 'hard-fast-slammer-like', level: 'hard',
        name: T('Zor: Slammer benzeri hızlı yayılma, birkaç adımda doygun', 'Hard: Slammer-like fast spread, saturates in a few steps'),
        data: mk(20, 1, 1.1) },
      { id: 'edge-already-half-infected', level: 'edge',
        name: T('Uç durum: başlangıçta zaten yarısı bulaşmış (hitlist)', 'Edge case: already half-infected at the start (a hitlist)'),
        data: mk(16, 8, 0.4) },
      { id: 'edge-single-machine-population', level: 'edge', small: true,
        name: T('Uç durum: N=1, tek makine, bulaşma anında doygun', 'Edge case: N=1, a single machine, infection is instantly saturated'),
        data: mk(1, 1, 0.5) },
      { id: 'edge-very-slow-beta', level: 'edge',
        name: T('Uç durum: beta çok küçük, ' + STEPS + ' adımda neredeyse hiç yayılmıyor', 'Edge case: beta is tiny, barely spreads in ' + STEPS + ' steps'),
        data: mk(18, 1, 0.03) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.N; },
    random: function (level, r) {
      var N = level === 'easy' ? D.randInt(r, 10, 14) : level === 'normal' ? D.randInt(r, 14, 18) :
              level === 'hard' ? D.randInt(r, 16, 22) : D.randInt(r, 18, 24);
      var i0 = level === 'extreme' && r() < 0.3 ? D.randInt(r, 2, Math.floor(N / 3)) : 1;
      var beta = level === 'hard' ? D.randInt(r, 80, 130) / 100 : level === 'extreme' ? D.randInt(r, 5, 130) / 100 : D.randInt(r, 30, 70) / 100;
      return mk(N, i0, beta);
    },
    input: {
      hint: T('N=nüfus i0=başlangıç beta=oran', 'N=population i0=initial beta=rate'),
      format: function (data) { return 'N=' + data.N + ' i0=' + data.i0 + ' beta=' + data.beta; },
      tokens: function (data) { return ['N=' + data.N, 'i0=' + data.i0, 'beta=' + data.beta]; },
      parse: function (text) {
        var m = {};
        String(text).trim().split(/\s+/).forEach(function (t) { var kv = t.split('='); if (kv.length === 2) m[kv[0]] = kv[1]; });
        if (!m.N || !m.i0 || !m.beta) throw T('N=.. i0=.. beta=.. üçü de gerekli.', 'N=.. i0=.. beta=.. all three are required.');
        var N = parseInt(m.N, 10), i0 = parseInt(m.i0, 10), beta = parseFloat(m.beta);
        if (!(N >= 1)) throw T('N en az 1 olmalı.', 'N must be at least 1.');
        if (!(i0 >= 1 && i0 <= N)) throw T('i0, 1..N arasında olmalı.', 'i0 must be between 1 and N.');
        if (!(beta > 0)) throw T('beta pozitif olmalı.', 'beta must be positive.');
        return mk(N, i0, beta);
      },
      bad: ['', 'N=10 i0=1', 'N=0 i0=1 beta=0.5', 'N=10 i0=20 beta=0.5']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
