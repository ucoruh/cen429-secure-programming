---
marp: true
theme: cen429
paginate: true
lang: en
title: "CEN429 Week 4 — Code Hardening: C/C++"
author: "Asst. Prof. Dr. Uğur CORUH"
header: "CEN429 Secure Programming · Week 4"
footer: "RTEU Computer Engineering · 2026-2027 Fall"
---




<!-- _class: baslik -->
<!-- _paginate: false -->

# Code Hardening: C/C++

**CEN429 Secure Programming — Week 4**

Asst. Prof. Dr. Uğur CORUH · 09.10.2026

<!--
Speaker note: This week we harden the code itself: first bug-free code, then protections that limit the damage if a bug slips through, and finally obfuscation that makes it harder to read.
-->

<!--
Speaker note: This week we harden the code itself: first bug-free code, then protections that limit the damage if a bug slips through, and finally obfuscation that makes it harder to read.
-->

---

# Today's Plan (3 Hours)

| Hour | Section | Topic |
| --- | --- | --- |
| 1 | 1 | Layers of hardening · SEI CERT · input validation principles · CERT pairs |
| 2 | 2–4 | Format string **Demo 1** · UAF **Demo 2** · integer/UB **Demo 3** · error handling/signals · static analysis · sanitizers · fuzzing **Demo 4** |
| 3 | 5–7 | Compiler/OS protections **Demo 5** · secure build pipeline (CI) · code obfuscation **Demo 6–7** · end to end · project |

**Learning outcome:** LO.3 (binary application protections)

<!-- Speaker note: This week we harden the code itself. We assume students know C but not security terms; we will define every term. Demos are under code/week-04. -->

---

<!-- _class: yogun -->

# A Brief History — the Race Between Memory Bugs and Defences

- **1988** — **Morris Worm** announces the buffer overflow to the world
- **1996** — *Smashing the Stack for Fun and Profit* teaches exploitation to everyone
- **1998 → 2004** — **canary** (StackGuard) · **ASLR** (PaX) · **DEP/NX** · FORTIFY
- **2012–13** — **AddressSanitizer** and **fuzzing** (AFL) catch bugs automatically

> This course follows this race: write the bug → let the tool catch it → let the compiler/OS protect.

---

# What We Bring from Earlier Weeks

- **Process memory: stack and heap** — the stack automatically manages the local variables of function calls, the heap is managed manually with `malloc`/`free` **(Week 1)**
- **Buffer overflow** — writing more data to an array than its allocated size; the overflowing bytes land on neighbouring memory **(Week 1)**
- **Stack frame and return address** — the region a function call gets on the stack, holding its local variables and the return address **(Week 1)**
- **The white-box attacker model** — the owner of the device is also a possible attacker; they can read memory, attach a debugger **(Week 1)**
- **CWE** — a numbered catalogue of software weaknesses **(Week 2)**

This week: on top of these foundations we build SEI CERT rules, sanitizers, and compiler/OS protections — applying the Weeks 1–3 principles/threat-model/crypto foundation to the C/C++ code itself.

---

<!-- _class: yogun -->

# This Week's Concepts

Each term is defined once, where it first appears in the body; here we only mark **where**.

| Concept | Where |
| --- | --- |
| Layers of hardening · SEI CERT | Section 1 |
| Input validation principles | Section 1 |
| Format string vulnerability | Section 2 |
| Use-after-free (UAF) | Section 3 |
| Undefined behaviour (UB) | Section 3 |
| Error handling, signals | Section 3 |
| Static analysis · sanitizers · fuzzing | Section 4 |
| Compiler/OS protections · CI | Section 5 |
| Code obfuscation | Section 6 |

---

# Pointer

- **Pointer:** a variable that holds a memory **address**.
- `p` is an address; `*p` is the value at that address.
- Wrong address → crash or wrong data.

---

# Compiler Flag

- **Flag:** an option passed to the compiler.
- Example: `-O2` (optimisation), `-Wall` (warnings), `-fsanitize=address`.
- The right flags catch many bugs **at compile time**.

---

# Warning vs Error

- **Error:** compilation stops.
- **Warning:** compilation continues but a problem is reported.
- Rule: **turn warnings into errors** (`-Werror`) — an ignored warning is a future vulnerability.

---

# How Do the Demos Work?

- Demos live under `code/week-04`; they run on **Windows (Visual Studio 2022)** and **WSL/Linux**.
- Build: Windows `.\build.ps1` · WSL/Linux `./build.sh`
- Run: in each demo folder, Windows `.\demo.ps1` · WSL/Linux `sh demo.sh`
- **Fuzzing (Demo 4)** needs **clang** on Linux/WSL (`sudo apt install -y clang`); on Windows it needs Visual Studio's "C++ AddressSanitizer" component.

> ⚠️ **Ethics:** the demos run only against **our own small programs**; none of them touch another program or system.

---

<!-- _class: bolum -->

# 1. Layers and SEI CERT

---

# Three Layers, the Right Order

Code hardening is three layers. The order matters:

1. **First, bug-free code** (secure coding)
2. **Then, limit the damage** (compiler/OS protections)
3. **Finally, make it harder to read** (obfuscation)

> ⚠️ Obfuscation does **not fix** the bug.

---

# Why This Order?

- Adding protection to buggy code is like painting over a rotten foundation.
- First **remove** the bug; then **catch** what slips through; finally **slow down** reverse engineering.
- We will see all three this week, in this order.

---

# Anatomy of a CERT Rule — Diagram

**SEI CERT C/C++:** the rulebook of secure coding, distilled from real-world vulnerabilities.

![w:900](assets/h04-15-cert-kural-anatomisi.svg)

---

# Three Layers — Diagram

![w:950](assets/h04-05-uc-katman.svg)

---

# Layer 2 · Secure Coding

- **Question:** is there a bug in my code?
- **Tools:** CERT rules, sanitizers, fuzzing.
- **Goal:** not writing the bug in the first place.

---

# Layer 3 · Compiler/OS

- **Question:** if a bug slips through, is it hard to exploit?
- **Tools:** canary, FORTIFY, ASLR, NX, RELRO, CFI.
- **Goal:** making exploitation of the remaining bug expensive.

---

# Layer 4 · Obfuscation

- **Question:** does someone reading the code understand it?
- **Tools:** symbol/string hiding, removing logging, flattening.
- **Goal:** slowing down reverse engineering.

---

# From the Field: Scheme Requirements

In a certified product:

- "Common vulnerabilities must be addressed: sensitive data, injection, overflow, language-specific weaknesses"
- "Defensive programming **consistent across the entire codebase**"
- "Protection against static and dynamic reverse engineering"

➡️ Eighteen hardening measures on the native side **alone**.

---

# SEI CERT: What Does a Rule Look Like?

Parts of every CERT rule:

- **Identifier:** `STR31-C`, `MEM50-CPP`
- **Title:** one sentence
- **Noncompliant example** and **compliant solution**
- **Risk level** (L1/L2/L3) and a **CWE** link

---

# Rule or Recommendation?

- **Rule:** violating it is a **vulnerability**, and it can be checked automatically.
- **Recommendation:** good practice.
- Start a review with **L1** (highest risk) rules.

---

# How Is the Risk Level Determined?

Risk = **severity × likelihood × cost to fix**.

- **L1:** high risk, these first.
- **L2 / L3:** progressively lower.

---

<!-- _class: yogun -->

# CERT Categories (1)

| Abbreviation | Category | Example |
| --- | --- | --- |
| INT | Integers | INT32-C: do not allow signed overflow |
| ARR/STR | Array/string | STR31-C: allocate sufficient space |
| MEM | Memory | MEM30-C: do not access freed memory |
| FIO | File I/O | FIO30-C: exclude input from the format string |

---

<!-- _class: yogun -->

# CERT Categories (2)

| Abbreviation | Category | Example |
| --- | --- | --- |
| ENV | Environment | ENV33-C: do not call `system()` |
| SIG | Signals | SIG30-C: only safe fn. in the handler |
| ERR | Error handling | ERR33-C: detect a library error |
| CON/MSC | Concurrency/misc | CON43-C, MSC32-C |

C++: MEM50-CPP, CTR50-CPP, STR50-CPP, EXP53-CPP, ERR50-CPP.

---

# Automated CERT Auditing

- Warnings: `-Wall -Wextra -Wformat=2 -Wconversion`
- `clang-tidy cert-*`
- `cppcheck --addon=cert`
- MSVC `/analyze`

> The evaluator runs this scan first, then reads by hand.

---

<!-- _class: bolum -->

# Input Validation

---

# Input Validation — Diagram

![w:950](assets/h04-06-girdi-dogrulama.svg)

---

# Where Does Input Come From?

From more places than you'd think. And **all of it is untrusted**:

- Command line, environment variables
- File, network
- IPC (another process on the same machine)
- Database, library interface (JNI)

---

# Commonly Forgotten Inputs

- Even `argv[0]` can be the attacker's; `PATH`, `LANG`.
- **Length fields** inside a file format.
- Network: says "16 bytes," sends 1 byte.
- "Our own data" may have changed since.

---

# Five Principles of Input Validation

