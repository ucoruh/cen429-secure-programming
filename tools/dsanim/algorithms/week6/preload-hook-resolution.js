// CEN429 — Week 6 — Demo 4 (code/week-06/04-preload-hook/preload_hook.c)
// dlsym(RTLD_DEFAULT, name) walks the dynamic loader's symbol search order — the objects the process has
// loaded, in the order they were loaded — and returns the address from the FIRST one that defines the
// symbol. LD_PRELOAD loads its library before everything else (even before the main executable's own
// dependencies), so if it defines the same symbol, IT wins the search and every caller gets the attacker's
// version. dladdr() on the winning address reveals which .so it actually came from.
(function (D) {
  'use strict';
  var T = D.T;

  var C = [
    'static int is_legitimate(const char *path)',
    '{',
    '    if (!path) return 1;',
    '    return strstr(path, "libc.so") != NULL || strstr(path, "/libc-") != NULL ||',
    '           strstr(path, "linux-vdso") != NULL || strstr(path, "linux-gate") != NULL ||',
    '           strstr(path, "ld-linux") != NULL || strstr(path, "/ld-") != NULL;',
    '}',
    '',
    'static int check_symbol(const char *name)',
    '{',
    '    void *p = dlsym(RTLD_DEFAULT, name);',
    '    Dl_info info;',
    '    dladdr(p, &info);',
    '    int hook = !is_legitimate(info.dli_fname);',
    '    printf("   %-8s -> %s %s\\n", name, info.dli_fname, hook ? "(HOOK!)" : "");',
    '    return hook;',
    '}'
  ];

  function isLegitimate(path) {
    return path.indexOf('libc.so') >= 0 || path.indexOf('/libc-') >= 0 ||
           path.indexOf('linux-vdso') >= 0 || path.indexOf('linux-gate') >= 0 ||
           path.indexOf('ld-linux') >= 0 || path.indexOf('/ld-') >= 0;
  }

  /** objects: load order, each { path }. hookAt: index of the attacker's LD_PRELOAD-ed .so, or -1 (not
   * loaded). libcAt: index of the real libc providing the symbol normally. symbol: which function name. */
  function mk(symbol, objects, hookAt, libcAt) {
    return { symbol: symbol, objects: objects.slice(), hookAt: hookAt, libcAt: libcAt };
  }

  /** Independent computation: the winner is whichever of hookAt/libcAt has the smaller index, found with
   * Math.min (not the left-to-right scan build() performs). */
  function reference(data) {
    var cand = [];
    if (data.hookAt >= 0) cand.push(data.hookAt);
    if (data.libcAt >= 0) cand.push(data.libcAt);
    if (!cand.length) return { found: false, hook: false, winnerPath: null };
    var idx = Math.min.apply(null, cand);
    var path = data.objects[idx].path;
    return { found: true, hook: !isLegitimate(path), winnerPath: path };
  }

  function build(S, data) {
    var W = 260, H = 30, GAP = 6, n = data.objects.length;
    S.label('title', { x: W / 2, y: -20,
      text: T('`dlsym(RTLD_DEFAULT, "' + data.symbol + '")` yüklenmiş nesneleri sırayla dener:', '`dlsym(RTLD_DEFAULT, "' + data.symbol + '")` tries loaded objects in order:'),
      anchor: 'middle', bold: true, size: 14 });
    for (var i = 0; i < n; i++) S.box('o' + i, { x: 0, y: i * (H + GAP), w: W, h: H, size: 12, mono: true, text: data.objects[i].path, style: 'normal' });
    S.pointer('cursor', { target: 'o0', side: 'left', text: T('deneniyor', 'trying') });
    S.step(T('Dinamik yükleyici, `' + data.symbol + '` sembolünü tanımlayan İLK nesneyi arar; ' + n + ' nesne yükleme sırasıyla denenir.',
              'The dynamic loader looks for the FIRST loaded object that defines `' + data.symbol + '`; ' + n + ' objects are tried in load order.'), { c: [10, 11] });
    var winner = -1;
    for (i = 0; i < n; i++) {
      S.set('cursor', { target: 'o' + i });
      S.at(i);
      if (i === data.hookAt) {
        S.set('o' + i, { style: 'del' });
        S.label('lb' + i, { x: W + 16, y: i * (H + GAP) + H / 2 + 5, text: T('LD_PRELOAD ile önyüklendi — burada tanımlı!', 'preloaded via LD_PRELOAD — defined here!'), anchor: 'start', size: 12, bold: true });
        S.step(T('`' + data.objects[i].path + '`, `' + data.symbol + '`\'i tanımlıyor — LD_PRELOAD kancası önce yüklendiği için ONU kazanıyor.',
                  '`' + data.objects[i].path + '` defines `' + data.symbol + '` — the LD_PRELOAD hook was loaded first, so IT wins.'), { c: [10, 11] });
        winner = i; break;
      } else if (i === data.libcAt) {
        S.set('o' + i, { style: 'new' });
        S.label('lb' + i, { x: W + 16, y: i * (H + GAP) + H / 2 + 5, text: T('gerçek libc — burada tanımlı', 'the real libc — defined here'), anchor: 'start', size: 12 });
        S.step(T('`' + data.objects[i].path + '`, `' + data.symbol + '`\'i tanımlıyor. Bu nesne kazanıyor.',
                  '`' + data.objects[i].path + '` defines `' + data.symbol + '`. This object wins.'), { c: [10, 11] });
        winner = i; break;
      } else {
        S.set('o' + i, { style: 'dim' });
        S.label('lb' + i, { x: W + 16, y: i * (H + GAP) + H / 2 + 5, text: T('tanımlamıyor', 'does not define it'), anchor: 'start', size: 11 });
        S.step(T('`' + data.objects[i].path + '` — `' + data.symbol + '` burada tanımlı değil, devam.', '`' + data.objects[i].path + '` — `' + data.symbol + '` is not defined here, keep going.'), { c: [10, 11] });
      }
    }
    S.remove('cursor');
    S.at(null);
    if (winner >= 0 && winner < n - 1) for (var j = winner + 1; j < n; j++) S.set('o' + j, { style: 'empty' });

    var hook = winner >= 0 && !isLegitimate(data.objects[winner].path);
    S.result = winner < 0 ? { found: false, hook: false, winnerPath: null } : { found: true, hook: hook, winnerPath: data.objects[winner].path };
    S.label('dladdr', { x: W / 2, y: n * (H + GAP) + 30,
      text: winner < 0 ? T('sembol bulunamadı', 'symbol not found')
                        : T('dladdr -> ' + data.objects[winner].path + (hook ? '  (HOOK!)' : ''), 'dladdr -> ' + data.objects[winner].path + (hook ? '  (HOOK!)' : '')),
      anchor: 'middle', size: 14, bold: true });
    if (hook) {
      S.step(T('SONUÇ: `dladdr` kaynağın libc DEĞİL, önyüklü bir kanca olduğunu gösteriyor -> KANCA ALGILANDI.',
                'RESULT: `dladdr` shows the source is NOT libc, but a preloaded hook -> HOOK DETECTED.'),
             { c: [13, 14, { n: 15, note: T('hook? evet -> "(HOOK!)" yazdırılır', 'hook? yes -> "(HOOK!)" is printed') }] });
    } else if (winner >= 0) {
      S.step(T('SONUÇ: `dladdr` kaynağın meşru (libc/vDSO/yükleyici) olduğunu doğruluyor -> temiz.',
                'RESULT: `dladdr` confirms the source is legitimate (libc/vDSO/loader) -> clean.'),
             { c: [13, 14, { n: 15, note: T('hook? hayır -> boş dize yazdırılır', 'hook? no -> an empty string is printed') }] });
    } else {
      S.step(T('SONUÇ: hiçbir yüklü nesne `' + data.symbol + '`\'i tanımlamıyor.', 'RESULT: no loaded object defines `' + data.symbol + '`.'), {});
    }
  }

  var LIBC_POOL = ['linux-vdso.so.1', 'ld-linux-x86-64.so.2', '/lib/x86_64-linux-gnu/libc.so.6',
    '/lib/x86_64-linux-gnu/libm.so.6', '/lib/x86_64-linux-gnu/libpthread.so.0', '/lib/x86_64-linux-gnu/libdl.so.2',
    '/usr/lib/x86_64-linux-gnu/libssl.so.3', '/usr/lib/x86_64-linux-gnu/libcrypto.so.3', '/lib/x86_64-linux-gnu/librt.so.1',
    '/usr/lib/x86_64-linux-gnu/libz.so.1', '/lib/x86_64-linux-gnu/libresolv.so.2', '/usr/lib/x86_64-linux-gnu/libgcc_s.so.1',
    '/usr/lib/x86_64-linux-gnu/libstdc++.so.6'];
  function pick(r, pool, n) {
    var copy = pool.slice(), out = [];
    for (var i = 0; i < n && copy.length; i++) out.push(copy.splice(D.randInt(r, 0, copy.length - 1), 1)[0]);
    return out;
  }
  function libcIndexIn(paths) {
    for (var i = 0; i < paths.length; i++) if (paths[i].indexOf('libc.so') >= 0) return i;
    return -1;
  }
  /** Builds a preset's data from a plain array of path STRINGS (simpler to read/write than juggling
   * {path} objects by hand): wraps each path and computes libcAt automatically. */
  function mkFromPaths(symbol, paths, hookAt) {
    return mk(symbol, paths.map(function (p) { return { path: p }; }), hookAt, libcIndexIn(paths));
  }

  D.define({
    id: 'preload-hook-resolution',
    title: T('LD_PRELOAD sembol çözümleme sırası: kanca kazanır (preload_hook.c)', 'LD_PRELOAD symbol resolution order: the hook wins (preload_hook.c)'),
    code: function () { return { c: C }; },
    presets: [
      { id: 'clean', level: 'normal', name: T('Normal: LD_PRELOAD yok, libc kazanıyor', 'Normal: no LD_PRELOAD, libc wins'),
        data: mkFromPaths('time', LIBC_POOL, -1) },
      { id: 'hooked-first', level: 'hard', name: T('Zor: kanca LD_PRELOAD ile EN BAŞA yükleniyor, kazanıyor', 'Hard: the hook is preloaded FIRST, and wins'),
        data: mkFromPaths('time', ['/home/student/bin/linux/libfake_hook.so'].concat(LIBC_POOL), 0) },
      { id: 'edge-immediately-after-vdso', level: 'edge',
        name: T('Uç durum: kanca vDSO\'dan hemen sonra, libc\'den önce yükleniyor', 'Edge case: the hook loads right after vDSO, before libc'),
        data: mkFromPaths('getenv', LIBC_POOL.slice(0, 2).concat(['/tmp/.evil/libfake_hook.so']).concat(LIBC_POOL.slice(2)), 2) },
      { id: 'edge-not-found', level: 'edge', name: T('Uç durum: sembol hiçbir yüklü nesnede yok', 'Edge case: the symbol is in no loaded object'),
        data: mk('__nonexistent_symbol', LIBC_POOL.map(function (p) { return { path: p }; }), -1, -1) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.objects.length; },
    random: function (level, r) {
      var counts = { easy: [10, 10], normal: [10, 12], hard: [11, 13], extreme: [12, 13] };
      var rg = counts[level] || counts.normal;
      var n = Math.min(rg[0] + D.randInt(r, 0, rg[1] - rg[0]), LIBC_POOL.length);
      var objs = pick(r, LIBC_POOL, n);
      var libcAt = libcIndexIn(objs);
      var hooked = (level === 'hard' || level === 'extreme') ? true : D.randInt(r, 0, 1) === 1;
      var hookAt = -1;
      if (hooked) {
        var pos = level === 'easy' ? 0 : D.randInt(r, 0, Math.max(0, libcAt));
        objs.splice(pos, 0, '/tmp/.evil/libfake_hook.so');
        hookAt = pos;
        libcAt = libcIndexIn(objs);
      }
      return mk(D.randInt(r, 0, 1) === 0 ? 'time' : 'getenv', objs.map(function (p) { return { path: p }; }), hookAt, libcAt);
    },
    input: {
      hint: T('sembol; nesne1, nesne2:hook, nesne3:libc, …', 'symbol; obj1, obj2:hook, obj3:libc, …'),
      format: function (data) {
        var list = data.objects.map(function (o, i) { return o.path + (i === data.hookAt ? ':hook' : i === data.libcAt ? ':libc' : ''); }).join(', ');
        return data.symbol + '; ' + list;
      },
      tokens: function (data) { return data.objects.map(function (o) { return o.path; }); },
      parse: function (text) {
        var parts = String(text).split(';');
        if (parts.length !== 2) throw T('Biçim: "sembol; nesne1, nesne2:hook, …" olmalı.', 'Format must be "symbol; obj1, obj2:hook, …".');
        var symbol = parts[0].trim();
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol)) throw T('Sembol adı geçerli bir C tanımlayıcısı olmalı.', 'The symbol name must be a valid C identifier.');
        var toks = parts[1].split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir nesne girin.', 'Enter at least one object.');
        var objects = [], hookAt = -1, libcAt = -1, bad = null;
        toks.forEach(function (t, i) {
          var m = t.match(/^(.*?)(:hook|:libc)?$/);
          var path = (m[1] || '').trim(), tag = m[2];
          if (!path) bad = bad || t;
          objects.push({ path: path });
          if (tag === ':hook') { if (hookAt !== -1) bad = bad || t; hookAt = i; }
          if (tag === ':libc') { if (libcAt !== -1) bad = bad || t; libcAt = i; }
        });
        if (bad !== null) throw T('"' + bad + '" geçersiz ya da yinelenen bir işaret.', '"' + bad + '" is invalid or a duplicate marker.');
        return mk(symbol, objects, hookAt, libcAt);
      },
      bad: ['', 'time', '1bad; /lib/libc.so:libc', 'time; /lib/libc.so:libc, /tmp/x.so:libc', 'time; :hook, /lib/libc.so:libc']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
