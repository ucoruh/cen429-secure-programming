# Week 15 — Final Project Demonstrations

| | |
| --- | --- |
| **Date** | 25.12.2026 |
| **Learning outcomes** | LO.1–7 |
| **Duration** | 3 hours |

<!-- materyal:basla -->

<div class="materyal" markdown>

[:material-file-pdf-box: Lecture notes (PDF)](cen429-week-15-ders-notu.pdf){ .md-button download="cen429-week-15-ders-notu.pdf" }
[:material-file-word-box: Lecture notes (DOCX)](cen429-week-15-ders-notu.docx){ .md-button download="cen429-week-15-ders-notu.docx" }
[:material-presentation: Slides (PDF)](cen429-week-15-sunum.pdf){ .md-button download="cen429-week-15-sunum.pdf" }
[:material-microsoft-powerpoint: Slides (PPTX)](cen429-week-15-sunum.pptx){ .md-button download="cen429-week-15-sunum.pptx" }
[:material-language-html5: Slides (HTML, offline)](cen429-week-15-sunum.html){ .md-button download="cen429-week-15-sunum.html" }
[:material-folder-zip: Download all (ZIP)](cen429-week-15-materyal.zip){ .md-button download="cen429-week-15-materyal.zip" }
[:material-fullscreen: Open slides full screen](cen429-week-15-sunum.html){ .md-button .md-button--primary target=_blank }

</div>

<div class="sunum-cercevesi">
<iframe src="../cen429-week-15-sunum.html" title="Week 15 — Final Project Demonstrations" loading="lazy" allowfullscreen></iframe>
</div>

<p class="sunum-ipucu">Click inside the slides and use the arrow keys; use the button at the bottom right of the slides or the link above for full screen.</p>

<!-- materyal:bitis -->

!!! abstract "What happens this week?"
    There is no lecture this week. The **second checkpoint of the term project (RAP2)** takes place: each team
    submits its final report (the complete security guide) and demonstrates its protected application and its test
    results. RAP2 is **70% of the final grade**; the remaining 30% is Quiz-2 in the final exam period
    (`Grade_Final = 0.7·RAP2 + 0.3·QUIZ2`). The course passing grade is calculated as
    `0.4·Grade_Midterm + 0.6·Grade_Final`. The detailed rubric is in the project guide.

!!! warning "Submission and timing rules"
    Late submissions are not accepted (syllabus, section G). The demonstration order, time per team and submission
    time are announced in class. Prepare a finding–action list showing how you closed out the feedback you received
    at the midterm checkpoint.

---

## 1. What does the final checkpoint measure?

The criteria of the final checkpoint rubric in the syllabus, and the corresponding sections in your security guide:

![RAP2 submission contents](assets/h15-01-rap2.svg)

