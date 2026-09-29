// CEN429 — Week 2 — Demo 4 (code/week-02/04-attack-tree/tree.c: compute())
// An attack tree's cheapest-attack cost is computed bottom-up: a LEAF's cost comes from the file; an
// AND node's cost is the SUM of its children (every step is required); an OR node's cost is the
// MINIMUM of its children (the attacker only needs one way in). The root's cost is the attacker's
// cheapest path to the goal — and that is exactly the chain a defender should reinforce first.
//
// Data model (kept to two levels on purpose, for a scene that stays readable and a parser that stays
// simple): the root is always `GOAL: ... / OR` over a list of GROUPS, exactly like every real
// tree-*.txt file in code/week-02/04-attack-tree/. Each group is either one LEAF, or an AND of 2-4
// leaves — both shapes appear in the real files (e.g. tree-attributed.txt's "Copy and decrypt the
// local database" AND-group vs. "Read memory with a debugger" leaf alternatives).
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (tree.c 59-96)
  // The real compute() also tracks two attributes this animation does not visualize (time in days,
  // skill 1-5) alongside cost; those lines are shown (byte-identical, nothing removed) but no step
  // below highlights them, since this animation is about the AND-sum / OR-min COST rule only.
  var COMPUTE_C = [
    'static int compute(int i)',
    '{',
    '    struct node *x = &nodes[i];',
    '    if (x->type == LEAF)',
    '        return x->cost;',
    '',
    '    if (x->type == AND) {',
    '        /* All of them are required: cost and time are SUMMED, skill is the',
    '         * HIGHEST (the hardest step sets the expertise needed). */',
    '        long total = 0, time = 0;',
    '        int skill = 0;',
    '        for (int c = 0; c < x->child_count; c++) {',
    '            total += compute(x->children[c]);',
    '            time += nodes[x->children[c]].time;',
    '            if (nodes[x->children[c]].skill > skill)',
    '                skill = nodes[x->children[c]].skill;',
    '        }',
    '        x->cost = total > INF_COST ? INF_COST : (int)total;',
    '        x->time = (int)time;',
    '        x->skill = skill;',
    '    } else { /* OR */',
    '        int cheapest = INF_COST, pick = -1;',
    '        for (int c = 0; c < x->child_count; c++) {',
    '            int m = compute(x->children[c]);',
    '            if (m < cheapest) {',
    '                cheapest = m;',
    '                pick = x->children[c];',
    '            }',
    '        }',
    '        x->cost = cheapest;',
    '        x->cheapest_child = pick;',
    '        if (pick >= 0) {',
    '            x->time = nodes[pick].time;',
    '            x->skill = nodes[pick].skill;',
    '        }',
    '    }',
    '    return x->cost;',
    '}'
  ];
  // `{c:[N]}` below addresses the code panel's own Nth displayed line (COMPUTE_C is shown whole,
  // tree.c 59-96 in the real file — no BASE arithmetic needed).

  function leafG(name, cost) { return { type: 'LEAF', name: name, leaves: [{ name: name, cost: cost }] }; }
  function andG(name, leaves) { return { type: 'AND', name: name, leaves: leaves }; }
  function mk(goal, groups) { return { goal: goal, groups: groups }; }

  function groupCost(g) {
    if (g.type === 'LEAF') return g.leaves[0].cost;
    var s = 0; g.leaves.forEach(function (l) { s += l.cost; }); return s;
  }

  /** Independent: finds the minimum with Math.min.apply (never the manual "if (m < cheapest)" loop
   * build() draws step by step), and sums an AND group with reduce() instead of a running total. */
  function reference(data) {
    var costs = data.groups.map(function (g) {
      return g.type === 'LEAF' ? g.leaves[0].cost : g.leaves.reduce(function (a, l) { return a + l.cost; }, 0);
    });
    var min = Math.min.apply(null, costs);
    return { rootCost: min, winner: costs.indexOf(min) };
  }

  function build(S, data) {
    var gx = 0, gGap = 50, leafW = 168, leafH = 34, leafGap = 12, groupPad = 16;
    var groupX = [];
    data.groups.forEach(function (g, gi) {
      groupX.push(gx);
      var gw = g.leaves.length * (leafW + leafGap) - leafGap + 2 * groupPad;
      if (g.type === 'AND') {
        S.region('grp' + gi, { x: gx, y: 80, w: gw, h: leafH + 2 * groupPad, title: '[AND] ' + g.name });
      }
      g.leaves.forEach(function (l, li) {
        var lx = gx + groupPad + li * (leafW + leafGap);
        S.box('leaf' + gi + '_' + li, { x: lx, y: 80 + groupPad, w: leafW, h: leafH, size: 11, mono: false,
          above: 'cost=' + l.cost, text: l.name, style: 'normal' });
      });
      S.arrow('rootArrow' + gi, { from: 'root', to: g.type === 'AND' ? 'grp' + gi : 'leaf' + gi + '_0', kind: 'center', head: false });
      gx += gw + gGap;
    });
    S.box('root', { x: (gx - gGap) / 2 - 110, y: 0, w: 220, h: 40, size: 13, text: '[OR] ' + data.goal, style: 'active' });
    S.at(0);
    S.step(T('Kök her zaman OR: ' + data.groups.length + ' seçenekten biri yeterli. Önce her seçeneğin kendi maliyeti hesaplanıyor.',
              'The root is always OR: one of the ' + data.groups.length + ' options is enough. Each option\'s own cost is computed first.'),
           { c: [{ n: 4, note: T('x->type == LEAF? hayır (kök her zaman OR)', 'x->type == LEAF? no (the root is always OR)') }, { n: 5, skip: true }] });

    var costs = [];
    data.groups.forEach(function (g, gi) {
      S.at(gi);
      if (g.type === 'AND') {
        var terms = g.leaves.map(function (l) { return l.cost; });
        var sum = terms.reduce(function (a, b) { return a + b; }, 0);
        costs.push(sum);
        g.leaves.forEach(function (l, li) { S.set('leaf' + gi + '_' + li, { style: 'hl' }); });
        S.step(T('"' + g.name + '" bir AND: tüm ' + g.leaves.length + ' adım gerekli, maliyetler TOPLANIR: ' + terms.join('+') + ' = ' + sum,
                  '"' + g.name + '" is an AND: all ' + g.leaves.length + ' steps are required, costs are SUMMED: ' + terms.join('+') + ' = ' + sum),
               { c: gi === 0
                 ? [{ n: 4, note: T('x->type == LEAF? hayır (bu bir AND)', 'x->type == LEAF? no (this is an AND)') }, { n: 5, skip: true },
                    { n: 7, note: T('x->type == AND? evet', 'x->type == AND? yes') }, 10,
                    { n: 12, note: T('c(0) < child_count(' + g.leaves.length + ')? evet', 'c(0) < child_count(' + g.leaves.length + ')? yes') }, 13,
                    { n: 18, note: T('total(' + sum + ') > INF_COST? hayır', 'total(' + sum + ') > INF_COST? no') }]
                 : [{ n: 12, note: T('c(0) < child_count(' + g.leaves.length + ')? evet', 'c(0) < child_count(' + g.leaves.length + ')? yes') }, 13,
                    { n: 18, note: T('total(' + sum + ') > INF_COST? hayır', 'total(' + sum + ') > INF_COST? no') }] });
        g.leaves.forEach(function (l, li) { S.set('leaf' + gi + '_' + li, { style: 'dim' }); });
        S.set('grp' + gi, { title: '[AND] ' + g.name + ' = ' + sum });
      } else {
        costs.push(g.leaves[0].cost);
        S.set('leaf' + gi + '_0', { style: 'hl' });
        S.step(T('"' + g.name + '" tek bir LEAF: maliyeti dosyadan doğrudan geliyor: ' + g.leaves[0].cost + '.',
                  '"' + g.name + '" is a single LEAF: its cost comes straight from the file: ' + g.leaves[0].cost + '.'),
               { c: [{ n: 4, note: T('x->type == LEAF? evet', 'x->type == LEAF? yes') }, 5] });
        S.set('leaf' + gi + '_0', { style: 'dim' });
      }
    });
    S.at(null);
    var min = Math.min.apply(null, costs), winner = costs.indexOf(min);
    var winnerG = data.groups[winner];
    if (winnerG.type === 'AND') { winnerG.leaves.forEach(function (l, li) { S.set('leaf' + winner + '_' + li, { style: 'new' }); }); S.set('grp' + winner, { style: 'new' }); }
    else S.set('leaf' + winner + '_0', { style: 'new' });
    S.set('root', { text: '[OR] ' + data.goal + ' = ' + min, style: 'new' });
    S.step(T('OR: kök = min(' + costs.join(', ') + ') = ' + min + '. EN UCUZ SALDIRI budur — savunmacının önce kırması gereken zincir.',
              'OR: the root = min(' + costs.join(', ') + ') = ' + min + '. This is the CHEAPEST ATTACK — the chain a defender should break first.'),
           { c: [22, { n: 23, note: T('c(0) < child_count(' + costs.length + ')? evet (her seçenek için tekrarlanır)', 'c(0) < child_count(' + costs.length + ')? yes (repeats for every option)') },
                 24, { n: 25, note: T('m < cheapest? en ucuz (' + min + ') olan seçenekte evet', 'm < cheapest? yes, at the cheapest (' + min + ') option') }, 26, 27, 30, 31,
                 { n: 32, note: T('pick >= 0? evet (en az bir seçenek var)', 'pick >= 0? yes (at least one option exists)') }, 33, 34] });
    S.result = { rootCost: min, winner: winner };
  }

  D.define({
    id: 'attack-tree-eval',
    title: T('Saldırı ağacı: AND toplar, OR en ucuzu seçer (tree.c)', 'Attack tree: AND sums, OR picks the cheapest (tree.c)'),
    code: { c: COMPUTE_C },
    presets: [
      { id: 'normal-three-options', level: 'normal',
        name: T('Normal: kök OR, üç seçenekten en ucuzu kazanıyor', 'Normal: a root OR, the cheapest of three options wins'),
        data: mk('Obtain the payment key', [
          andG('Decrypt the database', [{ name: 'Get root', cost: 3 }, { name: 'Find the DB key', cost: 6 }, { name: 'Run the decryptor', cost: 1 }]),
          andG('Read memory live', [{ name: 'Attach a debugger', cost: 2 }, { name: 'Dump the process', cost: 2 }, { name: 'Scan for the key', cost: 1 }]),
          andG('Eavesdrop on the network', [{ name: 'Break TLS', cost: 7 }, { name: 'Break app encryption', cost: 8 }, { name: 'Capture traffic', cost: 1 }, { name: 'Decode the session', cost: 2 }])
        ]) },
      { id: 'hard-many-and-groups', level: 'hard',
        name: T('Zor: beş AND grubu, aralarındaki fark küçük', 'Hard: five AND groups, the gap between them is small'),
        data: mk('Full compromise', [
          andG('Path A', [{ name: 'Recon A', cost: 4 }, { name: 'Access A', cost: 5 }, { name: 'Escalate A', cost: 3 }]),
          andG('Path B', [{ name: 'Recon B', cost: 3 }, { name: 'Access B', cost: 4 }, { name: 'Escalate B', cost: 5 }]),
          andG('Path C', [{ name: 'Recon C', cost: 5 }, { name: 'Access C', cost: 4 }, { name: 'Escalate C', cost: 2 }]),
          andG('Path D', [{ name: 'Recon D', cost: 4 }, { name: 'Access D', cost: 4 }, { name: 'Escalate D', cost: 4 }]),
          andG('Path E', [{ name: 'Recon E', cost: 3 }, { name: 'Access E', cost: 5 }, { name: 'Escalate E', cost: 4 }])
        ]) },
      { id: 'edge-single-leaf-root', level: 'edge', small: true,
        name: T('Uç durum: kök tek bir LEAF (dallanma yok)', 'Edge case: the root is a single LEAF (no branching at all)'),
        data: mk('Guess a default password', [leafG('Try admin/admin', 1)]) },
      { id: 'edge-all-leaves-no-and', level: 'edge', small: true,
        name: T('Uç durum: her seçenek tek bir LEAF, hiç AND yok', 'Edge case: every option is a single LEAF, no AND at all'),
        data: mk('Get in', [leafG('Phishing', 5), leafG('Password reuse', 3), leafG('Unpatched CVE', 8)]) },
      { id: 'edge-tie-first-wins', level: 'edge', small: true,
        name: T('Uç durum: iki seçenek aynı maliyette, ilki kazanır', 'Edge case: two options tie in cost, the first one wins'),
        data: mk('Goal', [leafG('Path X', 10), leafG('Path Y', 10), leafG('Path Z', 12)]) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { var n = 0; data.groups.forEach(function (g) { n += g.leaves.length; }); return n; },
    random: function (level, r) {
      var groupCount = level === 'easy' ? 3 : level === 'normal' ? D.randInt(r, 3, 4) : level === 'hard' ? D.randInt(r, 4, 5) : D.randInt(r, 4, 6);
      var groups = [], leafTotal = 0, minLeaves = level === 'edge' ? 3 : 10;
      for (var g = 0; g < groupCount || leafTotal < minLeaves; g++) {
        var kind = level === 'easy' ? 'AND' : (r() < 0.35 ? 'LEAF' : 'AND');
        if (kind === 'LEAF') {
          groups.push(leafG('Option ' + (g + 1), D.randInt(r, 1, 20)));
          leafTotal += 1;
        } else {
          var n = D.randInt(r, 2, 4), leaves = [];
          for (var k = 0; k < n; k++) leaves.push({ name: 'Step ' + (g + 1) + '.' + (k + 1), cost: D.randInt(r, 1, 15) });
          groups.push(andG('Path ' + (g + 1), leaves));
          leafTotal += n;
        }
        if (g > 20) break; // safety valve, never realistically hit
      }
      return mk('Goal', groups);
    },
    input: {
      hint: T('HEDEF :: SEÇENEK=yaprak:cost,yaprak:cost; SEÇENEK2=yaprak:cost; …',
              'GOAL :: OPTION=leaf:cost,leaf:cost; OPTION2=leaf:cost; …'),
      format: function (data) {
        return data.goal + ' :: ' + data.groups.map(function (g) {
          return g.name + '=' + g.leaves.map(function (l) { return l.name + ':' + l.cost; }).join(',');
        }).join('; ');
      },
      tokens: function (data) { return data.groups.map(function (g) { return g.name; }); },
      parse: function (text) {
        var head = String(text).split('::');
        if (head.length !== 2) throw T('"HEDEF :: seçenekler" biçiminde olmalı.', 'Must look like "GOAL :: options".');
        var goalText = head[0].trim();
        if (!goalText) throw T('Hedef adı boş olamaz.', 'The goal name cannot be empty.');
        var parts = head[1].split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        if (parts.length < 1) throw T('En az 1 seçenek girin.', 'Enter at least 1 option.');
        var groups = [];
        parts.forEach(function (p) {
          var eq = p.indexOf('=');
          if (eq < 0) throw T('"' + p + '" "isim=yaprak:cost,.." biçiminde olmalı.', '"' + p + '" must look like "name=leaf:cost,..".');
          var name = p.slice(0, eq).trim(), rest = p.slice(eq + 1).trim();
          var leafToks = rest.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          if (!leafToks.length) throw T('"' + p + '" en az bir yaprak içermeli.', '"' + p + '" must have at least one leaf.');
          var leaves = leafToks.map(function (t) {
            var m = t.match(/^(.+):(\d+)$/);
            if (!m) throw T('"' + t + '" "isim:cost" biçiminde olmalı.', '"' + t + '" must look like "name:cost".');
            return { name: m[1].trim(), cost: parseInt(m[2], 10) };
          });
          groups.push(leaves.length === 1 && leaves[0].name === name ? leafG(name, leaves[0].cost) : andG(name, leaves));
        });
        return mk(goalText, groups);
      },
      bad: ['', 'no separator here', 'Goal :: onlyone:5', 'Goal :: a=leaf:notanumber']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
