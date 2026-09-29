// CEN429 — Week 1 — Demo 1 (code/week-01/01-path-spoofing/report.c, report_secure.c, demo.sh)
// system(COMMAND) hands a BARE command name ("date" on Linux, "hostname" on Windows) to a shell. The shell
// searches the directories listed in PATH, in order, and runs the FIRST program it finds with that name —
// it has no idea which one is "the real one". Whoever controls an earlier PATH directory controls what runs
// (CWE-426/CWE-427). The secure version launches an ABSOLUTE path directly, with no shell and no PATH search.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines
  var VULN_C = [
    '/*',
    ' * CEN429 — Week 1 — Demo 1: PATH spoofing (VULNERABLE VERSION)',
    ' *',
    ' * The program prints a report header and then calls a system command ("date" on',
    ' * Linux, "hostname" on Windows). The problem: the command name is given bare,',
    ' * not as an absolute path. system() runs it through a shell (Linux: /bin/sh,',
    ' * Windows: cmd.exe); the shell searches the folders listed in the PATH',
    ' * environment variable, one by one (on Windows it also checks the working',
    ' * folder first). Whoever controls PATH, or the working folder, controls which',
    ' * program actually runs. (CWE-426 untrusted search path, CWE-427 uncontrolled',
    ' * search path element)',
    ' */',
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include "cen429_demo.h"',
    '',
    '#ifdef _WIN32',
    '#define COMMAND "hostname"',
    '#define LABEL "Computer name: "',
    '#else',
    '#define COMMAND "date"',
    '#define LABEL "Report date: "',
    '#endif',
    '',
    'int main(void)',
    '{',
    '    demo_prepare();',
    '    printf("=== Monthly Sales Report ===\\n");',
    '    printf(LABEL);',
    '    fflush(stdout);',
    '',
    '    /* BUG: bare command name + inherited environment (PATH, IFS, LD_* ...) + shell */',
    '    int status = system(COMMAND);',
    '    if (status != 0) {',
    '        fprintf(stderr, "%s could not be run (status=%d)\\n", COMMAND, status);',
    '        return 1;',
    '    }',
    '    return 0;',
    '}'
  ];
  var SECURE_C = [
    '/*',
    ' * CEN429 — Week 1 — Demo 1: PATH spoofing (SECURE VERSION)',
    ' *',
    ' * Three fixes (same idea on both platforms):',
    ' *  1) The program is launched with an ABSOLUTE PATH — no PATH search, no',
    ' *     working-folder search.',
    ' *     Linux: /bin/date     Windows: <system folder>\\hostname.exe (GetSystemDirectoryW)',
    ' *  2) NO SHELL IS USED (no system()) — posix_spawn on Linux, CreateProcessW on Windows.',
    ' *  3) The child process is given a SMALL, KNOWN environment instead of the',
    ' *     inherited one (Cookbook recipe 1.1, "cleaning up the environment").',
    ' */',
    '#include <stdio.h>',
    '#include "cen429_demo.h"',
    '',
    '#ifdef _WIN32',
    '#include <windows.h>',
    '#include <wchar.h>',
    '',
    'int main(void)',
    '{ /* ... GetSystemDirectoryW + CreateProcessW; see the Linux branch below for the idea ... */ }',
    '',
    '#else',
    '#include <spawn.h>',
    '#include <sys/wait.h>',
    '',
    'int main(void)',
    '{',
    '    demo_prepare();',
    '    printf("=== Monthly Sales Report ===\\n");',
    '    printf("Report date: ");',
    '    fflush(stdout);',
    '',
    '    char *const args[] = { "date", NULL };',
    '    char *const clean_env[] = { "PATH=/usr/bin:/bin", "LANG=C", NULL };',
    '',
    '    pid_t pid;',
    '    int err = posix_spawn(&pid, "/bin/date", NULL, NULL, args, clean_env);',
    '    if (err != 0) {',
    '        fprintf(stderr, "date could not be started (error=%d)\\n", err);',
    '        return 1;',
    '    }',
    '    int status;',
    '    if (waitpid(pid, &status, 0) < 0 || !WIFEXITED(status) || WEXITSTATUS(status) != 0) {',
    '        fprintf(stderr, "date failed\\n");',
    '        return 1;',
    '    }',
    '    return 0;',
    '}',
    '#endif'
  ];
  var DEMO_SH = [
    '#!/bin/sh',
    '# CEN429 — Week 1 — Demo 1: PATH spoofing (Linux / WSL)',
    '# Build first: ../../build.sh     Then: ./demo.sh',
    '# Only works inside this folder; does not touch system settings.',
    'cd "$(dirname "$0")"',
    'B=bin/linux',
    '[ -x "$B/report" ] || { echo "Build first: ../../build.sh"; exit 1; }',
    'chmod +x fake/date',
    'line() { echo "--------------------------------------------------------------"; }',
    '',
    'line; echo "STEP 1 - Normal run: the program finds the real date"',
    'echo "\\$ ./$B/report"',
    '"./$B/report"',
    '',
    'line; echo "STEP 2 - Attack: the fake/ folder is added to the front of PATH"',
    'echo "\\$ PATH=\\"\\$PWD/fake:\\$PATH\\" ./$B/report"',
    'PATH="$PWD/fake:$PATH" "./$B/report"',
    '',
    'line; echo "STEP 3 - The fixed version under the same attack"',
    'echo "\\$ PATH=\\"\\$PWD/fake:\\$PATH\\" ./$B/report_secure"',
    'PATH="$PWD/fake:$PATH" "./$B/report_secure"',
    '',
    'line; echo "Result: the secure version uses an absolute path + shell-less launch + a clean environment."'
  ];

  // ------------------------------------------------------------------ data
  function mk(secure, command, dirs, realAt, fakeAt, absPath) {
    return { secure: !!secure, command: command, dirs: dirs, realAt: realAt, fakeAt: fakeAt, absPath: absPath };
  }

  var POOL = ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin', '/sbin', '/bin', '/usr/games',
              '/usr/local/games', '/opt/bin', '/opt/tools', '/snap/bin', '~/.local/bin', '/usr/lib/ccache',
              '/var/lib/bin', '/srv/ci/bin', '/usr/lib/jvm/bin'];
  var TRAPS = ['/tmp/.evil', '/tmp/build', '~/.cache/bin', '/var/tmp/x', '/home/guest/bin', '/mnt/usb/bin',
               '~/Downloads', '/tmp/.hidden'];

  function pick(r, pool, n) {
    var copy = pool.slice(), out = [];
    for (var i = 0; i < n && copy.length; i++) out.push(copy.splice(D.randInt(r, 0, copy.length - 1), 1)[0]);
    return out;
  }

  /** Independent computation (does NOT call build()'s left-to-right scan): the winner is whichever of
   * realAt/fakeAt has the SMALLER index — found with Math.min, not a loop. */
  function reference(data) {
    if (data.secure) return { found: true, winner: 'absolute', dir: null, index: -1 };
    var cand = [];
    if (data.realAt >= 0) cand.push(data.realAt);
    if (data.fakeAt >= 0) cand.push(data.fakeAt);
    if (!cand.length) return { found: false, winner: null, dir: null, index: -1 };
    var idx = Math.min.apply(null, cand);
    return { found: true, winner: idx === data.fakeAt ? 'fake' : 'real', dir: data.dirs[idx], index: idx };
  }

  function shLine(data) { return data.secure ? 21 : (data.fakeAt >= 0 ? 17 : 13); }

  function buildSecure(S, data) {
    S.box('abs', { x: 0, y: 0, w: 260, h: 36, size: 14, mono: true, text: data.absPath, style: 'new' });
    S.label('absLbl', { x: 130, y: -16,
      text: T('mutlak yolla doğrudan çalıştırılıyor — PATH araması YOK', 'launched directly by absolute path — NO PATH search'),
      anchor: 'middle', size: 13, bold: true });
    S.at(0);
    S.step(T('Güvenli sürüm `' + data.absPath + '` dosyasını doğrudan çalıştırır: `PATH` hiç okunmaz, kabuk devreye girmez.',
              'The secure version launches `' + data.absPath + '` directly: PATH is never read, no shell is involved.'),
           { c: [37], sh: [shLine(data)] });
    S.region('env', { x: 0, y: 70, w: 260, h: 74, style: 'dim', title: T('küçük, bilinen ortam', 'small, known environment') });
    S.label('e1', { x: 16, y: 102, text: 'PATH=/usr/bin:/bin', anchor: 'start', size: 13, mono: true });
    S.label('e2', { x: 16, y: 124, text: 'LANG=C', anchor: 'start', size: 13, mono: true });
    S.at(null);
    S.result = reference(data);
    S.step(T('Ayrıca miras alınan ortam yerine küçük, bilinen bir ortamla çalıştırılır — saldırgan `PATH` ya da `LD_*` gibi değişkenleri önceden ayarlamış olsa bile işe yaramaz.',
              'It also runs with a small, known environment instead of the inherited one — even if an attacker had pre-set PATH or LD_* variables, it would not matter.'),
           { c: [33, 34] });
  }

  function build(S, data) {
    if (data.secure) { buildSecure(S, data); return; }
    var W = 220, H = 30, GAP = 6, n = data.dirs.length;
    S.label('title', { x: W / 2, y: -20,
      text: T('Kabuk `PATH` içinde `' + data.command + '`\'i sırayla arıyor:', 'The shell searches PATH for `' + data.command + '` in order:'),
      anchor: 'middle', bold: true, size: 15 });
    for (var i = 0; i < n; i++) S.box('d' + i, { x: 0, y: i * (H + GAP), w: W, h: H, size: 13, mono: true, text: data.dirs[i], style: 'normal' });
    S.pointer('cursor', { target: 'd0', side: 'left', text: T('sırada', 'checking') });
    S.step(T('`system("' + data.command + '")` bir kabuk başlatır; kabuk, `PATH` değişkenindeki ' + n + ' dizini yukarıdan aşağı sırayla dener.',
              '`system("' + data.command + '")` starts a shell; the shell tries the ' + n + ' PATH directories in order, top to bottom.'),
           { c: [33], sh: [shLine(data)] });
    var winner = -1;
    for (i = 0; i < n; i++) {
      S.set('cursor', { target: 'd' + i });
      S.at(i);
      if (i === data.fakeAt) {
        S.set('d' + i, { style: 'del' });
        S.label('lb' + i, { x: W + 16, y: i * (H + GAP) + H / 2 + 5,
          text: T('SAHTE `' + data.command + '` burada — DUR!', 'FAKE `' + data.command + '` here — STOP!'), anchor: 'start', size: 13, bold: true });
        S.step(T('`' + data.dirs[i] + '` içinde bir `' + data.command + '` var — ama bu saldırganın SAHTE programı. Kabuk burada durur ve BUNU çalıştırır.',
                  'There is a `' + data.command + '` in `' + data.dirs[i] + '` — but it is the ATTACKER\'s fake program. The shell stops here and runs THIS one.'),
               { c: [33], sh: [shLine(data)] });
        winner = i;
        break;
      } else if (i === data.realAt) {
        S.set('d' + i, { style: 'new' });
        S.label('lb' + i, { x: W + 16, y: i * (H + GAP) + H / 2 + 5,
          text: T('gerçek `' + data.command + '` burada — çalıştırılıyor', 'the real `' + data.command + '` here — runs'), anchor: 'start', size: 13 });
        S.step(T('`' + data.dirs[i] + '` içinde gerçek `' + data.command + '` bulundu. Kabuk burada durur ve onu çalıştırır.',
                  'The real `' + data.command + '` was found in `' + data.dirs[i] + '`. The shell stops here and runs it.'),
               { c: [33], sh: [shLine(data)] });
        winner = i;
        break;
      } else {
        S.set('d' + i, { style: 'dim' });
        S.label('lb' + i, { x: W + 16, y: i * (H + GAP) + H / 2 + 5, text: T('burada yok', 'not here'), anchor: 'start', size: 12 });
        S.step(T('`' + data.dirs[i] + '` içine bakılıyor: `' + data.command + '` yok, devam.',
                  'Checking `' + data.dirs[i] + '`: no `' + data.command + '` here, keep going.'),
               { c: [33], sh: [shLine(data)] });
      }
    }
    S.remove('cursor');
    S.at(null);
    S.result = reference(data);
    if (winner >= 0 && winner < n - 1) {
      for (var j = winner + 1; j < n; j++) S.set('d' + j, { style: 'empty' });
      S.step(T('Kalan ' + (n - 1 - winner) + ' dizin hiç kontrol edilmedi — kabuk zaten çalıştıracağı programı bulmuştu.',
                'The remaining ' + (n - 1 - winner) + ' director' + (n - 1 - winner === 1 ? 'y was' : 'ies were') + ' never checked — the shell had already found something to run.'),
             {});
    } else if (winner < 0) {
      S.step(T('Hiçbir dizinde `' + data.command + '` bulunamadı; kabuk "command not found" der.',
                'No directory had a `' + data.command + '`; the shell reports "command not found".'),
             { c: [34, 35] });
    }
  }

  D.define({
    id: 'path-lookup',
    title: T('PATH araması ve sahte komut (report.c)', 'PATH lookup and the fake command (report.c)'),
    code: function (data) { return { c: data && data.secure ? SECURE_C : VULN_C, sh: DEMO_SH }; },
    presets: [
      { id: 'normal-clean', level: 'normal',
        name: T('Normal: saldırı yok, gerçek `date` bulunuyor', 'Normal: no attack, the real `date` is found'),
        data: mk(false, 'date', ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin', '/sbin', '/bin',
                                  '/usr/games', '/opt/tools', '/snap/bin', '~/.local/bin'], 3, -1, null) },
      { id: 'hard-prepend', level: 'hard',
        name: T('Zor: sahte dizin PATH\'in BAŞINA eklendi', 'Hard: the fake directory is prepended to PATH'),
        data: mk(false, 'date', ['/tmp/.evil', '/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin',
                                  '/sbin', '/bin', '/usr/games', '/opt/tools', '/snap/bin', '~/.local/bin'], 4, 0, null) },
      { id: 'edge-mid-attack', level: 'edge',
        name: T('Uç durum: sahte dizin ortada, yine de kazanıyor', 'Edge case: the fake directory is in the middle, still wins'),
        data: mk(false, 'date', ['/usr/local/sbin', '~/.cache/bin', '/usr/local/bin', '/usr/sbin', '/usr/bin',
                                  '/sbin', '/bin', '/usr/games', '/opt/tools', '/snap/bin', '~/.local/bin'], 4, 1, null) },
      { id: 'edge-secure-fix', level: 'edge', small: true,
        name: T('Uç durum: güvenli sürüm — mutlak yol, arama yok', 'Edge case: the secure version — absolute path, no search'),
        data: mk(true, 'date', [], -1, -1, '/bin/date') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.secure ? 0 : data.dirs.length; },
    random: function (level, r) {
      var n = level === 'easy' ? 10 : (level === 'normal' || level === 'hard') ? D.randInt(r, 10, 12) : D.randInt(r, 11, 14);
      var dirs = pick(r, POOL, Math.min(n, POOL.length));
      var realAt = D.randInt(r, 0, dirs.length - 1), fakeAt = -1;
      if (level === 'hard') {
        dirs.splice(0, 0, pick(r, TRAPS, 1)[0]);
        fakeAt = 0;
        realAt += 1;
      } else if (level === 'extreme') {
        var pos = D.randInt(r, 0, realAt);
        dirs.splice(pos, 0, pick(r, TRAPS, 1)[0]);
        fakeAt = pos;
        realAt += 1;
      }
      return mk(false, 'date', dirs, realAt, fakeAt, null);
    },
    input: {
      hint: T('dizin1, dizin2:fake, dizin3:real, … (ya da: ABSOLUTE date /bin/date)', 'dir1, dir2:fake, dir3:real, … (or: ABSOLUTE date /bin/date)'),
      format: function (data) {
        if (data.secure) return 'ABSOLUTE ' + data.command + ' ' + data.absPath;
        return data.dirs.map(function (d, i) { return d + (i === data.fakeAt ? ':fake' : i === data.realAt ? ':real' : ''); }).join(', ');
      },
      tokens: function (data) { return data.secure ? [data.absPath] : data.dirs.slice(); },
      parse: function (text) {
        var s = String(text).trim();
        if (/^ABSOLUTE\b/i.test(s)) {
          var parts = s.split(/\s+/);
          if (parts.length !== 3) throw T('"ABSOLUTE <komut> <mutlak-yol>" biçiminde olmalı.', 'Must be "ABSOLUTE <command> <absolute-path>".');
          if (parts[2].charAt(0) !== '/') throw T('Yol mutlak olmalı (/ ile başlamalı).', 'The path must be absolute (start with /).');
          return mk(true, parts[1], [], -1, -1, parts[2]);
        }
        var toks = s.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir dizin girin.', 'Enter at least one directory.');
        var dirs = [], realAt = -1, fakeAt = -1, bad = null;
        toks.forEach(function (t, i) {
          var m = t.match(/^(.*?)(:real|:fake)?$/);
          var name = (m[1] || '').trim(), tag = m[2];
          if (!name || !/^[\w./~-]+$/.test(name)) bad = bad || t;
          dirs.push(name);
          if (tag === ':real') { if (realAt !== -1) bad = bad || t; realAt = i; }
          if (tag === ':fake') { if (fakeAt !== -1) bad = bad || t; fakeAt = i; }
        });
        if (bad !== null) throw T('"' + bad + '" geçersiz bir dizin adı ya da yinelenen bir işaret.', '"' + bad + '" is not a valid directory name or a duplicate marker.');
        if (realAt === -1) throw T('Tam olarak bir dizin ":real" ile işaretlenmeli (gerçek komutun bulunduğu yer).', 'Exactly one directory must be marked ":real" (where the real command lives).');
        return mk(false, 'date', dirs, realAt, fakeAt, null);
      },
      bad: ['', 'no marker at all, /bin', '/usr/bin:real, /tmp:real', 'bad;char:real', 'ABSOLUTE date relative/path']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