1. **Allow-list** (enumerate what's permitted), not a deny-list.
2. **Canonicalize first**, then validate.
3. **Length → type → range → format**, in that order.
4. At the **trust boundary**, as early as possible.
5. **Reject**, don't "clean up" and use it anyway.

---

# Principle 1 · Allow-List

- **Deny-list:** "these are forbidden" — something always gets forgotten.
- **Allow-list:** "only these are permitted" — a safe default.

Example: a username may only contain `[a-z0-9_]`.

---

# Principle 2 · Canonicalize

- The same thing, spelled differently: `/tmp/../etc`, `%2e%2e/`.
- Reduce it to **one form** (canonicalize) first, then check it.
- Otherwise the check can be bypassed.

---

# Principle 3 · `strtol`, Not `atoi`

```c
errno = 0;
long value = strtol(s, &end, 10);
if (end == s)         return -1;  /* no digits at all */
if (*end != '\0')     return -1;  /* "12abc" */
if (errno == ERANGE)  return -1;  /* overflowed */
if (value < min_val || value > max_val) return -1;  /* business rule */
```

---

# Why Is `atoi` Dangerous?

- `atoi("abc")` = 0 (the error is silent)
- `atoi("99999999999")` = **undefined** (overflow)
- `atoi("12abc")` = 12 (the extra characters are ignored)

> `strtol` reports **every error** to you; `atoi` does not.

---

# Principle 3 · a Length-Prefixed Record

```c
if (remaining < 3) return -1;                     /* not even a header */
uint16_t length = buffer[1] << 8 | buffer[2];
if (length > remaining - 3)     return -1;         /* SOURCE: declared > received */
if (length > sizeof rec->data)  return -1;         /* DEST: doesn't fit */
memcpy(rec->data, buffer + 3, length);
```

---

# Two Separate Checks, the Right Order

- **Source check:** is the declared length greater than the data that arrived?
- **Destination check:** does it fit in the destination buffer?
- Order: `remaining < 3` **first**, so `remaining - 3` does not wrap.
- In the field: every array coming from JNI is **re-validated** on the native side.

---

# CERT Pair · STR31-C

```c
strcpy(copy, name);                               /* WRONG */
int n = snprintf(copy, sizeof copy, "%s", name);  /* COMPLIANT */
if (n < 0 || (size_t)n >= sizeof copy) { /* truncated */ }
```

`strcpy` does not know bounds; `snprintf` knows the size and reports **truncation**.

---

# CERT Pair · INT30-C

```c
size_t remaining = total - read_count;  /* WRONG: read_count>total → huge number */
if (read_count > total) return ERROR;   /* COMPLIANT: check order first */
size_t remaining = total - read_count;
```

Unsigned subtraction **wraps**; check the logic first.

---

# CERT Pair · MEM30-C

```c
for (n = head; n; n = n->next) free(n);              /* WRONG */
while (n) { Node *s = n->next; free(n); n = s; }      /* COMPLIANT */
```

Reading `n->next` after `free(n)` = accessing freed memory.

---

# CERT Pair · ERR33-C

```c
FILE *f = fopen(path,"rb"); fread(t,1,n,f);        /* WRONG */
if (!f) return ERROR;
if (fread(t,1,n,f) < n && ferror(f)) return ERROR; /* COMPLIANT */
```

Check **every** return value; `fopen` can return NULL.

---

# Rule: Tie the Finding to an Identifier

Match every finding to a CERT identifier:

> "This line is a MEM30-C violation (CWE-416)."

This makes the finding **objective** and **searchable**.

---

# Section 1 — Quick Check

1. The three layers, and the right order?
2. Difference between a rule and a recommendation?
3. Why is `atoi` more dangerous than `strtol`?

<!-- Speaker note: Next, the format string vulnerability. -->

---

# Section 1 — Answers

1. **Order:** secure code (source) → **compiler/tool** protections → **OS/runtime** protections. First write it correctly, then harden it, then defend it at runtime.
2. A **rule** always applies, and violating it is a defect; a **recommendation** is good practice depending on context.
3. `atoi` does **not report** errors (undefined/0 on overflow/invalid input); `strtol` lets you check **both the error and the bound** via `endptr`+`ERANGE`.

---


<!-- _class: bolum -->

# 2. Format String Vulnerability

---

# Format String Vulnerability — Diagram

![w:950](assets/h04-07-bicim-dizisi.svg)

---

# The Problem · `printf(input)`

```c
printf(user_input);        /* WRONG */
printf("%s", user_input);  /* CORRECT */
```

In the first case, user input is interpreted as a **format string**.

---

# Why Is It Dangerous?

`printf` treats the `%` markers in the format string as a **command**.

If the user supplies `%x`, `%s`, `%n`, they make the program do work.

---

# Brief History · Format String Bugs

- **1999–2000** — real vulnerabilities in widely used FTP servers like **wu-ftpd** brought this bug class to wide attention.
- Attackers used user data that leaked into logging calls as a format string to leak information, even achieve remote code execution.
- Lesson: a "harmless-looking" marker like `%n` is actually a **write primitive**.
- Response: `-Wformat-security` at compile time, `_FORTIFY_SOURCE` at run time.

---

# Marker · `%x`, `%p`

- **Reads** values off the stack and prints them.
- → **information leak** (addresses, secret values).
- Weakens ASLR (if an address leaks).

---

# Marker · `%s`

- Treats a value on the stack as a **pointer** and reads the string at that address.
- Random address → crash or memory read.

---

# Marker · `%n`

- **Writes** the number of characters printed so far to an address.
- → **writes to memory** → corruption, hijacking control.
- The most dangerous one.

---

# The Same Bug Elsewhere

Not just `printf`:

`syslog`, `fprintf`, `snprintf`, `err`/`warn` — they all take a format string.

Rule: the format string is **always constant** (FIO30-C).

---

<!-- _class: yogun -->

# Demo 1 — Format String

`code/week-04/01-format-string` · CWE-134

| Step | What Is Seen? |
| --- | --- |
| 0 | GCC `-Wformat-security` warns; MSVC `/analyze` catches it |
| 2 `%x.%x…` | The stack is dumped, the **secret (synthetic) value** appears |
| 3 `AAAA%n` | Unprotected Linux crashes; Windows CRT rejects `%n` |
| 4 | `_FORTIFY_SOURCE`: `%n in writable segment` |
| 5 | Markers appear only as text |

---

# Animation — %x scans the stack

<iframe class="dsanim" src="anim/format-string.html?mode=slide&lang=en" title="Format string vulnerability: %x scans the stack"></iframe>

<!-- Speaker note: show live how %x scans argument slots in order, where it reaches the secret value, and open the "what %n would do" preset too. -->

---

# Animation — Edge Case: What `%n` Would Do Next

<iframe class="dsanim" src="anim/format-string.html?mode=slide&lang=en&example=percent-n" title="Format string vulnerability: the %n write primitive (edge case)"></iframe>

<!-- Speaker note: open the "percent-n" preset from the selector; emphasize that %n does not just read, it writes — this is why a "harmless-looking" marker is actually a write primitive. -->

---

# The Fix · Layer by Layer

1. The format string is always **constant** (FIO30-C).
2. Warning: `-Wformat -Wformat-security -Werror=format-security`.
3. Have the compiler **check** your own function too:

```c
void gunluk_yaz(int duzey, const char *bicim, ...)
    __attribute__((format(printf, 2, 3)));
```

4. Runtime: `_FORTIFY_SOURCE=2`; MS CRT has `%n` disabled.

---

<!-- _class: bolum -->

# 3. Memory: Use-After-Free

---

# Stack and Heap — Diagram

![w:950](assets/h04-13-yigin-obek.svg)

---

# Use-After-Free — Diagram

![w:950](assets/h04-08-uaf.svg)

---

# What Is UAF? · Step 1

- An object is on the heap.
- **Two pointers** point to the same object.

---

# UAF · Step 2

- One of them `free`s it.
- The other still holds that address → a **dangling** pointer.

---

# UAF · Step 3

- The allocator gives the same block to **another object**.
- The dangling pointer now reads/writes **foreign data**.
- If the object has a **function pointer** (C++ virtual table), the risk grows.

---

# Why Is UAF So Common?

Most of the "memory corruption fixed" notes in browser/OS updates fall into this class.

Complex ownership → a dangling pointer.

---

<!-- _class: yogun -->

# Demo 2 — UAF and Double Free

`code/week-04/02-use-after-free` · CWE-416/415 · MEM30-C

| Step | What Is Seen? |
| --- | --- |
| 1 | The freed block gets reused → role `user` → `admin` |
| 2 ASan | `heap-use-after-free` + locations |
| 3 | Double `free` → undefined behaviour |
| 4 ASan | `attempting double-free` |
| 5 | `free` + `NULL`, single owner → safe |

---

# Animation — a small heap

<iframe class="dsanim" src="anim/use-after-free.html?mode=slide&lang=en" title="Use-after-free and double-free"></iframe>

<!-- Speaker note: show live how a freed block goes onto the free list and how the next malloc hands it back; switch to the "double-free" preset too. -->

---

# Animation — Edge Case: Double Free

<iframe class="dsanim" src="anim/use-after-free.html?mode=slide&lang=en&example=double-free" title="Double-free, edge case"></iframe>

<!-- Speaker note: open the "double-free" preset from the selector; show live how freeing the same pointer a second time corrupts the allocator's free list, and how this usually opens the door to a further heap overflow. -->

---

# ASan Report · Three Stack Traces

```text
ERROR: heap-use-after-free
  #0 mode_uaf uaf.c:49   <- 1. USE
freed here:
  #1 mode_uaf  uaf.c:38   <- 2. FREE
allocated here:
  #1 mode_uaf     uaf.c:32   <- 3. ALLOCATION
```

The fix is usually at **location 2**: the ownership decision was wrong there.

---

# Fix · the C Side

- Set the pointer to `NULL` after `free`.
- Establish a **single owner**, a single release point.
- Write down the ownership rule: "who releases this memory?"

---

<!-- _class: yogun -->

# Fix · C++ Smart Pointers

| Need | C++ |
| --- | --- |
| Single owner | `std::unique_ptr` |
| Shared | `std::shared_ptr` |
| Non-owning observation | `std::weak_ptr` → `lock()` |
| Array | `std::vector`, `std::array` |

```cpp
if (auto o = cache.lock()) use(*o);  // otherwise stale memory is never accessed
```

⚠️ `get()` is a raw pointer; when a `vector` grows, its iterators are invalidated.

---

<!-- _class: bolum -->

# Integers and UB

---

# Integer Overflow — Diagram

![w:950](assets/h04-09-tamsayi.svg)

---

# Four Integer Bugs

| Bug | Example | Result |
| --- | --- | --- |
| Unsigned wraparound | `0u - 1` = 4,294,967,295 | Logic error |
| Signed overflow | `INT_MAX + 1` | **Undefined** |
| Conversion loss | `long long`→`int` | Truncation |
| Shift | `1 << 31` | Undefined |

---

# Why Does It Matter? · Multiplication Overflow

```c
uint32_t size = count * 4;   /* count = 0x40000001 → size = 4 */
array = malloc(size);        /* small block */
/* loop writes `count` times → heap overflow */
```

Writing too much into a small allocated block = an overflow.

---

# UB · the Compiler Can Delete the Check

**Undefined behaviour (UB):** an operation whose result the C/C++ standard does not define (e.g., signed integer overflow).

```c
if (x + 100 < x)   /* assumes "if it overflows, it gets smaller" */
    return -1;     /* signed overflow is UB → the compiler MAY DELETE this branch */
```

- It "works" at `-O0`, at `-O2` the check **disappears**.
- UB cannot be relied on.

---

# Correct: Check First

```c
if ((b > 0 && a > INT_MAX - b) ||
    (b < 0 && a < INT_MIN - b)) return false;   /* before the overflow */
if (__builtin_mul_overflow(a, b, &result)) return false;  /* GCC/Clang */
/* C23: <stdckdint.h> ckd_add/ckd_mul · MSVC: <intsafe.h> */
```

Catch the overflow **before it happens**.

---

<!-- _class: yogun -->

# Demo 3 — UB and UBSan

`code/week-04/03-undefined-behavior` · CWE-190/758

- Signed overflow, invalid shift, misaligned access
- On x86, most produce a wrong result **silently**
- `-fsanitize=undefined` → `signed integer overflow: 2147483647 + 1 ...`
- Windows: no UBSan → `/RTC`, `/analyze`, CERT

⚠️ `-fwrapv` **hides** the logic error; do not use it for diagnosis.

---

# Animation — INT_MAX + add

<iframe class="dsanim" src="anim/integer-overflow.html?mode=slide&lang=en" title="Signed integer overflow: INT_MAX + add"></iframe>

<!-- Speaker note: show live how the unchecked add silently wraps, and how checked_add catches the same overflow before adding. -->

---

# Animation — Edge Case: the Secure Version Rejects the Same Input

<iframe class="dsanim" src="anim/integer-overflow.html?mode=slide&lang=en&example=edge-secure" title="Integer overflow: the secure version rejects the same mix (edge case)"></iframe>

<!-- Speaker note: open the "edge-secure" preset from the selector; compare side by side how the SAME sequence of adds that leads to UB in the buggy version is stopped by checked_add BEFORE adding in the compiled secure version. -->

---

<!-- _class: bolum -->

# Error Handling and Signals

---

# Signal Handler — Diagram

![w:950](assets/h04-12-sinyal.svg)

---

# Unchecked Return Value

| Call | If Not Checked |
| --- | --- |
| `malloc` | Writing to NULL |
| `setresuid` | Stays privileged |
| `RAND_bytes` | The "random" key is zero |
| `EVP_DecryptFinal_ex` | Tampered data is assumed verified |

---

# Rules for Error Handling

1. Check every return value (ERR33-C); `[[nodiscard]]`.
2. On error, return to a **safe state** (`goto cleanup`) — **fail-closed**.
3. The message must not give a hint: "no such user" ≠ "wrong password."

---

# From the Field: Opaque Return Values

- Native functions do not return a detailed **error code**.
- Only success/failure, and even that is **opaque** (Week 9).
- A detailed code = a map for the attacker of "which check you tripped."
- A separate, secure channel for diagnosis → recorded as a **trade-off**.

---

# Signal Handler · Rule

```c
static volatile sig_atomic_t stop = 0;
static void handler(int s){ (void)s; stop = 1; }  /* ONLY a flag */
```

- No `printf`, `malloc`, `free` in the handler (SIG30-C).
- Do not call functions that are not async-signal-safe.
- `sigaction()` instead of `signal()`.

---

# Real Incident: regreSSHion

- 2024 CVE-2024-6387: the timeout **signal handler** called an unsafe logging function.
- Result: remote code execution risk.
- Lesson: only set a flag inside a handler.

---

# Section 2–3 — Quick Check

1. Why is `%n` the most dangerous?
2. The three traces in a UAF report? Which one gets the fix?
3. Why can `if (x+100 < x)` be deleted?
4. Why is there no `printf` in a signal handler?

<!-- Speaker note: After the break, static analysis, sanitizers, fuzzing. -->

---

# Section 2–3 — Answers

1. `%n` **WRITES** the number of bytes printed so far **to memory** → an attacker can write to an address of their choosing and hijack control flow.
2. **allocated-by · freed-by · use-here.** The fix is usually **between freed↔use**: set the pointer to `NULL` after `free`, or fix the lifetime.
3. Signed overflow is **undefined behaviour**; the compiler assumes "overflow never happens" → the condition is always `false` → it **deletes** it. Do the check with `__builtin_add_overflow`.
4. `printf` is **not async-signal-safe**; if the handler re-enters it, locks/state get corrupted → deadlock/crash. Only safe calls like `write` are allowed.

---


<!-- _class: bolum -->

# 4. Static Analysis, Sanitizers, Fuzzing

---

# ASan Redzone — Diagram

![w:950](assets/h04-11-asan.svg)

---

# Static ↔ Dynamic — Diagram

![w:950](assets/h04-10-statik-dinamik.svg)

---

# What Is Static Analysis?

Examining code **without running** it, looking for bugs.

Advantage: it also sees paths that never execute.
Disadvantage: it produces **false alarms**.

---

<!-- _class: yogun -->

# Static Analysis · Layer by Layer

| Level | Tool | What It Finds |
| --- | --- | --- |
| Warnings | `-Wall -Wextra -Wconversion` | Conversion, format |
| Analyser | `-fanalyzer`, `clang --analyze`, `/analyze` | NULL, leaks |
| Rule | `clang-tidy cert-*`, `cppcheck` | CERT violation |
| Semantic | CodeQL, Semgrep | Data flow |
| Commercial | Coverity, Klocwork | Deep analysis |

---

# Tainted Data: Source → Sink

![w:900](assets/h04-14-kirli-veri.svg)

The tool sees **unvalidated** data flowing to a dangerous place.

---

# Living with False Alarms

1. Start with **high-confidence** rules.
2. Every suppression has a **reason**: `// NOLINT(cert-err33-c): neden`.
3. **Zero warnings** on new code (enforced by CI).

> The evaluator asks for the developer's own scan report.

---

# What Is a Sanitizer?

A tool that catches memory/UB bugs while the program runs.

Almost no false alarms; but it only finds bugs on the path that **actually executes**.

→ combine with tests + fuzzing.

---

# Brief History · AddressSanitizer

- **2012** — Google released **AddressSanitizer** (ASan): compile-time instrumentation + shadow memory catches overflow/UAF **immediately**.
- Before this, this class of bug usually crashed **silently** or went unnoticed entirely.
- ASan + fuzzing together catch input that doesn't crash the program but does corrupt memory (this week's Sections 4/11).

