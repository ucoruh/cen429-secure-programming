// CEN429 — Week 1 — Process memory map: text / data / bss / heap / stack
// Reference: docs/week-1/cen429-week-1.{tr,en}.md, section 13, "Surec bellegi: verileriniz nerede duruyor?".
// Every C variable lives in one of five regions, decided entirely by ITS DECLARATION, not by its type or value:
// a string literal / compiled function -> text (read-only code); an initialised global/static -> data; an
// uninitialised global/static -> bss (Block Started by Symbol); malloc/calloc/realloc -> heap; a local (automatic)
// variable -> stack. This animation sorts a list of declarations into their real region.
(function (D) {
  'use strict';
  var T = D.T;

  var REF_C = [
    '/* which region a C declaration lives in (docs/week-1, section 13) */',
    'const char *banner = "Welcome";     /* the pointer: data   | the "Welcome" bytes: text (read-only) */',
    'int         request_count = 0;      /* initialised global               -> data */',
    'static char log_buffer[256];        /* uninitialised static             -> bss  */',
    'int main(void) {',
    '    int   local_total = 0;          /* local (automatic)                -> stack */',
    '    char *line = malloc(128);       /* the pointer "line": stack | the 128 bytes: heap */',
    '}'
  ];
  var REGION_ORDER = ['text', 'data', 'bss', 'heap', 'stack'];
  var REGION_LABEL = {
    text: T('metin (text) — kod ve salt okunur sabitler', 'text — code and read-only constants'),
    data: T('data — ilklenmiş global/static', 'data — initialised global/static'),
    bss: T('bss — ilklenmemiş global/static', 'bss — uninitialised global/static'),
    heap: T('öbek (heap) — malloc/calloc/new', 'heap — malloc/calloc/new'),
    stack: T('yığın (stack) — yerel (otomatik) değişken', 'stack — local (automatic) variable')
  };
  var REGION_LINE = { text: 2, data: 3, bss: 4, heap: 6, stack: 5 };

  var SNIPPETS = {};
  function snip(id, region, code, whyTr, whyEn) { SNIPPETS[id] = { region: region, code: code, why: T(whyTr, whyEn) }; }
  function labelFor(id) { return SNIPPETS[id] || { region: 'stack', code: id, why: T('yerel değişken', 'local variable') }; }

  function v(id) { return { id: id }; }
  function mk(variables) { return { variables: variables }; }

  snip('banner_ptr', 'data', 'const char *banner = "Welcome";', 'işaretçinin kendisi bir global değişken — ilklenmiş -> data', 'the pointer itself is a global variable — initialised -> data');
  snip('banner_text', 'text', '"Welcome"', 'dize sabiti derleyici tarafından salt okunur bölgeye konur, değiştirilemez', 'the string constant is placed by the compiler in a read-only region, cannot be modified');
  snip('request_count', 'data', 'int request_count = 0;', 'global ve açıkça ilklenmiş (0 bile olsa) -> data', 'global and explicitly initialised (even to 0) -> data');
  snip('log_buffer', 'bss', 'static char log_buffer[256];', 'static ve hiç ilklenmemiş -> bss, program başlarken sıfırlanır', 'static and never initialised -> bss, zeroed when the program starts');
  snip('server_version', 'data', 'static int server_version = 3;', 'static ve ilklenmiş -> data', 'static and initialised -> data');
  snip('session_table', 'bss', 'static Session session_table[64];', 'static dizi, ilklenmemiş -> bss', 'a static array, uninitialised -> bss');
  snip('local_total', 'stack', 'int local_total = 0;', 'fonksiyon içi yerel değişken, fonksiyon dönünce yok olur -> yığın', 'a local variable inside a function, gone when it returns -> stack');
  snip('line_ptr', 'stack', 'char *line = malloc(128);', 'işaretçinin KENDİSİ yerel bir değişken -> yığın', 'the pointer VARIABLE itself is local -> stack');
  snip('line_block', 'heap', 'malloc(128)', 'işaretçinin GÖSTERDİĞİ 128 bayt çalışma zamanında ayrılır -> öbek', 'the 128 bytes the pointer POINTS TO are allocated at run time -> heap');
  snip('argc_copy', 'stack', 'int n = argc;', 'parametre kopyası, yerel -> yığın', 'a copy of the parameter, local -> stack');
  snip('secure_startup_fn', 'text', 'void secure_startup(void) { ... }', 'derlenmiş fonksiyon kodu -> metin', 'compiled function code -> text');
  snip('log_in_fn', 'text', 'unsigned long log_in(const char *file) { ... }', 'derlenmiş fonksiyon kodu -> metin', 'compiled function code -> text');
  snip('key_buf', 'stack', 'unsigned char key[32];', 'yerel dizi, fonksiyon çerçevesinde -> yığın', 'a local array, inside the function frame -> stack');
  snip('parsed_records', 'heap', 'Record *r = calloc(n, sizeof *r);', 'çalışma zamanında istenen boyutta ayrılır -> öbek', 'allocated at run time at the requested size -> heap');
  snip('retry_limit', 'data', 'int retry_limit = 5;', 'global ve ilklenmiş -> data', 'global and initialised -> data');
  snip('audit_enabled', 'bss', 'static int audit_enabled;', 'static, ilklenmemiş (0 varsayılan) -> bss', 'static, uninitialised (defaults to 0) -> bss');

  var CORE = mk(['banner_ptr', 'banner_text', 'request_count', 'log_buffer', 'local_total', 'line_ptr', 'line_block',
    'secure_startup_fn', 'key_buf', 'retry_limit'].map(v));
  var EXTENDED = mk(['banner_ptr', 'banner_text', 'request_count', 'log_buffer', 'server_version', 'session_table',
    'local_total', 'line_ptr', 'line_block', 'argc_copy', 'secure_startup_fn', 'log_in_fn', 'key_buf',
    'parsed_records', 'retry_limit', 'audit_enabled'].map(v));
  var EDGE_ALL_STACK = mk(['local_total', 'line_ptr', 'argc_copy', 'key_buf', 'local_total',
    'line_ptr', 'argc_copy', 'key_buf', 'local_total', 'line_ptr'].map(v));
  var EDGE_ALL_HEAP = mk(['line_block', 'parsed_records', 'line_block', 'parsed_records', 'line_block', 'parsed_records',
    'line_block', 'parsed_records', 'line_block', 'parsed_records'].map(v));

  /** Independent of build(): reads SNIPPETS directly (a plain object index, not the labelFor() helper build()
   * also calls), with the same default-to-stack fallback inlined here rather than shared. */
  function reference(data) {
    var grouped = {};
    REGION_ORDER.forEach(function (r) { grouped[r] = []; });
    data.variables.forEach(function (item) {
      var entry = SNIPPETS[item.id];
      var region = entry ? entry.region : 'stack';
      grouped[region].push(item.id);
    });
    return grouped;
  }

  function build(S, data) {
    var RW = 260, RH_STEP = 26, RX = [0, 320, 640, 960, 1280];
    var regionY = { text: 0, data: 0, bss: 0, heap: 0, stack: 0 };
    var regionBoxIndex = { text: 0, data: 0, bss: 0, heap: 0, stack: 0 };
    var rx = {};
    REGION_ORDER.forEach(function (r, i) { rx[r] = RX[i]; });
    REGION_ORDER.forEach(function (r) {
      S.region('reg_' + r, { x: rx[r] - 10, y: -40, w: RW + 20, h: 480, style: 'dim', title: REGION_LABEL[r] });
    });

    S.step(T(data.variables.length + ' bildirim var. Her biri, C\'nin depolama süresi kurallarına göre TAM OLARAK bir bölgeye ait.',
              'There are ' + data.variables.length + ' declarations. Each one belongs to EXACTLY one region, decided by C\'s storage-duration rules.'),
           {});

    data.variables.forEach(function (item, idx) {
      var info = labelFor(item.id), region = info.region;
      var y = regionBoxIndex[region] * RH_STEP;
      regionBoxIndex[region]++;
      var boxId = 'v' + idx;
      S.box(boxId, { x: rx[region], y: y, w: RW, h: RH_STEP - 4, size: 11, mono: true, text: info.code, style: 'hl' });
      S.at(idx);
      var cap = idx < 4
        ? T('`' + info.code + '` — ' + info.why.tr + ' -> **' + REGION_LABEL[region].tr + '**.',
            '`' + info.code + '` — ' + info.why.en + ' -> **' + REGION_LABEL[region].en + '**.')
        : T('`' + info.code + '` -> ' + REGION_LABEL[region].tr + '.',
            '`' + info.code + '` -> ' + REGION_LABEL[region].en + '.');
      S.step(cap, { c: [REGION_LINE[region]] });
      S.set(boxId, { style: 'new' });
    });
    S.at(null);
    S.result = reference(data);
    var counts = REGION_ORDER.map(function (r) { return r + '=' + S.result[r].length; }).join(', ');
    S.step(T('Sonuç: ' + counts + '. Aynı fonksiyonun içinde bile değişkenler farklı bölgelerde yaşayabilir — bölgeyi belirleyen TÜR değil, BİLDİRİM biçimidir.',
              'Result: ' + counts + '. Even inside the same function, variables can live in different regions — it is the DECLARATION, not the type, that decides the region.'),
           {});
  }

  D.define({
    id: 'process-memory-map',
    title: T('Süreç belleği: text/data/bss/heap/stack', 'Process memory: text/data/bss/heap/stack'),
    code: { c: REF_C },
    presets: [
      { id: 'core-ten', level: 'normal', name: T('Normal: 10 bildirim, 4 bölge', 'Normal: 10 declarations, 4 regions'), data: CORE },
      { id: 'extended-sixteen', level: 'hard', name: T('Zor: 16 bildirim, 5 bölgenin hepsi', 'Hard: 16 declarations, all 5 regions'), data: EXTENDED },
      { id: 'edge-all-stack', level: 'edge', name: T('Uç durum: hepsi yığında (10 yerel değişken)', 'Edge case: everything on the stack (10 locals)'), data: EDGE_ALL_STACK },
      { id: 'edge-all-heap', level: 'edge', name: T('Uç durum: hepsi öbekte (10 malloc/calloc)', 'Edge case: everything on the heap (10 malloc/calloc)'), data: EDGE_ALL_HEAP }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    size: function (data) { return data.variables.length; },
    random: function (level, r) {
      var counts = { easy: 10, normal: 12, hard: 15, extreme: 16 };
      var n = counts[level] || 10;
      var ids = Object.keys(SNIPPETS);
      var out = [];
      for (var i = 0; i < n; i++) out.push(v(ids[D.randInt(r, 0, ids.length - 1)]));
      return mk(out);
    },
    input: {
      hint: T('id, id, … (' + Object.keys(SNIPPETS).slice(0, 3).join(', ') + ', …)', 'id, id, … (' + Object.keys(SNIPPETS).slice(0, 3).join(', ') + ', …)'),
      format: function (data) { return data.variables.map(function (x) { return x.id; }).join(', '); },
      tokens: function (data) { return data.variables.map(function (x) { return labelFor(x.id).code; }); },
      parse: function (text) {
        var toks = String(text).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!toks.length) throw T('En az bir bildirim girin.', 'Enter at least one declaration.');
        var out = [];
        toks.forEach(function (t) {
          if (!SNIPPETS[t]) throw T('"' + t + '" bilinen bir bildirim kimliği değil.', '"' + t + '" is not a known declaration id.');
          out.push(v(t));
        });
        return mk(out);
      },
      bad: ['', 'not_a_real_id', 'local_total, unknown_thing', ',,,', 'LOCAL_TOTAL']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
