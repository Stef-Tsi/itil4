# ITIL 4 Foundation question and application review

Reviewed and verified on 12 October 2026. Active revision: `strict-v5-20261012`.

All 168 questions, their four options and their individual English rationales were reviewed against the published Foundation syllabus, exam specification and sample material. The 90 existing study cards were also reviewed. This revision substantively changes 89 questions, standardizes capitalization in 14 further prompts and adds 21 study cards, giving 111 cards.

This is an editorial assessment. The original practice questions have not been calibrated against candidate performance or the confidential live exam bank. Matching the published blueprint does not establish equal difficulty or predict a first-attempt pass.

## Content findings and changes

- The question shown in the user's screenshot (item 021) contained an unnecessarily indirect scenario and a distractor that could be partly true. It now directly tests how guiding principles interact, with one unambiguous correct answer and specific explanations for all four options.
- Many prompts and options used indirect language or qualifications that made reading harder without testing a useful distinction. These were shortened while retaining the required Foundation concept. Difficulty should come from distinguishing related concepts, not decoding elaborate English.
- Practice-purpose explanations were revised to identify the actual purpose of each practice. Other revisions clarify incident restoration versus cause investigation, problem control versus error control, service requests versus changes, outputs versus outcomes, and component targets versus end-to-end service quality.
- Item 036's explanation previously attributed the same error to two different statements. It now explains each statement separately. Service-desk and service-level distractor explanations were also made specific to the selected option.
- Several study-card memory notes belonged to another concept. Those were corrected. Added cards cover service offerings, consumer costs and risks, guiding-principle interaction, external factors, sourcing, value streams, the continual improvement register, improvement participation, change schedules, problem activities, incident handling, service requests and service-level evidence.
- Every question has four English option-specific rationales. A wrong practice answer immediately displays why that chosen answer is wrong, the correct answer and its explanation. The comparison of all options is available in both practice feedback and the submitted exam review.

## Application changes

- Full question snapshots are saved with each new session. Revision-4 sessions reconstruct their original content from retained metadata and their saved shuffled answer versions, so an update does not silently change a question mid-exam.
- Existing progress, question familiarity, mistakes and historical exam reviews are retained. Earlier results are labelled rather than silently hidden. Historical mistake retry cannot overwrite an unrelated saved session.
- Export now includes progress and an unfinished session. Import accepts both the new backup format and older progress-only exports, validates the data, and asks before replacing progress. The immediately preceding state is retained locally before an import.
- Browser-storage failures show a warning. An in-memory mirror keeps the latest answers and export data available for the current page instead of reverting to stale stored answers.
- The former readiness score is replaced by question coverage, explicitly labelled as exposure rather than mastery. Current-revision exam results remain separate from all-time drill accuracy.
- The definitions-and-purposes drill now uses recall questions. Understanding practice remains available separately. Unseen questions are preferred where the selected mode permits it.
- Empty flashcard searches, keyboard card flipping, answer shortcuts and question focus were corrected. Answers use a lighter font weight for readability, and list questions display the stem before their numbered statements.
- The exam overview displays a running timer. Expiry is checked when answering, moving between questions, opening the overview and returning to the page. Practice explanations stay hidden throughout a timed exam until submission.
- Official sample questions and rationales are linked from the exam screen for an independent check using material outside this app.

## Blueprint


The published criterion allocation is used when selecting each exam. Bank inventory is larger than a paper; bank proportions do not replace the paper quotas.

| Assessment criterion | Active bank items | Questions per exam | Bloom level |
| --- | ---: | ---: | ---: |
| 1.1 | 7 | 2 | 1 |
| 1.2 | 10 | 2 | 2 |
| 1.3 | 5 | 1 | 2 |
| 2.1 | 4 | 1 | 2 |
| 2.2 | 19 | 5 | 2 |
| 3.1 | 9 | 2 | 2 |
| 4.1 | 6 | 1 | 2 |
| 5.1 | 4 | 1 | 2 |
| 5.2 | 6 | 1 | 2 |
| 6.1 | 16 | 5 | 1 |
| 6.2 | 10 | 2 | 1 |
| 7.1 | 72 | 17 | 2 |
| **Total** | **168** | **40** | **9 recall / 31 understanding** |