---

<!-- _class: yogun -->

# The Sanitizer Family

| Sanitizer | Finds | Flag |
| --- | --- | --- |
| **ASan** | Overflow, UAF, double free | `-fsanitize=address` |
| **LSan** | Leaks | with ASan |
| **UBSan** | Overflow, shift, NULL | `-fsanitize=undefined` |
| **MSan** | Uninitialized reads | `-fsanitize=memory` |
| **TSan** | Data race | `-fsanitize=thread` |

---

# How Does ASan Work? · Shadow Memory

- One **shadow byte** per 8 bytes: how much of it is valid?
- A **poisoned region** (redzone) before/after arrays.
- Freed blocks wait in **quarantine**.
- A shadow check before every access.

---

# ASan's Blind Spot

```c
struct { char name[8]; long role; } k;
strcpy(k.name, long_input);   /* name → role overflows */
```

A field-to-field overflow **inside** the same structure → no poisoned region in between → ASan **cannot see it** (Week 1 Demo 3).

---

# Sanitizers Do Not Ship in the Release Build

```bash
gcc -g -O1 -fno-omit-frame-pointer \
    -fsanitize=address,undefined p.c -o p_test
```

- Slows things down (~2×), uses memory.
- Only in **test/CI**; disabled in the release build.

---

# What Is Fuzzing? · Coverage-Guided

