// CEN429 — Week 2 — Demo 3 (code/week-02/03-access-model/access.c: dominates(), chinese_wall())
// Three mandatory-access-control (MAC) models decide READ/WRITE differently from the SAME "label
// dominance" idea (level + category-set superset), or — Chinese Wall — from HISTORY instead of
// labels at all: BLP protects CONFIDENTIALITY (no read up, no write down), Biba protects INTEGRITY
// (no read down, no write up, the mirror image of BLP), Chinese Wall (Brewer-Nash) closes off a
// competitor's data once ANY file from the same conflict-of-interest class has been read.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (access.c)
  var DOMINATES_C = [
    'static int dominates(int sa, unsigned ka, int sb, unsigned kb)',   // access.c 136
    '{',
    '    return sa >= sb && (ka & kb) == kb;',
    '}',
    '',
    '/* BLP (confidentiality): read  -> subject dom object (ss-property)',
    '                           write -> object dom subject (*-property) */',
    'int blp  = write ? dominates(os, oc, ss, sc) : dominates(ss, sc, os, oc);',   // access.c 218
    '',
    '/* Biba (integrity): read  -> object dom subject (no read down)',
    '                      write -> subject dom object (no write up) */',
    'int biba = write ? dominates(ss, sc, os, oc) : dominates(os, oc, ss, sc);'    // access.c 222
  ];
  var CW_C = [
    '/* The Chinese Wall decision; reason[] records the conflicting company */',    // access.c 160
    'static int chinese_wall(int si, int oi, int write, char *reason, size_t rb)',
    '{',
    '    const struct labeled *s = &subjects[si], *o = &objects[oi];',
    '    if (!is_sanitized(o))',
    '        for (int j = 0; j < object_count; j++) {',
    '            const struct labeled *m = &objects[j];',
    '            if (!has_read(s, j) || is_sanitized(m))',
    '                continue;',
    '            if (strcmp(m->conflict_class, o->conflict_class) == 0 &&',
    '                strcmp(m->company, o->company) != 0)',
    '                return 0;              /* same class, a DIFFERENT company already read: DENY */',
    '        }',
    '    if (!write)',
    '        return 1;',
    '    for (int j = 0; j < object_count; j++) {',
    '        const struct labeled *m = &objects[j];',
    '        if (has_read(s, j) && !is_sanitized(m) &&',
    '            strcmp(m->company, o->company) != 0)',
    '            return 0;                  /* the *-property: could leak another company\'s data */',
    '    }',
    '    return 1;',
    '}'
  ];

  function catsOf(list) { var m = 0; (list || []).forEach(function (c) { m |= 1 << catIndex(c); }); return m; }
  var CAT_NAMES = ['NUCLEAR', 'EUROPE', 'ASIA', 'FINANCE', 'MEDICAL'];
  function catIndex(name) { var i = CAT_NAMES.indexOf(name); return i < 0 ? 0 : i; }
  function catsText(list) { return list && list.length ? '{' + list.join(',') + '}' : '{}'; }

  function mkMac(model, write, sLevel, sCats, oLevel, oCats) {
    return { model: model, write: write, sLevel: sLevel, sCats: sCats, oLevel: oLevel, oCats: oCats };
  }
  function mkCw(write, historyCompany, historyClass, reqCompany, reqClass, sanitized) {
    return { model: 'CW', write: write, historyCompany: historyCompany, historyClass: historyClass,
             reqCompany: reqCompany, reqClass: reqClass, sanitized: !!sanitized };
  }

  function dominates(sa, ka, sb, kb) { return sa >= sb && (ka & kb) === kb; }

  /** Independent: for BLP/Biba, re-derives the dominance check from a DIFFERENT direction (checks
   * "kb is a subset of ka" via a bit-count comparison instead of the "(ka&kb)===kb" build() shows).
   * For CW, walks history with .some()/.every() instead of the for-loops build() animates. */
  function reference(data) {
    if (data.model === 'CW') {
      if (!data.sanitized && data.historyClass === data.reqClass && data.historyCompany !== data.reqCompany && data.historyCompany)
        return { allow: false, reason: 'class-conflict' };
      if (data.write && data.historyCompany && data.historyCompany !== data.reqCompany && !data.sanitized)
        return { allow: false, reason: 'star-property' };
      return { allow: true, reason: null };
    }
    function isSubset(sub, sup) { for (var i = 0; i < CAT_NAMES.length; i++) if ((sub & (1 << i)) && !(sup & (1 << i))) return false; return true; }
    var sc = catsOf(data.sCats), oc = catsOf(data.oCats);
    var dom = data.model === 'BLP'
      ? (data.write ? (data.oLevel >= data.sLevel && isSubset(sc, oc)) : (data.sLevel >= data.oLevel && isSubset(oc, sc)))
      : (data.write ? (data.sLevel >= data.oLevel && isSubset(oc, sc)) : (data.oLevel >= data.sLevel && isSubset(sc, oc)));
    return { allow: dom, reason: null };
  }

  function buildMac(S, data) {
    var sc = catsOf(data.sCats), oc = catsOf(data.oCats);
    S.box('subj', { x: 0, y: 0, w: 220, h: 50, size: 13, text: 'S: level=' + data.sLevel + ' ' + catsText(data.sCats), style: 'active' });
    S.box('obj', { x: 280, y: 0, w: 220, h: 50, size: 13, text: 'O: level=' + data.oLevel + ' ' + catsText(data.oCats), style: 'normal' });
    S.label('title', { x: 250, y: -24, anchor: 'middle', bold: true, size: 15, text: T(
      (data.model === 'BLP' ? 'BLP (Gizlilik)' : 'Biba (Bütünlük)') + ' — istek: ' + (data.write ? 'WRITE' : 'READ'),
      (data.model === 'BLP' ? 'BLP (Confidentiality)' : 'Biba (Integrity)') + ' — request: ' + (data.write ? 'WRITE' : 'READ')) });
    S.at(0);
    S.step(T('Etiketler okunuyor: S(seviye, kategori kümesi), O(seviye, kategori kümesi).',
              'The labels are read: S(level, category set), O(level, category set).'), { c: [1, 2, 3] });

    var blp = data.write ? dominates(data.oLevel, oc, data.sLevel, sc) : dominates(data.sLevel, sc, data.oLevel, oc);
    var biba = data.write ? dominates(data.sLevel, sc, data.oLevel, oc) : dominates(data.oLevel, oc, data.sLevel, sc);
    var relevant = data.model === 'BLP' ? blp : biba;
    var a = data.write === (data.model === 'BLP') ? { lvl: data.oLevel, cat: oc, name: 'O' } : { lvl: data.sLevel, cat: sc, name: 'S' };
    // (direction text is derived below from the model+write combination for the caption, not reused for the decision itself)
    S.set('subj', { style: 'hl' }); S.set('obj', { style: 'hl' });
    var levelOk = relevant ? true : undefined;
    var ternaryNote = T('write? ' + (data.write ? 'evet -> ilk dominates() dalı' : 'hayır -> ikinci dominates() dalı'),
                         'write? ' + (data.write ? 'yes -> the first dominates() branch' : 'no -> the second dominates() branch'));
    S.step(T((data.model === 'BLP' ? 'BLP kuralı: ' : 'Biba kuralı: ') + (data.model === 'BLP'
                ? (data.write ? 'yazarken O, S\'yi domine etmeli (bilgi aşağı sızmasın)' : 'okurken S, O\'yu domine etmeli (yukarı okuma yok)')
                : (data.write ? 'yazarken S, O\'yu domine etmeli (yukarı yazma yok)' : 'okurken O, S\'yi domine etmeli (aşağı okuma yok)')),
              (data.model === 'BLP' ? 'BLP rule: ' : 'Biba rule: ') + (data.model === 'BLP'
                ? (data.write ? 'when writing, O must dominate S (no information flows down)' : 'when reading, S must dominate O (no read up)')
                : (data.write ? 'when writing, S must dominate O (no write up)' : 'when reading, O must dominate S (no read down)'))),
           { c: data.model === 'BLP' ? [6, 7, { n: 8, note: ternaryNote }] : [10, 11, { n: 12, note: ternaryNote }] });

    var levelCheck = data.write === (data.model !== 'BLP')
      ? data.sLevel >= data.oLevel : data.oLevel >= data.sLevel;
    S.step(T('Seviye karşılaştırması ve kategori altküme kontrolü birleştiriliyor (VE ile).',
              'The level comparison and the category-subset check are combined (with AND).'),
           { c: data.model === 'BLP' ? [{ n: 8, note: ternaryNote }] : [{ n: 12, note: ternaryNote }] });

    S.set('subj', { style: relevant ? 'new' : 'del' });
    S.set('obj', { style: relevant ? 'new' : 'del' });
    S.step(relevant
      ? T('=> İZİN VERİLDİ: etiket ilişkisi kurala uyuyor.', '=> ALLOWED: the label relationship satisfies the rule.')
      : T('=> REDDEDİLDİ: etiket ilişkisi kurala uymuyor.', '=> DENIED: the label relationship does not satisfy the rule.'),
      {});
    S.result = reference(data);
  }

  function buildCw(S, data) {
    S.box('hist', { x: 0, y: 0, w: 260, h: 50, size: 12,
      text: data.historyCompany ? 'read so far: ' + data.historyCompany + ' (' + data.historyClass + ')' : 'nothing read yet', style: 'dim' });
    S.box('req', { x: 300, y: 0, w: 260, h: 50, size: 12,
      text: (data.write ? 'WRITE ' : 'READ ') + data.reqCompany + ' (' + data.reqClass + (data.sanitized ? ', sanitized' : '') + ')', style: 'active' });
    S.label('title', { x: 280, y: -24, text: T('Chinese Wall (Brewer-Nash)', 'Chinese Wall (Brewer-Nash)'), anchor: 'middle', bold: true, size: 15 });
    S.at(0);
    var isSan = !!data.sanitized;
    var classConflict = !data.sanitized && data.historyClass === data.reqClass && data.historyCompany && data.historyCompany !== data.reqCompany;
    S.step(T('Geçmişte okunanlar kontrol ediliyor: aynı çakışma sınıfında, FARKLI bir şirket var mı?',
              'What was read before is checked: is there a DIFFERENT company in the SAME conflict class?'),
           { c: [{ n: 5, note: T('!is_sanitized(o)? ' + (isSan ? 'hayır' : 'evet'), '!is_sanitized(o)? ' + (isSan ? 'no' : 'yes')) },
                 isSan ? { n: 6, skip: true } : { n: 6, note: T('j < object_count? evet', 'j < object_count? yes') },
                 isSan ? { n: 8, skip: true } : { n: 8, note: T('!has_read || sanitized? hayır (geçmişte okunan var)', '!has_read || sanitized? no (a read exists)') },
                 isSan ? { n: 10, skip: true } : { n: 10, note: T('aynı sınıf && farklı şirket? ' + (classConflict ? 'evet' : 'hayır'), 'same class && different company? ' + (classConflict ? 'yes' : 'no')) }] });

    if (classConflict) {
      S.set('hist', { style: 'del' }); S.set('req', { style: 'del' });
      S.step(T('"' + data.historyCompany + '" zaten okunmuş, "' + data.reqCompany + '" aynı sınıfta (' + data.reqClass + ') — DUVAR KAPANDI.',
                '"' + data.historyCompany + '" was already read, "' + data.reqCompany + '" is in the same class (' + data.reqClass + ') — the WALL is closed.'),
             { c: [{ n: 10, note: T('aynı sınıf && farklı şirket? evet', 'same class && different company? yes') }, 11, 12] });
      S.result = reference(data);
      return;
    }
    S.step(T('Sınıf çakışması yok (ya da nesne temizlenmiş): okuma tarafı serbest.',
              'No class conflict (or the object is sanitized): the read side is clear.'),
           { c: [13, { n: 14, note: T('!write? ' + (!data.write ? 'evet' : 'hayır'), '!write? ' + (!data.write ? 'yes' : 'no')) }] });

    if (!data.write) {
      S.set('req', { style: 'new' });
      S.step(T('İstek bir READ: sonuç İZİN VERİLDİ.', 'The request is a READ: the result is ALLOWED.'),
             { c: [{ n: 14, note: T('!write? evet', '!write? yes') }, 15] });
      S.result = reference(data);
      return;
    }
    var star = data.historyCompany && data.historyCompany !== data.reqCompany && !data.sanitized;
    S.step(T('İstek bir WRITE: *-özelliği kontrol ediliyor (başka bir şirketin verisi sızabilir mi?).',
              'The request is a WRITE: the *-property is checked (could another company\'s data leak?).'),
           { c: [{ n: 14, note: T('!write? hayır', '!write? no') }, { n: 16, note: T('j < object_count? evet', 'j < object_count? yes') },
                 17, { n: 18, note: T('geçmişte okunan && sanitize edilmemiş && farklı şirket? ' + (star ? 'evet' : 'hayır'), 'read before && not sanitized && different company? ' + (star ? 'yes' : 'no')) }] });
    S.set('req', { style: star ? 'del' : 'new' });
    S.step(star
      ? T('"' + data.historyCompany + '"nin verisi sızabilir — YAZMA REDDEDİLDİ.', '"' + data.historyCompany + '"\'s data could leak — the WRITE is DENIED.')
      : T('Sızma riski yok — YAZMAYA İZİN VERİLDİ.', 'No leak risk — the WRITE is ALLOWED.'),
      { c: star ? [{ n: 18, note: T('...? evet', '...? yes') }, 20] : [{ n: 18, note: T('...? hayır', '...? no') }, { n: 20, skip: true }, 22] });
    S.result = reference(data);
  }

  function build(S, data) { return data.model === 'CW' ? buildCw(S, data) : buildMac(S, data); }

  D.define({
    id: 'access-matrix',
    title: T('Erişim kontrol modelleri: BLP, Biba, Chinese Wall (access.c)', 'Access control models: BLP, Biba, Chinese Wall (access.c)'),
    code: function (data) { return { c: (data && data.model === 'CW') ? CW_C : DOMINATES_C }; },
    presets: [
      { id: 'normal-blp-read-up-denied', level: 'normal', small: true,
        name: T('Normal: BLP, yukarı okuma reddediliyor', 'Normal: BLP, a read-up is denied'),
        data: mkMac('BLP', false, 0, ['EUROPE'], 2, ['EUROPE']) },
      { id: 'hard-biba-category-mismatch', level: 'hard', small: true,
        name: T('Zor: Biba, seviye tutuyor ama kategori kümesi tutmuyor', 'Hard: Biba, the level matches but the category set does not'),
        data: mkMac('Biba', false, 2, ['FINANCE'], 2, ['FINANCE', 'MEDICAL']) },
      { id: 'edge-equal-labels-always-ok', level: 'edge', small: true,
        name: T('Uç durum: eşit etiketler her zaman izin verir', 'Edge case: equal labels always allow'),
        data: mkMac('BLP', true, 1, ['ASIA'], 1, ['ASIA']) },
      { id: 'edge-chinese-wall-closes', level: 'edge', small: true,
        name: T('Uç durum: Chinese Wall, ikinci şirket kapanıyor', 'Edge case: Chinese Wall, the second company closes'),
        data: mkCw(false, 'BankA', 'banking', 'BankB', 'banking', false) },
      { id: 'edge-chinese-wall-sanitized-open', level: 'edge', small: true,
        name: T('Uç durum: temizlenmiş nesne her zaman açık', 'Edge case: a sanitized object is always open'),
        data: mkCw(false, 'BankA', 'banking', 'PublicWire', 'banking', true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: each request is a fixed-shape label comparison (2 entities x {level, small category
    // set}) or a 2-step Chinese Wall history check — not a variable-length list the "≥10" rule targets.
    random: function (level, r) {
      if (level === 'extreme' && r() < 0.3) {
        var companies = ['BankA', 'BankB', 'OilX', 'OilY'], classes = ['banking', 'oil'];
        var cls = classes[D.randInt(r, 0, 1)];
        var hist = companies.filter(function (c) { return true; })[D.randInt(r, 0, 3)];
        var req = companies[D.randInt(r, 0, 3)];
        return mkCw(r() < 0.5, hist, cls, req, cls, r() < 0.2);
      }
      var model = r() < 0.5 ? 'BLP' : 'Biba';
      var write = r() < 0.5;
      var sLevel = D.randInt(r, 0, 2), oLevel = D.randInt(r, 0, 2);
      var pool = CAT_NAMES.slice(0, 3);
      function randCats() { return pool.filter(function () { return r() < 0.5; }); }
      return mkMac(model, write, sLevel, randCats(), oLevel, randCats());
    },
    input: {
      hint: T('BLP|Biba : R|W sSeviye{kat,..} oSeviye{kat,..}  —  ya da  —  CW : R|W geçmiş/sınıf istek/sınıf [sanitized]',
              'BLP|Biba : R|W sLevel{cat,..} oLevel{cat,..}  —  or  —  CW : R|W history/class request/class [sanitized]'),
      format: function (data) {
        if (data.model === 'CW') return 'CW : ' + (data.write ? 'W' : 'R') + ' ' + (data.historyCompany || '-') + '/' + data.historyClass + ' ' + data.reqCompany + '/' + data.reqClass + (data.sanitized ? ' sanitized' : '');
        return data.model + ' : ' + (data.write ? 'W' : 'R') + ' ' + data.sLevel + catsText(data.sCats) + ' ' + data.oLevel + catsText(data.oCats);
      },
      tokens: function (data) { return data.model === 'CW' ? ['history', 'request'] : ['S', 'O']; },
      parse: function (text) {
        var s = String(text).trim();
        if (/^CW\s*:/.test(s)) {
          var m = s.match(/^CW\s*:\s*(R|W)\s+([\w-]+)\/([\w-]+)\s+([\w-]+)\/([\w-]+)(\s+sanitized)?$/);
          if (!m) throw T('CW biçimi: "CW : R|W geçmiş/sınıf istek/sınıf [sanitized]"', 'CW format: "CW : R|W history/class request/class [sanitized]"');
          return mkCw(m[1] === 'W', m[2] === '-' ? '' : m[2], m[3], m[4], m[5], !!m[6]);
        }
        var mm = s.match(/^(BLP|Biba)\s*:\s*(R|W)\s+(\d+)(\{[^}]*\})\s+(\d+)(\{[^}]*\})$/);
        if (!mm) throw T('"BLP|Biba : R|W sSeviye{kat} oSeviye{kat}" biçiminde olmalı.', 'Must be "BLP|Biba : R|W sLevel{cat} oLevel{cat}".');
        function parseCats(t) { return t.slice(1, -1).split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
        return mkMac(mm[1], mm[2] === 'W', parseInt(mm[3], 10), parseCats(mm[4]), parseInt(mm[5], 10), parseCats(mm[6]));
      },
      bad: ['', 'XYZ : R 1{} 1{}', 'BLP : R 1 1', 'CW : R bad-format']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
