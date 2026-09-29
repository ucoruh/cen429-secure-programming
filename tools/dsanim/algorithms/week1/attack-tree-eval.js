// CEN429 — Week 1 — Attack tree evaluation: cheapest path through AND/OR nodes
// Reference: docs/week-1/cen429-week-1.{tr,en}.md, section 7, "Saldiri agaci" (Schneier, 1999). Root = the
// attacker's goal; an OR node needs only ONE child (cost = the cheapest child); an AND node needs ALL children
// (cost = the sum of every child). This animation evaluates a two-level attack tree bottom-up and highlights the
// globally cheapest strategy.
//
// Design note: `data` (round-tripped through parse/format) holds ONLY ids, kinds and integer costs — never
// presentation text — so parse(format(data)) can always equal data exactly. Bilingual display labels for the
// four named presets live in the separate LABELS table below, keyed by id; labelFor() falls back to the raw id
// itself (shown identically in both languages, like a directory name) for random data and hand-typed trees.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    '/* Attack tree evaluation (Schneier, 1999): cost of reaching the root */',
    '/* OR node:  attacker needs only ONE child  -> cost = min(children)   */',
    '/* AND node: attacker needs ALL children    -> cost = sum(children)  */',
    'cost(node):',
    '    if node is LEAF:  return node.cost',
    '    if node is OR:    return min( cost(child) for child in node.children )',
    '    if node is AND:   return sum( cost(child) for child in node.children )'
  ];

  function leaf(id, cost) { return { id: id, cost: cost }; }
  function branch(id, kind, leaves) { return { id: id, kind: kind, leaves: leaves }; }
  function mk(rootKind, branches) { return { rootKind: rootKind, branches: branches }; }

  var LABELS = {};
  function lbl(id, tr, en) { LABELS[id] = T(tr, en); }
  function labelFor(id) { return LABELS[id] || T(id, id); }

  lbl('A', 'İkili dosyadan çıkar', 'Extract from the binary');
  lbl('A1', 'gizlemeyi tersine mühendislik', 'reverse-engineer the obfuscation');
  lbl('A2', 'gömülü anahtarı bul', 'find the embedded key');
  lbl('B', 'Çalışma zamanında bellekten oku', 'Read it from memory at runtime');
  lbl('B1', 'kilit açıkken bellek dökümü al', 'dump memory while unlocked');
  lbl('B2', 'hata ayıklayıcı bağla', 'attach a debugger');
  lbl('B3', 'çökme dökümünü incele', 'inspect a crash dump');
  lbl('B4', 'takas dosyasını tara', 'scan the swap file');
  lbl('C', 'Kriptoyu kır + bütünlüğü atlat', 'Break the crypto + bypass integrity');
  lbl('C1', 'zayıf anahtar türetmeyi kır', 'break the weak key derivation');
  lbl('C2', 'kurcalama denetimini atlat', 'bypass tamper detection');
  lbl('C3', 'güncelleme imzasını atlat', 'bypass the update signature');
  lbl('D', 'Bir geliştiriciyi sosyal mühendislikle kandır', 'Social-engineer a developer');
  lbl('D1', 'kimlik avı', 'phishing');
  lbl('D2', 'içeriden rüşvet', 'an insider bribe');
  var PAYMENT_KEY = mk('OR', [
    branch('A', 'AND', [leaf('A1', 40), leaf('A2', 5)]),
    branch('B', 'OR', [leaf('B1', 2), leaf('B2', 3), leaf('B3', 1), leaf('B4', 6)]),
    branch('C', 'AND', [leaf('C1', 20), leaf('C2', 15), leaf('C3', 25)]),
    branch('D', 'OR', [leaf('D1', 8), leaf('D2', 50)])
  ]);

  lbl('P', 'Denetimi atlat', 'Bypass the check');
  lbl('P1', 'ikiliyi yamala', 'patch the binary');
  lbl('P2', 'sahte lisans sunucusu', 'a fake license server');
  lbl('P3', 'zaman damgasını geri al', 'roll back the clock');
  lbl('P4', 'donanım kimliğini sahtele', 'spoof the hardware id');
  lbl('P5', 'doğrulama fonksiyonunu kanca', 'hook the verification function');
  lbl('P6', 'sürüm dosyasını değiştir', 'edit the license file');
  lbl('P7', 'bellekte bayrağı çevir', 'flip the flag in memory');
  lbl('Q', 'Algılanmaktan kaçın', 'Avoid detection');
  lbl('Q1', 'bütünlük özetini yeniden hesapla', 'recompute the integrity hash');
  lbl('Q2', 'ağ raporlamasını kapat', 'disable network reporting');
  lbl('Q3', 'sahte günlük yaz', 'write fake log entries');
  lbl('Q4', 'hata ayıklayıcı algılamayı devre dışı bırak', 'disable debugger detection');
  lbl('Q5', 'süreç adını değiştir', 'rename the process');
  lbl('Q6', 'zamanlama kontrolünü atlat', 'defeat the timing check');
  lbl('Q7', 'imza doğrulamasını sahte geçir', 'spoof the signature check');
  var LICENSE_CHECK = mk('AND', [
    branch('P', 'OR', [leaf('P1', 12), leaf('P2', 18), leaf('P3', 4), leaf('P4', 22), leaf('P5', 9), leaf('P6', 6), leaf('P7', 3)]),
    branch('Q', 'OR', [leaf('Q1', 30), leaf('Q2', 10), leaf('Q3', 14), leaf('Q4', 7), leaf('Q5', 2), leaf('Q6', 11), leaf('Q7', 19)])
  ]);

  lbl('X', 'İlk katman', 'First layer'); lbl('X1', 'tek yol', 'the only way');
  lbl('Y', 'İkinci katman', 'Second layer'); lbl('Y1', 'tek yol', 'the only way');
  var TINY = mk('AND', [
    branch('X', 'OR', [leaf('X1', 7)]),
    branch('Y', 'OR', [leaf('Y1', 3)])
  ]);

  lbl('M', 'Katman 1', 'Layer 1'); lbl('N', 'Katman 2', 'Layer 2'); lbl('O', 'Katman 3', 'Layer 3');
  var ALL_AND = mk('AND', [
    branch('M', 'AND', [leaf('M1', 4), leaf('M2', 6), leaf('M3', 5)]),
    branch('N', 'AND', [leaf('N1', 3), leaf('N2', 4)]),
    branch('O', 'AND', [leaf('O1', 8), leaf('O2', 2), leaf('O3', 7), leaf('O4', 1), leaf('O5', 9)])
  ]);

  function leafCount(data) {
    var n = 0;
    data.branches.forEach(function (b) { n += b.leaves.length; });
    return n;
  }

  /** Independent computation: reduce()-based (build() uses running-min/running-sum comparisons step by step
   * instead), so the two never share a code path. */
  function reference(data) {
    var branchResults = data.branches.map(function (b) {
      var costs = b.leaves.map(function (l) { return l.cost; });
      var cost = b.kind === 'AND' ? costs.reduce(function (a, c) { return a + c; }, 0) : Math.min.apply(null, costs);
      var winner = null;
      if (b.kind === 'OR') {
        var bestIdx = costs.reduce(function (bi, c, i) { return c < costs[bi] ? i : bi; }, 0);
        winner = b.leaves[bestIdx].id;
      }
      return { id: b.id, kind: b.kind, cost: cost, winner: winner };
    });
    var bcosts = branchResults.map(function (r) { return r.cost; });
    var rootCost = data.rootKind === 'AND' ? bcosts.reduce(function (a, c) { return a + c; }, 0) : Math.min.apply(null, bcosts);
    var winningBranch = null;
    if (data.rootKind === 'OR') {
      var bi = bcosts.reduce(function (bi, c, i) { return c < bcosts[bi] ? i : bi; }, 0);
      winningBranch = data.branches[bi].id;
    }
    return { rootKind: data.rootKind, rootCost: rootCost, branches: branchResults, winningBranch: winningBranch };
  }

  function build(S, data) {
    var BW = 220, BH = 40, LW = 140, LH = 32, BY = 130, LGAPX = 20;
    var n = data.branches.length;
    var totalLeaves = leafCount(data);
    var xCursor = 0;
    var branchX = [];

    data.branches.forEach(function (b) {
      var startX = xCursor;
      b.leaves.forEach(function (l) {
        var x = xCursor;
        S.box('leaf_' + l.id, { x: x, y: BY, w: LW, h: LH, size: 12, mono: false, text: labelFor(l.id), style: 'normal' });
        S.label('cost_' + l.id, { x: x + LW / 2, y: BY + LH + 16, text: String(l.cost), anchor: 'middle', size: 13, bold: true, mono: true });
        xCursor += LW + LGAPX;
      });
      var endX = xCursor - LGAPX;
      branchX.push((startX + endX) / 2);
      xCursor += 30;
    });
    data.branches.forEach(function (b, bi) {
      S.box('br_' + b.id, { x: branchX[bi] - BW / 2, y: 40, w: BW, h: BH, size: 13, mono: false, text: labelFor(b.id), style: 'dim', above: b.kind });
      b.leaves.forEach(function (l) { S.arrow('a_br_' + l.id, { from: 'br_' + b.id, to: 'leaf_' + l.id, kind: 'center', style: 'dim', head: false }); });
    });
    var rootX = (branchX[0] + branchX[n - 1]) / 2;
    S.box('root', { x: rootX - 100, y: -60, w: 200, h: BH, size: 14, mono: false, text: T('Hedef: anahtarı ele geçir', 'Goal: obtain the key'), style: 'hl', above: data.rootKind });
    data.branches.forEach(function (b) { S.arrow('a_root_' + b.id, { from: 'root', to: 'br_' + b.id, kind: 'center', style: 'dim', head: false }); });

    S.step(T('Saldırı ağacı: kök hedeftir, ' + n + ' dal ve ' + totalLeaves + ' yaprak var. Her yaprağın altında saldırgana bu yolun maliyeti (ör. saat) yazıyor.',
              'The attack tree: the root is the goal, there are ' + n + ' branches and ' + totalLeaves + ' leaves. Under each leaf is the attacker\'s cost for that path (e.g. hours).'),
           {});

    var branchCost = [], branchWinner = [];
    data.branches.forEach(function (b, bi) {
      var costs = b.leaves.map(function (l) { return l.cost; });
      b.leaves.forEach(function (l) { S.set('leaf_' + l.id, { style: 'active' }); });
      if (b.kind === 'AND') {
        var sum = 0;
        b.leaves.forEach(function (l) { sum += l.cost; });
        branchCost[bi] = sum;
        b.leaves.forEach(function (l) { S.set('leaf_' + l.id, { style: 'new' }); });
        S.set('br_' + b.id, { style: 'new' });
        S.step(T('`' + labelFor(b.id).tr + '` bir **VE** düğümü: saldırgan ' + b.leaves.length + ' yaprağın HEPSİNİ yapmalı -> maliyet = toplam = ' + sum + '.',
                  '`' + labelFor(b.id).en + '` is an **AND** node: the attacker needs ALL ' + b.leaves.length + ' leaves -> cost = sum = ' + sum + '.'),
               { c: [
                 { n: 5, skip: true },
                 { n: 6, skip: true },
                 { n: 7, note: T(labelFor(b.id).tr + ' VE mi? evet -> toplam = ' + sum, labelFor(b.id).en + ' is AND? yes -> sum = ' + sum) }
               ] });
      } else {
        var best = 0;
        for (var i = 1; i < costs.length; i++) if (costs[i] < costs[best]) best = i;
        branchCost[bi] = costs[best];
        branchWinner[bi] = b.leaves[best].id;
        b.leaves.forEach(function (l, li) { S.set('leaf_' + l.id, { style: li === best ? 'new' : 'dim' }); });
        S.set('br_' + b.id, { style: 'new' });
        S.step(T('`' + labelFor(b.id).tr + '` bir **VEYA** düğümü: saldırgan yalnız BİRİNİ yapar, en ucuzunu seçer -> maliyet = min = ' + branchCost[bi] + ' (`' + labelFor(b.leaves[best].id).tr + '`).',
                  '`' + labelFor(b.id).en + '` is an **OR** node: the attacker only needs ONE, and picks the cheapest -> cost = min = ' + branchCost[bi] + ' (`' + labelFor(b.leaves[best].id).en + '`).'),
               { c: [
                 { n: 5, skip: true },
                 { n: 6, note: T(labelFor(b.id).tr + ' VEYA mi? evet -> min = ' + branchCost[bi], labelFor(b.id).en + ' is OR? yes -> min = ' + branchCost[bi]) },
                 { n: 7, skip: true }
               ] });
      }
      S.label('bc_' + b.id, { x: branchX[bi], y: 40 + BH + 16, text: String(branchCost[bi]), anchor: 'middle', size: 13, bold: true, mono: true });
    });

    data.branches.forEach(function (b) { S.set('br_' + b.id, { style: 'dim' }); });
    if (data.rootKind === 'AND') {
      var total = 0;
      branchCost.forEach(function (c) { total += c; });
      data.branches.forEach(function (b) { S.set('br_' + b.id, { style: 'new' }); });
      S.set('root', { style: 'new' });
      S.step(T('Kök bir **VE** düğümü: bütün dallar gerekli -> toplam maliyet = ' + total + '. Bu, katmanlı savunmanın gücüdür: her katman saldırganın maliyetine eklenir.',
                'The root is an **AND** node: every branch is required -> total cost = ' + total + '. This is the power of layered defence: every layer adds to the attacker\'s cost.'),
             { c: [
               { n: 5, skip: true },
               { n: 6, skip: true },
               { n: 7, note: T('kök VE mi? evet -> toplam = ' + total, 'root is AND? yes -> sum = ' + total) }
             ] });
      S.result = reference(data);
    } else {
      var bestB = 0;
      for (var j = 1; j < branchCost.length; j++) if (branchCost[j] < branchCost[bestB]) bestB = j;
      data.branches.forEach(function (b, bi) { S.set('br_' + b.id, { style: bi === bestB ? 'new' : 'dim' }); });
      S.set('root', { style: 'new' });
      S.set('a_root_' + data.branches[bestB].id, { style: 'new', head: true });
      if (branchWinner[bestB] !== undefined) S.set('a_br_' + branchWinner[bestB], { style: 'new', head: true });
      S.step(T('Kök bir **VEYA** düğümü: en ucuz dal `' + labelFor(data.branches[bestB].id).tr + '` (maliyet ' + branchCost[bestB] + ') seçilir — en ucuz yol budur.',
                'The root is an **OR** node: the cheapest branch, `' + labelFor(data.branches[bestB].id).en + '` (cost ' + branchCost[bestB] + '), is chosen — this is the cheapest path.'),
             { c: [
               { n: 5, skip: true },
               { n: 6, note: T('kök VEYA mi? evet -> min = ' + branchCost[bestB], 'root is OR? yes -> min = ' + branchCost[bestB]) },
               { n: 7, skip: true }
             ] });
      S.result = reference(data);
    }
  }

  D.define({
    id: 'attack-tree-eval',
    title: T('Saldırı ağacı: en ucuz yol (VE/VEYA)', 'Attack tree: cheapest path (AND/OR)'),
    code: { c: REF_C },
    presets: [
      { id: 'payment-key', level: 'normal', name: T('Normal: ödeme anahtarını ele geçirme (11 yaprak)', 'Normal: obtaining the payment key (11 leaves)'), data: PAYMENT_KEY },
      { id: 'license-check', level: 'hard', name: T('Zor: lisans denetimini atlatma, kök VE (14 yaprak)', 'Hard: bypassing a license check, root AND (14 leaves)'), data: LICENSE_CHECK },
      { id: 'tiny-and', level: 'edge', small: true, name: T('Uç durum: iki katmanlı zorunlu ağaç (2 yaprak)', 'Edge case: a forced two-layer tree (2 leaves)'), data: TINY },
      { id: 'all-and', level: 'edge', name: T('Uç durum: her düğüm VE — en pahalı durum (12 yaprak)', 'Edge case: every node is AND — the most expensive case (12 leaves)'), data: ALL_AND }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: leafCount,
    random: function (level, r) {
      // total leaf count is fixed per level (always >= 10); distributed across 3-5 random branches so no
      // branch ever ends up empty.
      var totalLeaves = { easy: 10, normal: 12, hard: 15, extreme: 18 }[level] || 10;
      var nb = D.randInt(r, 3, 5);
      var kinds = ['AND', 'OR'];
      var branches = [];
      var remaining = totalLeaves;
      for (var bi = 0; bi < nb; bi++) {
        var leavesLeftAfterThis = nb - bi - 1;
        var maxForThis = remaining - leavesLeftAfterThis;          // leave >= 1 for every later branch
        var thisNl = bi === nb - 1 ? remaining : D.randInt(r, 1, Math.max(1, maxForThis - 1));
        thisNl = Math.max(1, Math.min(thisNl, maxForThis));
        remaining -= thisNl;
        var leaves = [];
        for (var li = 0; li < thisNl; li++) leaves.push(leaf('R' + bi + (li + 1), D.randInt(r, 1, 60)));
        branches.push(branch('R' + bi, kinds[D.randInt(r, 0, 1)], leaves));
      }
      return mk(kinds[D.randInt(r, 0, 1)], branches);
    },
    input: {
      hint: T('KÖK(VE|VEYA); dal:tür:m1,m2,…; …', 'ROOT(AND|OR); branch:kind:c1,c2,…; …'),
      format: function (data) {
        var parts = ['ROOT(' + data.rootKind + ')'];
        data.branches.forEach(function (b) {
          parts.push(b.id + ':' + b.kind + ':' + b.leaves.map(function (l) { return l.cost; }).join(','));
        });
        return parts.join('; ');
      },
      tokens: function (data) {
        // Plain leaf ids, not labelFor()'s bilingual {tr, en} object: drawTape() calls esc(t) directly with no
        // language context, so a T() object here would render the input strip as literal "[object Object]".
        var out = [];
        data.branches.forEach(function (b) { b.leaves.forEach(function (l) { out.push(l.id); }); });
        return out;
      },
      parse: function (text) {
        var parts = String(text).split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        if (parts.length < 2) throw T('En az KÖK ve bir dal gerekir.', 'At least ROOT and one branch are required.');
        var m = parts[0].match(/^ROOT\((AND|OR|VE|VEYA)\)$/i);
        if (!m) throw T('İlk parça "ROOT(AND)" ya da "ROOT(OR)" olmalı.', 'The first part must be "ROOT(AND)" or "ROOT(OR)".');
        var rootKind = /^(AND|VE)$/i.test(m[1]) ? 'AND' : 'OR';
        var branches = [];
        for (var i = 1; i < parts.length; i++) {
          var bm = parts[i].split(':');
          if (bm.length !== 3) throw T('"' + parts[i] + '" biçimi "ad:tür:m1,m2,…" olmalı.', '"' + parts[i] + '" must be "name:kind:c1,c2,…".');
          var bid = bm[0].trim(), bkind = /^(AND|VE)$/i.test(bm[1].trim()) ? 'AND' : (/^(OR|VEYA)$/i.test(bm[1].trim()) ? 'OR' : null);
          if (!bid || !bkind) throw T('"' + parts[i] + '" geçersiz dal.', '"' + parts[i] + '" is an invalid branch.');
          var costs = bm[2].split(',').map(function (c) { return c.trim(); }).filter(Boolean);
          if (!costs.length) throw T('"' + bid + '" için en az bir maliyet gerekir.', '"' + bid + '" needs at least one cost.');
          var leaves = [];
          for (var k = 0; k < costs.length; k++) {
            if (!/^\d+$/.test(costs[k])) throw T('"' + costs[k] + '" bir sayı değil.', '"' + costs[k] + '" is not a number.');
            leaves.push(leaf(bid + (k + 1), parseInt(costs[k], 10)));
          }
          branches.push(branch(bid, bkind, leaves));
        }
        return mk(rootKind, branches);
      },
      bad: ['', 'ROOT(XOR); a:AND:1,2', 'ROOT(AND)', 'ROOT(AND); a:WEIRD:1,2', 'ROOT(AND); a:AND:1,x,3']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
