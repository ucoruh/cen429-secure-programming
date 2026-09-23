---
template: main.html
---

# CEN429 Term Project — Project Guide

In this project you design and build a chosen application **as if it were going through a certification process**:
a **C++ console application** plus a **dynamic library (DLL/.so)** that provides its security. The goal is to combine
every security technique you learn during the term into **one product** and document all of it in a **security guide**
(S0–S17).

!!! abstract "At a glance"
    - **Team:** 2 students (you may work alone).
    - **Language/tools:** C++ (DLL/.so), CMake/CTest, SQLite, SoftHSM/PKCS#11, OpenSSL.
    - **Two deliveries:** **Midterm (RAP1)** — first half of the product; **Final (RAP2)** — full product + test **results**.
    - **Heart of the delivery:** alongside the code, a **security guide** written like a certification document (S0–S17).
    - Detailed rubric is on Microsoft Teams; this page gives the requirements and how they map to the weeks.

## 1. Project plan (before you start)

- Create a **project plan** on **GitHub** (Projects/README): work packages, deliverables, schedule, member roles.
- Get it **approved by the instructor**. Projects started without approval are not accepted.
- Track progress from the plan; make small, **reviewable** commits each week (Week 1, change management).

## 2. Project setup

**Fork** the C++ template and name it with the course code:

- `https://github.com/ucoruh/cpp-cmake-ctest-template` → `cen429-project-name-surname-cpp`

!!! tip "Use the template fully"
    The template provides build, **CTest unit testing**, documentation generation, test/doc coverage, and packaging.
    Deliverables that do not follow the template are not accepted. Produce releases; record version id and digests
    (Week 12 TOE identity).

## 3. Topic selection

- Choose your own application idea (e.g., password vault, licensed content player, offline payment-wallet-like app,
  secure notes). **No two teams may pick the same topic** (to prevent plagiarism).
- If you are retaking this course, choose a **different topic** from before.
- The topic must be rich enough to apply the security requirements below **meaningfully**.

## 4. Requirements (checklist)

Each requirement notes **which week it is taught** and **which guide section (S)** it is documented in. Meet each item,
or **defer/scope-out with justification** (Week 13).

### 4.1 Development environment security · (Weeks 1, 12 · S13)
- Software development flow and **change management** (baseline → request → classify → approve → release → verify).
- Version control with **Git**; access logging; signed releases.
- Development host/server security (short policy).

### 4.2 Data-in-use security · (Weeks 3, 6 · S7)
- Sensitive data in memory is **wiped securely** after use (`memset_s`-like).
- Runtime data protection (shadow copy / integrity — Week 6).

### 4.3 Data-in-transit security · (Weeks 3, 10 · S6, S11)
- **TLS 1.3**; certificate chain + **SAN** validation; **pinning** + backup pin.
- Encrypted **session key**; **device/version binding**; integrity + authentication; server verification code.

### 4.4 Data-at-rest security · (Weeks 3, 10, 11 · S8)
- File/DB encryption with **AEAD** (AES-GCM); non-repeating nonce.
- For sensitive keys, **whitebox** or **SoftHSM/PKCS#11**; **justify** the choice (Week 11).

### 4.5 Static asset protection · (Weeks 1, 4, 9 · S5, S9)
- Secret keys, digests, source code, resources: encryption + access control + obfuscation.

### 4.6 Dynamic asset protection · (Weeks 3, 6 · S5, S8)
- Device/app fingerprints, session data, dynamic keys are encrypted.

### 4.7 Asset management · (Weeks 1, 3, 13 · S5)
Per asset: **name, description, location (table/column), source, size, creation/destruction time, default,
protection scheme (C/I/I+)**.

### 4.8 Interface definitions and protection · (Weeks 1, 4 · S3, S6)
- All interfaces protected with access control + authentication; input validated at the **trust boundary**.

### 4.9 Code hardening · (Weeks 4, 9, 14 · S9)
- Opaque loops/predicates, name/file/string/arithmetic obfuscation, opaque booleans, bogus ops/dead branches,
  **control-flow flattening** + random exit, logging **off** in release. **Measure** the cost (Week 9/14 demos).

