# VIBE.EXE

Free coding lessons in 12 languages, in black and white. Live: https://shiro-dev1.github.io/vibe-exe/

- **Home** — two animations take turns with a glitch between them: an eye drawn with letters (follows the cursor, blinks) and two hands drawn with letters (they reach for each other, pause, and spark when the fingers touch; letters move aside around the cursor). Below — cards for every language with progress.
- **Languages** (`page2.html`) — Python, JavaScript, TypeScript, HTML, CSS, PHP, Java, C, C++, C#, Go, Rust: facts and Hello, world.
- **Lessons** (`python.html`, `javascript.html`, ...) — every lesson has an explanation, code and its output, a line-by-line breakdown, common mistakes and an exercise with a hidden answer; each language ends with a 5-question quiz. JavaScript lessons have Run / Reset buttons (code runs in a sandboxed iframe).
- **Linux** (`page3.html`) — what a terminal is and basic commands.
- **Russian version** — the EN / RU switch in the header; Russian pages live in `ru/`. The choice is remembered in the browser.
- **Which language?** (`pick.html`) — a 5-question quiz that suggests a language for your goal; a banner links to it from the home page and the Languages page (`pick.js`).
- **Glossary** (`glossary.html`) — 38 programming words in plain language with everyday examples; search and a letter filter (`glossary.js`, words in `_build/glossary.py`).
- **Achievements** (`achievements.html`) — 12 badges for lessons, quizzes, running code and visiting days in a row; a pop-up when you earn one and a dot in the menu until you look (`achievements.js`).
- **Progress** — "Mark as done" on every lesson and the best quiz score, stored in the visitor's browser (localStorage).

## Files
- `site.css` — styles, `site.js` — mobile menu and language switch
- `hero.js` — switches the home animations, `eye.js` — the eye, `hands.js` + `hands-data.js` — the hands (brightness map made from `_build/hands-ascii.b64`), `progress.js` — progress, `quiz.js` — quizzes, `runner.js` — Run button
- `favicon.svg` — site icon
- `_build/` — not published by GitHub Pages:
  `python3 _build/build.py` rebuilds all 30 pages from `lessons.py`, `lessons_ru.py`, `quiz.py`, `site_data.py`, `details/` (explanations and exercises) and `newlangs/` (TypeScript, PHP, Java, Go);
  `verify.py`, `verify_quiz.py`, `verify_details.py` and `verify_new.py` run the code examples and check the outputs.