**Fuzzing:** feeding a program a large number of automatically generated, mostly malformed inputs to look for crashes.

![w:900](assets/h04-01-fuzzing-dongusu.svg)

An input that opens a new code path is **saved** and worked on further.

---

# What Does Fuzzing Find?

- It finds magic bytes and the right length field **on its own**.
- Inputs a human would never think of.
- Tools: libFuzzer, AFL++, honggfuzz, OSS-Fuzz (tens of thousands of bugs).

---

# Brief History · Fuzzing

- **1990** — Barton Miller's "Fuzz" study crashed 25-33% of Unix utilities with random input; the academic origin of fuzzing.
- **2013** — **AFL** (american fuzzy lop) made coverage feedback practical and mainstream.
- Then came **libFuzzer** (built into the compiler, fast) and OSS-Fuzz (a service that continuously fuzzes major open-source projects).

---

# Writing a Fuzz Target

```c
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    parse_document((const unsigned char *)data, size);
    return 0;
}
```

```bash
clang -g -O1 -fsanitize=fuzzer,address fuzz.c parser.c -o f
./f corpus/ -max_total_time=10
```

---

# A Good Fuzz Target

Four properties:

- **Fast** (no network/disk)
- **Deterministic** (same input → same result)
- **Stateless** (not affected by the previous call)
- **Single job** (tests one function)

---

<!-- _class: yogun -->

# Demo 4 — Finding Bugs with Fuzzing

`code/week-04/04-fuzzing` · CWE-125/787

| Step | What Happens? |
| --- | --- |
| 1 | `seeds/normal.bin` is fine |
| 2 | libFuzzer ≤ 10 s → a crashing input |
| 3 | Replay with ASan → full report |
| 4 | Fixed version → no crash |
| 5 | `crash.bin` is safely rejected |

> "This function was fuzzed for this long" = strong evidence (S16).

---

# Animation — an allow-list parser

<iframe class="dsanim" src="anim/input-validation.html?mode=slide&lang=en" title="Input validation: an allow-list parser"></iframe>

