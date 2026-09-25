---
marp: true
theme: cen429
paginate: true
lang: en
title: "CEN429 Week 15 — Final Project Demonstrations"
author: "Asst. Prof. Dr. Uğur CORUH"
header: "CEN429 Secure Programming · Week 15"
footer: "RTEU Computer Engineering · 2026-2027 Fall"
---



<!-- _class: baslik -->
<!-- _paginate: false -->

# Final Project Demonstrations

**CEN429 Secure Programming — Week 15**

Asst. Prof. Dr. Uğur CORUH · 25.12.2026

<!--
Speaker note: Final demonstration week: each team shows the complete security guide, its protected application, and its test results.
-->

---

# This Week: Final Project Demonstrations (RAP2)

- No lecture; final report (**the complete guide**) + protected application + test results
- RAP2 = **70%** of the final · Quiz-2 = **30%** · Course grade = `0.4·Grade_Midterm + 0.6·Grade_Final`
- Detailed rubric: project guide · order and timing: in class
- ⚠️ No late submissions · a **finding–action list** for the midterm feedback

---

# RAP2 Submission — Diagram

![w:950](assets/h15-01-rap2.svg)

---

<!-- _class: yogun -->

# Final Rubric

| Criterion | LO | Guide |
| --- | --- | --- |
| Cryptography | 2 | S8 |
| Secure communication | 4 | S6 · S11 |
| Asset management | 5 | S5 (complete) · S8 |
| Binary protections | 3 | S9 (advanced) · S15 |
| Security testing and unit tests | 6 | S16 **results** |
| Standards | 7 | S1 · S14 · S17 |
| Final report and presentation | 7 | All |

---

<!-- _class: yogun -->

# From Midterm to Final: New and Completed Sections

| New | To be completed / updated |
| --- | --- |
| S6 identity and binding | S5 assets (complete) |
| S8 cryptography and keys | S9 hardening (advanced) |
| S11 secure communication | S12 reporting (complete) |
| S14 assumptions and deferred requirements | S13 updated SBOM |
| S15 build and deployment pipeline | S16 **results** · S17 complete matrix |

---

# Security Guide Map S0–S17 — Diagram

![w:950](assets/h15-02-kilavuz-haritasi.svg)

---

<!-- _class: yogun -->

# Preparation Checklist

| Week | What you should be able to show |
| --- | --- |
| 9, 14 | Obfuscated functions and justification · cost table · obfuscation and signing in the build pipeline |
| 10 | Algorithm inventory · key lifecycle · TLS/pinning · signature verification |
| 11 | Protection method or justification for a sensitive asset |
| 12 | Test plan + **results** · unit tests · CI · finding–action list |
| 13 | Compliance matrix · assumptions and deferred requirements |

---

# Suggested Demonstration Flow

1. **Summary:** product, architecture, the three most critical assets
2. **Since the midterm:** finding–action list (finding → action → closure; the assessor looks for this loop)
3. **Live demonstration:** cryptography, secure communication, a protection layer **working live** (e.g., a tampered file being rejected)
4. **Evidence:** tests, protection table, SBOM, compliance matrix
5. **Remaining risk:** what was deliberately scoped out, and why

---

# Final Demonstration — Diagram

![w:950](assets/h15-03-gosterim.svg)

---

# Sample Questions

- Which key is this key derived from, where does it live, when is it deleted?
- How do you verify the certificate chain? Where is hostname verification performed?
- What happens if signature verification fails? Can an old but validly signed version still be installed?
- Did you measure the cost of obfuscation? Which function did you obfuscate, and why?
- In the compliance matrix, where is the evidence for this row marked "met"?
- Which requirement did you defer, and how will the other party meet it?

---

<!-- _class: yogun -->

# Common Mistakes

| Mistake | Why is it a problem? |
| --- | --- |
| A test plan exists, but no results | At the final, **results** are expected |
| "Met" without evidence | Counted as unmet |
| Guide and code version differ | The assessed product becomes ambiguous |
| Empty remaining-risk section | Incomplete analysis |
| Midterm feedback was ignored | The finding–action loop is part of the process |
| Real secret / personal data in the repo | Values must be **synthetic** |

---

# Academic Integrity

The syllabus's "Academic Integrity" section also applies to the project; every submitted line must be explainable, and any team member may be asked a question during the demonstration.

![w:950](assets/h15-04-s16.svg)

---

# At the End of the Term

- Your guide = a small model of certification documents → **portfolio** (make sure it contains no confidential information)

> At the final, **results** are expected: every protection is shown working, every requirement is tied to evidence.

---

<!-- _class: baslik -->

# Next Week

**Week 16 — Quiz-2**

After the final demonstration (RAP2), it's time for Quiz-2; the scope is weeks 9–14. The study guide is on the Week 16 page.
