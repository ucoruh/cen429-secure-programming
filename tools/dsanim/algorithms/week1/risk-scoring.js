// CEN429 — Week 1 — Risk scoring: likelihood x impact matrix
// Reference: docs/week-1/cen429-week-1.{tr,en}.md, section 8, "Tehditleri siralamak: olasilik x etki". Each
// threat gets a likelihood (1-3) and an impact (1-3); its risk score is the product, and the 3x3 matrix turns
// that score into a band: 9 = critical, 6 = high, 3-4 = medium, 1-2 = low. This animation places a list of
// threats on the matrix one by one, then ranks them from most to least urgent.
//
// Design note (see attack-tree-eval.js): `data` carries only ids and the two 1-3 integers, never presentation
// text, so parse(format(data)) always round-trips exactly. Bilingual threat names for the named presets live in
// the LABELS table below, keyed by id; labelFor() falls back to the raw id for random/custom data.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    '/* Risk score = likelihood (1-3) x impact (1-3); band from the matrix (docs/week-1, section 8) */',
    'score = likelihood * impact',
    'band(score):',
    '    if score == 9:            return "critical"',
    '    if score == 6:            return "high"',
    '    if score == 3 or score == 4: return "medium"',
    '    return "low"                /* score == 1 or 2 */'
  ];

  function threat(id, likelihood, impact) { return { id: id, likelihood: likelihood, impact: impact }; }
  function mk(threats) { return { threats: threats }; }

  var LABELS = {};
  function lbl(id, tr, en) { LABELS[id] = T(tr, en); }
  function labelFor(id) { return LABELS[id] || T(id, id); }

  function band(score) {
    if (score === 9) return T('kritik', 'critical');
    if (score === 6) return T('yüksek', 'high');
    if (score === 3 || score === 4) return T('orta', 'medium');
    return T('düşük', 'low');
  }
  function bandStyle(score) {
    if (score === 9) return 'del';
    if (score === 6) return 'hl';
    if (score === 3 || score === 4) return 'active';
    return 'dim';
  }

  /* Program-counter lines for band(score) (REF_C lines 4-7): each `if` really is evaluated in
   * order (they are separate `if`s with an early return, not `else if`), so a condition BEFORE
   * the matching one is executed with note=false, not skipped; only the lines AFTER the match are
   * never reached (skip: true) because the function already returned. */
  function bandLines(score) {
    var lines = [];
    var m9 = score === 9;
    lines.push({ n: 4, note: T('puan == 9 mu? ' + (m9 ? 'evet -> kritik' : 'hayır'), 'score == 9? ' + (m9 ? 'yes -> critical' : 'no')) });
    if (m9) { lines.push({ n: 5, skip: true }); lines.push({ n: 6, skip: true }); return lines; }
    var m6 = score === 6;
    lines.push({ n: 5, note: T('puan == 6 mı? ' + (m6 ? 'evet -> yüksek' : 'hayır'), 'score == 6? ' + (m6 ? 'yes -> high' : 'no')) });
    if (m6) { lines.push({ n: 6, skip: true }); return lines; }
    var m34 = score === 3 || score === 4;
    lines.push({ n: 6, note: T('puan 3 ya da 4 mü? ' + (m34 ? 'evet -> orta' : 'hayır -> düşük'), 'score is 3 or 4? ' + (m34 ? 'yes -> medium' : 'no -> low')) });
    if (!m34) lines.push(7);
    return lines;
  }

  lbl('T1', 'Çalınan dizüstünden kasa dosyası kopyalanır, zayıf ana parola çevrimdışı denenir', 'Vault file copied from a stolen laptop, weak master password tried offline');
  lbl('T2', 'Ana parola ya da anahtar bellekte kalır', 'Master password or key left over in memory');
  lbl('T3', 'Panoya kopyalanan parola başka bir uygulama tarafından okunur', 'Password copied to the clipboard is read by another app');
  lbl('T4', 'Kasa dosyası değiştirilir; bozuk kayıt fark edilmeden kullanılır', 'Vault file is tampered with; the corrupt record is used unnoticed');
  lbl('T5', 'Başlıktaki türetme parametresi 1e düşürülür', 'The header\'s derivation parameter is dropped to 1');
  lbl('T6', 'Sahte güncelleme paketi kurulur', 'A fake update package is installed');
  lbl('T7', 'Sahte yedek sunucusu belirteci çalar', 'A fake backup server steals the token');
  lbl('T8', 'Ayrıştırıcıda bellek hatası; kötü niyetli dosya çökertir', 'Parser memory bug; a malicious file crashes it');
  lbl('T9', 'Kullanıcının yanında biri ana parolayı ekrandan görür', 'Someone shoulder-surfs the master password on screen');
  lbl('T10', 'Sunucu sertifikası doğrulanmadan bağlanılır', 'Connects without validating the server certificate');
  lbl('T11', 'Günlük dosyasına parola yanlışlıkla yazılır', 'Password accidentally written to the log file');
  lbl('T12', 'Eski sürüm indirilip geri yüklenir (downgrade)', 'An old version is downloaded and restored (downgrade)');
  var VAULT = mk([
    threat('T1', 3, 3), threat('T2', 2, 3), threat('T3', 3, 2), threat('T4', 2, 2), threat('T5', 1, 3),
    threat('T6', 2, 3), threat('T7', 2, 2), threat('T8', 2, 3), threat('T9', 1, 3), threat('T10', 2, 2),
    threat('T11', 1, 2), threat('T12', 1, 3)
  ]);

  lbl('U1', 'Kart verisi ele geçirilir', 'Card data is captured'); lbl('U2', 'PIN paneli değiştirilir', 'PIN pad is swapped');
  lbl('U3', 'İşlem tekrar oynatılır (replay)', 'Transaction is replayed'); lbl('U4', 'Anahtar zamanlama saldırısıyla sızar', 'Key leaks via a timing attack');
  lbl('U5', 'Hatalı işlem tutarı gönderilir', 'A wrong transaction amount is sent'); lbl('U6', 'Terminalde hata ayıklayıcı bağlanır', 'A debugger attaches to the terminal');
  lbl('U7', 'Sertifika süresi kontrol edilmez', 'Certificate expiry is not checked'); lbl('U8', 'Çift harcama denemesi', 'A double-spend attempt');
  lbl('U9', 'Firmware imzasız yüklenir', 'Unsigned firmware is loaded'); lbl('U10', 'Günlük kaydı silinir', 'Audit log is deleted');
  lbl('U11', 'Test modu sürümde açık kalır', 'Test mode is left on in the release'); lbl('U12', 'Ekranda tutar oynanır', 'Displayed amount is tampered with');
  lbl('U13', 'Sahte kart okuyucu takılır', 'A fake card reader is attached'); lbl('U14', 'İşlemci taşması ile çökme', 'Crash via processor overflow');
  var TERMINAL = mk([
    threat('U1', 3, 3), threat('U2', 1, 3), threat('U3', 2, 2), threat('U4', 1, 2), threat('U5', 2, 3),
    threat('U6', 2, 3), threat('U7', 2, 2), threat('U8', 2, 2), threat('U9', 3, 3), threat('U10', 1, 2),
    threat('U11', 2, 3), threat('U12', 1, 2), threat('U13', 3, 2), threat('U14', 1, 3)
  ]);

  var EDGE_ALL_CRITICAL = mk((function () { var out = []; for (var i = 1; i <= 10; i++) out.push(threat('C' + i, 3, 3)); return out; })());
  var EDGE_ALL_LOW = mk((function () { var out = []; for (var i = 1; i <= 10; i++) out.push(threat('L' + i, 1, 1)); return out; })());

  function reference(data) {
    var scored = data.threats.map(function (t) { return { id: t.id, likelihood: t.likelihood, impact: t.impact, score: t.likelihood * t.impact }; });
    var ranked = scored.slice().sort(function (a, b) { return b.score - a.score; }).map(function (t) { return t.id; });
    return { scored: scored, ranked: ranked };
  }

  function isValidId(s) { return /^[A-Za-z][A-Za-z0-9]{0,19}$/.test(s); }

  function build(S, data) {
    var CW = 90, CH = 60, GX = 0, GY = 0;
    // matrix: columns = impact 1..3 (left to right), rows = likelihood 3..1 (top to bottom, high likelihood on top)
    S.label('impLbl', { x: GX + 1.5 * CW, y: GY - 34, text: T('Etki →', 'Impact ->'), anchor: 'middle', size: 14, bold: true });
    S.label('likLbl', { x: GX - 60, y: GY + 1.5 * CH, text: T('Olasılık ↓', 'Likelihood v'), anchor: 'middle', size: 14, bold: true });
    for (var col = 1; col <= 3; col++) S.label('impH' + col, { x: GX + (col - 0.5) * CW, y: GY - 12, text: String(col), anchor: 'middle', size: 13, bold: true });
    for (var rowI = 0; rowI < 3; rowI++) {
      var likelihood = 3 - rowI;
      S.label('likV' + rowI, { x: GX - 18, y: GY + rowI * CH + CH / 2 + 5, text: String(likelihood), anchor: 'end', size: 13, bold: true });
      for (col = 1; col <= 3; col++) {
        var score = likelihood * col;
        S.box('cell_' + likelihood + '_' + col, { x: GX + (col - 1) * CW, y: GY + rowI * CH, w: CW - 3, h: CH - 3, size: 12, mono: true,
          text: String(score), style: bandStyle(score) });
      }
    }
    S.step(T('3x3 risk matrisi: her hücre olasılık x etki, hücrenin rengi bandı gösterir (kritik/yüksek/orta/düşük).',
              'The 3x3 risk matrix: every cell is likelihood x impact, its colour shows the band (critical/high/medium/low).'),
           {});

    var count = {};
    var outY = GY + 3 * CH + 40, outX = GX + 3 * CW + 60, outN = 0;
    S.label('outLbl', { x: outX, y: outY - 16, text: T('yerleştirilen tehditler', 'threats placed'), anchor: 'start', size: 13, bold: true });

    data.threats.forEach(function (t, idx) {
      var key = t.likelihood + '_' + t.impact;
      var slot = count[key] || 0; count[key] = slot + 1;
      var cellX = GX + (t.impact - 1) * CW, cellY = GY + (3 - t.likelihood) * CH;
      var tokId = 'tok_' + t.id;
      S.box(tokId, { x: cellX + 4 + (slot % 2) * 28, y: cellY + 4 + Math.floor(slot / 2) * 16, w: 26, h: 14, size: 9, mono: true, text: t.id, style: 'new' });
      S.at(idx);
      var sc = t.likelihood * t.impact;
      if (idx < 3) {
        S.step(T('`' + labelFor(t.id).tr + '` — olasılık ' + t.likelihood + ', etki ' + t.impact + ' -> puan ' + sc + ' (**' + band(sc).tr + '**). Matriste (' + t.likelihood + ',' + t.impact + ') hücresine yerleşir.',
                  '`' + labelFor(t.id).en + '` — likelihood ' + t.likelihood + ', impact ' + t.impact + ' -> score ' + sc + ' (**' + band(sc).en + '**). It lands in the (' + t.likelihood + ',' + t.impact + ') cell.'),
               { c: bandLines(sc) });
      } else {
        S.step(T('`' + labelFor(t.id).tr + '`: (' + t.likelihood + ',' + t.impact + ') -> ' + sc + ' (' + band(sc).tr + ').',
                  '`' + labelFor(t.id).en + '`: (' + t.likelihood + ',' + t.impact + ') -> ' + sc + ' (' + band(sc).en + ').'),
               { c: bandLines(sc) });
      }
      S.label('out' + outN, { x: outX, y: outY + outN * 18, text: t.id + '  score=' + sc, anchor: 'start', size: 12, mono: true });
      outN++;
    });
    S.at(null);

    // rank: selection-style pass over the already-computed scores (independent of reference's Array.sort)
    var pool = data.threats.map(function (t) { return { id: t.id, score: t.likelihood * t.impact }; });
    var order = [];
    while (pool.length) {
      var bestI = 0;
      for (var i = 1; i < pool.length; i++) if (pool[i].score > pool[bestI].score) bestI = i;
      order.push(pool[bestI].id);
      pool.splice(bestI, 1);
    }
    S.remove('outLbl');
    for (var k = 0; k < data.threats.length; k++) S.remove('out' + k);
    var rankY = GY + 3 * CH + 40;
    S.label('rankLbl', { x: outX, y: rankY - 16, text: T('risk sırası (en yüksekten en düşüğe)', 'risk order (highest to lowest)'), anchor: 'start', size: 13, bold: true });
    order.forEach(function (id, i) {
      S.label('rank' + i, { x: outX, y: rankY + i * 18, text: (i + 1) + '. ' + id + '  (' + reference(data).scored.filter(function (s) { return s.id === id; })[0].score + ')', anchor: 'start', size: 12, mono: true });
    });
    S.step(T(data.threats.length + ' tehdit puana göre sıralandı. En yüksek puanlı ' + order[0] + ', önce ele alınması gereken tehdittir.',
              'All ' + data.threats.length + ' threats are ranked by score. The highest-scoring ' + order[0] + ' is the threat to address first.'),
           {});
    S.result = reference(data);
  }

  D.define({
    id: 'risk-scoring',
    title: T('Risk puanlama: olasılık × etki matrisi', 'Risk scoring: likelihood × impact matrix'),
    code: { c: REF_C },
    presets: [
      { id: 'vault', level: 'normal', name: T('Normal: parola kasası tehditleri (12)', 'Normal: password-vault threats (12)'), data: VAULT },
      { id: 'terminal', level: 'hard', name: T('Zor: ödeme terminali tehditleri (14)', 'Hard: payment-terminal threats (14)'), data: TERMINAL },
      { id: 'edge-critical', level: 'edge', name: T('Uç durum: 10 tehdit de kritik (3×3)', 'Edge case: all 10 threats are critical (3x3)'), data: EDGE_ALL_CRITICAL },
      { id: 'edge-low', level: 'edge', name: T('Uç durum: 10 tehdit de düşük (1×1)', 'Edge case: all 10 threats are low (1x1)'), data: EDGE_ALL_LOW }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.threats.length; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 12, hard: 15, extreme: 18 };
      var n = counts[level] || 10;
      var out = [];
      for (var i = 0; i < n; i++) out.push(threat('X' + (i + 1), D.randInt(r, 1, 3), D.randInt(r, 1, 3)));
      return mk(out);
    },
    input: {
      hint: T('id:olasılık:etki, id:olasılık:etki, …', 'id:likelihood:impact, id:likelihood:impact, …'),
      format: function (data) { return data.threats.map(function (t) { return t.id + ':' + t.likelihood + ':' + t.impact; }).join(', '); },
      // Plain threat ids, not labelFor()'s bilingual {tr, en} object: drawTape() calls esc(t) directly with no
      // language context, so a T() object here would render the input strip as literal "[object Object]".
      tokens: function (data) { return data.threats.map(function (t) { return t.id; }); },
      parse: function (text) {
        var toks = String(text).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir tehdit girin.', 'Enter at least one threat.');
        var out = [];
        toks.forEach(function (t) {
          var parts = t.split(':');
          if (parts.length !== 3) throw T('"' + t + '" biçimi "id:olasılık:etki" olmalı.', '"' + t + '" must be "id:likelihood:impact".');
          var id = parts[0].trim();
          if (!isValidId(id)) throw T('"' + id + '" geçersiz bir kimlik.', '"' + id + '" is not a valid id.');
          var lk = parseInt(parts[1].trim(), 10), im = parseInt(parts[2].trim(), 10);
          if (!(lk >= 1 && lk <= 3) || !/^\d+$/.test(parts[1].trim())) throw T('olasılık 1-3 arasında olmalı.', 'likelihood must be 1-3.');
          if (!(im >= 1 && im <= 3) || !/^\d+$/.test(parts[2].trim())) throw T('etki 1-3 arasında olmalı.', 'impact must be 1-3.');
          out.push(threat(id, lk, im));
        });
        return mk(out);
      },
      bad: ['', 'a:1', 'a:4:2', 'a:1:0', '1x:2:2']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
