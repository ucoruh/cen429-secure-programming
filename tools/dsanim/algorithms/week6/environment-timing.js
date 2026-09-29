// CEN429 — Week 6 — Demo 3 (code/week-06/03-environment-timing/environment.c)
// CPUID leaf 1's ECX bit 31 says whether a hypervisor is present. If it is, leaf 0x40000000 hands back a
// 12-byte ASCII vendor signature, three registers (EBX, ECX, EDX) of 4 bytes each, built here with explicit
// shifts (not a raw memory copy) so it can be replayed frame by frame. A hypervisor bit alone is a WEAK
// signal (WSL2/Hyper-V/VBS show it on ordinary laptops too).
(function (D) {
  'use strict';
  var T = D.T;
  // D.hex(n, 8) has a known bug for values with bit 31 set (it goes through a signed 32-bit AND
  // internally and can print a leading '-'); this local helper formats a full unsigned 32-bit value
  // safely and is used instead of D.hex(..., 8) throughout this file. D.hex(..., 2) for single bytes
  // is unaffected (values 0-255 never trip the bug) and is still used as-is.
  function hex32(n) {
    var s = (n >>> 0).toString(16).toUpperCase();
    while (s.length < 8) s = '0' + s;
    return s;
  }


  var C = [
    'static int hypervisor_bit(unsigned int ecx)',
    '{',
    '    return (ecx >> 31) & 1u;',
    '}',
    '',
    'static void vendor_signature(unsigned int ebx, unsigned int ecx, unsigned int edx, char out[13])',
    '{',
    '    unsigned int regs[3] = { ebx, ecx, edx };',
    '    int pos = 0;',
    '    for (int reg = 0; reg < 3; reg++) {',
    '        for (int byte = 0; byte < 4; byte++) {',
    '            unsigned char c = (unsigned char)((regs[reg] >> (8 * byte)) & 0xFFu);',
    '            if (c != 0 && (c < 32 || c > 126))',
    '                c = \'.\';',
    '            out[pos++] = (char)c;',
    '        }',
    '    }',
    '    out[12] = \'\\0\';',
    '}'
  ];

  function regBytes(str12) {
    var b = [];
    for (var i = 0; i < 12; i++) b.push(i < str12.length ? str12.charCodeAt(i) : 0);
    return b;
  }
  function vendorFromBytes(bytes) {
    var out = '';
    for (var i = 0; i < 12; i++) {
      var c = bytes[i];
      if (c === 0) out += '\u0000';
      else if (c < 32 || c > 126) out += '.';
      else out += String.fromCharCode(c);
    }
    return out;
  }

  function mk(hv, vendorText, elapsedMs, thresholdMs) {
    return { hv: !!hv, vendorText: hv ? vendorText : '', elapsedMs: elapsedMs, thresholdMs: thresholdMs };
  }

  /** Independent computation: builds the sanitized vendor string with String.replace + a regex instead of
   * build()'s byte-by-byte loop (a real NUL byte is padding and stays as-is, matching vendor_signature()'s
   * own contract; only a non-zero non-printable byte becomes '.'), and compares the elapsed time to the
   * threshold with a plain subtraction. */
  function reference(data) {
    var slice = data.hv ? data.vendorText.slice(0, 12) : '';
    var vendor = data.hv ? slice.replace(/[\x01-\x1f\x7f-\xff]/g, '.') : null;
    var blank = data.hv ? /^\u0000*$/.test(slice) : false;
    return { hv: data.hv, vendor: data.hv ? (blank ? null : vendor) : null, slow: data.elapsedMs - data.thresholdMs > 0 };
  }

  function build(S, data) {
    S.label('title', { x: 150, y: -18, text: T('(A) CPUID yaprak 1 — ECX yazmacı', '(A) CPUID leaf 1 — the ECX register'), anchor: 'middle', bold: true, size: 15 });
    var ecx = data.hv ? 0x80000000 : 0x00000000;
    S.box('ecx', { x: 0, y: 0, w: 300, h: 36, size: 15, mono: true, text: '0x' + hex32(ecx), style: 'active' });
    S.label('bitLbl', { x: 150, y: 54, text: T('bit 31 (hipervizör biti)', 'bit 31 (hypervisor bit)'), anchor: 'middle', size: 13 });
    S.step(T('CPUID yaprak 1 çalıştırılıyor; ECX = 0x' + hex32(ecx) + '.', 'CPUID leaf 1 runs; ECX = 0x' + hex32(ecx) + '.'), { c: [1, 3] });
    var hv = (ecx >>> 31) & 1;
    S.set('ecx', { style: hv ? 'new' : 'del' });
    S.step(T('bit 31 = ' + hv + ' -> hipervizör ' + (hv ? 'VAR' : 'yok (bare-metal gibi)') + '.',
              'bit 31 = ' + hv + ' -> hypervisor ' + (hv ? 'PRESENT' : 'absent (looks bare-metal)') + '.'), { c: [3] });

    if (hv) {
      var bytes = regBytes(data.vendorText);
      var W = 30, GAP = 2, Y = 110;
      S.label('vLbl', { x: -14, y: Y + 20, text: T('satıcı imzası =', 'vendor signature ='), anchor: 'end', size: 14, mono: true });
      var ids = S.memRow('v', bytes.map(function (b) { return { value: b }; }), { x: 0, y: Y, w: W, h: 32, gap: GAP, addrs: false });
      S.brace('ebxBr', { from: ids[0], to: ids[3], text: 'EBX', side: 'bottom' });
      S.brace('ecxBr', { from: ids[4], to: ids[7], text: 'ECX', side: 'bottom' });
      S.brace('edxBr', { from: ids[8], to: ids[11], text: 'EDX', side: 'bottom' });
      var out = '';
      for (var i = 0; i < 12; i++) {
        var c = bytes[i], display = (c !== 0 && (c < 32 || c > 126)) ? 46 /* '.' */ : c;
        out += String.fromCharCode(display === 0 ? 0 : display);
        S.set(ids[i], { above: String(i), style: 'new', text: c === 0 ? '' : String.fromCharCode(display) });
        if (i < 3) {
          var isNonPrintable = c !== 0 && (c < 32 || c > 126);
          var lineRefs = [12, { n: 13, note: T('c != 0 && (c<32 || c>126)? ' + (isNonPrintable ? 'evet' : 'hayır'), 'c != 0 && (c<32 || c>126)? ' + (isNonPrintable ? 'yes' : 'no')) }];
          lineRefs.push(isNonPrintable ? 14 : { n: 14, skip: true });
          lineRefs.push(15);
          S.step(T('bayt ' + i + ' = 0x' + D.hex(c, 2) + ' -> \'' + (c === 0 ? '(boş)' : String.fromCharCode(display)) + '\'',
                    'byte ' + i + ' = 0x' + D.hex(c, 2) + ' -> \'' + (c === 0 ? '(blank)' : String.fromCharCode(display)) + '\''), { c: lineRefs });
        }
      }
      var blank = out.replace(/\u0000/g, '').length === 0;
      S.label('vOut', { x: 12 * (W + GAP) + 16, y: Y + 22, text: blank ? T('(satıcı imzası gizli/boş)', '(vendor signature hidden/blank)') : '"' + out + '"', anchor: 'start', size: 14, bold: true });
      S.step(T('12 bayt birleştirilince satıcı imzası: ' + (blank ? '(boş)' : '"' + out + '"') + '.',
                'The 12 bytes combine into the vendor signature: ' + (blank ? '(blank)' : '"' + out + '"') + '.'), { c: [17] });
    }

    // ---- (B) timing ----
    var TY = hv ? 260 : 100;
    S.label('tLbl', { x: 150, y: TY - 20, text: T('(B) zamanlama ölçümü (yalnız bilgilendirme)', '(B) timing measurement (informational only)'), anchor: 'middle', bold: true, size: 15 });
    S.box('elapsed', { x: 0, y: TY, w: 140, h: 34, size: 14, text: data.elapsedMs.toFixed(1) + ' ms', style: 'active' });
    S.box('threshold', { x: 160, y: TY, w: 140, h: 34, size: 14, text: data.thresholdMs.toFixed(1) + ' ms', style: 'dim' });
    S.label('elapsedAbove', { x: 70, y: TY - 6, text: T('geçen süre', 'elapsed'), anchor: 'middle', size: 12 });
    S.label('thresholdAbove', { x: 230, y: TY - 6, text: T('eşik', 'threshold'), anchor: 'middle', size: 12 });
    var slow = data.elapsedMs > data.thresholdMs;
    S.set('elapsed', { style: slow ? 'del' : 'new' });
    S.step(T('Geçen süre ' + data.elapsedMs.toFixed(1) + ' ms, eşik ' + data.thresholdMs.toFixed(1) + ' ms -> ' + (slow ? 'BEKLENENDEN YAVAŞ (tek-adım/emülasyon işareti olabilir)' : 'normal aralıkta') + '.',
              'Elapsed ' + data.elapsedMs.toFixed(1) + ' ms, threshold ' + data.thresholdMs.toFixed(1) + ' ms -> ' + (slow ? 'SLOWER than expected (could hint at single-stepping/emulation)' : 'within the normal range') + '.'), {});

    S.result = { hv: hv === 1, vendor: hv ? (out.replace(/\u0000/g, '').length === 0 ? null : out) : null, slow: slow };
    if (hv) {
      S.step(T('SONUÇ: hipervizör GÖRÜLDÜ. WSL2/Hyper-V/VBS de böyle görünür — tek başına "analiz ortamı" demek değildir.',
                'RESULT: a hypervisor was SEEN. WSL2/Hyper-V/VBS also look like this — this alone does not mean "analysis environment".'), {});
    } else {
      S.step(T('SONUÇ: hipervizör görünmüyor (bare-metal olabilir).', 'RESULT: no hypervisor visible (may be bare-metal).'), {});
    }
  }

  D.define({
    id: 'environment-timing',
    title: T('VM/emülatör algılama: CPUID + zamanlama (environment.c)', 'VM/emulator detection: CPUID + timing (environment.c)'),
    code: function () { return { c: C }; },
    minSize: 10,
    size: function () { return 12; },
    presets: [
      { id: 'bare-metal', level: 'normal', name: T('Normal: bare-metal, hipervizör yok', 'Normal: bare-metal, no hypervisor'),
        data: mk(false, '', 4.2, 9.0) },
      { id: 'kvm', level: 'hard', name: T('Zor: KVM altında, satıcı imzası "KVMKVMKVM"', 'Hard: under KVM, vendor signature "KVMKVMKVM"'),
        data: mk(true, 'KVMKVMKVM\u0000\u0000\u0000', 5.1, 9.0) },
      { id: 'edge-blank-vendor', level: 'edge', name: T('Uç durum: hipervizör var ama satıcı imzası tamamen boş', 'Edge case: a hypervisor is present but the vendor signature is entirely blank'),
        data: mk(true, '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000', 6.0, 9.0) },
      { id: 'edge-slow-timing', level: 'edge', name: T('Uç durum: hipervizör yok ama zamanlama eşiği çok aşıyor', 'Edge case: no hypervisor, but the timing far exceeds the threshold'),
        data: mk(false, '', 41.0, 9.0) }
    ],
    levels: ['easy', 'normal', 'hard', 'extreme'],
    random: function (level, r) {
      var hv = D.randInt(r, 0, 1) === 1;
      var vendors = ['KVMKVMKVM\u0000\u0000\u0000', 'VMwareVMware', 'Microsoft Hv', 'VBoxVBoxVBox', 'XenVMMXenVMM'];
      var vendorText = hv ? vendors[D.randInt(r, 0, vendors.length - 1)] : '';
      var baseMs = { easy: [3, 6], normal: [3, 8], hard: [4, 30], extreme: [4, 60] }[level] || [3, 8];
      var elapsed = Math.round((baseMs[0] + r() * (baseMs[1] - baseMs[0])) * 10) / 10;   // rounded so format()/parse() round-trips exactly
      return mk(hv, vendorText, elapsed, 9.0);
    },
    input: {
      hint: T('hv=evet|hayir vendor=<24 onaltılık karakter> elapsed=<ms>', 'hv=yes|no vendor=<24 hex chars> elapsed=<ms>'),
      format: function (data) {
        var v = data.hv ? regBytes(data.vendorText).map(function (b) { return D.hex(b, 2); }).join('') : 'none';
        return 'hv=' + (data.hv ? 'yes' : 'no') + ' vendor=' + v + ' elapsed=' + data.elapsedMs.toFixed(1);
      },
      tokens: function (data) { return data.hv ? regBytes(data.vendorText).map(function (b) { return D.hex(b, 2); }) : ['none']; },
      parse: function (text) {
        var s = String(text).trim();
        var m = s.match(/^hv=(yes|no)\s+vendor=(\S+)\s+elapsed=([0-9.]+)$/i);
        if (!m) throw T('Biçim: "hv=yes|no vendor=<24 onaltılık karakter ya da none> elapsed=<ms>" olmalı.', 'Format must be "hv=yes|no vendor=<24 hex chars or none> elapsed=<ms>".');
        var hv = /yes/i.test(m[1]);
        var vendorField = m[2];
        var elapsed = parseFloat(m[3]);
        var vendorRaw = '';
        if (hv) {
          if (!/^[0-9a-fA-F]{24}$/.test(vendorField)) throw T('vendor tam olarak 24 onaltılık karakter (12 bayt) olmalı.', 'vendor must be exactly 24 hex characters (12 bytes).');
          for (var i = 0; i < 24; i += 2) vendorRaw += String.fromCharCode(parseInt(vendorField.substr(i, 2), 16));
        }
        if (!(elapsed >= 0)) throw T('elapsed negatif olamaz.', 'elapsed cannot be negative.');
        return mk(hv, vendorRaw, elapsed, 9.0);
      },
      bad: ['', 'hv=maybe vendor=none elapsed=1', 'hv=yes vendor=short elapsed=1', 'hv=no vendor=none elapsed=-3', 'hv=yes vendor=zz00112233445566778899aabb elapsed=1']
    },
    reference: reference,
    build: build
  });
})(typeof DSAnim !== 'undefined' ? DSAnim : require('../../web/scene.js'));