| Criterion | Learning outcome | Where in the guide | Which weeks? |
| --- | --- | --- | --- |
| **Cryptography implementation** | LO.2 | S8 algorithm inventory, key lifecycle and hierarchy, random numbers | [3](../week-3/cen429-week-3.md#17-term-project-this-week), [10](../week-10/cen429-week-10.md#13-term-project-this-week) |
| **Secure communication** | LO.4 | S6 authentication and binding · S11 TLS, pinning, message-level protection | [3](../week-3/cen429-week-3.md#17-term-project-this-week), [10](../week-10/cen429-week-10.md#13-term-project-this-week) |
| **Asset management** | LO.5 | S5 asset list (complete) · S8 keys | [1](../week-1/cen429-week-1.md#21-term-project-this-week), [3](../week-3/cen429-week-3.md#17-term-project-this-week), [13](../week-13/cen429-week-13.md#9-term-project-this-week) |
| **Binary application protections** | LO.3 | S9 code hardening (advanced) · S15 build, signing and deployment pipeline | [4](../week-4/cen429-week-4.md#17-term-project-this-week), [5](../week-5/cen429-week-5.md#15-term-project-this-week), [6](../week-6/cen429-week-6.md#12-term-project-this-week), [9](../week-9/cen429-week-9.md#12-term-project-this-week-s9-advanced-hardening), [14](../week-14/cen429-week-14.md#10-term-project-this-week-s9-advanced-s15-pipeline) |
| **Security testing and unit tests** | LO.6 | S16 test and verification results | [4](../week-4/cen429-week-4.md#17-term-project-this-week), [12](../week-12/cen429-week-12.md#9-term-project-this-week-s16-test-plan-and-results) |
| **Security standards** | LO.7 | S1 references · S14 assumptions and deferrals · S17 compliance matrix | [12](../week-12/cen429-week-12.md#9-term-project-this-week-s16-test-plan-and-results), [13](../week-13/cen429-week-13.md#9-term-project-this-week) |
| **Final report and presentation** | LO.7 | All sections; document structure, consistency, presentation | All |

### Sections that must be present in the final report

At the final checkpoint, every section is expected to be **complete**:

| No | Section | Difference from the midterm |
| --- | --- | --- |
| S0 | Cover, document control, version history | Version history up to date; changes marked |
| S1 | Scope, target audience, abbreviations, references | Complete |
| S2–S4 | Product, architecture, threat model | Updated with midterm feedback |
| S5 | Asset list and protection scheme | **Complete**: lifecycle and C/I/I+ for every asset |
| S6 | Authentication, identification, device/version binding | New |
| S7 | Data security + security shell matrix | Updated |
| S8 | Cryptographic methods, key lifecycle and hierarchy | New |
| S9 | Code hardening | **Advanced** (including obfuscation) |
| S10 | RASP + response policy | Updated |
| S11 | Secure communication | New |
| S12 | Reporting and logging policy | Complete |
| S13 | Development process, SBOM, change management | Updated SBOM |
| S14 | Assumptions and deferred requirements | New |
| S15 | Build, signing and deployment pipeline | New |
| S16 | Security testing and verification | **Results** (not a plan) |
| S17 | Requirement compliance matrix | Complete |

---

## 2. Preparation checklist (weeks 9–14)

??? success "Weeks 9 and 14 — Advanced code hardening (S9, S15)"
    Source: [Week 9 · Term project](../week-9/cen429-week-9.md#12-term-project-this-week-s9-advanced-hardening) · [Week 14 · Term project](../week-14/cen429-week-14.md#10-term-project-this-week-s9-advanced-s15-pipeline)

    - [ ] Which functions obfuscation was applied to and why; a before/after cost table (time, size).
    - [ ] Obfuscation and signing steps in the build pipeline; version identity and digest values.
    - [ ] Metrics for before and after obfuscation (ratio of meaningful names, count of plaintext sensitive strings).

![Security guide map](assets/h15-02-kilavuz-haritasi.svg)

??? success "Week 10 — Cryptography and PKI (S8, S11)"
    Source: [Week 10 · Term project](../week-10/cen429-week-10.md#13-term-project-this-week)

    - [ ] Algorithm inventory: purpose, key length, mode, standard, library.
    - [ ] Key lifecycle table: generation, storage, crypto-period, renewal, destruction.
    - [ ] TLS validation; SPKI pinning and a backup pin if used; signature verification on the update file.

??? success "Week 11 — Key protection (S8)"
    Source: [Week 11 · Term project](../week-11/cen429-week-11.md#7-term-project-this-week-s8-key-protection-justification)

    - [ ] Protection method and justification for at least one sensitive asset (e.g., device binding, layered
          protection); if not used, the justification for why not.

??? success "Week 12 — Testing and assessment (S16)"
    Source: [Week 12 · Term project](../week-12/cen429-week-12.md#9-term-project-this-week-s16-test-plan-and-results)

    - [ ] Test plan and **results**: for each test, the purpose, method, expected and observed result.
    - [ ] Unit tests (for cryptography and protection functions) and a continuous integration record.
    - [ ] A finding–action list for the midterm feedback.

??? success "Week 13 — Requirements (S14, S17)"
    Source: [Week 13 · Term project](../week-13/cen429-week-13.md#9-term-project-this-week)

    - [ ] Compliance matrix: for every implemented requirement, its status, section, verification and evidence.
    - [ ] Assumptions and deferred requirements: to whom, why, how.

---

## 3. Demonstration: suggested flow

1. **Summary:** Product, architecture, and the three most critical assets (a single diagram).
2. **Since the midterm:** The feedback received and how it was addressed (finding–action list).
3. **Live demonstration:** Run the protected build; show cryptography, secure communication and at least one
   protection layer **working live** (e.g., a tampered file or an update with a broken signature being rejected).
4. **Evidence:** The tests, the protection table, the SBOM and the compliance matrix themselves; "we ran this
   command and got this output."
5. **Remaining risk:** What did you deliberately scope out, what could you not meet, and why?

![Final demonstration](assets/h15-03-gosterim.svg)

### Sample questions you may be asked during the demonstration

- Which key is this key derived from, where does it live, when is it deleted?
- How do you validate your certificate chain? Where is hostname verification performed?
- What happens if your signature verification fails? Can an old but validly signed version still be installed?
- Did you measure the cost of obfuscation? Which functions did you obfuscate, and why?
- Where is the evidence for this row in your compliance matrix that you marked "met"?
- Which requirement did you defer, and how will the other party meet it?

### Common mistakes

| Mistake | Why is it a problem? |
| --- | --- |
| There is a test plan but no results | At the final checkpoint, S16's **results** are expected |
| "Met" with no evidence in the compliance matrix | Counted as unmet in the assessor's eyes |
| A version mismatch between the guide and the code | The product being assessed becomes ambiguous; version identity and digest values must be consistent |
| An empty remaining-risk section | No product has zero remaining risk; an empty section means an incomplete analysis |
| Ignoring the midterm feedback | The finding–action loop is part of the process |
| Real secrets or personal data in the repository | A serious security mistake; all values must be synthetic |

---

## 4. Academic integrity

The "Academic Integrity" section of the syllabus applies to the project as well. You must be able to explain every
line you submit; any member of the team may be asked a question during the demonstration. If you used someone else's
code or text, cite the source.

![S16: results, not a plan](assets/h15-04-s16.svg)

---

## 5. At the end of the term

- Your security guide is a scaled-down model of the documentation that certified products carry; you can use it as
  a **portfolio** item in job applications (make sure it contains no confidential information).
- Quiz-2 is held in the final exam period; its scope is weeks 9–14 (see the [Week 16 page](../week-16/cen429-week-16.md)).
