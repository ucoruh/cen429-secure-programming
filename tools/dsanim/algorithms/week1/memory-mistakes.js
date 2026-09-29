// CEN429 — Week 1 — Memory management mistakes: leak, double free, use-after-free
// Reference: docs/week-1/cen429-week-1.{tr,en}.md, section 17, "Bellek yonetimi ve guvenlik" (the User /
// active / cached / note example). Dynamic memory's lifecycle is allocate -> validate -> use -> free; this
// animation walks a series of small sessions, each following that same shape, and shows which of the four
// classic mistakes (or none) each one makes: a block never freed (leak), free() called twice on the same block
// (double free), or a stale pointer read after its block was freed AND reused by someone else (use-after-free).
(function (D) {
  'use strict';
  var T = D.T;

  var CODE_C = [
    'typedef struct { char name[32]; int privilege; } User;',
    '',
    'User *active = malloc(sizeof *active);',
    'User *cached = active;                /* a second owner */',
    '/* ... */',
    'free(active);                         /* session closed */',
    'active = NULL;                        /* active is safe, but cached still holds the old address */',
    '',
    'char *note = malloc(sizeof(User));    /* the allocator may hand back the very same block */',
    'strcpy(note, "....");                 /* writing the note */',
    '',
    'if (cached->privilege) { /* ... */ }  /* UAF: this now reads \'note\'s bytes */'
  ];
  var L = { alloc: 3, alias: 4, free: 6, null: 7, reuse: 9, write: 10, access: 12 };

  var KINDS = ['ok', 'leak', 'double_free', 'uaf'];
  function item(id, kind) { return { id: id, kind: kind }; }
  function mk(items) { return { items: items }; }

  function reference(data) {
    var counts = { ok: 0, leak: 0, double_free: 0, uaf: 0 };
    var perItem = data.items.map(function (it) {
      counts[it.kind]++;
      return { id: it.id, kind: it.kind, mistake: it.kind !== 'ok' };
    });
    return { perItem: perItem, counts: counts };
  }

  function narrate(kind) {
    return {
      ok: T('temiz kalıp: ayır, kullan, serbest bırak, işaretçiyi NULL yap. Tek sahip, sorun yok.',
            'the clean pattern: allocate, use, free, NULL the pointer. A single owner, no problem.'),
      leak: T('ayrılan blok hiçbir zaman `free` edilmedi — sunucu uzun çalıştıkça bellek tükenir.',
              'the allocated block is never `free`d — the longer a server runs, the more memory it loses.'),
      double_free: T('aynı blok İKİ KEZ `free` edildi — bellek yöneticisinin iç listeleri bozulur.',
                      'the same block is `free`d TWICE — the allocator\'s internal free-list is corrupted.'),
      uaf: T('`cached` hâlâ eski adresi tutuyor; blok `note`\'a yeniden verildikten sonra `cached` üzerinden okumak `note`\'un baytlarını okur.',
             '`cached` still holds the old address; reading through `cached` after the block was handed to `note` reads `note`\'s bytes instead.')
    }[kind];
  }

  function build(S, data) {
    var items = data.items, n = items.length;
    var BW = 70, BH = 30, ROWH = 60, GAP = 30;
    var seenKinds = {};

    items.forEach(function (it, idx) {
      var y = idx * ROWH;
      var detailed = !seenKinds[it.kind];
      seenKinds[it.kind] = true;

      S.label('lbl' + idx, { x: -14, y: y + 20, text: it.id, anchor: 'end', size: 13, mono: true, bold: true });
      var blockId = 'blk' + idx;
      S.box(blockId, { x: 0, y: y, w: BW, h: BH, size: 12, mono: true, text: T('boş', 'free'), style: 'empty' });
      var ptr1 = 'p1_' + idx;
      S.pointer(ptr1, { target: blockId, side: 'top', text: 'active' });
      S.at(idx);
      var line = { ok: L.alloc, leak: L.alloc, double_free: L.alloc, uaf: L.alloc }[it.kind];

      if (detailed) {
        // first occurrence of this kind: walk through every micro-step with its own caption
        S.set(blockId, { style: 'new', text: T('ayrıldı', 'allocated') });
        S.step(T('`' + it.id + '`: `active = malloc(...)` — blok ayrıldı.', '`' + it.id + '`: `active = malloc(...)` — the block is allocated.'), { c: [line] });

        if (it.kind === 'uaf') {
          S.pointer('p2_' + idx, { target: blockId, side: 'bottom', text: 'cached', dist: 30 });
          S.step(T('`cached = active` — aynı bloğun İKİNCİ bir sahibi.', '`cached = active` — a SECOND owner of the same block.'), { c: [L.alias] });
        }

        S.set(blockId, { style: 'dim', text: T('boş', 'free') });
        S.remove(ptr1);
        S.step(T('`free(active)`; `active = NULL`.', '`free(active)`; `active = NULL`.'), { c: [L.free, L.null] });

        if (it.kind === 'leak') {
          S.step(narrate('leak'), { c: [] });
        } else if (it.kind === 'double_free') {
          S.set(blockId, { style: 'del' });
          S.step(T('`free(active)` TEKRAR çağrılır — aynı blok ikinci kez serbest bırakılıyor!', '`free(active)` is called AGAIN — the same block is freed a second time!'), { c: [L.free] });
        } else if (it.kind === 'uaf') {
          S.set(blockId, { style: 'new', text: 'note' });
          S.pointer('p3_' + idx, { target: blockId, side: 'top', text: 'note' });
          S.step(T('`note = malloc(...)` aynı boyutu ister — bellek yöneticisi büyük olasılıkla AYNI bloğu geri verir.', '`note = malloc(...)` asks for the same size — the allocator most likely hands back the SAME block.'), { c: [L.reuse, L.write] });
          S.set(blockId, { style: 'del' });
          S.step(T('`cached->privilege` okunur — ama `cached` hâlâ eski adreste; bu artık `note`\'un baytlarını okuyor (UAF).', '`cached->privilege` is read — but `cached` is still at the old address; this now reads `note`\'s bytes (UAF).'),
                 { c: [{ n: L.access, note: T('cached->privilege != 0? tanımsız — artık note\'un verisi okunuyor, gerçek bellekten değil', 'cached->privilege != 0? undefined — this now reads note\'s data, not real memory') }] });
        } else {
          S.step(narrate('ok'), { c: [] });
        }
      } else {
        // a repeat of a kind already shown in full: set up the end state directly, one compact step
        S.remove(ptr1);
        if (it.kind === 'uaf') {
          S.pointer('p2_' + idx, { target: blockId, side: 'bottom', text: 'cached', dist: 30 });
          S.set(blockId, { style: 'del', text: 'note' });
        } else if (it.kind === 'double_free') {
          S.set(blockId, { style: 'del', text: T('boş (2×!)', 'free (2x!)') });
        } else if (it.kind === 'leak') {
          S.set(blockId, { style: 'new', text: T('ayrıldı', 'allocated') });
        } else {
          S.set(blockId, { style: 'dim', text: T('boş', 'free') });
        }
        var summary = {
          ok: T('`' + it.id + '`: aynı temiz kalıp — ayır, kullan, serbest bırak. Sorun yok.',
                '`' + it.id + '`: the same clean pattern — allocate, use, free. No problem.'),
          leak: T('`' + it.id + '`: yine ayrıldı, yine hiç `free` edilmedi — bir sızıntı daha.',
                  '`' + it.id + '`: allocated again, never `free`d again — one more leak.'),
          double_free: T('`' + it.id + '`: yine aynı blok iki kez serbest bırakılıyor.',
                          '`' + it.id + '`: the same block is freed twice again.'),
          uaf: T('`' + it.id + '`: aynı kalıp — `cached` eski adreste kalıyor, blok yeniden verildikten sonra okumak UAF.',
                 '`' + it.id + '`: the same pattern — `cached` is left at the old address, reading it after reuse is a UAF.')
        }[it.kind];
        S.step(summary, { c: [line] });
      }
    });
    S.at(null);
    S.result = reference(data);
    var c = S.result.counts;
    S.step(T(n + ' oturum: ' + c.ok + ' temiz, ' + c.leak + ' sızıntı, ' + c.double_free + ' çift-serbest-bırakma, ' + c.uaf + ' UAF.',
              n + ' sessions: ' + c.ok + ' clean, ' + c.leak + ' leak, ' + c.double_free + ' double-free, ' + c.uaf + ' UAF.'),
           {});
  }

  function makeSet(prefix, kinds) { return kinds.map(function (k, i) { return item(prefix + (i + 1), k); }); }

  var NORMAL = mk(makeSet('S', ['ok', 'leak', 'ok', 'double_free', 'ok', 'uaf', 'ok', 'leak', 'ok', 'double_free']));
  var HARD = mk(makeSet('H', ['uaf', 'double_free', 'leak', 'uaf', 'ok', 'double_free', 'leak', 'uaf', 'ok', 'leak', 'double_free', 'uaf']));
  var EDGE_ALL_UAF = mk(makeSet('U', ['uaf', 'uaf', 'uaf', 'uaf', 'uaf', 'uaf', 'uaf', 'uaf', 'uaf', 'uaf']));
  var EDGE_ALL_OK = mk(makeSet('C', ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok']));

  D.define({
    id: 'memory-mistakes',
    title: T('Bellek yönetimi hataları: sızıntı, çift serbest bırakma, UAF', 'Memory management mistakes: leak, double free, UAF'),
    code: { c: CODE_C },
    presets: [
      { id: 'mixed-ten', level: 'normal', name: T('Normal: 10 oturum, karışık hatalar', 'Normal: 10 sessions, mixed mistakes'), data: NORMAL },
      { id: 'mostly-broken', level: 'hard', name: T('Zor: 12 oturum, çoğu hatalı', 'Hard: 12 sessions, mostly broken'), data: HARD },
      { id: 'edge-all-uaf', level: 'edge', name: T('Uç durum: 10 oturumun hepsi UAF', 'Edge case: all 10 sessions are UAF'), data: EDGE_ALL_UAF },
      { id: 'edge-all-clean', level: 'edge', name: T('Uç durum: 10 oturumun hepsi temiz', 'Edge case: all 10 sessions are clean'), data: EDGE_ALL_OK }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.items.length; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 11, hard: 13, extreme: 16 };
      var n = counts[level] || 10;
      var out = [];
      for (var i = 0; i < n; i++) out.push(item('R' + (i + 1), KINDS[D.randInt(r, 0, 3)]));
      return mk(out);
    },
    input: {
      hint: T('id:tür, id:tür, … (tür = ok|leak|double_free|uaf)', 'id:kind, id:kind, … (kind = ok|leak|double_free|uaf)'),
      format: function (data) { return data.items.map(function (it) { return it.id + ':' + it.kind; }).join(', '); },
      tokens: function (data) { return data.items.map(function (it) { return it.id; }); },
      parse: function (text) {
        var toks = String(text).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir oturum girin.', 'Enter at least one session.');
        var out = [];
        toks.forEach(function (t) {
          var parts = t.split(':');
          if (parts.length !== 2) throw T('"' + t + '" biçimi "id:tür" olmalı.', '"' + t + '" must be "id:kind".');
          var id = parts[0].trim(), kind = parts[1].trim();
          if (!/^[A-Za-z][A-Za-z0-9]*$/.test(id)) throw T('"' + id + '" geçersiz bir kimlik.', '"' + id + '" is not a valid id.');
          if (KINDS.indexOf(kind) < 0) throw T('"' + kind + '" geçersiz bir tür.', '"' + kind + '" is not a valid kind.');
          out.push(item(id, kind));
        });
        return mk(out);
      },
      bad: ['', 'S1', 'S1:weird', '1S:ok', 'S1:ok:extra']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
