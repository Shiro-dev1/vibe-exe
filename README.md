# VIBE.EXE

Free coding lessons in 12 languages, in black and white. Live: https://shiro-dev1.github.io/vibe-exe/

- **Home** — an eye drawn with letters (ASCII art) that follows the cursor and blinks, cards for every language with progress.
- **Languages** (`page2.html`) — Python, JavaScript, TypeScript, HTML, CSS, PHP, Java, C, C++, C#, Go, Rust: facts and Hello, world.
- **Lessons** (`python.html`, `javascript.html`, ...) — every lesson has an explanation, code and its output, a line-by-line breakdown, common mistakes and an exercise with a hidden answer; each language ends with a 5-question quiz. JavaScript lessons have Run / Reset buttons (code runs in a sandboxed iframe).
- **Linux** (`page3.html`) — what a terminal is and basic commands.
- **Russian version** — the EN / RU switch in the header; Russian pages live in `ru/`. The choice is remembered in the browser.
- **Progress** — "Mark as done" on every lesson and the best quiz score, stored in the visitor's browser (localStorage).

## Files
- `site.css` — styles, `site.js` — mobile menu and language switch
- `eye.js` — the eye on the home page, `progress.js` — progress, `quiz.js` — quizzes, `runner.js` — Run button
- `favicon.svg` — site icon
- `_build/` — not published by GitHub Pages:
  `python3 _build/build.py` rebuilds all 30 pages from `lessons.py`, `lessons_ru.py`, `quiz.py`, `site_data.py`, `details/` (explanations and exercises) and `newlangs/` (TypeScript, PHP, Java, Go);
  `verify.py`, `verify_quiz.py`, `verify_details.py` and `verify_new.py` run the code examples and check the outputs.
