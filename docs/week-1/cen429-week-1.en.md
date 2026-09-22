# Week 1 — Introduction to Secure Programming and the Application Protection Plan

| | |
| --- | --- |
| **Date** | 18.09.2026 (make-up: 30.09.2026) |
| **Learning outcomes** | LO.1, LO.5 |
| **Duration** | 3 hours |
| **Labs** | [`code/week-01`](https://github.com/ucoruh/cen429-secure-programming/tree/main/code/week-01) — 4 demos, each runs with `make demo` |

<!-- materyal:basla -->

<div class="materyal" markdown>

[:material-file-pdf-box: Lecture notes (PDF)](cen429-week-1-ders-notu.pdf){ .md-button download="cen429-week-1-ders-notu.pdf" }
[:material-file-word-box: Lecture notes (DOCX)](cen429-week-1-ders-notu.docx){ .md-button download="cen429-week-1-ders-notu.docx" }
[:material-presentation: Slides (PDF)](cen429-week-1-sunum.pdf){ .md-button download="cen429-week-1-sunum.pdf" }
[:material-microsoft-powerpoint: Slides (PPTX)](cen429-week-1-sunum.pptx){ .md-button download="cen429-week-1-sunum.pptx" }
[:material-language-html5: Slides (HTML, offline)](cen429-week-1-sunum.html){ .md-button download="cen429-week-1-sunum.html" }
[:material-folder-zip: Download all (ZIP)](cen429-week-1-materyal.zip){ .md-button download="cen429-week-1-materyal.zip" }
[:material-fullscreen: Open slides full screen](cen429-week-1-sunum.html){ .md-button .md-button--primary target=_blank }

</div>

<div class="sunum-cercevesi">
<iframe src="../cen429-week-1-sunum.html" title="Week 1 — Introduction to Secure Programming and the Application Protection Plan" loading="lazy" allowfullscreen></iframe>
</div>

<p class="sunum-ipucu">Click inside the slides and use the arrow keys; use the button at the bottom right of the slides or the link above for full screen.</p>

<!-- materyal:bitis -->

!!! info "English version in preparation"
    The course is taught in Turkish. The English version of these notes is prepared after the Turkish notes are
    reviewed. Until then, please use the Turkish page; the lab code and its comments are self-explanatory.

Topics: security goals (CIA) and the asset–threat–vulnerability–risk chain; attacker models including the
white-box ("man-at-the-end") attacker; secure design principles; the application protection plan with interface and asset
tables; threat modeling with STRIDE and attack trees; untrusted environments at program start-up
(PATH hijacking); secrets left in memory (dead store elimination); process memory layout; buffer overflow leading to
privilege escalation; signed/unsigned length errors.
