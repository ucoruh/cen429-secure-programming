// CEN429 — Week 2 — Demo 14 (code/week-02/14-rbac-clark-wilson/bank.c: check_access())
// Before any transformation procedure (TP) touches a Constrained Data Item, FIVE gates run IN ORDER,
// each one able to stop the request on its own: E3 the identity is recognized and has an open
// session, E4 a certifier may never RUN a TP (only certify one), E2 the TP is present in one of the
// user's ACTIVE roles (RBAC), E1 the TP is CERTIFIED for these exact CDIs (Clark-Wilson). Only after
// all five pass does the TP itself run (where C2/C3/C5 take over).
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (bank.c 218-257)
  var CHECK_C = [
    '/* E3 + E4 + E2 + E1. 1 = the TP may run */',
    'static int check_access(int u, const char *username, const char *tp,',
    '                        const char *c1, const char *c2)',
    '{',
    '    if (u < 0) {',
    '        /* E3 identity: not recognized -> DENY */',
    '        return 0;',
    '    }',
    '    if (!user[u].session) {',
    '        /* E3 no open session -> DENY */',
    '        return 0;',
    '    }',
    '    int cr = find_name(role_name, role_n, CERTIFIER_ROLE);',
    '    if (cr >= 0 && (user[u].assigned & (1u << cr))) {',
    '        /* E4 a certifier cannot run a TP -> DENY */',
    '        return 0;',
    '    }',
    '    unsigned active = expand_roles(user[u].active);',
    '    int grantor = -1;',
    '    for (int i = 0; i < grant_n; i++)',
    '        if (strcmp(grant[i].tp, tp) == 0 && (active & (1u << grant[i].role))) {',
    '            grantor = grant[i].role;',
    '            break;',
    '        }',
    '    if (grantor < 0) {',
    '        /* E2 (username, tp): not present in any active role -> DENY */',
    '        return 0;',
    '    }',
    '    if (!is_certified(tp, c1, c2)) {',
    '        /* E1 tp is not certified for these CDIs -> DENY */',
    '        return 0;',
    '    }',
    '    return 1;'
  ];

  function mk(username, exists, hasSession, isCertifier, hasGrant, isCertified, tp) {
    return { username: username, exists: exists, hasSession: hasSession, isCertifier: isCertifier,
             hasGrant: hasGrant, isCertified: isCertified, tp: tp };
  }

  /** Independent: expresses the 5-gate chain as an ARRAY of boolean conditions and uses .every()
   * to find the first failing gate, instead of the sequence of early `return 0`s build() animates. */
  function reference(data) {
    var gates = [
      { id: 'e3a', pass: data.exists },
      { id: 'e3b', pass: !data.exists || data.hasSession },
      { id: 'e4', pass: !(data.exists && data.hasSession) || !data.isCertifier },
      { id: 'e2', pass: !(data.exists && data.hasSession && !data.isCertifier) || data.hasGrant },
      { id: 'e1', pass: !(data.exists && data.hasSession && !data.isCertifier && data.hasGrant) || data.isCertified }
    ];
    var firstFail = gates.findIndex(function (g) { return !g.pass; });
    return { allow: firstFail < 0, stoppedAtGate: firstFail < 0 ? null : gates[firstFail].id };
  }

  function build(S, data) {
    // Each gate's line list is a FUNCTION of `ok` (that gate's real pass/fail outcome), so the
    // condition line(s) it owns always carry a note reflecting the actual comparison, and the
    // "return 0" line inside is shown as run only when the gate actually failed (else skipped).
    var gateNames = [
      { id: 'e3a', label: T('E3: kimlik tanınıyor mu?', 'E3: is the identity recognized?'),
        lines: function (ok) { return [{ n: 5, note: T('u < 0? ' + (ok ? 'hayır' : 'evet'), 'u < 0? ' + (ok ? 'no' : 'yes')) }, ok ? { n: 7, skip: true } : 7]; } },
      { id: 'e3b', label: T('E3: açık oturum var mı?', 'E3: is there an open session?'),
        lines: function (ok) { return [{ n: 9, note: T('!session? ' + (ok ? 'hayır' : 'evet'), '!session? ' + (ok ? 'no' : 'yes')) }, ok ? { n: 11, skip: true } : 11]; } },
      { id: 'e4', label: T('E4: sertifikacı değil mi?', 'E4: is this NOT a certifier?'),
        lines: function (ok) { return [13, { n: 14, note: T('cr>=0 && sertifikacı mı? ' + (ok ? 'hayır' : 'evet'), 'cr>=0 && is a certifier? ' + (ok ? 'no' : 'yes')) }, ok ? { n: 16, skip: true } : 16]; } },
      { id: 'e2', label: T('E2: TP, aktif bir rolde mi?', 'E2: is the TP in an active role?'),
        lines: function (ok) { return [18, 19, { n: 20, note: T('i < grant_n? evet', 'i < grant_n? yes') },
          { n: 21, note: T('tp eşleşti && aktif rolde? ' + (data.hasGrant ? 'evet' : 'hayır'), 'tp matches && in active role? ' + (data.hasGrant ? 'yes' : 'no')) },
          { n: 25, note: T('grantor < 0? ' + (ok ? 'hayır' : 'evet'), 'grantor < 0? ' + (ok ? 'no' : 'yes')) }, ok ? { n: 27, skip: true } : 27]; } },
      { id: 'e1', label: T('E1: TP bu CDI\'lar için sertifikalı mı?', 'E1: is the TP certified for these CDIs?'),
        lines: function (ok) { return [{ n: 29, note: T('!is_certified? ' + (ok ? 'hayır' : 'evet'), '!is_certified? ' + (ok ? 'no' : 'yes')) }, ok ? { n: 31, skip: true } : 31]; } }
    ];
    gateNames.forEach(function (g, i) {
      S.box('g' + i, { x: 0, y: i * 46, w: 380, h: 38, size: 13, text: g.label, style: 'normal' });
    });
    S.label('title', { x: 0, y: -24, text: T(data.username + ' -> ' + data.tp + ' çalıştırmak istiyor', data.username + ' wants to run ' + data.tp), anchor: 'start', bold: true, size: 15 });
    S.at(0);
    S.step(T('5 kapı SIRAYLA kontrol edilir; herhangi biri geçmezse istek anında REDDEDİLİR.',
              'Five gates are checked IN ORDER; failing any one of them denies the request immediately.'), { c: [1] });

    var checks = [data.exists, data.exists && data.hasSession, data.exists && data.hasSession && !data.isCertifier,
                  data.exists && data.hasSession && !data.isCertifier && data.hasGrant, null];
    var passResults = [data.exists, !data.exists || data.hasSession, !(data.exists && data.hasSession) || !data.isCertifier,
                        !(data.exists && data.hasSession && !data.isCertifier) || data.hasGrant,
                        !(data.exists && data.hasSession && !data.isCertifier && data.hasGrant) || data.isCertified];
    for (var i = 0; i < 5; i++) {
      S.at(i);
      S.set('g' + i, { style: 'hl' });
      var reachable = i === 0 || passResults.slice(0, i).every(Boolean);
      if (!reachable) { S.set('g' + i, { style: 'empty' }); continue; }
      var ok = passResults[i];
      S.set('g' + i, { style: ok ? 'new' : 'del' });
      S.step(T(gateNames[i].label.tr + ' -> ' + (ok ? 'GEÇTİ' : 'BAŞARISIZ, DUR.'), gateNames[i].label.en + ' -> ' + (ok ? 'PASSED' : 'FAILED, STOP.')),
             { c: gateNames[i].lines(ok) });
      if (!ok) {
        S.at(null);
        for (var j = i + 1; j < 5; j++) S.set('g' + j, { style: 'empty' });
        S.step(T('=> REDDEDİLDİ (kapı: ' + gateNames[i].id.toUpperCase() + ').', '=> DENIED (gate: ' + gateNames[i].id.toUpperCase() + ').'), {});
        S.result = reference(data);
        return;
      }
    }
    S.at(null);
    S.step(T('5 kapı da geçti => TP ÇALIŞABİLİR (C2/C3/C5 kontrolleri TP\'nin kendi içinde devam eder).',
              'All 5 gates passed => the TP MAY RUN (C2/C3/C5 checks continue inside the TP itself).'), {});
    S.result = reference(data);
  }

  D.define({
    id: 'rbac-clark-wilson-transaction-check',
    title: T('RBAC + Clark-Wilson: bir TP çalıştırma kontrolü (bank.c)', 'RBAC + Clark-Wilson: the TP access-check chain (bank.c)'),
    code: { c: CHECK_C },
    presets: [
      { id: 'normal-all-pass', level: 'normal', small: true,
        name: T('Normal: beş kapı da geçiyor, TP çalışıyor', 'Normal: all five gates pass, the TP runs'),
        data: mk('alice', true, true, false, true, true, 'DEPOSIT') },
      { id: 'hard-fails-at-last-gate', level: 'hard', small: true,
        name: T('Zor: rol doğru ama TP sertifikalı değil (E1\'de durur)', 'Hard: the role is right but the TP is not certified (stops at E1)'),
        data: mk('bob', true, true, false, true, false, 'BAD_TRANSFER') },
      { id: 'edge-unrecognized-user', level: 'edge', small: true,
        name: T('Uç durum: kullanıcı hiç tanınmıyor (E3\'te ilk kapıda durur)', 'Edge case: the user is not recognized at all (stops at the very first E3 gate)'),
        data: mk('guest', false, false, false, false, false, 'DEPOSIT') },
      { id: 'edge-certifier-tries-to-run', level: 'edge', small: true,
        name: T('Uç durum: sertifikacı bir TP çalıştırmaya çalışıyor (E4)', 'Edge case: a certifier tries to run a TP (E4)'),
        data: mk('eve', true, true, true, true, true, 'TRANSFER') },
      { id: 'edge-no-session', level: 'edge', small: true,
        name: T('Uç durum: tanınıyor ama oturum yok (E3\'ün ikinci yarısı)', 'Edge case: recognized but no open session (the second half of E3)'),
        data: mk('carl', true, false, false, true, true, 'APPROVE') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: a 5-gate access check is a fixed-shape boolean chain, not a variable-length list.
    random: function (level, r) {
      var users = ['alice', 'bob', 'carl', 'dana', 'eve', 'guest'];
      var tps = ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'APPROVE', 'IVP'];
      var exists = level === 'easy' ? true : r() < 0.85;
      var hasSession = !exists ? false : (level === 'easy' ? true : r() < 0.8);
      var isCertifier = exists && hasSession && level !== 'easy' && r() < 0.2;
      var hasGrant = exists && hasSession && !isCertifier && (level === 'easy' ? true : r() < 0.75);
      var isCertified = hasGrant && (level === 'easy' ? true : r() < 0.75);
      return mk(users[D.randInt(r, 0, users.length - 1)], exists, hasSession, isCertifier, hasGrant,
                isCertified, tps[D.randInt(r, 0, tps.length - 1)]);
    },
    input: {
      hint: T('user exists:0|1 session:0|1 certifier:0|1 grant:0|1 certified:0|1 tp',
              'user exists:0|1 session:0|1 certifier:0|1 grant:0|1 certified:0|1 tp'),
      format: function (data) {
        return [data.username, 'exists:' + (data.exists ? 1 : 0), 'session:' + (data.hasSession ? 1 : 0),
                'certifier:' + (data.isCertifier ? 1 : 0), 'grant:' + (data.hasGrant ? 1 : 0),
                'certified:' + (data.isCertified ? 1 : 0), data.tp].join(' ');
      },
      tokens: function (data) { return ['exists', 'session', 'certifier', 'grant', 'certified']; },
      parse: function (text) {
        var toks = String(text).trim().split(/\s+/);
        if (toks.length !== 7) throw T('7 alan gerekli: user exists:.. session:.. certifier:.. grant:.. certified:.. tp', '7 fields required: user exists:.. session:.. certifier:.. grant:.. certified:.. tp');
        var vals = {};
        for (var i = 1; i <= 5; i++) {
          var m = toks[i].match(/^(exists|session|certifier|grant|certified):([01])$/);
          if (!m) throw T('"' + toks[i] + '" "ad:0|1" biçiminde olmalı.', '"' + toks[i] + '" must look like "name:0|1".');
          vals[m[1]] = m[2] === '1';
        }
        return mk(toks[0], vals.exists, vals.session, vals.certifier, vals.grant, vals.certified, toks[6]);
      },
      bad: ['', 'alice exists:1', 'alice exists:2 session:1 certifier:0 grant:1 certified:1 DEPOSIT', 'alice exists:1 session:1 certifier:0 grant:1 certified:1']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
