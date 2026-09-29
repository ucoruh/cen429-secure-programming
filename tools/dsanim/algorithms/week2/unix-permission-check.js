// CEN429 — Week 2 — Demo 13 (code/week-02/13-unix-permissions-umask/permissions.c:
// check_permission(), mode_text(), section_b()'s umask table)
// The Unix kernel picks exactly ONE class per request — owner, THEN group, THEN other — and never
// falls back: if the owner class is picked, the group/other bits are never even looked at (the
// "owner can't read their own file" paradox). umask works the opposite way, at CREATE time: the
// real mode = requested & ~umask, bit by bit.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (permissions.c)
  var CHECK_C = [
    'static int check_permission(const struct person *p, const struct fileobj *f,',   // 53
    '                            int request, const char **class_out)',
    '{',
    '    if (p->uid == 0) {',
    '        *class_out = "root";',
    '        if (request == EXECUTE)',
    '            return (f->mode & 0111u) != 0;',
    '        return 1;',
    '    }',
    '    unsigned bits;',
    '    if (p->uid == f->owner) {',
    '        *class_out = "owner";',
    '        bits = (f->mode >> 6) & 7u;',
    '    } else if (p->groups[0] == f->group || p->groups[1] == f->group ||',
    '               p->groups[2] == f->group) {',
    '        *class_out = "group";',
    '        bits = (f->mode >> 3) & 7u;',
    '    } else {',
    '        *class_out = "other";',
    '        bits = f->mode & 7u;',
    '    }',
    '    return (bits & (unsigned)request) != 0;',
    '}'
  ]; // permissions.c 53-77 (unbroken)
  var UMASK_C = [
    'static void mode_text(unsigned mode, char *t)',   // 44
    '{',
    '    const char *h = "rwxrwxrwx";',
    '    for (int i = 0; i < 9; i++)',
    '        t[i] = (mode & (0400u >> i)) ? h[i] : \'-\';',
    '    t[9] = \'\\0\';',
    '}',
    '',
    '    const unsigned requested[] = {0666, 0777, 0600};',   // 130
    '    const unsigned masks[] = {000, 002, 022, 077};',     // 131
    '    /* ... (the two nested loops that print the table; see section_b()) ... */',
    '            mode_text(requested[i] & ~masks[j], m);'     // 141
  ];

  var RIGHT_BIT = { READ: 4, WRITE: 2, EXECUTE: 1 };
  var RIGHT_LETTER = { READ: 'r', WRITE: 'w', EXECUTE: 'x' };

  function mkCheck(uid, groups, request, owner, group, mode) {
    return { kind: 'check', uid: uid, groups: groups, request: request, owner: owner, group: group, mode: mode };
  }
  function mkUmask(requested, umask) { return { kind: 'umask', requested: requested, umask: umask }; }

  function modeText(mode) {
    var h = 'rwxrwxrwx', t = '';
    for (var i = 0; i < 9; i++) t += (mode & (0x100 >> i)) ? h[i] : '-';
    return t;
  }

  function checkPermission(data) {
    var bit = RIGHT_BIT[data.request];
    if (data.uid === 0) {
      if (data.request === 'EXECUTE') return { allow: (data.mode & 0o111) !== 0, cls: 'root' };
      return { allow: true, cls: 'root' };
    }
    var bits, cls;
    if (data.uid === data.owner) { cls = 'owner'; bits = (data.mode >> 6) & 7; }
    else if (data.groups.indexOf(data.group) >= 0) { cls = 'group'; bits = (data.mode >> 3) & 7; }
    else { cls = 'other'; bits = data.mode & 7; }
    return { allow: (bits & bit) !== 0, cls: cls };
  }

  /** Independent: for the permission check, tests the SPECIFIC letter in the mode_text() string
   * instead of the bit arithmetic build() shows; for umask, XORs then ANDs with the requested value
   * (an equivalent, differently-derived way to compute "requested & ~umask"). */
  function reference(data) {
    if (data.kind === 'umask') {
      var notUmask = (~data.umask) >>> 0;
      return { actual: (data.requested & notUmask) & 0x1ff, text: modeText((data.requested & notUmask) & 0x1ff) };
    }
    var r = checkPermission(data);
    var text = modeText(data.mode);
    var offset = r.cls === 'root' ? -1 : r.cls === 'owner' ? 0 : r.cls === 'group' ? 3 : 6;
    var letterIndex = offset + (data.request === 'READ' ? 0 : data.request === 'WRITE' ? 1 : 2);
    var expectAllow = r.cls === 'root' ? (data.request !== 'EXECUTE' || (data.mode & 0o111) !== 0) : text[letterIndex] !== '-';
    return { allow: expectAllow, cls: r.cls };
  }

  function buildCheck(S, data) {
    var r = checkPermission(data);
    S.box('person', { x: 0, y: 0, w: 220, h: 50, size: 12, text: 'uid=' + data.uid + ' groups=[' + data.groups.join(',') + ']', style: 'active' });
    S.box('file', { x: 260, y: 0, w: 320, h: 50, size: 12, text: 'owner=' + data.owner + ' group=' + data.group + ' mode=' + modeText(data.mode), style: 'normal' });
    S.label('title', { x: 250, y: -24, text: T('İstek: ' + data.request, 'Request: ' + data.request), anchor: 'middle', bold: true, size: 15 });
    S.at(0);
    var isRoot = data.uid === 0;
    S.step(T('Kernel sınıfı SIRAYLA seçer: önce root mu?', 'The kernel picks a class IN ORDER: root first?'),
           { c: [{ n: 4, note: T('uid(' + data.uid + ') == 0? ' + (isRoot ? 'evet' : 'hayır'), 'uid(' + data.uid + ') == 0? ' + (isRoot ? 'yes' : 'no')) },
                 isRoot ? 5 : { n: 5, skip: true }] });

    if (isRoot) {
      S.set('person', { style: 'new' });
      var isExec = data.request === 'EXECUTE';
      var rootAllow = isExec ? (data.mode & 0o111) !== 0 : true;
      S.step(T('uid=0: ROOT sınıfı. İstek EXECUTE mi?', 'uid=0: the ROOT class. Is the request EXECUTE?'),
             { c: [{ n: 6, note: T(data.request + ' == EXECUTE? ' + (isExec ? 'evet' : 'hayır'), data.request + ' == EXECUTE? ' + (isExec ? 'yes' : 'no')) },
                   isExec ? { n: 7, note: T('mode & 0111 != 0 -> ' + (rootAllow ? 'evet' : 'hayır'), 'mode & 0111 != 0 -> ' + (rootAllow ? 'yes' : 'no')) } : { n: 7, skip: true },
                   isExec ? { n: 8, skip: true } : 8] });
      S.step(isExec
        ? T('EXECUTE: en az bir x biti (' + modeText(data.mode) + ') gerekli — ' + (rootAllow ? 'var, İZİN VERİLDİ.' : 'yok, REDDEDİLDİ.'),
            'EXECUTE: at least one x bit (' + modeText(data.mode) + ') is required — ' + (rootAllow ? 'present, ALLOWED.' : 'absent, DENIED.'))
        : T('READ/WRITE: root için CAP_DAC_OVERRIDE serbesttir — İZİN VERİLDİ.', 'READ/WRITE: CAP_DAC_OVERRIDE makes it free for root — ALLOWED.'),
        {});
      S.result = reference(data);
      return;
    }
    var isOwner = data.uid === data.owner;
    S.step(T('root değil. Sahibi mi (uid == owner)?', 'Not root. Is this the owner (uid == owner)?'),
           { c: [{ n: 11, note: T('uid(' + data.uid + ') == owner(' + data.owner + ')? ' + (isOwner ? 'evet' : 'hayır'), 'uid(' + data.uid + ') == owner(' + data.owner + ')? ' + (isOwner ? 'yes' : 'no')) }] });

    var bits, letterOffset;
    if (isOwner) {
      bits = (data.mode >> 6) & 7; letterOffset = 0;
      S.set('person', { style: 'hl' }); S.set('file', { style: 'hl' });
      S.step(T('EVET: sınıf = owner. Yalnızca üst 3 bit (' + modeText(data.mode).slice(0, 3) + ') dikkate alınır — grup/diğer bitleri ASLA bakılmaz.',
                'YES: class = owner. Only the top 3 bits (' + modeText(data.mode).slice(0, 3) + ') are consulted — the group/other bits are NEVER looked at.'),
             { c: [11, 12, 13, { n: 14, skip: true }] });
    } else {
      var inGroup = data.groups.indexOf(data.group) >= 0;
      S.step(T('HAYIR. Grubu mu (' + data.group + ' listede mi: [' + data.groups.join(',') + '])?',
                'NO. Is it the group (' + data.group + ' in the list: [' + data.groups.join(',') + '])?'),
             { c: [{ n: 14, note: T('group(' + data.group + ') listede mi? ' + (inGroup ? 'evet' : 'hayır'), 'group(' + data.group + ') in the list? ' + (inGroup ? 'yes' : 'no')) }, 15] });
      if (inGroup) {
        bits = (data.mode >> 3) & 7; letterOffset = 3;
        S.set('person', { style: 'hl' }); S.set('file', { style: 'hl' });
        S.step(T('EVET: sınıf = group. Orta 3 bit (' + modeText(data.mode).slice(3, 6) + ') dikkate alınır.',
                  'YES: class = group. The middle 3 bits (' + modeText(data.mode).slice(3, 6) + ') are consulted.'),
               { c: [14, 15, 16, 17] });
      } else {
        bits = data.mode & 7; letterOffset = 6;
        S.set('person', { style: 'hl' }); S.set('file', { style: 'hl' });
        S.step(T('HAYIR, ne sahip ne grup. sınıf = other. Son 3 bit (' + modeText(data.mode).slice(6, 9) + ') dikkate alınır.',
                  'NO, neither owner nor group. class = other. The last 3 bits (' + modeText(data.mode).slice(6, 9) + ') are consulted.'),
               { c: [18, 19, 20] });
      }
    }
    var allow = (bits & RIGHT_BIT[data.request]) !== 0;
    S.set('person', { style: allow ? 'new' : 'del' });
    S.set('file', { style: allow ? 'new' : 'del' });
    S.step(T('bits(' + bits.toString(2) + ') & ' + data.request + '(' + RIGHT_LETTER[data.request] + ') ' + (allow ? '!= 0 -> İZİN VERİLDİ.' : '== 0 -> REDDEDİLDİ.'),
              'bits(' + bits.toString(2) + ') & ' + data.request + '(' + RIGHT_LETTER[data.request] + ') ' + (allow ? '!= 0 -> ALLOWED.' : '== 0 -> DENIED.')),
           { c: [22] });
    S.result = reference(data);
  }

  function buildUmask(S, data) {
    var actual = (data.requested & (~data.umask >>> 0)) & 0x1ff;
    S.label('title', { x: 0, y: -24, text: T('gerçek izin = istenen & ~umask', 'the actual permission = requested & ~umask'), anchor: 'start', bold: true, size: 15 });
    for (var i = 0; i < 9; i++) {
      var reqBit = (data.requested & (0x100 >> i)) ? 1 : 0;
      var maskBit = (data.umask & (0x100 >> i)) ? 1 : 0;
      S.box('req' + i, { x: i * 34, y: 0, w: 30, h: 30, size: 13, text: String(reqBit), style: 'normal', above: 'rwxrwxrwx'[i] });
      S.box('mask' + i, { x: i * 34, y: 44, w: 30, h: 30, size: 13, text: String(1 - maskBit), style: 'dim' }); // showing ~umask directly
    }
    S.label('reqLbl', { x: -20, y: 20, text: T('istenen', 'requested'), anchor: 'end', size: 12 });
    S.label('maskLbl', { x: -20, y: 64, text: '~umask', anchor: 'end', size: 12 });
    S.label('resLbl', { x: -20, y: 108, text: T('sonuç', 'result'), anchor: 'end', size: 12 });
    S.at(0);
    S.step(T('İstenen mod (' + modeText(data.requested) + ') ve umask (' + modeText(data.umask) + ') bit bit karşılaştırılacak.',
              'The requested mode (' + modeText(data.requested) + ') and the umask (' + modeText(data.umask) + ') are compared bit by bit.'),
           { c: [9, 10] });
    for (i = 0; i < 9; i++) {
      var reqBit = (data.requested & (0x100 >> i)) ? 1 : 0;
      var maskBit = (data.umask & (0x100 >> i)) ? 1 : 0;
      var resBit = reqBit & (1 - maskBit);
      S.set('req' + i, { style: 'hl' }); S.set('mask' + i, { style: 'hl' });
      S.box('res' + i, { x: i * 34, y: 88, w: 30, h: 30, size: 13, text: String(resBit), style: resBit ? 'new' : 'empty' });
      if (i < 2 || i === 8) {
        S.step(T('bit ' + i + ' (' + 'rwxrwxrwx'[i] + '): ' + reqBit + ' & ~' + maskBit + ' = ' + resBit + '; mode_text bunu "' + (resBit ? 'rwxrwxrwx'[i] : '-') + '" karakterine çevirir.',
                  'bit ' + i + ' (' + 'rwxrwxrwx'[i] + '): ' + reqBit + ' & ~' + maskBit + ' = ' + resBit + '; mode_text turns it into the "' + (resBit ? 'rwxrwxrwx'[i] : '-') + '" character.'),
               { c: [12, 4, { n: 5, note: T('bit ' + i + ' set mi? ' + (resBit ? 'evet -> harf' : 'hayır -> \'-\''), 'bit ' + i + ' set? ' + (resBit ? 'yes -> letter' : 'no -> \'-\'')) }] });
      }
      S.set('req' + i, { style: 'dim' }); S.set('mask' + i, { style: 'dim' });
    }
    S.at(null);
    S.label('final', { x: 0, y: 140, anchor: 'start', size: 14, bold: true, style: 'new', text: T(
      'gerçek izin = ' + modeText(actual) + ' (' + ('000' + actual.toString(8)).slice(-3) + ')',
      'actual permission = ' + modeText(actual) + ' (' + ('000' + actual.toString(8)).slice(-3) + ')') });
    S.step(T('Sonuç: ' + modeText(actual) + '. umask 000 ile 0666 isteyince dosya HERKESE YAZILABİLİR olur — dikkat.',
              'Result: ' + modeText(actual) + '. Requesting 0666 with umask 000 makes the file WRITABLE BY EVERYONE — watch out.'),
           {});
    S.result = reference(data);
  }

  function build(S, data) { return data.kind === 'umask' ? buildUmask(S, data) : buildCheck(S, data); }

  D.define({
    id: 'unix-permission-check',
    title: T('Unix izin kontrolü ve umask (permissions.c)', 'Unix permission check and umask (permissions.c)'),
    code: function (data) { return { c: (data && data.kind === 'umask') ? UMASK_C : CHECK_C }; },
    presets: [
      { id: 'normal-owner-allowed', level: 'normal', small: true,
        name: T('Normal: sahip okuyor, izin var', 'Normal: the owner reads, it is allowed'),
        data: mkCheck(1001, [2001], 'READ', 1001, 2001, 0o640) },
      { id: 'hard-owner-paradox', level: 'hard', small: true,
        name: T('Zor: "sahip okuyamaz" paradoksu (owner bitleri kapalı)', 'Hard: the "owner can\'t read" paradox (owner bits are off)'),
        data: mkCheck(1001, [2001], 'READ', 1001, 2001, 0o077) },
      { id: 'edge-root-execute-needs-x', level: 'edge', small: true,
        name: T('Uç durum: root bile çalıştırmak için x biti ister', 'Edge case: even root needs an x bit to execute'),
        data: mkCheck(0, [0], 'EXECUTE', 1001, 2001, 0o640) },
      { id: 'edge-umask-000-dangerous', level: 'edge', small: true,
        name: T('Uç durum: umask 000, 0666 isteyince herkese açılıyor', 'Edge case: umask 000, requesting 0666 opens it to everyone'),
        data: mkUmask(0o666, 0o000) },
      { id: 'edge-umask-full-blocks-group-other', level: 'edge', small: true,
        name: T('Uç durum: umask 077, grup/diğer tamamen kapanıyor', 'Edge case: umask 077 closes group/other entirely'),
        data: mkUmask(0o666, 0o077) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: a single permission check (2 fixed entities) or a 9-bit umask comparison is a
    // fixed-shape record, not a variable-length list the "≥10" rule was written for.
    random: function (level, r) {
      if (level === 'extreme' && r() < 0.4) return mkUmask([0o666, 0o777, 0o600][D.randInt(r, 0, 2)], [0, 0o002, 0o022, 0o077][D.randInt(r, 0, 3)]);
      var requests = ['READ', 'WRITE', 'EXECUTE'];
      var uid = r() < 0.15 ? 0 : 1001 + D.randInt(r, 0, 3);
      var owner = 1001, group = 2001, groups = r() < 0.5 ? [group] : [3001];
      var mode = D.randInt(r, 0, 511);
      return mkCheck(uid, groups, requests[D.randInt(r, 0, 2)], owner, group, mode);
    },
    input: {
      hint: T('CHECK uid grup1,grup2 REQUEST owner group mode  —  ya da  —  UMASK requested umask (sekizlik)',
              'CHECK uid group1,group2 REQUEST owner group mode  —  or  —  UMASK requested umask (octal)'),
      format: function (data) {
        if (data.kind === 'umask') return 'UMASK ' + data.requested.toString(8) + ' ' + data.umask.toString(8);
        return 'CHECK ' + data.uid + ' ' + data.groups.join(',') + ' ' + data.request + ' ' + data.owner + ' ' + data.group + ' ' + data.mode.toString(8);
      },
      tokens: function (data) { return data.kind === 'umask' ? ['requested', 'umask'] : ['uid', 'request', 'owner', 'group', 'mode']; },
      parse: function (text) {
        var toks = String(text).trim().split(/\s+/);
        if (toks[0] === 'UMASK') {
          if (toks.length !== 3) throw T('"UMASK requested umask" biçiminde olmalı.', 'Must be "UMASK requested umask".');
          return mkUmask(parseInt(toks[1], 8), parseInt(toks[2], 8));
        }
        if (toks[0] === 'CHECK') {
          if (toks.length !== 7) throw T('"CHECK uid grup1,.. REQUEST owner group mode" biçiminde olmalı.', 'Must be "CHECK uid g1,.. REQUEST owner group mode".');
          var groups = toks[2].split(',').map(function (x) { return parseInt(x, 10); });
          if (['READ', 'WRITE', 'EXECUTE'].indexOf(toks[3]) < 0) throw T('İstek READ/WRITE/EXECUTE olmalı.', 'The request must be READ/WRITE/EXECUTE.');
          return mkCheck(parseInt(toks[1], 10), groups, toks[3], parseInt(toks[4], 10), parseInt(toks[5], 10), parseInt(toks[6], 8));
        }
        throw T('"CHECK .." ya da "UMASK .." ile başlamalı.', 'Must start with "CHECK .." or "UMASK ..".');
      },
      bad: ['', 'UMASK 666', 'CHECK 1001 2001 BOGUS 1001 2001 640', 'NEITHER 1 2 3']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
