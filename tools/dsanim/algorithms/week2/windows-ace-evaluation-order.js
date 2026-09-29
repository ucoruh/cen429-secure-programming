// CEN429 — Week 2 — Demo 12 (code/week-02/12-ace-evaluation/ace.c: the ACE-walking loop in evaluate())
// Windows does NOT pick the "best matching" ACE (a common textbook error): it walks a DACL's ACEs
// IN ORDER. A SID not in the token is skipped; a matching DENY for a still-missing right stops the
// walk immediately (later ACEs are never consulted); matching ALLOW rights accumulate until every
// requested right is granted. A deny-only group (the UAC filter) matches DENY ACEs only.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (ace.c 304-341)
  var WALK_C = [
    '    for (int i = 0; i < obj.ace_n; i++) {',
    '        const struct ace *a = &obj.ace[i];',
    '        int e = sid_matches(a->sid);',
    '        if (e == 0) {',
    '            /* SID not in the token, skip */',
    '            continue;',
    '        }',
    '        if (e == 2 && !a->deny) {',
    '            /* a deny-only group; an ALLOW ACE does not count */',
    '            continue;',
    '        }',
    '        if (a->deny) {',
    '            int denied = a->mask & request & ~granted;',
    '            if (denied) {',
    '                /* => DENY  (ACE i: later ACEs are never consulted) */',
    '                return 0;',
    '            }',
    '            continue;',
    '        }',
    '        int extra = a->mask & request & ~granted;',
    '        granted |= a->mask & request;',
    '        if (granted == request) {',
    '            /* => ALLOW  (every requested right was granted) */',
    '            return 1;',
    '        }',
    '    }',
    '    /* => DENY  (the list ended; a requested right was never granted) */',
    '    return 0;'
  ];

  var RIGHTS = ['READ', 'WRITE', 'DELETE'];
  var BIT = { READ: 1, WRITE: 2, DELETE: 4 };
  function rightsText(mask) {
    var out = [];
    RIGHTS.forEach(function (r) { if (mask & BIT[r]) out.push(r); });
    return out.length ? out.join(',') : '-';
  }
  function parseRights(text) {
    var mask = 0;
    text.split(',').forEach(function (r) { r = r.trim(); if (BIT[r]) mask |= BIT[r]; });
    return mask;
  }

  function mk(user, groups, aces, request) { return { user: user, groups: groups, aces: aces, request: request }; }
  function ace(deny, sid, rightsText_) { return { deny: deny, sid: sid, mask: parseRights(rightsText_) }; }

  function sidMatches(data, sid) {
    if (sid === 'Everyone' || sid === data.user) return 1;
    for (var i = 0; i < data.groups.length; i++)
      if (data.groups[i].name === sid) return data.groups[i].denyOnly ? 2 : 1;
    return 0;
  }

  /** Independent right-parsing/SID-matching (does not call parseRights()/sidMatches() above, which
   * build() uses for both drawing and its own walk -- a bug in either copy now shows up as soon as
   * build() and reference() stop agreeing). */
  function referenceParseRights(text) {
    var names = { READ: 1, WRITE: 2, DELETE: 4 }, mask = 0;
    text.split(',').map(function (s) { return s.trim(); }).forEach(function (r) {
      if (names.hasOwnProperty(r)) mask += names[r];
    });
    return mask;
  }
  function referenceSidMatches(data, sid) {
    if (sid === data.user || sid === 'Everyone') return 1;
    for (var i = 0; i < data.groups.length; i++)
      if (data.groups[i].name === sid) return data.groups[i].denyOnly ? 2 : 1;
    return 0;
  }

  /** The same forward, in-order ACE walk the real ace.c/evaluate() performs (Windows does not search
   * for a "best match" -- see the header comment), reimplemented from scratch with its own SID-match
   * and rights-parsing helpers above, so nothing here is textually shared with build(). */
  function reference(data) {
    var granted = 0, requestMask = referenceParseRights(data.request);
    for (var i = 0; i < data.aces.length; i++) {
      var a = data.aces[i];
      var e = referenceSidMatches(data, a.sid);
      if (e === 0) continue;
      if (e === 2 && !a.deny) continue;
      if (a.deny) {
        if (a.mask & requestMask & ~granted) return { allow: false, stoppedAt: i };
        continue;
      }
      granted |= a.mask & requestMask;
      if (granted === requestMask) return { allow: true, stoppedAt: i };
    }
    return { allow: granted === requestMask, stoppedAt: -1 };
  }

  function build(S, data) {
    var requestMask = parseRights(data.request);
    S.label('title', { x: 0, y: -24, text: T('Token: ' + data.user + '  gruplar: ' + data.groups.map(function (g) { return g.name + (g.denyOnly ? '(deny-only)' : ''); }).join(', '),
      'Token: ' + data.user + '  groups: ' + data.groups.map(function (g) { return g.name + (g.denyOnly ? '(deny-only)' : ''); }).join(', ')), anchor: 'start', size: 13, bold: true });
    S.label('req', { x: 0, y: -4, text: T('İstek: ' + data.request, 'Request: ' + data.request), anchor: 'start', size: 13 });
    data.aces.forEach(function (a, i) {
      S.box('ace' + i, { x: 0, y: i * 44, w: 340, h: 36, size: 12, mono: true,
        text: (i + 1) + '. ' + (a.deny ? 'DENY ' : 'ALLOW') + ' ' + a.sid + ' ' + rightsText(a.mask), style: 'normal' });
    });
    S.at(0);
    S.step(T('ACE\'ler DİZİ SIRASINDA yürünür (en iyi eşleşme aranmaz).', 'ACEs are walked IN ARRAY ORDER (no "best match" search).'),
           { c: [{ n: 1, note: T('i(0) < ace_n(' + data.aces.length + ')? evet', 'i(0) < ace_n(' + data.aces.length + ')? yes') }] });

    var granted = 0, decided = false;
    for (var i = 0; i < data.aces.length; i++) {
      var a = data.aces[i];
      S.at(i);
      S.set('ace' + i, { style: 'hl' });
      var e = sidMatches(data, a.sid);
      var loopNote = { n: 1, note: T('i(' + i + ') < ace_n(' + data.aces.length + ')? evet', 'i(' + i + ') < ace_n(' + data.aces.length + ')? yes') };
      if (e === 0) {
        S.set('ace' + i, { style: 'dim' });
        S.step(T('ACE ' + (i + 1) + ': "' + a.sid + '" tokende yok — atla.', 'ACE ' + (i + 1) + ': "' + a.sid + '" is not in the token — skip.'),
               { c: [loopNote, 3, { n: 4, note: T('e == 0? evet', 'e == 0? yes') }, 6] });
        continue;
      }
      S.step(T('ACE ' + (i + 1) + ': SID tokende var (e=' + e + ') — deny-only mu kontrol edilir.', 'ACE ' + (i + 1) + ': the SID IS in the token (e=' + e + ') — checked for deny-only.'),
             { c: [loopNote, 3, { n: 4, note: T('e == 0? hayır', 'e == 0? no') }, { n: 6, skip: true }] });
      var denyOnlySkip = e === 2 && !a.deny;
      if (denyOnlySkip) {
        S.set('ace' + i, { style: 'dim' });
        S.step(T('ACE ' + (i + 1) + ': "' + a.sid + '" deny-only bir grup — ALLOW ACE\'i saymaz.', 'ACE ' + (i + 1) + ': "' + a.sid + '" is a deny-only group — its ALLOW ACE does not count.'),
               { c: [{ n: 8, note: T('e==2 && !deny? evet', 'e==2 && !deny? yes') }, 10] });
        continue;
      }
      S.step(T('ACE ' + (i + 1) + ': deny-only değil (ya da bu bir DENY ACE\'i) — devam.', 'ACE ' + (i + 1) + ': not deny-only (or this is a DENY ACE) — continue.'),
             { c: [{ n: 8, note: T('e==2 && !deny? hayır', 'e==2 && !deny? no') }, { n: 10, skip: true }] });
      if (a.deny) {
        var denied = a.mask & requestMask & ~granted;
        if (denied) {
          S.set('ace' + i, { style: 'del' });
          S.step(T('ACE ' + (i + 1) + ': DENY "' + a.sid + '" istenen ' + rightsText(denied) + '\'i reddediyor — DUR, sonraki ACE\'ler HİÇ bakılmaz.',
                    'ACE ' + (i + 1) + ': DENY "' + a.sid + '" denies the requested ' + rightsText(denied) + ' — STOP, later ACEs are NEVER consulted.'),
                 { c: [{ n: 12, note: T('a->deny? evet', 'a->deny? yes') }, 13,
                       { n: 14, note: T('denied(' + denied + ') != 0? evet', 'denied(' + denied + ') != 0? yes') }, 16] });
          decided = true;
          S.at(null);
          for (var j = i + 1; j < data.aces.length; j++) S.set('ace' + j, { style: 'empty' });
          S.step(T('=> REDDEDİLDİ.', '=> DENIED.'), {});
          break;
        }
        S.set('ace' + i, { style: 'dim' });
        S.step(T('ACE ' + (i + 1) + ': DENY "' + a.sid + '" eşleşti ama istenen hakka dokunmuyor.', 'ACE ' + (i + 1) + ': DENY "' + a.sid + '" matched but does not touch the requested right.'),
               { c: [{ n: 12, note: T('a->deny? evet', 'a->deny? yes') }, 13, { n: 14, note: T('denied(0) != 0? hayır', 'denied(0) != 0? no') }, { n: 16, skip: true }, 18] });
        continue;
      }
      var extra = a.mask & requestMask & ~granted;
      granted |= a.mask & requestMask;
      S.set('ace' + i, { style: extra ? 'new' : 'dim' });
      S.step(T('ACE ' + (i + 1) + ': ALLOW "' + a.sid + '" ' + (extra ? rightsText(extra) + ' hakkını verdi.' : 'yeni bir şey vermedi.'),
                'ACE ' + (i + 1) + ': ALLOW "' + a.sid + '" ' + (extra ? 'granted ' + rightsText(extra) + '.' : 'granted nothing new.')),
             { c: [{ n: 12, note: T('a->deny? hayır (ALLOW)', 'a->deny? no (ALLOW)') }, 20, 21] });
      if (granted === requestMask) {
        decided = true;
        S.at(null);
        for (j = i + 1; j < data.aces.length; j++) S.set('ace' + j, { style: 'empty' });
        S.step(T('İstenen her hak verildi => İZİN VERİLDİ.', 'Every requested right has been granted => ALLOWED.'),
               { c: [{ n: 22, note: T('granted == request? evet', 'granted == request? yes') }, 24] });
        break;
      } else {
        S.step(T('Henüz her hak verilmedi, sonraki ACE\'e geçiliyor.', 'Not every right is granted yet, moving to the next ACE.'),
               { c: [{ n: 22, note: T('granted == request? hayır', 'granted == request? no') }, { n: 24, skip: true }] });
      }
    }
    if (!decided) {
      S.at(null);
      S.step(T('Liste bitti, "' + rightsText(requestMask & ~granted) + '" hiç verilmedi => REDDEDİLDİ.',
                'The list ended, "' + rightsText(requestMask & ~granted) + '" was never granted => DENIED.'),
             { c: [{ n: 1, note: T('i < ace_n? hayır (liste bitti)', 'i < ace_n? no (list ended)') }, 27, 28] });
    }
    S.result = reference(data);
  }

  D.define({
    id: 'windows-ace-evaluation-order',
    title: T('Windows ACE değerlendirme sırası (ace.c)', 'Windows ACE evaluation order (ace.c)'),
    code: { c: WALK_C },
    presets: [
      { id: 'normal-allow-accumulates', level: 'normal', small: true,
        name: T('Normal: iki ALLOW ACE birlikte tam izni oluşturuyor', 'Normal: two ALLOW ACEs together build up the full grant'),
        data: mk('alice', [{ name: 'Users', denyOnly: false }], [ace(false, 'alice', 'READ'), ace(false, 'Users', 'WRITE')], 'READ,WRITE') },
      { id: 'hard-deny-out-of-canonical-order', level: 'hard', small: true,
        name: T('Zor: ALLOW önce gelirse DENY hiç görülmeyebilir (kurallı olmayan sıra)', 'Hard: if ALLOW comes first, DENY may never be seen (non-canonical order)'),
        data: mk('bob', [{ name: 'Everyone', denyOnly: false }], [ace(false, 'bob', 'READ,WRITE'), ace(true, 'bob', 'WRITE')], 'WRITE') },
      { id: 'edge-deny-only-group-skipped', level: 'edge', small: true,
        name: T('Uç durum: deny-only grup, ALLOW ACE\'i saymaz', 'Edge case: a deny-only group, its ALLOW ACE does not count'),
        data: mk('admin', [{ name: 'Administrators', denyOnly: true }], [ace(false, 'Administrators', 'READ,WRITE,DELETE')], 'READ') },
      { id: 'edge-sid-not-in-token', level: 'edge', small: true,
        name: T('Uç durum: hiçbir ACE\'nin SID\'i tokende yok', 'Edge case: none of the ACEs\' SIDs are in the token'),
        data: mk('zoe', [{ name: 'Interns', denyOnly: false }], [ace(false, 'mark', 'READ,WRITE,DELETE')], 'READ') },
      { id: 'edge-canonical-deny-first-stops-early', level: 'edge', small: true,
        name: T('Uç durum: kurallı sıra — DENY ilk ACE, hemen durur', 'Edge case: canonical order — DENY is the first ACE, stops right away'),
        data: mk('carl', [{ name: 'Everyone', denyOnly: false }], [ace(true, 'Everyone', 'DELETE'), ace(false, 'carl', 'READ,WRITE,DELETE')], 'DELETE') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: a DACL walk over a handful of ACEs is a short, fixed-shape trace (real Windows
    // DACLs are rarely long either) — not the variable-length list the "≥10" rule targets.
    random: function (level, r) {
      var users = ['alice', 'bob', 'carl', 'zoe', 'admin'];
      var groupNames = ['Everyone', 'Users', 'Administrators', 'Interns', 'BackupOperators'];
      var user = users[D.randInt(r, 0, users.length - 1)];
      var groups = [{ name: groupNames[D.randInt(r, 0, groupNames.length - 1)], denyOnly: level === 'extreme' && r() < 0.4 }];
      var n = level === 'easy' ? 2 : level === 'normal' ? D.randInt(r, 2, 3) : D.randInt(r, 2, 4);
      var aces = [];
      var sidPool = [user, groups[0].name, 'Everyone'];
      for (var i = 0; i < n; i++) {
        var rightsList = RIGHTS.filter(function () { return r() < 0.6; });
        if (!rightsList.length) rightsList = ['READ'];
        aces.push(ace(r() < 0.35, sidPool[D.randInt(r, 0, sidPool.length - 1)], rightsList.join(',')));
      }
      var req = RIGHTS.filter(function () { return r() < 0.5; });
      if (!req.length) req = ['READ'];
      return mk(user, groups, aces, req.join(','));
    },
    input: {
      hint: T('user g1,g2[:deny] | DENY|ALLOW sid rights ; … | İSTEK', 'user g1,g2[:deny] | DENY|ALLOW sid rights ; … | REQUEST'),
      format: function (data) {
        return data.user + ' ' + data.groups.map(function (g) { return g.name + (g.denyOnly ? ':deny' : ''); }).join(',') + ' | ' +
          data.aces.map(function (a) { return (a.deny ? 'DENY' : 'ALLOW') + ' ' + a.sid + ' ' + rightsText(a.mask); }).join(' ; ') + ' | ' + data.request;
      },
      tokens: function (data) { return data.aces.map(function (a, i) { return 'ACE' + i; }); },
      parse: function (text) {
        var parts = String(text).split('|');
        if (parts.length !== 3) throw T('"token | ACE listesi | istek" biçiminde olmalı.', 'Must be "token | ACE list | request".');
        var head = parts[0].trim().split(/\s+/);
        if (head.length !== 2) throw T('token parçası "user g1,g2" biçiminde olmalı.', 'the token part must look like "user g1,g2".');
        var groups = head[1].split(',').map(function (g) {
          var deny = /:deny$/.test(g);
          return { name: g.replace(/:deny$/, ''), denyOnly: deny };
        });
        var aces = parts[1].split(';').map(function (s) { return s.trim(); }).filter(Boolean).map(function (t) {
          var m = t.match(/^(DENY|ALLOW)\s+(\S+)\s+([\w,]+)$/);
          if (!m) throw T('"' + t + '" "DENY|ALLOW sid rights" biçiminde olmalı.', '"' + t + '" must look like "DENY|ALLOW sid rights".');
          m[3].split(',').forEach(function (rt) {
            if (RIGHTS.indexOf(rt.trim()) < 0) throw T('"' + rt + '" geçersiz bir hak (READ/WRITE/DELETE olmalı).', '"' + rt + '" is not a valid right (must be READ/WRITE/DELETE).');
          });
          return ace(m[1] === 'DENY', m[2], m[3]);
        });
        if (!aces.length) throw T('En az bir ACE girin.', 'Enter at least one ACE.');
        var request = parts[2].trim();
        if (!parseRights(request)) throw T('İstek en az bir geçerli hak içermeli.', 'The request must contain at least one valid right.');
        return mk(head[0], groups, aces, request);
      },
      bad: ['', 'alice Users | BOGUS alice READ | READ', 'alice Users | ALLOW alice READ', 'alice Users | ALLOW alice BOGUSRIGHT | READ']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
