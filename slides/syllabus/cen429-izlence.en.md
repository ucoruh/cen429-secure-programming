---
marp: true
theme: cen429
paginate: true
lang: en
title: "CEN429 Secure Programming — Syllabus"
author: "Asst. Prof. Dr. Uğur CORUH"
header: "CEN429 Secure Programming · Syllabus"
footer: "RTEU Computer Engineering · 2026-2027 Fall"
---

<!-- _class: baslik -->
<!-- _paginate: false -->

# CEN429 Secure Programming

**Syllabus — 2026-2027 Fall**

Asst. Prof. Dr. Uğur CORUH

---

# Course information

| | |
| --- | --- |
| **Contact** | ugur.coruh@erdogan.edu.tr — subject line: **[CEN429]** |
| **Office** | F-301 · meetings by e-mail appointment |
| **Class** | Friday 09:00–12:00 · Faculty of Economics and Law Building, D-402 |
| **Website** | ucoruh.github.io/cen429-secure-programming |
| **Classroom code** | A new code each term; announced in week 1 |
| **Language / type** | Turkish · Elective · 7th semester |
| **Hours / credits / ECTS** | 3 · 3 · 5 |
| **Prerequisite** | CEN107 Algorithms and Programming I |

---

# Aim of the course

- **Recognise** common software vulnerabilities: buffer overflow, memory errors, injection
- **Apply** software protection methods: data security and cryptography, C/C++ and Java hardening,
  runtime self-protection, code obfuscation, whitebox cryptography
- Know security standards and **penetration test planning**
- Every topic: **faulty code → attack → fix**

---

<!-- _class: yogun -->

# Learning outcomes

| Code | Learning outcome |
| --- | --- |
| LO.1 | Identifies and classifies common vulnerabilities |
| LO.2 | Explains encryption methods and the principles of secure communication (SSL/TLS) |
| LO.3 | Applies code hardening techniques (input validation, safe memory, RASP, obfuscation) in C/C++ and Java |
| LO.4 | Explains how to build a secure channel with encryption and authentication |
| LO.5 | Produces a software plan based on secure design principles |
| LO.6 | Knows security review and vulnerability assessment methods |
| LO.7 | Knows secure programming standards and penetration test planning |

---

<!-- _class: yogun -->

# Weekly schedule (1–8)

| Wk | Date | Topic |
| --- | --- | --- |
| 1 | 18.09 | Introduction to secure programming and the application protection plan |
| 2 | 25.09 | Computer viruses and security models |
| 3 | 02.10 | Data security: in transit, at rest, in use |
| 4 | 09.10 | Code hardening: C/C++ |
| 5 | 16.10 | Code hardening: Java and interpreted languages |
| 6 | 23.10 | Runtime application self-protection (RASP) |
| 7 | 30.10 | **Midterm project demonstrations** |
| 8 | 31.10–08.11 | **Midterm exam week — Quiz-1** |

---

<!-- _class: yogun -->

# Weekly schedule (9–16)

| Wk | Date | Topic |
| --- | --- | --- |
| 9 | 13.11 | Advanced obfuscation and diversification |
| 10 | 20.11 | Certificates and cryptographic methods |
| 11 | 27.11 | Whitebox cryptography |
| 12 | 04.12 | Security certifications and penetration test planning |
| 13 | 11.12 | Security requirements |
| 14 | 18.12 | Tigress and diversification |
| 15 | 25.12 | **Final project demonstrations** |
| 16 | 04–17.01 | **Final exam period — Quiz-2** |

---

# Assessment

- **One term project:** a C/C++ application + a security guide, with two checkpoints (rubric-based)
- **Two quizzes:** in the exam weeks

| Component | Weight | When |
| --- | --- | --- |
| Project checkpoint 1 (RAP1) | 60% of the midterm | Week 7 |
| Quiz-1 | 40% of the midterm | Week 8 |
| Project checkpoint 2 (RAP2) | 70% of the final | Week 15 |
| Quiz-2 | 30% of the final | Week 16 |

**Course grade = 0.4 · Midterm + 0.6 · Final**

---

# Resources and tools

- **Lecture notes** (website) — the main source, sufficient on their own
- **Textbook:** J. Viega, M. Messier, *Secure Programming Cookbook for C and C++*, O'Reilly, 2003
- **Open standards:** SEI CERT, OWASP, MITRE CWE, NIST FIPS 140-3
- **A laptop is required:** WSL2 + Ubuntu, GCC/Clang, CMake, gdb, OpenSSL 3, SQLite, JDK 21, Tigress
- Demos: in the `code/week-NN` folders; build once inside `code`, then run `demo.ps1` (Windows) or `demo.sh` (WSL/Linux)

---

# Rules

- **Late submissions are not accepted**; report unexpected circumstances immediately
- **Academic integrity:** working together is allowed; sharing solutions and uncited quoting are not
- **Communication:** university e-mail, with **[CEN429]** in the subject line
- **Ethics:** attack techniques are tried **only on your own computer** and only on the demos provided

---

<!-- _class: baslik -->

# Questions and answers

**Course site:** ucoruh.github.io/cen429-secure-programming
