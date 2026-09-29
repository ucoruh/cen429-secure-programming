// CEN429 — Week 1 — Secure start-up: sanitising everything a program inherits
// Reference: docs/week-1/cen429-week-1.{tr,en}.md, section 11, "Guvenli baslatma: programin ilk satirlarinda
// yapilacaklar" (Cookbook recipes 1.1-1.9), and code/week-01/01-path-spoofing/report_secure.c. secure_startup()
// runs, in this order: sanitize_file_descriptors() (step 2), sanitize_environment() (step 1), umask(077)
// (step 3), disable_core_dump() (step 4), drop_privileges() (step 5). This animation takes a dangerous inherited
// state (an environment variable list plus leaked descriptors / umask / core dump / privilege) and walks the
// real pipeline, variable by variable, until only a small, known, safe state is left.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    'int main(int argc, char **argv)',
    '{',
    '    sanitize_file_descriptors();   /* step 2 */',
    '    sanitize_environment();        /* step 1 */',
    '    umask(077);                    /* step 3 */',
    '    disable_core_dump();           /* step 4 */',
    '    drop_privileges();             /* step 5 */',
    '',
    '    /* ... the program\'s actual work ... */',
    '    return 0;',
    '}',
    '',
    'void sanitize_environment(void)',
    '{',
    '    for (each inherited NAME=value) {',
    '        if (NAME is on the allow-list: TZ, LANG, HOME)',
    '            keep(NAME, value);      /* copied now, restored after clearenv() */',
    '        else',
    '            drop(NAME);             /* not on the allow-list, e.g. PATH, LD_PRELOAD */',
    '    }',
    '    clearenv();                     /* wipes ALL of it, kept or not */',
    '    setenv() each kept NAME=value;  /* then force PATH=/usr/bin:/bin, never inherited */',
    '}'
  ];
  var LINE = { fd: 3, env: 4, umask: 5, core: 6, priv: 7, envIf: 16, envKeep: 17, envDrop: 19, envClear: 21 };

  var SAFE_KEEP = ['TZ', 'LANG', 'HOME'];
  var KNOWN_DANGEROUS = ['PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH', 'IFS', 'BASH_ENV', 'ENV'];

  function ev(name, value) { return { name: name, value: value }; }
  function mk(envVars, fdExtra, stdoutClosed, umaskIn, coreDump, priv) {
    return { envVars: envVars, fdExtra: fdExtra, stdoutClosed: stdoutClosed, umaskIn: umaskIn, coreDump: coreDump, priv: priv };
  }

  var TYPICAL_ENV = [
    ev('PATH', '/tmp/evil:/usr/bin:/bin'), ev('LD_PRELOAD', '/tmp/keylogger.so'), ev('IFS', '$\'\\n\''),
    ev('HOME', '/home/alice'), ev('TZ', 'Europe/Istanbul'), ev('LANG', 'en_US.UTF-8'),
    ev('EDITOR', 'vim'), ev('SHELL', '/bin/bash'), ev('TERM', 'xterm-256color'), ev('PWD', '/home/alice/vault'),
    ev('USER', 'alice'), ev('BASH_ENV', '/tmp/payload.sh')
  ];
  var NORMAL = mk(TYPICAL_ENV, 2, true, '000', true, 'root');

  var SERVER_ENV = [
    ev('PATH', '.:/usr/bin'), ev('LD_LIBRARY_PATH', '/tmp/fake-libs'), ev('IFS', '\\t'), ev('ENV', '/tmp/rc'),
    ev('BASH_ENV', '/tmp/rc2'), ev('HOME', '/home/svc'), ev('TZ', 'UTC'), ev('LANG', 'C'),
    ev('LOGNAME', 'svc'), ev('MAIL', '/var/mail/svc'), ev('HISTFILE', '/home/svc/.bash_history'),
    ev('SSH_AUTH_SOCK', '/tmp/ssh.sock'), ev('DISPLAY', ':0'), ev('LD_PRELOAD', '/tmp/rootkit.so')
  ];
  var HARD = mk(SERVER_ENV, 3, true, '022', true, 'root');

  var EDGE_CLEAN_ENV = [];
  for (var i = 1; i <= 10; i++) EDGE_CLEAN_ENV.push(ev('CUSTOM_VAR_' + i, 'harmless-' + i));
  var EDGE_CLEAN = mk(EDGE_CLEAN_ENV, 0, false, '077', false, 'user');

  var EDGE_ALL_DANGEROUS_ENV = [];
  KNOWN_DANGEROUS.forEach(function (n, i) { EDGE_ALL_DANGEROUS_ENV.push(ev(n, 'danger-' + i)); });
  for (i = 0; i < 5; i++) EDGE_ALL_DANGEROUS_ENV.push(ev('PATH', '/tmp/evil' + i)); // repeated PATH entries, worst case
  var EDGE_ALL_DANGEROUS = mk(EDGE_ALL_DANGEROUS_ENV, 5, true, '000', true, 'root');

  /** Independent computation: a single filter() over the allowlist, no per-item loop matching build()'s. */
  function reference(data) {
    var survivors = ['PATH=/usr/bin:/bin'].concat(
      data.envVars.filter(function (v) { return SAFE_KEEP.indexOf(v.name) >= 0; })
                   .map(function (v) { return v.name + '=' + v.value; })
    );
    return {
      envSurvivors: survivors,
      fdLeaksClosed: data.fdExtra,
      stdoutFixed: data.stdoutClosed,
      umaskAfter: '077',
      coreDumpAfter: false,
      privilegeAfter: 'user'
    };
  }

  function build(S, data) {
    var n = data.envVars.length;
    var RX = 0, RY = 0, RW = 340, RH = 30, GAP = 4;
    S.label('title', { x: RX, y: RY - 18, text: T('devralınan ortam (' + n + ' değişken)', 'inherited environment (' + n + ' variables)'), anchor: 'start', size: 14, bold: true });
    for (var i = 0; i < n; i++) {
      var v = data.envVars[i];
      S.box('e' + i, { x: RX, y: RY + i * (RH + GAP), w: RW, h: RH, size: 12, mono: true, text: v.name + '=' + v.value, style: 'normal' });
    }
    var keptX = RX + RW + 60;
    S.label('keptTitle', { x: keptX, y: RY - 18, text: T('yeni, bilinen ortam', 'new, known environment'), anchor: 'start', size: 14, bold: true });
    S.box('safePath', { x: keptX, y: RY, w: 260, h: RH, size: 12, mono: true, text: 'PATH=/usr/bin:/bin', style: 'new' });
    var keptCount = 1;

    S.step(T('`sanitize_file_descriptors()` önce çalışır (adım 2): 0-2 garanti edilir, ' + data.fdExtra + ' sızmış tanıtıcı kapatılır.',
              '`sanitize_file_descriptors()` runs first (step 2): 0-2 are guaranteed, ' + data.fdExtra + ' leaked descriptor(s) are closed.'),
           { c: [LINE.fd] });

    for (i = 0; i < n; i++) {
      var vv = data.envVars[i];
      S.set('e' + i, { style: 'active' });
      S.at(i);
      var keep = SAFE_KEEP.indexOf(vv.name) >= 0;
      var dangerous = KNOWN_DANGEROUS.indexOf(vv.name) >= 0;
      if (keep) {
        S.set('e' + i, { style: 'new' });
        var ny = RY + keptCount * (RH + GAP);
        S.box('kept' + i, { x: keptX, y: ny, w: 260, h: RH, size: 12, mono: true, text: vv.name + '=' + vv.value, style: 'new' });
        keptCount++;
        var cap1 = i < 3
          ? T('`' + vv.name + '` beyaz listede — değeri önce KOPYALANIR, sonra yeni ortama geri konur.',
              '`' + vv.name + '` is on the allowlist — its value is COPIED first, then put back into the new environment.')
          : T('`' + vv.name + '` de beyaz listede — korunur.', '`' + vv.name + '` is on the allowlist too — kept.');
        S.step(cap1, { c: [
          { n: LINE.envIf, note: T(vv.name + ' beyaz listede mi (TZ, LANG, HOME)? evet', vv.name + ' on the allow-list (TZ, LANG, HOME)? yes') },
          LINE.envKeep,
          { n: LINE.envDrop, skip: true }
        ] });
      } else {
        S.set('e' + i, { style: 'del' });
        var why = dangerous
          ? T('`' + vv.name + '` bilinen tehlikeli bir değişken — beyaz listede DEĞİL, atılır.',
              '`' + vv.name + '` is a known-dangerous variable — NOT on the allowlist, dropped.')
          : T('`' + vv.name + '` beyaz listede değil — tehlikeli olmasa bile atılır (kara liste değil, beyaz liste).',
              '`' + vv.name + '` is not on the allowlist — dropped even though it isn\'t dangerous (an allowlist, not a blocklist).');
        var cap2 = i < 3 ? why : T('`' + vv.name + '` atılır (beyaz listede değil).', '`' + vv.name + '` dropped (not on the allowlist).');
        S.step(cap2, { c: [
          { n: LINE.envIf, note: T(vv.name + ' beyaz listede mi (TZ, LANG, HOME)? hayır', vv.name + ' on the allow-list (TZ, LANG, HOME)? no') },
          { n: LINE.envKeep, skip: true },
          LINE.envDrop
        ] });
      }
    }
    S.at(null);
    S.step(T('`clearenv()` bütün eski ortamı geçersiz kılar; yalnızca yukarıda kopyalanan ' + keptCount + ' değişken `setenv()` ile geri konur.',
              '`clearenv()` invalidates the whole old environment; only the ' + keptCount + ' variables copied above are put back with `setenv()`.'),
           { c: [LINE.envClear] });

    S.set('safePath', { style: 'hl' });
    S.box('umaskBox', { x: keptX, y: RY + (keptCount + 1) * (RH + GAP), w: 260, h: RH, size: 12, mono: true,
      text: T('umask: ' + data.umaskIn + ' -> 077', 'umask: ' + data.umaskIn + ' -> 077'), style: 'new' });
    S.step(T('`umask(077)` çalışır (adım 3): devralınan `' + data.umaskIn + '` yerine yeni dosyalar yalnız sahibine açık.',
              '`umask(077)` runs (step 3): instead of the inherited `' + data.umaskIn + '`, new files open only to the owner.'),
           { c: [LINE.umask] });

    S.box('coreBox', { x: keptX, y: RY + (keptCount + 2) * (RH + GAP), w: 260, h: RH, size: 12, mono: true,
      text: data.coreDump ? T('çökme dökümü: açık -> kapalı', 'core dump: enabled -> disabled') : T('çökme dökümü: zaten kapalı', 'core dump: already disabled'), style: 'new' });
    S.step(T('`disable_core_dump()` çalışır (adım 4): ' + (data.coreDump ? 'devralınan açık döküm kapatılır.' : 'döküm zaten kapalıydı, öylece kalır.'),
              '`disable_core_dump()` runs (step 4): ' + (data.coreDump ? 'the inherited enabled dump is turned off.' : 'the dump was already disabled, it stays off.')),
           { c: [LINE.core] });

    S.box('privBox', { x: keptX, y: RY + (keptCount + 3) * (RH + GAP), w: 260, h: RH, size: 12, mono: true,
      text: T('yetki: ' + data.priv + ' -> user', 'privilege: ' + data.priv + ' -> user'), style: 'new' });
    S.step(T('`drop_privileges()` çalışır (adım 5): ' + (data.priv === 'root' ? 'kök yetkisi kalıcı olarak bırakılır ve DOĞRULANIR.' : 'zaten normal kullanıcı, yine de doğrulanır.'),
              '`drop_privileges()` runs (step 5): ' + (data.priv === 'root' ? 'root privilege is permanently dropped and VERIFIED.' : 'already a normal user, still verified.')),
           { c: [LINE.priv] });

    S.result = reference(data);
    S.step(T('Sonuç: ' + n + ' devralınan değişkenden yalnız ' + (keptCount) + " tanesi hayatta kaldı (+ zorla ayarlanan PATH); tanıtıcılar, umask, döküm ve yetki hepsi bilinen güvenli değerlerde.",
              'Result: of ' + n + ' inherited variables only ' + (keptCount) + ' survive (+ the forced PATH); descriptors, umask, dump and privilege are all at known-safe values.'),
           {});
  }

  D.define({
    id: 'env-sanitize-startup',
    title: T('Güvenli başlatma: ortamı, tanıtıcıları, yetkiyi temizle', 'Secure start-up: sanitise the environment, descriptors, privilege'),
    code: { c: REF_C },
    presets: [
      { id: 'workstation', level: 'normal', name: T('Normal: masaüstü uygulaması (12 değişken)', 'Normal: a desktop app (12 variables)'), data: NORMAL },
      { id: 'server', level: 'hard', name: T('Zor: sunucu süreci, çok sayıda tehlikeli değişken (14)', 'Hard: a server process, many dangerous variables (14)'), data: HARD },
      { id: 'edge-clean', level: 'edge', name: T('Uç durum: hiçbiri tehlikeli değil, yine de hepsi atılır', 'Edge case: none are dangerous, yet all are dropped'), data: EDGE_CLEAN },
      { id: 'edge-all-dangerous', level: 'edge', name: T('Uç durum: hepsi bilinen tehlikeli değişken', 'Edge case: every variable is a known-dangerous one'), data: EDGE_ALL_DANGEROUS }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.envVars.length; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 12, hard: 15, extreme: 18 };
      var n = counts[level] || 10;
      var pool = KNOWN_DANGEROUS.concat(SAFE_KEEP, ['EDITOR', 'SHELL', 'TERM', 'PWD', 'USER', 'LOGNAME', 'MAIL', 'DISPLAY']);
      var out = [];
      for (var i = 0; i < n; i++) out.push(ev(pool[D.randInt(r, 0, pool.length - 1)] + '_' + i, 'v' + i));
      var umasks = ['000', '002', '022', '077'];
      return mk(out, D.randInt(r, 0, 4), D.randInt(r, 0, 1) === 1, umasks[D.randInt(r, 0, 3)], D.randInt(r, 0, 1) === 1, D.randInt(r, 0, 1) === 1 ? 'root' : 'user');
    },
    input: {
      hint: T('AD=değer, AD=değer, …; fd=n; stdout=open|closed; umask=oktal; coredump=on|off; priv=root|user', 'NAME=value, NAME=value, …; fd=n; stdout=open|closed; umask=octal; coredump=on|off; priv=root|user'),
      format: function (data) {
        var envPart = data.envVars.map(function (v) { return v.name + '=' + v.value; }).join(', ');
        return envPart + '; fd=' + data.fdExtra + '; stdout=' + (data.stdoutClosed ? 'closed' : 'open') +
               '; umask=' + data.umaskIn + '; coredump=' + (data.coreDump ? 'on' : 'off') + '; priv=' + data.priv;
      },
      tokens: function (data) { return data.envVars.map(function (v) { return v.name + '=' + v.value; }); },
      parse: function (text) {
        var segs = String(text).split(';').map(function (s) { return s.trim(); }).filter(Boolean);
        if (segs.length !== 6) throw T('Biçim: "AD=değer, …; fd=n; stdout=…; umask=…; coredump=…; priv=…" olmalı.', 'Format must be "NAME=value, …; fd=n; stdout=…; umask=…; coredump=…; priv=…".');
        var envToks = segs[0].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!envToks.length) throw T('En az bir değişken girin.', 'Enter at least one variable.');
        var envVars = envToks.map(function (t) {
          var eq = t.indexOf('=');
          if (eq <= 0) throw T('"' + t + '" biçimi "AD=değer" olmalı.', '"' + t + '" must be "NAME=value".');
          var name = t.slice(0, eq).trim(), value = t.slice(eq + 1).trim();
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw T('"' + name + '" geçerli bir değişken adı değil.', '"' + name + '" is not a valid variable name.');
          return ev(name, value);
        });
        var fdM = segs[1].match(/^fd=(\d+)$/);
        if (!fdM) throw T('"' + segs[1] + '" biçimi "fd=n" olmalı.', '"' + segs[1] + '" must be "fd=n".');
        var stdoutM = segs[2].match(/^stdout=(open|closed)$/);
        if (!stdoutM) throw T('"' + segs[2] + '" "stdout=open" ya da "stdout=closed" olmalı.', '"' + segs[2] + '" must be "stdout=open" or "stdout=closed".');
        var umaskM = segs[3].match(/^umask=(\d{3})$/);
        if (!umaskM) throw T('"' + segs[3] + '" biçimi "umask=NNN" olmalı.', '"' + segs[3] + '" must be "umask=NNN".');
        var coreM = segs[4].match(/^coredump=(on|off)$/);
        if (!coreM) throw T('"' + segs[4] + '" "coredump=on" ya da "coredump=off" olmalı.', '"' + segs[4] + '" must be "coredump=on" or "coredump=off".');
        var privM = segs[5].match(/^priv=(root|user)$/);
        if (!privM) throw T('"' + segs[5] + '" "priv=root" ya da "priv=user" olmalı.', '"' + segs[5] + '" must be "priv=root" or "priv=user".');
        return mk(envVars, parseInt(fdM[1], 10), stdoutM[1] === 'closed', umaskM[1], coreM[1] === 'on', privM[1]);
      },
      bad: ['', 'PATH=x', 'PATH=x; fd=2', 'PATH=x; fd=2; stdout=maybe; umask=000; coredump=on; priv=root', '1BAD=x; fd=0; stdout=open; umask=000; coredump=off; priv=user']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
