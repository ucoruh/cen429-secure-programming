// CEN429 — Week 4 — Demo 2 (code/week-04/02-use-after-free/uaf.c)
// A toy heap allocator: alloc() hands out a free chunk (reusing the most-recently-freed one first —
// LIFO, like glibc's tcache), free() marks a chunk free and pushes it onto the free list, but does NOT
// change the pointer variable that used to own it — that pointer is now DANGLING. If the next alloc()
// reuses the very same chunk for a new, attacker-controlled object, the dangling pointer's owner reads
// and calls into the NEW object's data (CWE-416). Freeing the same chunk twice (double-free) corrupts
// the free list itself (CWE-415). This animation's allocator is a simplified, deterministic teaching
// model — real allocators do not always reuse the same address (see the note's own caveat).
(function (D) {
  'use strict';
  var T = D.T;

  // Exact source (code/week-04/02-use-after-free/uaf.c), full file: both mode_uaf and mode_double
  // live in the same real file, so the code panel always shows the whole thing; only which lines are
  // marked "executing" differs by scenario.
  var FULL_C = [
    '/*',
    ' * CEN429 - Week 4 - Demo 2: use-after-free and double-free (VULNERABLE VERSION)',
    ' *',
    ' * The "session" object is kept on the HEAP, not the stack, and it holds a function pointer',
    ' * (action). If the pointer is still used after the object was free()d (dangling), an attacker',
    ' * can allocate a new block of the same size and put their own data there; the "dangling" pointer',
    ' * now points at the attacker\'s data. That is how role \'user\' becomes \'admin\', and the function',
    ' * pointer ends up calling a different function.',
    ' *',
    ' * Mode:',
    ' *   uaf    : use-after-free exploit (privilege escalation)',
    ' *   double : freeing the same block twice (double-free)',
    ' *',
    ' * ETHICS: every action calls this program\'s own functions; no code is injected from the outside.',
    ' * Steps that could crash are bounded on Linux with prlimit+timeout, on Windows with demo_prepare().',
    ' */',
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '#include "cen429_demo.h"',
    '',
    'struct session {',
    '    void (*action)(void);',
    '    char  role[16];',
    '};',
    '',
    'static void normal_panel(void) { printf("   -> Normal user panel.\\n"); }',
    'static void admin_panel(void)  { printf("   -> >>> ADMIN panel opened! <<<\\n"); }',
    '',
    'static int mode_uaf(void)',
    '{',
    '    struct session *s = malloc(sizeof *s);',
    '    if (!s) return 1;',
    '    s->action = normal_panel;',
    '    strcpy(s->role, "user");',
    '    printf("1) Session opened: role=%s\\n", s->role);',
    '',
    '    free(s);                 /* s is now dangling; it was not set to NULL */',
    '    printf("2) Session freed (but the pointer is still in hand).\\n");',
    '',
    '    /* An attacker allocates a block of the same size; the allocator usually hands back the',
    '       same spot. */',
    '    struct session *fake = malloc(sizeof *s);',
    '    if (!fake) return 1;',
    '    fake->action = admin_panel;',
    '    strcpy(fake->role, "admin");',
    '',
    '    /* BUG: the freed \'s\' is used (use-after-free) */',
    '    printf("3) Role read through the dangling pointer: %s\\n", s->role);',
    '    printf("4) Action called through the dangling pointer:\\n");',
    '    s->action();',
    '',
    '    free(fake);',
    '    return 0;',
    '}',
    '',
    'static int mode_double(void)',
    '{',
    '    char *buffer = malloc(32);',
    '    if (!buffer) return 1;',
    '    strcpy(buffer, "sample data");',
    '    printf("1) Block allocated and filled.\\n");',
    '    free(buffer);',
    '    printf("2) Block freed.\\n");',
    '    printf("3) The SAME block is freed AGAIN (double-free)...\\n");',
    '    free(buffer);             /* BUG: double-free */',
    '    printf("4) If we got here, the allocator did not notice the corruption.\\n");',
    '    return 0;',
    '}',
    '',
    'int main(int argc, char **argv)',
    '{',
    '    demo_prepare();',
    '    const char *mode = (argc >= 2) ? argv[1] : "uaf";',
    '    if (strcmp(mode, "uaf") == 0)    return mode_uaf();',
    '    if (strcmp(mode, "double") == 0) return mode_double();',
    '    fprintf(stderr, "Usage: %s <uaf|double>\\n", argv[0]);',
    '    return 2;',
    '}'
  ];

  // ------------------------------------------------------------------ data
  function mk(mode, noise) { return { mode: mode, noise: noise | 0 }; }

  function buildOps(data) {
    var ops = [];
    for (var i = 0; i < data.noise; i++) {
      ops.push({ type: 'alloc', name: 'n' + i });
      ops.push({ type: 'free', name: 'n' + i });
    }
    if (data.mode === 'uaf') {
      ops.push({ type: 'alloc', name: 's' });
      ops.push({ type: 'free', name: 's' });
      ops.push({ type: 'alloc', name: 'fake', reuseOf: 's' });
      ops.push({ type: 'use', name: 's' });
      ops.push({ type: 'call', name: 's' });
    } else {
      ops.push({ type: 'alloc', name: 'buf' });
      ops.push({ type: 'free', name: 'buf' });
      ops.push({ type: 'freeAgain', name: 'buf' });
    }
    return ops;
  }

  /** Independent computation: this toy allocator ALWAYS reuses the most-recently-freed same-size chunk
   * (a deterministic teaching simplification), so the outcome follows directly from the op list's shape,
   * without walking a shared slot-simulation loop. */
  function reference(data) {
    if (data.mode === 'uaf') return { mode: 'uaf', reused: true, finalRole: 'admin', callsAdminPanel: true };
    return { mode: 'double', corrupted: true };
  }

  function build(S, data) {
    var ops = buildOps(data);
    var W = 74, GAP = 8, Y = 0;
    var slotCount = 0, slotOwner = {}, nameSlot = {}, freeList = [];
    S.label('title', { x: 250, y: -24, text: T('Küçük bir öbek (heap): alloc() en son serbest kalanı geri verir (LIFO)', 'A small heap: alloc() hands back the most-recently-freed chunk first (LIFO)'), anchor: 'middle', bold: true, size: 14 });
    S.label('flLbl', { x: 620, y: -4, text: T('serbest liste (LIFO), üst = sıradaki', 'free list (LIFO), top = next'), anchor: 'start', size: 12, bold: true });
    S.label('freeList', { x: 620, y: 20, text: '[ ]', anchor: 'start', size: 13, mono: true });

    function drawSlot(idx) {
      S.box('slot' + idx, { x: idx * (W + GAP), y: Y, w: W, h: 42, size: 12, mono: true, text: '', style: 'empty', below: 'A' + idx });
    }
    function freshSlot() { var idx = slotCount++; drawSlot(idx); return idx; }
    function renderFreeList() { S.set('freeList', { text: '[ ' + freeList.map(function (i) { return 'A' + i; }).join(', ') + ' ]' }); }

    function lineFor(kind, name) {
      if (data.mode === 'uaf') {
        if (kind === 'alloc' && name === 's') return { c: [32, 34, 35] };
        if (kind === 'free' && name === 's') return { c: [38] };
        if (kind === 'alloc' && name === 'fake') return { c: [43, 45, 46] };
        if (kind === 'use') return { c: [49] };
        if (kind === 'call') return { c: [51] };
        return { c: [32] };   // noise ops: illustrated with the same alloc/free shape
      }
      if (kind === 'alloc') return { c: [59, 61] };
      if (kind === 'free') return { c: [63] };
      if (kind === 'freeAgain') return { c: [66] };
      return { c: [59] };
    }

    var tokens = ops.map(function (o) { return o.type + '(' + o.name + ')'; });
    ops.forEach(function (op, i) {
      S.at(i);
      var idx;
      if (op.type === 'alloc') {
        if (op.reuseOf !== undefined && nameSlot[op.reuseOf] !== undefined && slotOwner[nameSlot[op.reuseOf]] === null) {
          idx = nameSlot[op.reuseOf];
          freeList.splice(freeList.indexOf(idx), 1);
          renderFreeList();
          S.set('slot' + idx, { text: op.name, style: 'del' });
          S.step(T('`' + op.name + ' = malloc(...)` — serbest listenin TEPESİNDEKİ `A' + idx + '` blok geri veriliyor. Bu, `' + op.reuseOf + '`\'nin ESKİ bloğu!',
                    '`' + op.name + ' = malloc(...)` — the block at the TOP of the free list, `A' + idx + '`, is handed back. That is `' + op.reuseOf + '`\'s OLD block!'),
                 lineFor('alloc', op.name));
        } else {
          idx = freshSlot();
          nameSlot[op.name] = idx; slotOwner[idx] = op.name;
          S.set('slot' + idx, { text: op.name, style: 'new' });
          S.step(T('`' + op.name + ' = malloc(...)` — yeni bir blok, `A' + idx + '`, ayrılıyor.',
                    '`' + op.name + ' = malloc(...)` — a new block, `A' + idx + '`, is allocated.'),
                 lineFor('alloc', op.name));
        }
        nameSlot[op.name] = idx; slotOwner[idx] = op.name;
      } else if (op.type === 'free') {
        idx = nameSlot[op.name];
        slotOwner[idx] = null;
        freeList.push(idx);
        renderFreeList();
        S.set('slot' + idx, { text: T('boş', 'free'), style: 'dim' });
        S.step(T('`free(' + op.name + ')` — `A' + idx + '` boşa çıktı ve serbest listeye eklendi. `' + op.name + '` değişkeni HÂLÂ `A' + idx + '`\'yi gösteriyor (askıda işaretçi).',
                  '`free(' + op.name + ')` — `A' + idx + '` becomes free and is pushed onto the free list. The `' + op.name + '` variable STILL points at `A' + idx + '` (dangling pointer).'),
               lineFor('free', op.name));
      } else if (op.type === 'use') {
        idx = nameSlot[op.name];
        var owner = slotOwner[idx];
        S.set('slot' + idx, { style: 'hl' });
        S.step(T('`' + op.name + '->role` okunuyor: işaretçi hâlâ `A' + idx + '`\'yi gösteriyor, ama o blok artık `' + owner + '`\'e ait — okunan değer `' + owner + '`\'in verisi.',
                  '`' + op.name + '->role` is read: the pointer still points at `A' + idx + '`, but that block now belongs to `' + owner + '` — the value read is `' + owner + '`\'s data.'),
               lineFor('use'));
      } else if (op.type === 'call') {
        idx = nameSlot[op.name];
        owner = slotOwner[idx];
        S.set('slot' + idx, { style: 'hl' });
        S.step(T('`' + op.name + '->action()` çağrılıyor: işaretçi `A' + idx + '`\'deki fonksiyon adresini okuyor — bu artık `' + owner + '`\'in yazdığı adres (`admin_panel`).',
                  '`' + op.name + '->action()` is called: the pointer reads the function address stored at `A' + idx + '` — that is now the address `' + owner + '` wrote there (`admin_panel`).'),
               lineFor('call'));
      } else if (op.type === 'freeAgain') {
        idx = nameSlot[op.name];
        S.set('slot' + idx, { style: 'del' });
        S.label('err', { x: idx * (W + GAP) + W / 2, y: 70, text: T('İKİNCİ free — aynı blok serbest listede İKİ KEZ! Liste bozuldu.', 'SECOND free — the same block is on the free list TWICE! The list is corrupted.'), anchor: 'middle', size: 12, bold: true });
        freeList.push(idx);
        renderFreeList();
        S.step(T('`free(' + op.name + ')` TEKRAR çağrılıyor — `A' + idx + '` serbest listeye ikinci kez ekleniyor. Ayırıcının iç yapısı artık tutarsız (double-free, CWE-415).',
                  '`free(' + op.name + ')` is called AGAIN — `A' + idx + '` is pushed onto the free list a second time. The allocator\'s internal structure is now inconsistent (double-free, CWE-415).'),
               lineFor('freeAgain'));
      }
    });
    S.at(null);
    S.result = reference(data);
    if (data.mode === 'uaf') {
      S.step(T('Sonuç: askıdaki işaretçi üzerinden `admin_panel` çağrıldı — rol ve davranış saldırganın verisine döndü.',
                'Result: `admin_panel` was called through the dangling pointer — both the role and the behaviour became the attacker\'s data.'),
             {});
    } else {
      S.step(T('Sonuç: iki kez serbest bırakılan blok, ayırıcının bir SONRAKİ `malloc` çağrısında aynı belleği iki farklı sahibe vermesine yol açabilir — tanımsız davranış.',
                'Result: a block freed twice can make the allocator hand the SAME memory to two different owners on a later `malloc` call — undefined behavior.'),
             {});
    }
  }

  D.define({
    id: 'use-after-free',
    title: T('Serbest bellek kullanımı ve çift serbest bırakma (uaf.c)', 'Use-after-free and double-free (uaf.c)'),
    code: function () { return { c: FULL_C }; },
    presets: [
      { id: 'uaf-normal', level: 'normal', name: T('Normal: UAF, 3 gürültü çifti (11 işlem)', 'Normal: UAF, 3 noise pairs (11 ops)'), data: mk('uaf', 3) },
      { id: 'uaf-hard', level: 'hard', name: T('Zor: UAF, 5 gürültü çifti (15 işlem)', 'Hard: UAF, 5 noise pairs (15 ops)'), data: mk('uaf', 5) },
      { id: 'uaf-bare', level: 'edge', small: true, name: T('Uç durum: UAF, gürültü yok (yalın mekanizma)', 'Edge case: UAF, no noise (the bare mechanism)'), data: mk('uaf', 0) },
      { id: 'double-free', level: 'edge', name: T('Uç durum: çift serbest bırakma (double-free)', 'Edge case: double-free'), data: mk('double', 4) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return buildOps(data).length; },
    random: function (level, r) {
      var mode = D.randInt(r, 0, 3) === 0 ? 'double' : 'uaf';
      var minNoise = mode === 'double' ? 4 : 3;
      var ranges = { easy: [minNoise, minNoise + 1], normal: [minNoise, minNoise + 2], hard: [minNoise + 2, minNoise + 4], extreme: [minNoise + 3, minNoise + 5] };
      var rg = ranges[level] || ranges.normal;
      return mk(mode, D.randInt(r, rg[0], rg[1]));
    },
    input: {
      hint: T('kip(uaf|double) gurultu-cifti (ör. uaf 3)', 'mode(uaf|double) noise-pairs (e.g. uaf 3)'),
      format: function (data) { return data.mode + ' ' + data.noise; },
      tokens: function (data) { return buildOps(data).map(function (o) { return o.type + '(' + o.name + ')'; }); },
      parse: function (text) {
        var parts = String(text).trim().split(/\s+/);
        if (parts.length !== 2) throw T('"kip gurultu-cifti" biçiminde olmalı (ör. "uaf 3").', 'Must be "mode noise-pairs" (e.g. "uaf 3").');
        if (parts[0] !== 'uaf' && parts[0] !== 'double') throw T('Kip yalnız "uaf" ya da "double" olabilir.', 'Mode can only be "uaf" or "double".');
        if (!/^\d+$/.test(parts[1])) throw T('Gürültü çifti sayısı tam sayı olmalı.', 'The noise-pair count must be an integer.');
        var n = parseInt(parts[1], 10);
        if (n < 0 || n > 10) throw T('Gürültü çifti sayısı 0-10 arasında olmalı.', 'The noise-pair count must be between 0 and 10.');
        var minNoise = parts[0] === 'double' ? 4 : 0;
        if (n < minNoise) throw T('"double" kipi en az 4 gürültü çifti gerektirir (≥10 işlem için).', '"double" mode needs at least 4 noise pairs (to reach >=10 ops).');
        return mk(parts[0], n);
      },
      bad: ['', 'uaf', 'uaf -1', 'uaf abc', 'weird 3', 'double 0', 'uaf 99']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
