// CEN429 — Week 4 — Demo 7 (code/week-04/07-flow-flattening/pin.c, pin_flattened.c)
// The SAME PIN check, two ways. pin.c is a natural if-chain: a reverse engineer reads five
// comparisons in a row. pin_flattened.c places every step inside a switch dispatcher wrapped in one
// infinite loop; a "state" variable says which step is next. Every guess now takes several passes
// through the SAME dispatcher instead of a direct chain — the control-flow graph loses the natural
// adjacency between steps, at the cost of extra work per call (shown by the demo's own timing mode).
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/07-flow-flattening/pin.c), full file, byte-identical.
  var PLAIN_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 7: control-flow flattening - PLAIN (normal) version.',
    ' *',
    ' * A small PIN check, written with natural if/branches. A reverse engineer reading this easily',
    ' * recovers the control flow (the control-flow graph, CFG). The 07-flow demo compares this against',
    ' * the same logic in "flattened" form (pin_flattened.c).',
    ' *',
    ' * The correct PIN is synthetic (made up) and is encoded as digit-by-digit comparisons rather than',
    ' * a single string constant, so it does not leak with \'strings\' either.',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include <time.h>',
    '#include "cen429_demo.h"',
    '',
    '/* Is the PIN correct? (correct = 4-2-9-1) */',
    'int pin_verify(const char *guess)',
    '{',
    '    if (strlen(guess) != 4) return 0;',
    '    if (guess[0] != \'4\') return 0;',
    '    if (guess[1] != \'2\') return 0;',
    '    if (guess[2] != \'9\') return 0;',
    '    if (guess[3] != \'1\') return 0;',
    '    return 1;',
    '}'
  ];
  // Exact source (code/week-04/07-flow-flattening/pin_flattened.c), full file, byte-identical.
  var FLAT_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 7: control-flow FLATTENED version.',
    ' *',
    ' * The SAME logic as pin.c, but hand-"flattened": every step is placed in a switch dispatcher',
    ' * inside a single infinite loop. A "state" variable holds which step comes next. The output is',
    ' * identical, but the control-flow graph (CFG) no longer looks like a natural if-chain: every block',
    ' * passes through the dispatcher, and the original adjacency between blocks disappears. This is the',
    ' * hand-made equivalent of Tigress\'s --Transform=Flatten (Week 14).',
    ' *',
    ' * Cost: the dispatcher loop does extra work; the demo shows this with a timing measurement.',
    ' */',
    '#include <stdio.h>',
    '#include <string.h>',
    '#include <time.h>',
    '#include "cen429_demo.h"',
    '',
    'int pin_verify(const char *guess)',
    '{',
    '    int state = 0;',
    '    int ok = 0;',
    '    for (;;) {',
    '        switch (state) {',
    '        case 0:  state = (strlen(guess) != 4) ? 99 : 1; break;',
    '        case 1:  state = (guess[0] != \'4\')     ? 99 : 2; break;',
    '        case 2:  state = (guess[1] != \'2\')     ? 99 : 3; break;',
    '        case 3:  state = (guess[2] != \'9\')     ? 99 : 4; break;',
    '        case 4:  state = (guess[3] != \'1\')     ? 99 : 5; break;',
    '        case 5:  ok = 1; state = 99;                     break;',
    '        case 99: return ok;',
    '        default: return 0;',
    '        }',
    '    }',
    '}'
  ];

  var STATES = [0, 1, 2, 3, 4, 5, 99];
  var STATE_LINE = { 0: 23, 1: 24, 2: 25, 3: 26, 4: 27, 5: 28, 99: 29 };
  var PLAIN_LINE = [19, 20, 21, 22, 23];

  function mk(flattened, guesses) { return { flattened: !!flattened, guesses: guesses.slice() }; }

  /** Independent: a guess is correct iff it equals the literal "4291" — derived straight from the
   * spec ("correct = 4-2-9-1"), not from walking either version's control flow. */
  function reference(data) {
    return { flattened: !!data.flattened, results: data.guesses.map(function (g) { return g === '4291'; }) };
  }

  function nextState(state, guess) {
    switch (state) {
      case 0: return strlenNe4(guess) ? 99 : 1;
      case 1: return guess.charAt(0) !== '4' ? 99 : 2;
      case 2: return guess.charAt(1) !== '2' ? 99 : 3;
      case 3: return guess.charAt(2) !== '9' ? 99 : 4;
      case 4: return guess.charAt(3) !== '1' ? 99 : 5;
      case 5: return 99;
      default: return 99;
    }
  }
  function strlenNe4(g) { return g.length !== 4; }

  function build(S, data) {
    var n = data.guesses.length;
    if (data.flattened) {
      // r/gap sized for the widest label ("state=99", 8 chars): the engine draws circle text at a
      // FIXED 16px bold mono font regardless of the `size` option here, so a small radius clips it
      // (confirmed by rendering: with r:26 the text overflowed into the neighbouring "passed"/"failed"
      // arrow-label pill and was covered). r:40 comfortably fits 8 chars at that font; gap widened to
      // match so consecutive (now bigger) circles and their arrow labels do not crowd each other.
      var gap = 145;
      STATES.forEach(function (s, i) {
        S.circle('s' + s, { x: i * gap, y: 0, r: 40, text: 'state=' + s, size: 11, style: 'dim' });
      });
      for (var i = 0; i < STATES.length - 2; i++) S.arrow('a' + i, { from: 's' + STATES[i], to: 's' + STATES[i + 1], kind: 'center', style: 'dim', text: T('geçti', 'passed') });
      for (i = 0; i < STATES.length - 1; i++) S.arrow('j' + i, { from: 's' + STATES[i], to: 's99', kind: 'center', bend: -60 - i * 8, style: 'dim', text: T('başarısız', 'failed') });
      S.pointer('cursor', { target: 's0', side: 'top', text: T('geçerli durum', 'current state') });
      S.label('title', { x: 3 * gap, y: -70, text: T('Dağıtıcı, her tahmin için sıfırdan başlar ve durumdan duruma sıçrar', 'The dispatcher starts fresh for every guess and hops from state to state'), anchor: 'middle', bold: true, size: 13 });
    } else {
      S.label('title', { x: 220, y: -20, text: T('Doğal if-zinciri: ilk başarısız denetimde hemen döner', 'Natural if-chain: returns immediately at the first failed check'), anchor: 'middle', bold: true, size: 13 });
      var checks = [T('strlen == 4?', 'strlen == 4?'), T("guess[0]=='4'?", "guess[0]=='4'?"), T("guess[1]=='2'?", "guess[1]=='2'?"), T("guess[2]=='9'?", "guess[2]=='9'?"), T("guess[3]=='1'?", "guess[3]=='1'?")];
      checks.forEach(function (c, i) { S.box('chk' + i, { x: 0, y: i * 40, w: 200, h: 32, size: 12, mono: true, text: c, style: 'dim' }); });
    }

    var results = [];
    for (var g = 0; g < n; g++) {
      var guess = data.guesses[g];
      S.at(g);
      var correct = guess === '4291';
      results.push(correct);
      if (data.flattened) {
        S.styleAll('dim', 'circle');
        var path = [], state = 0, hops = 0;
        while (state !== 99 && hops < 6) {
          var nxt = nextState(state, guess);
          path.push([state, nxt]);
          state = nxt; hops++;
        }
        if (g < 2) {
          // First two guesses: full detail, one step per dispatcher hop.
          S.step(T('Tahmin #' + (g + 1) + ': `"' + guess + '"` — dağıtıcı `state=0`\'dan başlıyor.',
                    'Guess #' + (g + 1) + ': `"' + guess + '"` — the dispatcher starts at `state=0`.'),
                 { c: [19, 20] });
          path.forEach(function (hop) {
            var s = hop[0], next = hop[1];
            S.set('s' + s, { style: 'hl' });
            S.set('cursor', { target: 's' + s });
            S.step(T('`case ' + s + ':` denetleniyor → sıradaki durum `' + next + '`' + (next === 99 && s !== 5 ? ' (başarısız, doğrudan 99\'a atlıyor)' : '') + '.',
                      '`case ' + s + ':` is checked → next state is `' + next + '`' + (next === 99 && s !== 5 ? ' (failed, jumps straight to 99)' : '') + '.'),
                   { c: [{ n: STATE_LINE[s], note: T('durum ' + s + ' → ' + next, 'state ' + s + ' → ' + next) }] });
            S.set('s' + s, { style: 'new' });
          });
          S.set('cursor', { target: 's99' });
          S.set('s99', { style: correct ? 'new' : 'del' });
          S.step(T('`case 99:` `return ' + (correct ? 1 : 0) + ';` — `' + hops + '` dağıtıcı geçişinden sonra.',
                    '`case 99:` `return ' + (correct ? 1 : 0) + ';` — after `' + hops + '` dispatcher hops.'),
                 { c: [STATE_LINE[99]] });
        } else {
          // Later guesses: the same dispatcher, condensed to one step (grouping repetitive work).
          path.forEach(function (hop) { S.set('s' + hop[0], { style: 'new' }); });
          S.set('s99', { style: correct ? 'new' : 'del' });
          var lastState = path.length ? path[path.length - 1][0] : 0;
          S.step(T('Tahmin #' + (g + 1) + ': `"' + guess + '"` — dağıtıcı yine `state=0`\'dan başlayıp `' + hops + '` geçişte `case 99` döner: `return ' + (correct ? 1 : 0) + ';`.',
                    'Guess #' + (g + 1) + ': `"' + guess + '"` — the dispatcher again starts at `state=0` and reaches `case 99` in `' + hops + '` hops: `return ' + (correct ? 1 : 0) + ';`.'),
                 { c: [{ n: STATE_LINE[lastState], note: T('son durum ' + lastState + ' → 99', 'last state ' + lastState + ' → 99') }, STATE_LINE[99]] });
        }
      } else {
        S.styleAll('dim', 'box');
        var failAt = strlenNe4(guess) ? 0 : (guess.charAt(0) !== '4' ? 1 : (guess.charAt(1) !== '2' ? 2 : (guess.charAt(2) !== '9' ? 3 : (guess.charAt(3) !== '1' ? 4 : -1))));
        for (var k = 0; k <= (failAt === -1 ? 4 : failAt); k++) S.set('chk' + k, { style: k === failAt ? 'del' : 'new' });
        var lastCheck = failAt === -1 ? 4 : failAt;
        var checkLines = [];
        for (var ci = 0; ci <= lastCheck; ci++) {
          var thisFails = ci === failAt;
          checkLines.push({ n: PLAIN_LINE[ci], note: T(checks[ci].tr + ' ' + (thisFails ? 'EVET → return 0' : 'hayır → devam'), checks[ci].en + ' ' + (thisFails ? 'YES → return 0' : 'no → continue')) });
        }
        if (failAt === -1) checkLines.push(24);
        S.step(T('Tahmin #' + (g + 1) + ': `"' + guess + '"` — ' + (failAt === -1 ? 'tüm 5 denetimi geçti, `return 1`.' : ('denetim #' + (failAt + 1) + '\'de başarısız, `return 0` (kalan ' + (4 - failAt) + ' denetime hiç bakılmadı).')),
                  'Guess #' + (g + 1) + ': `"' + guess + '"` — ' + (failAt === -1 ? 'passed all 5 checks, `return 1`.' : ('failed check #' + (failAt + 1) + ', `return 0` (the remaining ' + (4 - failAt) + ' check(s) were never even looked at).'))),
               { c: checkLines });
      }
    }
    S.at(null);
    S.result = reference(data);
    var okCount = results.filter(Boolean).length;
    S.step(T(okCount + '/' + n + ' tahmin doğru. Her iki sürüm de AYNI sonucu verir — yalnız kontrol akışı farklı.',
              okCount + '/' + n + ' guesses were correct. Both versions give the EXACT SAME result — only the control flow differs.'),
           {});
  }

  D.define({
    id: 'flow-flattening',
    title: T('Kontrol akışı düzleştirme: dağıtıcı durum makinesi (pin.c)', 'Control-flow flattening: the dispatcher state machine (pin.c)'),
    code: function (data) { return { c: data && data.flattened ? FLAT_C : PLAIN_C }; },
    presets: [
      { id: 'plain-mixed', level: 'normal', name: T('Normal: düz sürüm, 10 karışık tahmin', 'Normal: plain version, 10 mixed guesses'), data: mk(false, ['4291', '1234', '0000', '429', '42911', '4201', '3291', '4291', '9999', '4290']) },
      { id: 'flat-mixed', level: 'hard', name: T('Zor: düzleştirilmiş sürüm, aynı 10 tahmin', 'Hard: flattened version, the same 10 guesses'), data: mk(true, ['4291', '1234', '0000', '429', '42911', '4201', '3291', '4291', '9999', '4290']) },
      { id: 'flat-all-correct', level: 'edge', name: T('Uç durum: düzleştirilmiş, hepsi doğru PIN (tam dolaşım)', 'Edge case: flattened, every guess correct (full traversal every time)'), data: mk(true, ['4291', '4291', '4291', '4291', '4291', '4291', '4291', '4291', '4291', '4291']) },
      { id: 'flat-all-wrong-length', level: 'edge', name: T('Uç durum: düzleştirilmiş, hepsi yanlış uzunlukta (anında 99)', 'Edge case: flattened, every guess has the wrong length (instant 99)'), data: mk(true, ['1', '22', '333', '55555', '666666', '', '4', '42', '429', '42910']) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.guesses.length; },
    random: function (level, r) {
      var counts = { easy: [10, 11], normal: [10, 12], hard: [11, 13], extreme: [12, 14] };
      var rg = counts[level] || counts.normal;
      var n = D.randInt(r, rg[0], rg[1]);
      var guesses = [];
      for (var i = 0; i < n; i++) {
        if (D.randInt(r, 0, 4) === 0) guesses.push('4291');
        else {
          var len = D.randInt(r, 0, 6);
          var s = ''; for (var k = 0; k < len; k++) s += String(D.randInt(r, 0, 9));
          guesses.push(s);
        }
      }
      return mk(D.randInt(r, 0, 1) === 1, guesses);
    },
    input: {
      hint: T('[FLAT] tahmin1,tahmin2,… (≥10 dört haneli ya da farklı uzunlukta dize)', '[FLAT] guess1,guess2,… (>=10 digit strings, any length)'),
      format: function (data) { return (data.flattened ? 'FLAT ' : '') + data.guesses.join(','); },
      tokens: function (data) { return data.guesses.slice(); },
      parse: function (text) {
        var s = String(text).trim(), flattened = false;
        if (/^FLAT\s+/i.test(s)) { flattened = true; s = s.replace(/^FLAT\s+/i, ''); }
        var guesses = s.split(',').map(function (t) { return t.trim(); });
        if (guesses.length < 10) throw T('En az 10 tahmin girin.', 'Enter at least 10 guesses.');
        for (var i = 0; i < guesses.length; i++) if (!/^\d{0,8}$/.test(guesses[i])) throw T('"' + guesses[i] + '" yalnızca rakamlardan oluşmalı (en fazla 8 hane).', '"' + guesses[i] + '" must contain digits only (at most 8 digits).');
        return mk(flattened, guesses);
      },
      bad: ['', '4291,1234', 'FLAT', 'abcd,1234,1234,1234,1234,1234,1234,1234,1234,1234', '123456789,1,1,1,1,1,1,1,1,1']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
