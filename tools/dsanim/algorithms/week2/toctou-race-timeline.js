// CEN429 — Week 2 — Demo 6 (code/week-02/06-toctou/logwriter.c: write_unsafe(), write_safe())
// CWE-367: a TOCTOU (time-of-check, time-of-use) race. The UNSAFE version checks "is this a symbolic
// link?" (lstat), THEN opens it (fopen) — two separate steps with a WINDOW between them where an
// attacker can swap the target. The SAFE version checks and opens in ONE atomic syscall
// (open(..., O_NOFOLLOW)): there is no window at all.
(function (D) {
  'use strict';
  var T = D.T;

  // ------------------------------------------------------------------ exact source lines (logwriter.c 43-83)
  var RACE_C = [
    'static int write_unsafe(const char *target, const char *text)',
    '{',
    '    /* TIME OF CHECK: is the target a regular file, or a symbolic link? */',
    '    struct stat st;',
    '    if (lstat(target, &st) == 0 && S_ISLNK(st.st_mode)) {',
    '        fprintf(stderr, "  rejected: the target is a symbolic link\\n");',
    '        return 1;',
    '    }',
    '    /* ... an attacker could replace the target with a symbolic link here ... */',
    '    small_delay();',
    '',
    '    /* TIME OF USE: fopen FOLLOWS symbolic links; we may write to another file */',
    '    FILE *f = fopen(target, "a");',
    '    if (!f) {',
    '        perror("  fopen");',
    '        return 1;',
    '    }',
    '    fprintf(f, "%s\\n", text);',
    '    fclose(f);',
    '    return 0;',
    '}',
    '',
    'static int write_safe(const char *target, const char *text)',
    '{',
    '    small_delay();',
    '    /* Check and open in ONE step: if there is a symbolic link, the open fails. */',
    '    int fd = open(target, O_WRONLY | O_CREAT | O_APPEND | O_NOFOLLOW, 0600);',
    '    if (fd < 0) {',
    '        if (errno == ELOOP)',
    '            fprintf(stderr,',
    '                    "  rejected: the target is a symbolic link (O_NOFOLLOW)\\n");',
    '        else',
    '            perror("  open");',
    '        return 1;',
    '    }',
    '    dprintf(fd, "%s\\n", text);',
    '    close(fd);',
    '    return 0;',
    '}'
  ];

  function mk(mode, attackerRaces) { return { mode: mode, attackerRaces: attackerRaces }; }

  /** Independent: expresses the outcome as a small truth table (mode x raced) looked up directly,
   * never by re-running the check/use steps build() animates. */
  function reference(data) {
    var table = {
      'unsafe|true': { written: true, toSecret: true },
      'unsafe|false': { written: true, toSecret: false },
      'safe|true': { written: false, toSecret: false },
      'safe|false': { written: true, toSecret: false }
    };
    return table[data.mode + '|' + data.attackerRaces];
  }

  function build(S, data) {
    var X = { writer: 0, target: 260, attacker: 520 };
    S.lifelines('L', { x: [X.writer, X.target, X.attacker], labels: [T('Yazıcı süreci', 'Writer process'), T('hedef dosya', 'target file'), T('Saldırgan', 'Attacker')], y0: 0, y1: 260 });
    S.label('title', { x: X.target, y: -30, text: (data.mode === 'unsafe' ? T('UNSAFE: kontrol ve kullanım İKİ AYRI adım', 'UNSAFE: check and use are TWO SEPARATE steps')
      : T('SAFE: kontrol ve kullanım TEK atomik adım (O_NOFOLLOW)', 'SAFE: check and use are ONE atomic step (O_NOFOLLOW)')), anchor: 'middle', bold: true, size: 14 });
    S.at(0);

    var y = 20;
    if (data.mode === 'unsafe') {
      S.message('m1', { x1: X.writer, x2: X.target, y: y, text: T('lstat: normal dosya mı?', 'lstat: a regular file?') });
      S.step(T('ZAMAN OF CHECK: yazıcı hedefin sembolik bağ olup olmadığını kontrol ediyor — şu an normal bir dosya.',
                'TIME OF CHECK: the writer checks whether the target is a symbolic link — right now it is a regular file.'),
             { c: [4, { n: 5, note: T('lstat==0 && S_ISLNK? hayır (henüz normal dosya)', 'lstat==0 && S_ISLNK? no (still a regular file)') }, { n: 6, skip: true }, { n: 7, skip: true }] });
    } else {
      S.step(T('SAFE: kontrol ile açma AYRI adımlar değil — bekleyecek bir "kontrol sonucu" yok.',
                'SAFE: the check and the open are NOT separate steps — there is no "check result" to wait on.'), {});
    }
    y += 40;

    if (data.mode === 'unsafe' && data.attackerRaces) {
      S.message('m2', { x1: X.attacker, x2: X.target, y: y, text: T('sil + sembolik bağ oluştur', 'delete + create symlink'), style: 'del' });
      S.step(T('YARIŞ PENCERESİ: kontrol ile kullanım arasındaki gecikmede saldırgan hedefi secret_target\'a işaret eden bir sembolik bağla DEĞİŞTİRİYOR.',
                'THE RACE WINDOW: during the delay between check and use, the attacker REPLACES the target with a symbolic link pointing at secret_target.'),
             { c: [9, 10] });
      y += 40;
    } else if (data.attackerRaces) {
      S.message('m2', { x1: X.attacker, x2: X.target, y: y, text: T('sil + sembolik bağ oluştur', 'delete + create symlink'), style: 'del' });
      S.step(T('Saldırgan yine dener — ama SAFE sürümde kontrol ile kullanım arasında hiç pencere yok.',
                'The attacker tries anyway — but in the SAFE version there is no window at all between check and use.'),
             { c: [26] });
      y += 40;
    } else {
      S.step(T('Bu senaryoda saldırgan araya girmiyor (karşılaştırma için).', 'In this scenario the attacker does not step in (for comparison).'), {});
    }

    if (data.mode === 'unsafe') {
      var toSecret = data.attackerRaces;
      S.message('m3', { x1: X.writer, x2: X.target, y: y, text: T('fopen (bağı TAKİP EDER)', 'fopen (FOLLOWS the link)'), style: toSecret ? 'del' : 'normal' });
      S.step(T('ZAMAN OF USE: `fopen` sembolik bağları TAKİP EDER — ' + (toSecret ? 'artık secret_target\'a yazıyoruz, hedefimize değil!' : 'bağ yok, normal dosyaya yazılıyor.'),
                'TIME OF USE: `fopen` FOLLOWS symbolic links — ' + (toSecret ? 'we are now writing to secret_target, not our intended file!' : 'no link, writes to the regular file.')),
             { c: [12, 13, { n: 14, note: T('!f? hayır (açma başarılı)', '!f? no (open succeeded)') }, { n: 15, skip: true }, 18] });
      S.step(toSecret
        ? T('>>> SALDIRI BAŞARILI: yazma secret_target\'a yönlendirildi.', '>>> ATTACK SUCCEEDED: the write was redirected to secret_target.')
        : T('>>> Saldırgan araya girmedi: yazma normal şekilde tamamlandı.', '>>> The attacker never stepped in: the write completed normally.'),
        {});
    } else {
      var blocked = data.attackerRaces;
      S.message('m3', { x1: X.writer, x2: X.target, y: y, text: T('open(O_NOFOLLOW)', 'open(O_NOFOLLOW)'), style: blocked ? 'new' : 'normal' });
      S.step(T('ZAMAN OF USE, tek adımda: `open(..., O_NOFOLLOW)` — sembolik bağ varsa açma BAŞARISIZ olur (ELOOP).',
                'TIME OF USE, in one step: `open(..., O_NOFOLLOW)` — if there is a symbolic link, the open FAILS (ELOOP).'),
             { c: [27, { n: 28, note: T('fd < 0? ' + (blocked ? 'evet (ELOOP)' : 'hayır (açıldı)'), 'fd < 0? ' + (blocked ? 'yes (ELOOP)' : 'no (opened)')) },
                   blocked ? { n: 29, note: T('errno == ELOOP? evet', 'errno == ELOOP? yes') } : { n: 29, skip: true },
                   blocked ? 31 : { n: 31, skip: true }, blocked ? 34 : { n: 34, skip: true }, blocked ? { n: 36, skip: true } : 36] });
      S.step(blocked
        ? T('>>> SALDIRI ENGELLENDİ: sembolik bağ reddedildi, secret_target hiç dokunulmadı.', '>>> ATTACK BLOCKED: the symbolic link was refused, secret_target was never touched.')
        : T('>>> Saldırgan araya girmedi: yazma normal şekilde tamamlandı.', '>>> The attacker never stepped in: the write completed normally.'),
        {});
    }
    S.at(null);
    S.result = reference(data);
  }

  D.define({
    id: 'toctou-race-timeline',
    title: T('TOCTOU yarış zaman çizelgesi (logwriter.c)', 'A TOCTOU race timeline (logwriter.c)'),
    code: { c: RACE_C },
    presets: [
      { id: 'normal-unsafe-race-succeeds', level: 'normal', small: true,
        name: T('Normal: UNSAFE + saldırgan araya giriyor — saldırı başarılı', 'Normal: UNSAFE + the attacker races in — the attack succeeds'),
        data: mk('unsafe', true) },
      { id: 'hard-safe-race-blocked', level: 'hard', small: true,
        name: T('Zor: SAFE + AYNI saldırgan — O_NOFOLLOW engelliyor', 'Hard: SAFE + the SAME attacker — O_NOFOLLOW blocks it'),
        data: mk('safe', true) },
      { id: 'edge-unsafe-no-attacker', level: 'edge', small: true,
        name: T('Uç durum: UNSAFE ama saldırgan yok — sorun görünmez', 'Edge case: UNSAFE but no attacker — the bug stays invisible'),
        data: mk('unsafe', false) },
      { id: 'edge-safe-no-attacker', level: 'edge', small: true,
        name: T('Uç durum: SAFE, saldırgan yok — normal şekilde yazar', 'Edge case: SAFE, no attacker — writes normally'),
        data: mk('safe', false) },
      { id: 'edge-safe-race-again', level: 'edge', small: true,
        name: T('Uç durum: SAFE, saldırgan tekrar dener — yine engellenir', 'Edge case: SAFE, the attacker tries again — still blocked'),
        data: mk('safe', true) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    // No `size()`: a single check/use race is a fixed 2x2 scenario (mode x attacker), not a
    // variable-length list the "≥10" rule was written for.
    random: function (level, r) {
      var mode = level === 'easy' ? 'unsafe' : (r() < 0.5 ? 'unsafe' : 'safe');
      var attackerRaces = level === 'easy' ? true : r() < 0.75;
      return mk(mode, attackerRaces);
    },
    input: {
      hint: T('unsafe|safe race:0|1', 'unsafe|safe race:0|1'),
      format: function (data) { return data.mode + ' race:' + (data.attackerRaces ? 1 : 0); },
      tokens: function (data) { return [data.mode, 'race']; },
      parse: function (text) {
        var m = String(text).trim().match(/^(unsafe|safe)\s+race:([01])$/);
        if (!m) throw T('"unsafe|safe race:0|1" biçiminde olmalı.', 'Must be "unsafe|safe race:0|1".');
        return mk(m[1], m[2] === '1');
      },
      bad: ['', 'maybe race:1', 'unsafe race:2', 'unsafe']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
