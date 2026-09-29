// CEN429 — Week 2 — Demo 07 (code/week-02/07-rule-engine/engine.c: the condition evaluator, 226-365)
// A YARA-style rule also needs a CONDITION language ($id, #id op n, and/or/not, "n of them"). engine.c
// evaluates it with RECURSIVE DESCENT: expr() -> and_expr() -> not_expr() -> primary(), one grammar
// level per precedence (or lowest, then and, then not, then the atoms). Two things surprise students:
// `and`/`or` are NOT short-circuit (both sides are always evaluated -- see and_expr()'s own comment,
// "resolve both: let the syntax be checked"), and a broken condition returns -1 (CONDITION ERROR), it
// never crashes or silently matches.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (engine.c 226-365)
  var COND_C = [
    'struct parser {',
    '    char *t[MAX_TOKENS];',
    '    int n, i, error;',
    '    const struct rule *k;',
    '};',
    '',
    'static const char *peek(struct parser *c)',
    '{',
    '    return c->i < c->n ? c->t[c->i] : "";',
    '}',
    '',
    'static const char *take(struct parser *c)',
    '{',
    '    return c->i < c->n ? c->t[c->i++] : "";',
    '}',
    '',
    'static int string_index(const struct rule *k, const char *id)',
    '{',
    '    for (int i = 0; i < k->nstr; i++)',
    '        if (strcmp(k->strings[i].id, id) == 0)',
    '            return i;',
    '    return -1;',
    '}',
    '',
    'static int expr(struct parser *c);',
    '',
    'static int primary(struct parser *c)',
    '{',
    '    const char *t = take(c);',
    '    const struct rule *k = c->k;',
    '    if (strcmp(t, "(") == 0) {',
    '        int v = expr(c);',
    '        if (strcmp(take(c), ")") != 0)',
    '            c->error = 1;',
    '        return v;',
    '    }',
    '    if (strcmp(t, "true") == 0)',
    '        return 1;',
    '    if (strcmp(t, "false") == 0)',
    '        return 0;',
    '    if (strcmp(t, "all") == 0 || strcmp(t, "any") == 0 ||',
    '        isdigit((unsigned char)t[0])) {',
    '        int needed = t[0] == \'a\' && t[1] == \'l\' ? k->nstr',
    '                    : t[0] == \'a\' ? 1 : atoi(t);',
    '        if (strcmp(take(c), "of") != 0 || strcmp(take(c), "them") != 0) {',
    '            c->error = 1;',
    '            return 0;',
    '        }',
    '        int present = 0;',
    '        for (int i = 0; i < k->nstr; i++)',
    '            present += k->strings[i].count > 0;',
    '        return present >= needed;',
    '    }',
    '    if (t[0] == \'$\' || t[0] == \'#\') {',
    '        int x = string_index(k, t + 1);',
    '        if (x < 0) {',
    '            c->error = 1;',
    '            return 0;',
    '        }',
    '        if (t[0] == \'$\')',
    '            return k->strings[x].count > 0;',
    '        const char *op = take(c);',
    '        const char *num = take(c);',
    '        if (!isdigit((unsigned char)num[0])) {',
    '            c->error = 1;',
    '            return 0;',
    '        }',
    '        int s = k->strings[x].count, m = atoi(num);',
    '        if (strcmp(op, ">=") == 0) return s >= m;',
    '        if (strcmp(op, ">") == 0)  return s > m;',
    '        if (strcmp(op, "<=") == 0) return s <= m;',
    '        if (strcmp(op, "<") == 0)  return s < m;',
    '        if (strcmp(op, "==") == 0) return s == m;',
    '        c->error = 1;',
    '        return 0;',
    '    }',
    '    c->error = 1;',
    '    return 0;',
    '}',
    '',
    'static int not_expr(struct parser *c)',
    '{',
    '    if (strcmp(peek(c), "not") == 0) {',
    '        take(c);',
    '        return !not_expr(c);',
    '    }',
    '    return primary(c);',
    '}',
    '',
    'static int and_expr(struct parser *c)',
    '{',
    '    int v = not_expr(c);',
    '    while (strcmp(peek(c), "and") == 0) {',
    '        take(c);',
    '        int r = not_expr(c);          /* resolve both: let the syntax be checked */',
    '        v = v && r;',
    '    }',
    '    return v;',
    '}',
    '',
    'static int expr(struct parser *c)',
    '{',
    '    int v = and_expr(c);',
    '    while (strcmp(peek(c), "or") == 0) {',
    '        take(c);',
    '        int r = and_expr(c);',
    '        v = v || r;',
    '    }',
    '    return v;',
    '}',
    '',
    '/* Evaluates the condition: 1 matched, 0 did not match, -1 a syntax error. */',
    'static int evaluate_condition(const struct rule *k)',
    '{',
    '    char copy[600];',
    '    size_t j = 0;',
    '    /* Add spaces around parentheses so they split into separate tokens */',
    '    for (const char *s = k->condition; *s && j + 4 < sizeof copy; s++) {',
    '        if (*s == \'(\' || *s == \')\') {',
    '            copy[j++] = \' \';',
    '            copy[j++] = *s;',
    '            copy[j++] = \' \';',
    '        } else {',
    '            copy[j++] = *s;',
    '        }',
    '    }',
    '    copy[j] = \'\\0\';',
    '    struct parser c;',
    '    memset(&c, 0, sizeof c);',
    '    c.k = k;',
    '    for (char *t = strtok(copy, " \\t"); t; t = strtok(NULL, " \\t")) {',
    '        if (c.n >= MAX_TOKENS)',
    '            return -1;',
    '        c.t[c.n++] = t;',
    '    }',
    '    int v = expr(&c);',
    '    if (c.error || c.i != c.n)',
    '        return -1;',
    '    return v;',
    '}'
  ];
  // COND_C is ONE contiguous slice starting at the real file's line 226, so a real line number L is
  // shown at panel position R(L) = L - 225 (BASE = 1, no concatenation arithmetic to get wrong).
  function R(line) { return line - 225; }

  function mk(condition, strings) { return { condition: condition, strings: strings }; }

  function tokenize(cond) {
    return cond.replace(/([()])/g, ' $1 ').trim().split(/\s+/).filter(Boolean);
  }

  /** Independent evaluator: shunting-yard into an explicit operator/value STACK (iterative, not
   * recursive descent) -- a structurally different algorithm from build()'s primary()/not_expr()/
   * and_expr()/expr() mirror below, written from scratch with its own tokenizer. */
  function referenceTokenize(cond) {
    return cond.replace(/([()])/g, ' $1 ').trim().split(/\s+/).filter(Boolean);
  }
  function referenceEval(data) {
    var toks = referenceTokenize(data.condition);
    var counts = {};
    data.strings.forEach(function (s) { counts[s.id] = s.count; });
    var i = 0, error = false;
    function next() { return i < toks.length ? toks[i++] : ''; }
    function readOperand() {
      var t = next();
      if (t === 'true') return 1;
      if (t === 'false') return 0;
      if (t === 'all' || t === 'any' || /^[0-9]/.test(t)) {
        var needed = (t === 'all') ? data.strings.length : (t === 'any') ? 1 : parseInt(t, 10);
        if (next() !== 'of' || next() !== 'them') { error = true; return 0; }
        var present = 0;
        data.strings.forEach(function (s) { if (s.count > 0) present++; });
        return present >= needed ? 1 : 0;
      }
      if (t.charAt(0) === '$' || t.charAt(0) === '#') {
        var id = t.slice(1);
        if (!counts.hasOwnProperty(id)) { error = true; return 0; }
        if (t.charAt(0) === '$') return counts[id] > 0 ? 1 : 0;
        var op = next(), numTok = next();
        if (!/^[0-9]+$/.test(numTok)) { error = true; return 0; }
        var n = parseInt(numTok, 10), s = counts[id];
        if (op === '>=') return s >= n ? 1 : 0;
        if (op === '>') return s > n ? 1 : 0;
        if (op === '<=') return s <= n ? 1 : 0;
        if (op === '<') return s < n ? 1 : 0;
        if (op === '==') return s === n ? 1 : 0;
        error = true; return 0;
      }
      error = true; return 0;
    }
    var PREC = { and: 2, or: 1 };
    var vals = [], ops = [];
    function applyBinary() {
      var op = ops.pop();
      if (vals.length < 2) { error = true; vals.push(0); return; }
      var b = vals.pop(), a = vals.pop();
      vals.push(op === 'and' ? (a && b ? 1 : 0) : (a || b ? 1 : 0));
    }
    function applyNot() {
      ops.pop();
      if (vals.length < 1) { error = true; vals.push(0); return; }
      vals.push(vals.pop() ? 0 : 1);
    }
    while (!error && i < toks.length) {
      var t = toks[i];
      if (t === '(') { ops.push('('); i++; }
      else if (t === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') {
          if (ops[ops.length - 1] === 'not') applyNot(); else applyBinary();
        }
        if (!ops.length) { error = true; break; }
        ops.pop(); i++;
      } else if (t === 'not') { ops.push('not'); i++; }
      else if (t === 'and' || t === 'or') {
        while (ops.length && ops[ops.length - 1] !== '(' && ops[ops.length - 1] !== 'not' &&
               PREC[ops[ops.length - 1]] >= PREC[t]) applyBinary();
        ops.push(t); i++;
      } else {
        vals.push(readOperand());
        while (ops.length && ops[ops.length - 1] === 'not') applyNot();
      }
    }
    while (!error && ops.length) {
      if (ops[ops.length - 1] === '(') { error = true; break; }
      if (ops[ops.length - 1] === 'not') applyNot(); else applyBinary();
    }
    if (error || vals.length !== 1) return -1;
    return vals[0];
  }
  function reference(data) { return referenceEval(data); }

  function build(S, data) {
    var tokens = tokenize(data.condition);
    var counts = {};
    data.strings.forEach(function (s) { counts[s.id] = s.count; });

    S.label('title', { x: 0, y: -46,
      text: T('koşul = "' + data.condition + '"', 'condition = "' + data.condition + '"'),
      anchor: 'start', bold: true, size: 14 });

    data.strings.forEach(function (s, idx) {
      S.box('str' + idx, { x: idx * 110, y: -4, w: 100, h: 24, size: 11, mono: true,
        text: '$' + s.id + '=' + s.count, style: 'normal' });
    });
    S.label('strLbl', { x: -14, y: 8, text: T('sayımlar =', 'counts ='), anchor: 'end', size: 12, bold: true });

    var tokW = 74, tokGap = 4;
    tokens.forEach(function (tk, idx) {
      S.box('tok' + idx, { x: idx * (tokW + tokGap), y: 60, w: tokW, h: 26, size: 11, mono: true,
        text: tk, style: 'normal', above: String(idx) });
    });
    S.label('tokLbl', { x: -14, y: 73, text: T('jetonlar =', 'tokens ='), anchor: 'end', size: 12, bold: true });

    var traceN = 0, traceY = 116;
    function pushTrace(text) {
      S.box('tr' + traceN, { x: traceN * 140, y: traceY, w: 132, h: 26, size: 11, text: text, style: 'new' });
      traceN++;
    }
    S.label('trLbl', { x: -14, y: traceY + 13, text: T('değerlendirme izi =', 'evaluation trace ='), anchor: 'end', size: 12, bold: true });

    var pos = { i: 0 }, error = false;

    function markTok(idx, style) {
      if (idx >= 0 && idx < tokens.length) S.set('tok' + idx, { style: style });
    }
    function atTok(idx) { if (idx < tokens.length) S.at(idx); }

    function doPrimary() {
      var idx = pos.i;
      var inBounds = idx < tokens.length;
      var t = inBounds ? tokens[idx] : '';
      pos.i++;
      atTok(idx);
      markTok(idx, 'hl');

      if (t === '(') {
        S.step(T('primary(): "(" görüldü — expr() ile içeri girilir.', 'primary(): saw "(" — recursing into expr().'),
               { c: [R(256)] });
        var v = doExpr();
        var closeIdx = pos.i;
        if (tokens[closeIdx] === ')') {
          markTok(closeIdx, 'hl');
          pos.i++;
          S.step(T('primary(): ")" ile grup kapanıyor.', 'primary(): ")" closes the group.'),
                 { c: [R(257), { n: R(258), note: T('take()==")"?  evet', 'take()==")"?  yes') }] });
        } else {
          error = true;
          S.step(T('primary(): ")" bekleniyordu — SÖZDİZİMİ HATASI.', 'primary(): expected ")" — SYNTAX ERROR.'),
                 { c: [{ n: R(258), note: T('take()==")"?  hayır', 'take()==")"?  no') }, R(259)] });
        }
        markTok(idx, 'dim');
        pushTrace('(' + (v ? 'T' : 'F') + ')');
        return v;
      }
      if (t === 'true') {
        markTok(idx, 'new');
        S.step(T('primary(): "true" sabiti.', 'primary(): the "true" literal.'),
               { c: [{ n: R(262), note: T('t=="true"?  evet', 't=="true"?  yes') }, R(263)] });
        pushTrace('true');
        return 1;
      }
      if (t === 'false') {
        markTok(idx, 'del');
        S.step(T('primary(): "false" sabiti.', 'primary(): the "false" literal.'),
               { c: [{ n: R(264), note: T('t=="false"?  evet', 't=="false"?  yes') }, R(265)] });
        pushTrace('false');
        return 0;
      }
      if (t === 'all' || t === 'any' || /^[0-9]/.test(t)) {
        var needed = t === 'all' ? data.strings.length : t === 'any' ? 1 : parseInt(t, 10);
        var ofIdx = pos.i, themIdx = pos.i + 1;
        var ok = tokens[ofIdx] === 'of' && tokens[themIdx] === 'them';
        if (ok) { markTok(ofIdx, 'dim'); markTok(themIdx, 'dim'); pos.i += 2; }
        if (!ok) {
          error = true;
          markTok(idx, 'del');
          S.step(T('primary(): "' + t + ' of them" bekleniyordu — SÖZDİZİMİ HATASI.',
                    'primary(): expected "' + t + ' of them" — SYNTAX ERROR.'),
                 { c: [{ n: R(270), note: T('"of","them" mi?  hayır', '"of","them"?  no') }, R(271)] });
          pushTrace(t + '?');
          return 0;
        }
        var present = 0;
        data.strings.forEach(function (s) { if (s.count > 0) present++; });
        var v = present >= needed ? 1 : 0;
        markTok(idx, v ? 'new' : 'del');
        S.step(T('primary(): ' + present + ' string mevcut, gereken ' + needed + ' — ' + (v ? 'yeterli' : 'yetersiz') + '.',
                  'primary(): ' + present + ' string(s) present, ' + needed + ' needed — ' + (v ? 'enough' : 'not enough') + '.'),
               { c: [{ n: R(270), note: T('"of","them" mi?  evet', '"of","them"?  yes') }, R(274), R(275), R(276),
                     { n: R(277), note: T('present(' + present + ')>=needed(' + needed + ')?  ' + (v ? 'evet' : 'hayır'),
                                          'present(' + present + ')>=needed(' + needed + ')?  ' + (v ? 'yes' : 'no')) }] });
        pushTrace(t + ' of them -> ' + (v ? 'T' : 'F'));
        return v;
      }
      if (t.charAt(0) === '$' || t.charAt(0) === '#') {
        var id = t.slice(1);
        var known = counts.hasOwnProperty(id);
        if (!known) {
          error = true;
          markTok(idx, 'del');
          S.step(T('primary(): "' + t + '" tanımlı değil — SÖZDİZİMİ HATASI.', 'primary(): "' + t + '" is undefined — SYNTAX ERROR.'),
                 { c: [{ n: R(279), note: T('$ ya da #?  evet', '$ or #?  yes') }, R(280),
                       { n: R(281), note: T('x<0?  evet', 'x<0?  yes') }, R(282)] });
          pushTrace(t + '?');
          return 0;
        }
        if (t.charAt(0) === '$') {
          var v2 = counts[id] > 0 ? 1 : 0;
          markTok(idx, v2 ? 'new' : 'del');
          S.step(T('primary(): $' + id + ' say=' + counts[id] + ' — en az bir kez geçti mi?',
                    'primary(): $' + id + ' count=' + counts[id] + ' — did it appear at least once?'),
                 { c: [{ n: R(279), note: T('$ ya da #?  evet', '$ or #?  yes') }, R(280),
                       { n: R(281), note: T('x<0?  hayır', 'x<0?  no') },
                       { n: R(285), note: T('t[0]=="$"?  evet', 't[0]=="$"?  yes') }, R(286)] });
          pushTrace('$' + id + '=' + counts[id] + ' -> ' + (v2 ? 'T' : 'F'));
          return v2;
        }
        var opIdx = pos.i, numIdx = pos.i + 1;
        var op = tokens[opIdx], numTok = tokens[numIdx];
        markTok(opIdx, 'dim'); markTok(numIdx, 'dim');
        pos.i += 2;
        var n = parseInt(numTok, 10), s = counts[id], v3;
        var lineFor = { '>=': R(294), '>': R(295), '<=': R(296), '<': R(297), '==': R(298) };
        if (op === '>=') v3 = s >= n ? 1 : 0;
        else if (op === '>') v3 = s > n ? 1 : 0;
        else if (op === '<=') v3 = s <= n ? 1 : 0;
        else if (op === '<') v3 = s < n ? 1 : 0;
        else if (op === '==') v3 = s === n ? 1 : 0;
        else { error = true; v3 = 0; }
        markTok(idx, v3 ? 'new' : 'del');
        S.step(T('primary(): #' + id + ' say=' + s + ', ' + op + ' ' + n + ' ile karşılaştırılıyor -> ' + (v3 ? 'evet' : 'hayır') + '.',
                  'primary(): #' + id + ' count=' + s + ', compared ' + op + ' ' + n + ' -> ' + (v3 ? 'yes' : 'no') + '.'),
               { c: [{ n: R(285), note: T('t[0]=="$"?  hayır (# olduğu için)', 't[0]=="$"?  no (it is #)') }, R(287), R(288),
                     { n: R(289), note: T('rakam mı?  evet', 'digit?  yes') }, R(293),
                     { n: lineFor[op] || R(298), note: T(s + ' ' + op + ' ' + n + '?  ' + (v3 ? 'evet' : 'hayır'),
                                                          s + ' ' + op + ' ' + n + '?  ' + (v3 ? 'yes' : 'no')) }] });
        pushTrace('#' + id + op + n + '(' + s + ') -> ' + (v3 ? 'T' : 'F'));
        return v3;
      }
      error = true;
      markTok(idx, inBounds ? 'del' : 'normal');
      S.step(T('primary(): jeton kalmadı ya da tanınmıyor — SÖZDİZİMİ HATASI.',
                'primary(): no token left, or it is unrecognized — SYNTAX ERROR.'),
             { c: [R(302), R(303)] });
      pushTrace('?');
      return 0;
    }

    function doNot() {
      if (tokens[pos.i] === 'not') {
        var idx = pos.i;
        atTok(idx);
        markTok(idx, 'active');
        pos.i++;
        S.step(T('not_expr(): "not" görüldü — bir sonraki not_expr() çağrılır.', 'not_expr(): saw "not" — recursing into the next not_expr().'),
               { c: [{ n: R(308), note: T('peek()=="not"?  evet', 'peek()=="not"?  yes') }, R(309)] });
        var v = doNot();
        var r = v ? 0 : 1;
        markTok(idx, r ? 'new' : 'del');
        pushTrace('not -> ' + (r ? 'T' : 'F'));
        return r;
      }
      return doPrimary();
    }

    function doAnd() {
      var v = doNot();
      while (tokens[pos.i] === 'and') {
        var idx = pos.i;
        atTok(idx);
        markTok(idx, 'active');
        pos.i++;
        S.step(T('and_expr(): "and" görüldü — SAĞ taraf da HER ZAMAN değerlendirilir (kısa devre yok).',
                  'and_expr(): saw "and" — the RIGHT side is ALWAYS evaluated too (no short-circuit).'),
               { c: [{ n: R(318), note: T('peek()=="and"?  evet', 'peek()=="and"?  yes') }, R(319)] });
        var r = doNot();
        var newV = (v && r) ? 1 : 0;
        markTok(idx, newV ? 'new' : 'del');
        S.step(T('and_expr(): ' + (v ? 'true' : 'false') + ' and ' + (r ? 'true' : 'false') + ' = ' + (newV ? 'true' : 'false') + '.',
                  'and_expr(): ' + (v ? 'true' : 'false') + ' and ' + (r ? 'true' : 'false') + ' = ' + (newV ? 'true' : 'false') + '.'),
               { c: [R(320), R(321)] });
        pushTrace((v ? 'T' : 'F') + ' and ' + (r ? 'T' : 'F') + ' -> ' + (newV ? 'T' : 'F'));
        v = newV;
      }
      return v;
    }

    function doExpr() {
      var v = doAnd();
      while (tokens[pos.i] === 'or') {
        var idx = pos.i;
        atTok(idx);
        markTok(idx, 'active');
        pos.i++;
        S.step(T('expr(): "or" görüldü — SAĞ taraf da HER ZAMAN değerlendirilir.', 'expr(): saw "or" — the RIGHT side is ALWAYS evaluated too.'),
               { c: [{ n: R(329), note: T('peek()=="or"?  evet', 'peek()=="or"?  yes') }, R(330)] });
        var r = doAnd();
        var newV = (v || r) ? 1 : 0;
        markTok(idx, newV ? 'new' : 'del');
        S.step(T('expr(): ' + (v ? 'true' : 'false') + ' or ' + (r ? 'true' : 'false') + ' = ' + (newV ? 'true' : 'false') + '.',
                  'expr(): ' + (v ? 'true' : 'false') + ' or ' + (r ? 'true' : 'false') + ' = ' + (newV ? 'true' : 'false') + '.'),
               { c: [R(331), R(332)] });
        pushTrace((v ? 'T' : 'F') + ' or ' + (r ? 'T' : 'F') + ' -> ' + (newV ? 'T' : 'F'));
        v = newV;
      }
      return v;
    }

    S.at(0);
    S.step(T('evaluate_condition(): koşul jetonlara ayrılıyor (parantezler ayrı jeton), expr() ile ayrıştırma başlıyor.',
              'evaluate_condition(): the condition is split into tokens (parens become their own token), parsing begins with expr().'),
           { c: [R(338), R(343), R(356), R(361)] });
    var finalV = doExpr();
    var leftover = pos.i < tokens.length;
    if (leftover) error = true;
    S.at(null);
    for (var k = 0; k < tokens.length; k++) markTok(k, error ? 'del' : 'dim');
    if (error) {
      S.step(T('>>> SONUÇ: KOŞUL HATASI (sözdizimi bozuk ya da jeton arttı).', '>>> RESULT: CONDITION ERROR (broken syntax, or leftover tokens).'),
             { c: [{ n: R(362), note: T('error || i!=n?  evet', 'error || i!=n?  yes') }, R(363)] });
    } else {
      S.step(T('>>> SONUÇ: koşul ' + (finalV ? 'EŞLEŞTİ' : 'eşleşmedi') + '.', '>>> RESULT: the condition ' + (finalV ? 'MATCHED' : 'did not match') + '.'),
             { c: [{ n: R(362), note: T('error || i!=n?  hayır', 'error || i!=n?  no') }, R(364)] });
    }
    S.result = reference(data);
  }

  D.define({
    id: 'rule-condition-eval',
    title: T('Kural motoru: koşul ayrıştırıcı (engine.c)', 'Rule engine: the condition evaluator (engine.c)'),
    code: { c: COND_C },
    presets: [
      { id: 'normal-nested-and-context', level: 'normal',
        name: T('Normal: parantez + zincirlenmiş "and" (Word_Context kuralı gibi)', 'Normal: parens + chained "and" (like the Word_Context rule)'),
        data: mk('($a and $b) and $magic', [{ id: 'a', count: 1 }, { id: 'b', count: 1 }, { id: 'magic', count: 1 }]) },
      { id: 'hard-not-or-count', level: 'hard',
        name: T('Zor: "not", "or" ve bir #say karşılaştırması bir arada', 'Hard: "not", "or" and a #count comparison together'),
        data: mk('not $decoy or #t >= 3', [{ id: 'decoy', count: 1 }, { id: 't', count: 2 }]) },
      { id: 'edge-single-atom', level: 'edge', small: true,
        name: T('Uç durum: tek atom, hiç operatör yok (en kısa geçerli koşul)', 'Edge case: a single atom, no operator at all (the shortest valid condition)'),
        data: mk('$h', [{ id: 'h', count: 0 }]) },
      { id: 'edge-all-of-them-missing-one', level: 'edge', small: true,
        name: T('Uç durum: "all of them", tam sınırda — biri eksik olunca başarısız', 'Edge case: "all of them", right at the boundary — fails when just one is missing'),
        data: mk('all of them', [{ id: 'a', count: 1 }, { id: 'b', count: 1 }, { id: 'c', count: 0 }]) },
      { id: 'edge-syntax-error-incomplete-and', level: 'edge', small: true,
        name: T('Uç durum: kırık koşul, "and"ın sağı yok — KOŞUL HATASI', 'Edge case: a broken condition, "and" has no right side — CONDITION ERROR'),
        data: mk('$a and', [{ id: 'a', count: 1 }]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: a condition is a short, fixed-shape expression (engine.c caps a rule at
    // MAX_STRINGS=8 named strings) -- not the variable-length list the "≥10" rule targets, the same
    // opt-out windows-ace-evaluation-order.js and rbac-clark-wilson-transaction-check.js use.
    random: function (level, r) {
      var n = level === 'easy' ? 2 : level === 'normal' ? D.randInt(r, 2, 3) : level === 'hard' ? D.randInt(r, 3, 4) : D.randInt(r, 4, 5);
      var idPool = ['a', 'b', 'c', 'd', 'e'];
      var ids = idPool.slice(0, n);
      var strings = ids.map(function (id) { return { id: id, count: D.randInt(r, 0, 4) }; });
      var parts = ids.map(function (id) {
        var kind = level === 'easy' ? 0 : D.randInt(r, 0, 2);
        var atom = kind === 0 ? ('$' + id) : kind === 1 ? ('#' + id + ' >= ' + D.randInt(r, 0, 3)) : ('#' + id + ' == ' + D.randInt(r, 0, 3));
        if (level !== 'easy' && r() < 0.3) atom = 'not ' + atom;
        return atom;
      });
      var cond = parts[0];
      for (var i = 1; i < parts.length; i++)
        cond += ' ' + (level === 'easy' ? 'and' : (r() < 0.5 ? 'and' : 'or')) + ' ' + parts[i];
      return mk(cond, strings);
    },
    input: {
      hint: T('koşul | id=say,id=say,…', 'condition | id=count,id=count,…'),
      format: function (data) { return data.condition + ' | ' + data.strings.map(function (s) { return s.id + '=' + s.count; }).join(','); },
      tokens: function (data) { return tokenize(data.condition); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 2) throw T('"koşul | id=say,…" biçiminde olmalı.', 'Must be "condition | id=count,…".');
        var cond = parts[0].trim();
        if (!cond) throw T('Koşul boş olamaz.', 'The condition cannot be empty.');
        var strings = parts[1].split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(function (t) {
          var m = t.match(/^(\w+)=(\d+)$/);
          if (!m) throw T('"' + t + '" "id=say" biçiminde olmalı.', '"' + t + '" must look like "id=count".');
          return { id: m[1], count: parseInt(m[2], 10) };
        });
        if (!strings.length) throw T('En az bir string tanımlayın.', 'Define at least one string.');
        return mk(cond, strings);
      },
      bad: ['', '$a and $b', 'not $a | id=abc', '$a | ', 'a|b|c']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