### 4.10 RASP · (Week 6 · S10)
- Checksum integrity, caller hash/signature verification, root/emulator detection, **hook/anti-debug**, tamper
  detection + response, control-flow counter.

### 4.11 Memory protection · (Week 4 · S9)
- Compiler/OS protections (stack canary, PIE, RELRO, NX, CFI); sensitive memory cleared after use.

### 4.12 Cryptography and certificates · (Weeks 3, 10 · S8, S11)
- Correct algorithm/mode/padding; signature verification (`==1`, version coverage); SSL/TLS + pinning + mutual auth.

### 4.13 Certification and penetration test plan · (Weeks 12, 13 · S16, S14, S17)
- Standards mapping (ETSI/EMVCo/GSMA/PCI/MASVS); **penetration test plan** (scope, rules, methodology, test card) and
  its **results**; attack potential + CVSS.

### 4.14 Binary application protection · (Weeks 6, 9, 11, 14 · S9, S10, S15)
- **Detection** (checksum, anti-debug, emulator), **defense** (obfuscation, string/resource encryption, call hiding),
  **deterrence** (response/shutdown policy).

### 4.15 OWASP and build/deploy pipeline · (Weeks 5, 14 · S13, S15)
- OWASP MASVS/ASVS principles; **SBOM** (CycloneDX) + dependency scan; build pipeline with obfuscation + signing.

## 5. Deliverables

- [ ] **Source code** (forked template, CMake/CTest, C++ DLL/.so + SQLite + SoftHSM).
- [ ] **Unit tests** (crypto and protection functions) and a **CI** record.
- [ ] **Security guide (S0–S17)** — a scaled-down model of a certification document (below).
- [ ] **Test results (S16)** — not a plan, the **observed** results.
- [ ] **Compliance matrix (S17)** and **deferred requirements (S14)**.
- [ ] **SBOM** + dependency scan. All values **synthetic**; **no** real secret/personal data in the repo.

## 6. Security guide sections (S0–S17)

| No | Section | No | Section |
| --- | --- | --- | --- |
| S0 | Cover, version history | S9 | Code hardening (advanced) |
| S1 | Scope, abbreviations, references | S10 | RASP + response policy |
| S2 | Product and architecture | S11 | Secure communication (TLS) |
| S3 | Interfaces | S12 | Reporting/logging |
| S4 | Threat model (STRIDE, tree) | S13 | Dev process, SBOM, change mgmt |
| S5 | Asset list + protection | S14 | Assumptions and deferrals |
| S6 | Identity/binding | S15 | Build, signing, deploy pipeline |
| S7 | Data security + shell matrix | S16 | Security testing and **results** |
| S8 | Crypto, key lifecycle | S17 | Requirement compliance matrix |

## 7. Assessment

!!! info "Weights (syllabus)"
    - **Midterm = 0.6·RAP1 + 0.4·Quiz-1** · **Final = 0.7·RAP2 + 0.3·Quiz-2**
    - **Course grade = 0.4·Midterm + 0.6·Final**
    - **RAP1 (Week 7):** first half (S2–S5 + basic protections). **RAP2 (Week 15):** full product + S16 results.

| Criterion | LO | In the guide |
| --- | --- | --- |
| Cryptography implementation | LO.2 | S8 |
| Secure communication | LO.4 | S6, S11 |
| Asset management | LO.5 | S5, S8 |
| Binary application protections | LO.3 | S9, S10, S15 |
| Security testing and unit tests | LO.6 | S16 |
| Security standards | LO.7 | S1, S14, S17 |
| Report and presentation | LO.7 | All |

The detailed **analytic rubric** is on Microsoft Teams. Every row needs **evidence**: a "met" row without evidence
counts as unmet (Week 13).

## 8. Academic integrity

You must be able to **explain** every line you submit; any team member may be questioned during the demo. Cite sources
if you reuse code/text. Plagiarism and unauthorized copying cause failure.

!!! warning "Safe and legal frame"
    Penetration testing is only done on **your own** project. Examples and values must be **synthetic**; no real secret,
    key, or personal data may enter the repo. Your application must not harm anyone else's system or data.
