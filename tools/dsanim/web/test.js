// dsanim v2 test runner (Node). For every algorithm file given (or every tools/dsanim/algorithms/week*/ *.js):
//   - at least 3 examples, covering the levels normal, hard and edge; every example has ≥ minSize input values
//   - every example builds; every frame renders in TR and EN without "undefined"/"NaN"; the view box is finite
//   - random data: 200 seeds for every difficulty level build without error
//   - own values: parse(format(data)) gives the same data back; bad input throws a {tr, en} message
//   - correctness: spec.reference(data) (an independent computation) must equal S.result set by build()
// Usage: node test.js [file.js …]      exit code 1 on any failure
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('./scene.js');
global.DSAnim = D;

const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(__dirname, '..', 'algorithms'))
  .filter(w => /^week\d+$/.test(w))
  .flatMap(w => fs.readdirSync(path.join(__dirname, '..', 'algorithms', w)).filter(f => f.endsWith('.js')).map(f => path.join(__dirname, '..', 'algorithms', w, f)));

let failures = 0;
function fail(id, msg) { failures++; console.log(`  FAIL ${id}: ${msg}`); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// CEN429 scene.js helper self-tests (memRow, lifelines, message) — not tied to any algorithm file, since
// week 1's two examples only exercise memRow; lifelines/message are exercised here so a later week that
// draws e.g. a TLS handshake can rely on them being tested.
function checkFrame(label, S) {
  if (!S.frames.length) { fail(label, 'no frames'); return; }
  const vb = D.viewBox(S.frames);
  if (!vb.every(Number.isFinite)) fail(label, `view box ${vb}`);
  S.frames.forEach((f, i) => {
    for (const lang of ['tr', 'en']) {
      const s = D.render(f.state, f.order, lang);
      if (/="[^"]*(undefined|NaN)/.test(s)) fail(label, `step ${i + 1} (${lang}) renders undefined/NaN`);
    }
  });
}
(function selfTestHelpers() {
  {
    const S = new D.Scene();
    const bytes = [{ value: 0x41, addr: 0x1000 }, { value: 0x42, addr: 0x1001 }, {}, { text: 'admin', style: 'hl', addr: 0x1010 }];
    const ids = S.memRow('b', bytes, { x: 0, y: 0 });
    if (ids.length !== 4) fail('memRow', `expected 4 ids, got ${ids.length}`);
    if (S.get('b0').text !== D.hex(0x41, 2)) fail('memRow', `hex formatting: ${S.get('b0').text}`);
    if (S.get('b0').below !== '0x1000') fail('memRow', `address formatting: ${S.get('b0').below}`);
    if (S.get('b2').style !== 'empty') fail('memRow', `empty byte should default to style 'empty', got ${S.get('b2').style}`);
    S.step(D.T('bellek satırı', 'memory row'), {});
    checkFrame('memRow', S);
  }
  {
    const S = new D.Scene();
    S.lifelines('lc', { x: [0, 300], labels: [D.T('İstemci', 'Client'), D.T('Sunucu', 'Server')], y0: 0, y1: 200 });
    S.message('m1', { x1: 0, x2: 300, y: 40, text: 'ClientHello' });
    S.message('m2', { x1: 300, x2: 0, y: 90, text: 'ServerHello' });
    S.step(D.T('el sıkışma', 'handshake'), {});
    checkFrame('lifelines/message', S);
    if (!S.has('lchat0') || !S.has('lchat1')) fail('lifelines', 'lane ids missing');
  }
  {
    const S = new D.Scene();
    S.lifelines('l3', { x: [0, 200, 400], labels: ['A', 'B', 'C'], y0: 0, y1: 120 });
    S.message('m3', { x1: 0, x2: 200, y: 30, text: 'x' });
    S.message('m4', { x1: 200, x2: 400, y: 60, text: 'y' });
    S.step('3 lanes', {});
    checkFrame('lifelines-3', S);
  }
  console.log(failures ? '…' : 'ok', 'scene.js helpers (memRow, lifelines, message)');
})();