<!-- Speaker note: show live which bound each record violates (or doesn't); contrast with the buggy version reading out of bounds on the same inputs. -->

---

# Animation — Edge Case: Every Record Is Malformed

<iframe class="dsanim" src="anim/input-validation.html?mode=slide&lang=en&example=edge-all-bad" title="Input validation: all 10 records malformed/short (edge case)"></iframe>

<!-- Speaker note: open the "edge-all-bad" preset from the selector; show that NOT ONE record passes, and walk through which principle (length/type/range/format) each one violates and is rejected for. -->

---

# Animation — coverage-guided fuzzing

<iframe class="dsanim" src="anim/fuzzing-loop.html?mode=slide&lang=en" title="Coverage-guided fuzzing loop"></iframe>

<!-- Speaker note: show live whether each candidate opens new coverage, and how the session stops the moment a crash is found. -->

---

# Animation — Edge Case: the Very First Candidate Crashes

<iframe class="dsanim" src="anim/fuzzing-loop.html?mode=slide&lang=en&example=edge-immediate-crash" title="Fuzzing loop: the first candidate crashes (edge case)"></iframe>

<!-- Speaker note: open the "edge-immediate-crash" preset from the selector; make the point that the most valuable input can sometimes appear at the very first step of a session — this is a result of the mutation strategy, not "luck." -->

---

# Section 4 — Quick Check

1. The difference between static and dynamic analysis?
2. Which overflow can ASan not see?
3. The four properties of a good fuzz target?

<!-- Speaker note: Next, compiler and OS protections. -->

---

# Section 4 — Answers

1. **Static:** examines all paths without running the code (can have false positives). **Dynamic:** while running, observes **real** bugs only on the path that actually executes.
2. ASan sees the places where it placed a **redzone**; it cannot see a **field-to-field** overflow inside an object, or paths that **never execute**.
3. **Fast**, **deterministic**, **self-sufficient** (not dependent on external state), a target that handles a **narrow input surface** and fails cleanly on a crash.

---


<!-- _class: bolum -->

# 5. Compiler and OS Protections

<!-- Speaker note: These are the "limit the damage if a bug slips through" layer. None of them removes the bug; they make exploitation harder. -->

---

# Compiler/OS Protections — Diagram

![w:950](assets/h04-02-derleyici-os-korumalari.svg)

---

# Layer 3 · the Idea

Say a bug slipped through.

- There are automatic protections that make exploitation **expensive**.
- Most are turned on with a **compile flag**.
- Not free, but cheap.

---

# Stack Canary

- A **sentinel value** is placed just before the return address.
- If an overflow corrupts this value, it is noticed before the return and the program **halts**.
- `-fstack-protector-strong` / MSVC `/GS`.

---

# Brief History · Compiler/OS Protections

- **1998** — **StackGuard**: the first to add the stack-canary idea to a compiler automatically.
- **2001** — the **PaX** project brought **ASLR** (address space layout randomization) to the Linux kernel.
- **2003–2004** — **W^X / NX / DEP**: a memory page can no longer be both writable and executable at once.
- Together, these three form the foundation of today's compiler/OS protections.

---

# Stack Overflow and Canary — Diagram

![w:1000](assets/h04-04-yigin-kanarya.svg)

---


# _FORTIFY_SOURCE

- Catches **library calls** that write more than a buffer's known size.
- `-D_FORTIFY_SOURCE=2` (+ at least `-O1`).
- Does not protect your **own loops**.

---

# PIE + ASLR

- **ASLR:** randomizes addresses.
- **PIE:** makes the program itself load at a random address too.
- `-fPIE -pie` / `/DYNAMICBASE /HIGHENTROPYVA`.

---

# DEP/NX and RELRO

- **DEP/NX:** makes the data region non-executable (default).
- **RELRO:** makes tables like the GOT read-only → `-Wl,-z,relro,-z,now`.

---

# CFI / CFG and the Shadow Stack

- **CFI/CFG:** checks that indirect calls only go to **valid** targets.
- `-fcf-protection`, `-fsanitize=cfi` / `/guard:cf`.
- **Shadow stack:** a second copy of the return addresses (CET).

---

<!-- _class: yogun -->

# Protections · One Table

| Protection | GCC/Clang | MSVC |
| --- | --- | --- |
| Canary | `-fstack-protector-strong` | `/GS` |
| FORTIFY | `-D_FORTIFY_SOURCE=2` | Secure CRT |
| PIE/ASLR | `-fPIE -pie` | `/DYNAMICBASE` |
| NX | default | `/NXCOMPAT` |
| RELRO | `-Wl,-z,relro,-z,now` | — |
| CFI | `-fcf-protection` | `/guard:cf` |

---

# ⚠️ Every Protection Has Limits

| Protection | Stops | Does Not Stop |
| --- | --- | --- |
| Canary | Overflow reaching the return address | Heap overflow, a leaked canary |
| FORTIFY | Library-call overflow | Your own loops |
| ASLR | Assuming a fixed address | **Address leak** |
| NX | Code in the data region | Code reuse (ROP) |

---

# The Main Rule

> Every protection makes a **technique** harder; it does not remove a **class of bug**.

None of them is enough for a logic error → secure coding comes first.

---

<!-- _class: yogun -->

# Demo 5 — Turning Protections On and Off

`code/week-04/05-compiler-protections` · CWE-121

- The same overflow: `overflow_weak` (off) vs `overflow_hardened` (on).
- Hardened: `*** stack smashing detected ***` / Windows `0xC0000409`.
- Weak: silent corruption or a crash.

```bash
readelf -h p | grep Type          # DYN = PIE
readelf -d p | grep BIND_NOW      # full RELRO
readelf -s p | grep __stack_chk   # canary
```

---

# Animation — the stack canary

<iframe class="dsanim" src="anim/compiler-protections.html?mode=slide&lang=en" title="Stack canary: what happens when buffer[64] overflows?"></iframe>

<!-- Speaker note: show live how strcpy fills buffer[64] and reaches the canary, then the frame and return address; highlight the hardened build catching it. -->

---

# Animation — Edge Case: Same Overflow, WEAK Build Has No Canary

<iframe class="dsanim" src="anim/compiler-protections.html?mode=slide&lang=en&example=weak-overflow" title="Stack canary: the same 75 characters, unprotected build (edge case)"></iframe>

<!-- Speaker note: open the "weak-overflow" preset from the selector; show that the exact SAME 75-character input we just saw caught by the canary in the hardened build sails straight through to the return address when the canary is absent — without the flag on, nothing but CERT/sanitizer/fuzzing stops this. -->

---

# Recommended Release Flags

**GCC/Clang:**

`-O2 -D_FORTIFY_SOURCE=2 -fstack-protector-strong -fPIE -pie -Wl,-z,relro,-z,now -fcf-protection -Wall -Wextra -Wformat=2 -Werror=format-security`

**MSVC:**

`/O2 /GS /sdl /guard:cf /DYNAMICBASE /HIGHENTROPYVA /NXCOMPAT /CETCOMPAT /W4`

---

# Protection Table = Evidence

- The evaluator extracts a **protection table** for every binary and `.so`.
- A disabled protection is a **finding**; its justification must be in the trade-off record.
- Scheme: the application can also **verify itself** that the protections are enabled.

---

# Secure Build Pipeline (CI)

**CI (Continuous Integration):** a system that runs an automatic build + tests on every code change.

![w:900](assets/h04-03-ci-hatti.svg)

Every failing step **stops** the merge.

---

<!-- _class: yogun -->

# CI · Failure Criteria

| Stage | Failure |
| --- | --- |
| Build | A single warning |
| Sanitizer-enabled test | Any report |
| Fuzzing | A new crash (old corpus = regression) |
| Binary audit | Log strings, symbols, a disabled protection |

---

<!-- _class: yogun -->

# The Course's CMake Modes

| Mode | Flags |
| --- | --- |
| `korumasiz` | `-O0` |
| `optimize` | `-O2` |
| `asan` | `-O1 -fsanitize=address` |
| `denetimli` | `-O2 -D_FORTIFY_SOURCE=2` |
| `guvenli` | `-O2` + fixed source |

Most of the protection flags: Demo 5's `overflow_hardened`.

---

# The Build Environment Is a Target Too

- Access logging; pinning dependencies (Week 5's SBOM).
- Signed releases; **reproducible** builds.
- If the build machine is compromised, the entire product is affected.

---

# Section 5 — Quick Check

1. What does the canary stop, and what does it not stop?
2. Why is ASLR weakened by an information leak?
3. Why is "no protection is enough for a logic error"?

<!-- Speaker note: Next, an introduction to code obfuscation. -->

---

# Section 5 — Answers

1. **Stops:** a **sequential** stack overflow that overwrites the return address (the canary gets corrupted). **Does not stop:** a targeted write, a heap overflow, an information leak.
2. A single **leaked address** reveals the module's base address (the offset is fixed) → the entire randomisation **collapses**.
3. Protections catch **memory** violations; incorrect authorization/business logic is a **valid** memory access → no protection is triggered. Correct design + review is required.

---


<!-- _class: bolum -->

# 6. Introduction to Code Obfuscation

<!-- Speaker note: The introductory layer of obfuscation. Depth comes in Weeks 9 and 14. -->

---

# Layer 4 · Why?

- White-box attacker: reads strings, finds functions by name, bypasses checks.
- Obfuscation: same behaviour, **harder to understand**.

---

# Two Attacker Models — Diagram

![w:900](assets/h04-17-iki-saldirgan-modeli.svg)

---

# The Purpose of Obfuscation

Not making it impossible, but making it **expensive** (Cookbook 12.1):

- cost > the value being protected
- make automation harder (diversification, Week 14)
- buy **time** for the other layers

> A few simple techniques + data hiding, rather than one advanced technique.

---

# Brief History · a Taxonomy of Obfuscation

- **1997** — Collberg, Thomborson, and Low published the work that organized obfuscation techniques into a **systematic taxonomy**: layout, data, control, and preventive transformations.
- What we saw this week — string/symbol hiding = a **data** transformation; control-flow flattening and the opaque predicate = a **control** transformation.
- The taxonomy is still the shared vocabulary of academic and industrial obfuscation literature.

---

<!-- _class: yogun -->

# Obfuscation Map

| Family | What It Hides | Week |
| --- | --- | --- |
| Layout | Names, structure | 4 |
| Data | Constants, strings, variables | 4, 9 |
| Control flow | Algorithm structure | 4, 9 |
| Preventive | Analysis tool | 9 |
| Virtualisation | Machine code | 9, 14 |

---

# From the Field: 18 Measures on the Native Side

Symbol visibility off · name mangling · constant arithmetic hiding · string encryption (decrypt on use, **wipe immediately**) · opaque booleans · your own library functions · fake operation/dead branch · flattening + randomised exit · **no** logging in the release build.

➡️ The strength comes from **combining them**, and from RASP.

---

# Three Cheap Measures

| Measure | How? |
| --- | --- |
| Hide symbols | `static`, `-fvisibility=hidden`, `strip -s` |
| Remove logging | Empty the macro at compile time |
| Hide strings | Encrypt at compile time, decrypt on use, wipe immediately |

---

# Logging Macro

```c
#ifdef LOG_ENABLED
#  define LOG(...) fprintf(stderr, __VA_ARGS__)
#else
#  define LOG(...) ((void)0)   /* neither the string nor the call end up in the binary */
#endif
```

`LOG_ENABLED` is not defined in the release build → the logging is **never compiled in**.

---

# ⚠️ a Runtime Flag Is Not Enough

```c
if (debug_flag) printf("...");  /* BAD */
```

- The string **remains** in the binary.
- The attacker can flip the flag and turn logging back on.
- The right way: remove it **at compile time**.

---

# ⚠️ String Hiding ≠ Key Storage

- The decrypted string sits **in memory, in the clear**, while it's in use.
- The decryption key is **inside** the program.
- What it stops: static scans like `strings`.
- Against someone inspecting it while running → RASP (6). A real key → whitebox (11).

---

<!-- _class: yogun -->

# Demo 6 — Symbol and String Leakage

`code/week-04/06-symbol-strings` · CWE-200/215

| Step | What Happens? |
| --- | --- |
| 1 | `secret_exposed` and `secret_hidden` give the same result |
| 2 `strings` | The license string and `[LOG]` are visible in the open one; not in the closed one |
| 3 `nm` | `license_verify` is visible in the open one; no symbol in the closed one |
| 4 | Windows: names are in the PDB; the closed build produces no PDB |

---

# Animation — string + symbol hiding

<iframe class="dsanim" src="anim/symbol-string-hiding.html?mode=slide&lang=en" title="String and symbol hiding: XOR + strip"></iframe>

<!-- Speaker note: show live how every byte is XOR'd with the key, and how the symbols visible with nm differ between the exposed and hidden builds. -->

---

# Animation — Edge Case: a Bad Key Choice (0x00)

<iframe class="dsanim" src="anim/symbol-string-hiding.html?mode=slide&lang=en&example=edge-zero-key" title="String hiding: key 0x00 hides nothing (edge case)"></iframe>

<!-- Speaker note: open the "edge-zero-key" preset from the selector; show live that when the XOR key is 0x00, every byte XORs with itself and stays unchanged — the "hiding" step does nothing at all. Key choice is part of the design too. -->

---

# Symbol and String Hiding — Diagram

![w:900](assets/h04-18-sembol-dize-gizleme.svg)

---

# Control-Flow Flattening

```c
int state = 1;
for (;;) switch (state) {
  case 1: state = 2; break;
  case 2: state = (condition ? 3 : 4); break;
  case 3: state = 5; break;
  case 4: return FAILURE;
  case 5: return SUCCESS;
}
```

The blocks' natural adjacency is lost; the order lives only in the **state variable**.

---

# Flattening: Before/After — Diagram

![w:900](assets/h04-19-duzlestirme-giris.svg)

---

# What Strengthens Flattening

- **Hide the state values** (arithmetic transformation)
- **Fake/dead blocks** (which one is real?)
- **Randomised exit** (where the error was caught becomes unreadable)
- **Opaque values** (a single byte cannot flip it)

The template alone is solved quickly on its own → Week 9 depth.

---

<!-- _class: yogun -->

# Demo 7 — Flattening

`code/week-04/07-flow-flattening`

| Step | What Happens? |
| --- | --- |
| 1 | `pin.c` and `pin_flattened.c` give the same result (the PIN is synthetic) |
| 2 | `objdump`: the flattened version has far more branches |
| 3 | Timing: the cost of flattening |

➡️ Automated with Tigress's `Flatten` in Week 14; measuring effectiveness in Week 9.

---

# Animation — the dispatcher state machine

<iframe class="dsanim" src="anim/flow-flattening.html?mode=slide&lang=en" title="Control-flow flattening: the dispatcher state machine"></iframe>

<!-- Speaker note: show live how the plain version takes a direct if-chain while the flattened version walks the dispatcher from state=0 again for every guess. -->

---

# Animation — Edge Case: Every Guess Has the Wrong Length

<iframe class="dsanim" src="anim/flow-flattening.html?mode=slide&lang=en&example=flat-all-wrong-length" title="Control-flow flattening: every guess has the wrong length (edge case)"></iframe>

<!-- Speaker note: open the "flat-all-wrong-length" preset from the selector; even in the flattened version, the dispatcher MUST still pass through the length-check state first — reading stays harder, but the meaning of the flow hasn't changed. -->

---

# Animation — the opaque predicate

<iframe class="dsanim" src="anim/opaque-predicate.html?mode=slide&lang=en" title="Opaque predicate: (x*x) % 4 is never 2"></iframe>

<!-- Speaker note: prove experimentally that (x*x)%4 is never 2 for any integer; highlight that the decoy branch (decoy_branch) never runs. -->

---

# Animation — Edge Case: Values Near the INT Bounds

<iframe class="dsanim" src="anim/opaque-predicate.html?mode=slide&lang=en&example=edge-extremes" title="Opaque predicate: 10 extreme values near INT bounds (edge case)"></iframe>

<!-- Speaker note: open the "edge-extremes" preset from the selector; show that the (x*x)%4 identity still never equals 2 even at values like INT_MAX/INT_MIN (despite the potential for signed overflow) — tie this back to this week's integer overflow section. -->

---

# Concept: Three Techniques Leading into Week 9

- **Function name hiding:** exported names are meaningless; readability handled via a macro.
- **Allocation-size hiding:** blur the "32 bytes = a key" tell.
- **Dynamic decryption:** sensitive code sits encrypted in the binary; conflicts with DEP/NX, used selectively.

---

# Section 6 — Quick Check

1. Does obfuscation fix the bug?
2. Why isn't silencing logging with a runtime flag enough?
3. Three techniques that strengthen flattening?

<!-- Speaker note: Next, the project and the solved self-check. -->

---

# Section 6 — Answers

1. **No.** Obfuscation only makes reverse engineering harder; the bug **stays where it is**. **Fix first, then obfuscate.**
2. The string/code **remains** in the binary; the attacker can flip the flag or read the strings. Remove logging in the release build **at compile time** (macro/dead-code elimination).
3. **Opaque predicates** + **fake blocks/dead branches** + **state-variable encoding & randomised exit** (also name/string hiding).

---


<!-- _class: bolum -->

# End to End: Closing One Overflow in Three Layers

<!-- Speaker note: We trace a single overflow from buggy code to attack, then to the fix; we see all three of this week's layers (coding, compiler/OS, not obfuscation but correction) in the same example. Can be worked through on the board. -->

---

# Buggy Code

```c
void greet(const char *name) {
    char buffer[16];
    strcpy(buffer, name);          /* no bound */
    printf("Hello %s\n", buffer);
}
```

What happens if `name` is longer than 16 bytes?

---

# What Happens? · Step by Step

- `buffer` is 16 bytes on the stack.
- `strcpy` copies `name` all the way to its end, paying no attention to bounds.
- A `name` longer than 16 → neighbouring memory (including the return address) is corrupted.

---

# Attack · Outcome

- Short overflow: a neighbouring variable gets corrupted (a logic bug).
- Long overflow: the **return address** gets corrupted → crash or control hijacking.
- Without protection: a serious vulnerability (CWE-121).

---

# Fix 1 · Bounded Copying

```c
int n = snprintf(buffer, sizeof buffer, "%s", name);
if (n < 0 || (size_t)n >= sizeof buffer) {
    /* truncated: reject or flag it */
}
```

`snprintf` knows the size and **reports truncation**.

---

# Fix 2 · Layers

- **Coding:** `snprintf` (STR31-C).
- **Compiler:** `-fstack-protector-strong` (canary).
- **FORTIFY:** `-D_FORTIFY_SOURCE=2` checks the library call.
- **Testing:** ASan catches the overflow with a long input.

---

# Lesson: One Line, Many Layers

- One bug: `strcpy`.
- Defence: the right function + compiler protection + sanitizer testing.
- But the **real** fix is in the first line: bounded copying.

---

<!-- _class: yogun -->

# Classic Mistakes — Summary

| Mistake | Section | Rule |
| --- | --- | --- |
| Ignoring warnings | 1 | Turn warnings into errors with `-Werror`; keep the CERT scan clean |
| "Cleaning up" input and using it anyway | 1 | Reject dangerous input; allow-list + rejection is safest |
| Not checking the return value | 2–3 | Check every return (ERR33-C); `fopen`/`malloc` can return NULL |
| Hiding UB with `-fwrapv` | 2–3 | Making the overflow "defined" hides the logic bug; diagnose with UBSan |
| Shipping the sanitizer in the release build | 4 | Test/CI only; disabled in the release build |
| Covering up a bug with obfuscation | 6 | Obfuscation doesn't fix it, only hides it; fix first, then obfuscate |

All six mistakes were covered earlier in this deck; here they are gathered in one glance.

---

<!-- _class: bolum -->

# 7. Project and Closing

---

# Project · S9 "Code Hardening" — 1

- [ ] Build with the recommended release flags; attach the protection table (`checksec`/`dumpbin`).
- [ ] Run a CERT scan with `clang-tidy`/`cppcheck`; fix ≥ 5 findings (with rule ids).

---

# Project · S9 — 2

- [ ] Run the tests with ASan + UBSan.
- [ ] At least one fuzz target, ≥ 10 min.
- [ ] No logging in the release build; no sensitive string in `strings` output.
- [ ] Every return value is checked (ERR33-C); it builds with `-Werror`.

**Measure card:** Description → Implementation → Verification → Residual risk.

---

<!-- _class: bolum -->

# Solved Self-Check

---

# Question 1

**Which of the three layers actually removes the bug?**

**Answer:** Only **secure coding** (layer 2). Compiler/OS protections make exploitation harder; obfuscation slows down reading — neither one **removes** the bug.

---

# Question 2

**What is the mildest outcome of `printf(girdi)`?**

**Answer:** An **information leak** (reading the stack via `%x`/`%p`). The worst is writing to memory via `%n`.

---

# Question 3

**The three stack traces in a UAF report? Which one gets the fix?**

**Answer:** Use, free, allocation. The fix is usually at the **free** point (an ownership decision).

---

# Question 4

**Why can `if (x + 100 < x)` be deleted?**

**Answer:** Signed integer overflow is **undefined behaviour**; the compiler assumes "overflow never happens" and can optimise the check away, **deleting** it.

---

# Question 5

**Why is there no `printf` in a signal handler?**

**Answer:** `printf`/`malloc` are **not async-signal-safe**; if the handler calls them while interrupted mid-state, corruption follows. Only a flag is set (SIG30-C).

---

# Question 6

**Which overflow can ASan not see?**

**Answer:** A **field-to-field** overflow inside the same structure (there is no poisoned region between them).

---

# Question 7

**The four properties of a good fuzz target?**

**Answer:** Fast, deterministic, stateless, single job.

---

# Question 8

**What does the canary stop, and what does it not stop?**

**Answer:** **Stops:** a stack overflow that reaches the return address. **Does not stop:** heap overflow, corruption of earlier variables, a leaked canary.

---

# Question 9

**Why is ASLR weakened by an information leak?**

**Answer:** If one address leaks, the attacker can **calculate** the other addresses relative to it; the advantage of randomisation is lost.

---

# Question 10

**Why isn't silencing logging with a runtime flag enough?**

**Answer:** The string **remains** in the binary and the attacker can flip the flag to turn logging back on. It must be removed **at compile time**.

---

# Question 11

**Three techniques that strengthen flattening?**

**Answer:** Hiding state values, fake/dead blocks, a randomised exit point (and opaque values).

---

# Question 12

**Why is string hiding not the same as key storage?**

**Answer:** The decrypted string is in memory, in the clear, while it's in use, and the decryption key sits inside the program; it only stops **static** scanning.

---

# Summary: This Week in One Sentence

> First **bug-free code** (CERT + sanitizer + fuzzing), then **limit the damage** (compiler/OS protections), and finally **make it harder to read** (obfuscation) — and no protection substitutes for secure coding.
>
> Secure code is not written once; it is **checked with tools on every build**.

---

<!-- _class: yogun -->

# Glossary

| Term | Meaning |
| --- | --- |
| UB | Undefined behaviour |
| UAF | Use-after-free |
| CERT/CWE | Rulebook / weakness catalogue |
| Sanitizer | Runtime bug detector |
| Fuzzing | Finding crashes with random input |
| Canary/ASLR/NX | Compiler/OS protections |

---

<!-- _class: baslik -->

# Next Week

**Week 5 — Java and Interpreted Languages**

This week we dealt with manually managed memory in C/C++ and compiler/OS protections; Week 5 shows how the JVM eliminates most of these bugs (overflow, UAF, UB), but opens a new bug class such as injection (SQL, command, path).

The SEI CERT Java rules will be compared with today's SEI CERT C/C++ rules; we will also cover obfuscation with ProGuard/R8, dependency security, and SBOM.

Preparation: JDK 17+, Maven · `code/week-05`.

First correct code, then protection, finally obfuscation. The order matters.
