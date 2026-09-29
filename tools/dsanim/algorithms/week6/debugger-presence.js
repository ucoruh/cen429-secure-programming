// CEN429 — Week 6 — Demo 2 (code/week-06/02-debugger-detection/antidebug.c)
// Two independent, read-only signals: (1) scan /proc/self/status line by line for "TracerPid:" — a nonzero
// value means something is ptrace-ing this process; (2) is the parent process's NAME a known debugger/tracer?
// Neither signal alone is proof (both are easy to spoof); the program just counts how many fired.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static long parse_tracer_pid(const char *status_text)',
    '{',
    '    const char *line = status_text;',
    '    while (line && *line) {',
    '        if (strncmp(line, "TracerPid:", 10) == 0)',
    '            return strtol(line + 10, NULL, 10);',
    '        const char *next = strchr(line, \'\\n\');',
    '        line = next ? next + 1 : NULL;',
    '    }',
    '    return -1;',
    '}',
    '',
    'static int parent_name_is_suspicious(const char *name)',
    '{',
    '    return strstr(name, "gdb") || strstr(name, "lldb") || strstr(name, "strace") ||',
    '           strstr(name, "ltrace") || strstr(name, "valgrind");',
    '}'
  ];

  var BAD_NAMES = ['gdb', 'lldb', 'strace', 'ltrace', 'valgrind'];
  function isSuspiciousName(name) {
    for (var i = 0; i < BAD_NAMES.length; i++) if (name.indexOf(BAD_NAMES[i]) >= 0) return true;
    return false;
  }
  /** Deterministically rebuilds the fabricated /proc/self/status-like lines from (before, tracerPid): `before`
   * generic filler lines, then exactly one "TracerPid:" line, then two more filler lines. */
  function mkLines(before, tracerPid) {
    var lines = [];
    var names = ['Name', 'State', 'Tgid', 'Pid', 'PPid', 'Umask', 'Ngid', 'NStgid', 'NSpid'];
    for (var i = 0; i < before; i++) lines.push((names[i % names.length]) + i + ':\tv' + i);
    lines.push('TracerPid:\t' + tracerPid);
    lines.push('Uid:\t1000\t1000\t1000\t1000');
    lines.push('Gid:\t1000\t1000\t1000\t1000');
    return lines;
  }

  function mk(before, tracerPid, parentName) { return { before: before, tracerPid: tracerPid, parentName: parentName }; }

  function reference(data) {
    var sig1 = data.tracerPid > 0;
    var sig2 = BAD_NAMES.some(function (w) { return data.parentName.indexOf(w) !== -1; });
    var count = (sig1 ? 1 : 0) + (sig2 ? 1 : 0);
    return { tracerSignal: sig1, nameSignal: sig2, suspicious: count, detected: count > 0 };
  }

  function build(S, data) {
    var lines = mkLines(data.before, data.tracerPid), n = lines.length;
    var LW = 220, LH = 26, GAP = 2;
    S.label('title', { x: LW / 2, y: -18, text: T('/proc/self/status satır satır taranıyor:', '/proc/self/status is scanned line by line:'), anchor: 'middle', bold: true, size: 15 });
    var tracerIndex = data.before;
    for (var i = 0; i < n; i++) {
      S.box('l' + i, { x: 0, y: i * (LH + GAP), w: LW, h: LH, size: 12, mono: true, text: lines[i], style: 'normal', above: String(i) });
    }
    S.pointer('cursor', { target: 'l0', side: 'left', text: T('taranıyor', 'scanning') });
    for (i = 0; i < n; i++) {
      S.set('cursor', { target: 'l' + i });
      if (i === tracerIndex) {
        S.set('l' + i, { style: 'hl' });
        S.step(T('"' + lines[i] + '" -> TracerPid bulundu, tarama burada durur.', '"' + lines[i] + '" -> TracerPid found, the scan stops here.'),
               { c: [{ n: 4, note: T('line && *line? evet', 'line && *line? yes') },
                      { n: 5, note: T('strncmp(line, "TracerPid:", 10) == 0? evet', 'strncmp(line, "TracerPid:", 10) == 0? yes') }, 6] });
        break;
      } else {
        S.set('l' + i, { style: 'dim' });
        if (i < 3) S.step(T('"' + lines[i] + '" -> TracerPid değil, devam.', '"' + lines[i] + '" -> not TracerPid, keep going.'),
                           { c: [{ n: 4, note: T('line && *line? evet', 'line && *line? yes') },
                                  { n: 5, note: T('strncmp(line, "TracerPid:", 10) == 0? hayır', 'strncmp(line, "TracerPid:", 10) == 0? no') }, 7,
                                  { n: 8, note: T('next != NULL? evet -> sıradaki satır', 'next != NULL? yes -> next line') }] });
      }
    }
    S.remove('cursor');
    for (i = tracerIndex + 1; i < n; i++) S.set('l' + i, { style: 'empty' });

    var sig1 = data.tracerPid > 0;
    S.label('sig1', { x: LW + 20, y: tracerIndex * (LH + GAP) + LH / 2 + 4,
      text: T('TracerPid=' + data.tracerPid + (sig1 ? ' -> İZLENİYOR (şüpheli)' : ' -> izleyen yok (temiz)'),
              'TracerPid=' + data.tracerPid + (sig1 ? ' -> TRACED (suspicious)' : ' -> no tracer (clean)')),
      anchor: 'start', size: 13, bold: sig1 });
    S.at(0);
    S.step(T('Sinyal 1: TracerPid = ' + data.tracerPid + ' -> ' + (sig1 ? 'şüpheli' : 'temiz') + '.',
              'Signal 1: TracerPid = ' + data.tracerPid + ' -> ' + (sig1 ? 'suspicious' : 'clean') + '.'), {});

    // ---- parent process name ----
    var PY = n * (LH + GAP) + 60;
    S.label('parentLbl', { x: -14, y: PY + 20, text: T('ana süreç adı =', 'parent process name ='), anchor: 'end', size: 14, mono: true });
    S.box('parent', { x: 0, y: PY, w: 180, h: 32, size: 15, text: data.parentName, style: 'active' });
    var sig2 = isSuspiciousName(data.parentName);
    var matched = null;
    for (i = 0; i < BAD_NAMES.length; i++) if (data.parentName.indexOf(BAD_NAMES[i]) >= 0) { matched = BAD_NAMES[i]; break; }
    S.at(1);
    S.step(T('Sinyal 2: ana süreç adı `' + data.parentName + '` bilinen hata ayıklayıcı sözcük listesiyle karşılaştırılıyor.',
              'Signal 2: the parent process name `' + data.parentName + '` is checked against a list of known debugger words.'), { c: [12, 14, 15] });
    S.set('parent', { style: sig2 ? 'del' : 'new' });
    if (sig2) {
      S.label('parentMatch', { x: 200, y: PY + 20, text: T('eşleşti: "' + matched + '" -> ŞÜPHELİ', 'matched: "' + matched + '" -> SUSPICIOUS'), anchor: 'start', size: 13, bold: true });
      S.step(T('"' + data.parentName + '" içinde "' + matched + '" geçiyor -> Sinyal 2 ŞÜPHELİ.', 'The name "' + data.parentName + '" contains "' + matched + '" -> Signal 2 is SUSPICIOUS.'), { c: [14, 15] });
    } else {
      S.label('parentMatch', { x: 200, y: PY + 20, text: T('bilinen sözcük yok -> temiz', 'no known word -> clean'), anchor: 'start', size: 13 });
      S.step(T('"' + data.parentName + '" bilinen hiçbir hata ayıklayıcı sözcüğünü içermiyor -> Sinyal 2 temiz.', 'The name "' + data.parentName + '" contains none of the known debugger words -> Signal 2 is clean.'), { c: [14, 15] });
    }

    var count = (sig1 ? 1 : 0) + (sig2 ? 1 : 0);
    S.result = { tracerSignal: sig1, nameSignal: sig2, suspicious: count, detected: count > 0 };
    S.at(null);
    if (count > 0) {
      S.step(T('SONUÇ: hata ayıklayıcı/izleme ARACI algılandı (' + count + ' sinyal).', 'RESULT: a debugger/tracing TOOL was detected (' + count + ' signal(s)).'), {});
    } else {
      S.step(T('SONUÇ: temiz - izleyen bir araç görünmüyor.', 'RESULT: clean - no tracing tool visible.'), {});
    }
  }

  D.define({
    id: 'debugger-presence',
    title: T('Hata ayıklayıcı algılama: TracerPid + ana süreç adı (antidebug.c)', 'Debugger detection: TracerPid + parent process name (antidebug.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'clean', level: 'normal', name: T('Normal: izleyen yok, temiz ana süreç', 'Normal: no tracer, a clean parent'),
        data: mk(6, 0, 'bash') },
      { id: 'gdb-attached', level: 'hard', name: T('Zor: gdb altında, iki sinyal de şüpheli', 'Hard: under gdb, both signals suspicious'),
        data: mk(8, 7780, 'gdb') },
      { id: 'edge-conflicting', level: 'edge', name: T('Uç durum: TracerPid temiz ama ana süreç "strace" içeriyor', 'Edge case: TracerPid clean but the parent contains "strace"'),
        data: mk(7, 0, 'strace-wrapper') },
      { id: 'edge-first-line', level: 'edge', name: T('Uç durum: TracerPid ilk satırda (before=0)', 'Edge case: TracerPid is the very first line (before=0)'),
        data: mk(0, 555, 'lldb') }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return mkLines(data.before, data.tracerPid).length; },
    minSize: 3,
    random: function (level, r) {
      var ranges = { easy: [4, 5], normal: [4, 6], hard: [6, 8], extreme: [8, 10] };
      var rg = ranges[level] || ranges.normal;
      var before = D.randInt(r, rg[0], rg[1]);
      var traced = D.randInt(r, 0, 1) === 1;
      var tracerPid = traced ? D.randInt(r, 100, 9999) : 0;
      var names = ['bash', 'systemd', 'zsh', 'tmux', 'sshd', 'gdb', 'lldb', 'strace', 'ltrace', 'valgrind', 'code', 'python3'];
      var parentName = names[D.randInt(r, 0, names.length - 1)];
      return mk(before, tracerPid, parentName);
    },
    input: {
      hint: T('before=<satır> TracerPid=<n> name=<ana süreç>', 'before=<lines> TracerPid=<n> name=<parent>'),
      format: function (data) { return 'before=' + data.before + ' TracerPid=' + data.tracerPid + ' name=' + data.parentName; },
      tokens: function (data) { return [String(data.tracerPid), data.parentName]; },
      parse: function (text) {
        var s = String(text).trim();
        var m = s.match(/^before=(\d+)\s+TracerPid=(\d+)\s+name=(\S+)$/i);
        if (!m) throw T('Biçim: "before=<n> TracerPid=<n> name=<ad>" olmalı.', 'Format must be "before=<n> TracerPid=<n> name=<name>".');
        var before = parseInt(m[1], 10);
        var tracerPid = parseInt(m[2], 10);
        var parentName = m[3];
        if (!/^[A-Za-z0-9_.-]+$/.test(parentName)) throw T('Ad yalnızca harf, rakam, . _ - içerebilir.', 'The name may only contain letters, digits, . _ -.');
        return mk(before, tracerPid, parentName);
      },
      bad: ['', 'before=abc TracerPid=5 name=bash', 'TracerPid=5 name=bash', 'before=3 TracerPid=5 name=has space', 'before=3 TracerPid=5']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