for (const file of files) {
  for (const k of Object.keys(D.registry)) delete D.registry[k];
  delete require.cache[path.resolve(file)];
  require(path.resolve(file));
  const spec = Object.values(D.registry)[0];
  const id = spec.id;
  let runs = 0;
  const minSize = spec.minSize === undefined ? 10 : spec.minSize;

  function run(data, label) {
    let S;
    try {
      S = new D.Scene();
      spec.build(S, data);
    } catch (e) { fail(id, `${label}: build threw ${e && e.stack || e}`); return; }
    runs++;
    if (!S.frames.length) { fail(id, `${label}: no frames`); return; }
    const vb = D.viewBox(S.frames);
    if (!vb.every(Number.isFinite)) fail(id, `${label}: view box ${vb}`);
    S.frames.forEach((f, i) => {
      for (const lang of ['tr', 'en']) {
        // "undefined behavior" and "NaN (not a number)" are legitimate lecture terms; anything else is a JS leak
        const leak = t => /undefined|NaN/.test(t.replace(/undefined behaviou?r/gi, '').replace(/NaN \((not a number|sayı değil)\)/g, ''));
        const s = D.render(f.state, f.order, lang);
        if (/="[^"]*(undefined|NaN)/.test(s) || leak(s)) { fail(id, `${label}: step ${i + 1} (${lang}) renders undefined/NaN`); return; }
        const cap = f.cap && f.cap[lang];
        if (!cap || leak(cap)) { fail(id, `${label}: step ${i + 1} caption (${lang}) missing or broken: ${cap}`); return; }
      }
    });
    if (S.frames.some(f => f.at !== undefined)) {
      if (!spec.input) fail(id, `${label}: S.at() used but there is no input spec`);
      else {
        const toks = spec.input.tokens ? spec.input.tokens(data) : String(spec.input.format(data)).split(/\s+/).filter(Boolean);
        S.frames.forEach((f, i) => { if (f.at !== undefined && !(Number.isInteger(f.at) && f.at >= 0 && f.at < toks.length)) fail(id, `${label}: step ${i + 1} at=${f.at} outside the ${toks.length} input values`); });
      }
    }
    if (spec.reference) {
      let want;
      try { want = spec.reference(data); } catch (e) { fail(id, `${label}: reference threw ${e}`); return; }
      if (!same(S.result, want)) fail(id, `${label}: result ${JSON.stringify(S.result)} != reference ${JSON.stringify(want)}`);
    }
    if (spec.input) {
      try {
        const back = spec.input.parse(spec.input.format(data));
        if (!same(back, data)) fail(id, `${label}: parse(format(data)) changed the data`);
      } catch (e) { fail(id, `${label}: parse(format(data)) threw ${JSON.stringify(e)}`); }
    }
  }

  const levels = new Set(spec.presets.map(p => p.level || 'normal'));
  if (spec.presets.length < 3) fail(id, `only ${spec.presets.length} examples (need ≥ 3)`);
  for (const l of ['normal', 'hard', 'edge']) if (!levels.has(l)) fail(id, `no "${l}" example`);
  for (const p of spec.presets) {
    if (spec.size && spec.size(p.data) < minSize && !p.small) fail(id, `example ${p.id}: only ${spec.size(p.data)} values (need ≥ ${minSize})`);
    if (!p.name || !p.name.tr || !p.name.en) fail(id, `example ${p.id}: name needs tr and en`);
    run(p.data, `example ${p.id}`);
  }
  if (spec.random) {
    for (const level of spec.levels || ['easy', 'normal', 'hard', 'extreme']) {
      for (let seed = 1; seed <= 200; seed++) {
        let data;
        try { data = spec.random(level, D.rng(seed)); } catch (e) { fail(id, `random ${level}/${seed} threw ${e}`); continue; }
        if (spec.size && spec.size(data) < minSize) { fail(id, `random ${level}/${seed}: only ${spec.size(data)} values`); continue; }
        run(data, `random ${level}/${seed}`);
      }
    }
  } else fail(id, 'no random() generator');
  if (spec.input) {
    for (const bad of spec.input.bad || []) {
      try { spec.input.parse(bad); fail(id, `bad input accepted: "${bad}"`); }
      catch (e) { if (!e || !e.tr || !e.en) fail(id, `bad input "${bad}" must throw a {tr, en} message, got ${e}`); }
    }
  } else fail(id, 'no own-values input');
  console.log(`${failures ? '…' : 'ok'} ${id}: ${spec.presets.length} examples, ${runs} runs`);
}
console.log(failures ? `\n${failures} failure(s)` : '\nall tests passed');
process.exit(failures ? 1 : 0);