The bank includes 147 standard, 16 list, 3 missing-word and 2 exceptional negative items. These are bank counts, not a claimed official distribution of question styles. Each list question presents four statements and four paired options with one correct pair.

Timed exams use 60 minutes, one mark per question, a pass mark of 26/40 and no negative marking. The 75-minute option is labelled for candidates granted extra time. Feedback is withheld until submission. Earlier scores remain visible with their revision label and are excluded from the current-revision exam average. Sessions from revision 4 retain their original question text and shuffled answers when resumed. Familiarity is preserved across content revisions so edited questions are not falsely counted as unseen.

## Reference comparison

The community quiz supplied by the user contains 174 items and concise option feedback. It was used as a style reference. Its random selection, immediate feedback and older terminology do not replace the published exam specification or current syllabus used for this app.

No community or official sample questions were imported. Revised questions and explanations were independently written. Their intent is to practise published Foundation learning outcomes, not reproduce confidential live exam questions.

## Sources

- [PeopleCert syllabus v4.2.0, March 2025](https://gogotraining.com/blog/wp-content/uploads/2025/01/ITIL4_FND_Syllabus_%CE%95%CE%9D_v4.2.pdf): scope, levels and question-style rules.
- [PeopleCert exam specification](https://igen.nl/wp-content/uploads/2024/10/ITIL-4-Foundation_Exam-Specification_Digital.pdf): criterion quotas and 9/31 Bloom allocation.
- [Official Foundation sample paper 1, question booklet v1.4](https://www.serview.de/fileadmin/redakteur/medien/downloads/Musterpr%C3%BCfungen_f%C3%BCr_neuen_Downloadbereich/EN_ITIL4_FND_2019_SamplePaper1_QuestionBk_v1.4.pdf) and [rationales v1.6](https://en.serview.de/fileadmin/redakteur/medien/downloads/Musterpr%C3%BCfungen_f%C3%BCr_neuen_Downloadbereich/EN_ITIL4_FND_2019_SamplePaper1_Rationale_v1.6.pdf): comparison of concise stems and close distractors. These carry the 2019 AXELOS copyright; the newer syllabus controls terminology and scope.
- [PeopleCert-authored Quick Reference Guide](https://files.qaro.digiday.cz/site/01933137-0d6e-7a7a-8528-6f4f944789dc/uploads/2025/12/18/01a60047bc2bd4b07588a88e9af117a3.pdf): cross-check of definitions and practice distinctions.
- [The user's community example](https://d12.github.io/itil-quiz/game.html): style comparison only, not the authority for exam requirements.

The official documents above are hosted by third parties. Use the linked official sample material separately to validate preparation on questions not previously practised in this app.

## Functional verification

JavaScript syntax and local DOM integration checks passed for:

- All 168 unique English items, four distinct options, four matching rationales and valid assessment metadata.
- 100 generated papers with exactly 40 questions, the published criterion quotas and the 9/31 recall/understanding split; three disjoint papers from a fresh bank.
- Shuffled answers with their matching rationales, immediate drill feedback, delayed exam feedback, last-selected-answer scoring and all 40 answer reviews.
- Scores of 25/40 and 26/40 on the pass boundary, a 32/40 paper and prevention of double rewards.
- Navigation, flags, unanswered-question confirmation, saved-session protection, resume, automatic submission on expiry and 60/75-minute settings.
- Resuming and grading a revision-4 session using its original wording and shuffled options; migration of familiarity and retention of earlier history.
- Backup parsing and restoration, invalid backup rejection, and preserving current answers when browser writes fail.
- All 111 study cards, no-results searches, keyboard interaction and protection of a saved exam when retrying historical mistakes.

These checks verify application behaviour and data consistency. The editorial review assesses content. Neither substitutes for an independent official sample paper or guarantees an exam result.
