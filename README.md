# VIBE.EXE

Black and white experiment: a big eye drawn with letters (ASCII art) watches you.

- The eye follows the cursor or finger, blinks every few seconds and looks around by itself when the mouse is still.
- The pupil gets smaller when the cursor is close. Click the eye and it blinks.
- The VIBE.EXE window is a small terminal: type `help` to see commands, `page 2` / `page 3` to open other pages, a language name (`python`, `js`, `cpp`...) to open its lessons.

## Pages
- `index.html` — page 1, the eye
- `page2.html` — LANGUAGES.DOC, short docs about programming languages
- `page3.html` — LINUX.MAN, Linux and basic terminal commands
- Lessons, opened from the terminal by typing a language name:
  `python.html`, `javascript.html` (js), `html.html`, `css.html`, `c.html`, `cpp.html` (cpp / c++), `csharp.html` (csharp / c#), `rust.html`.
  Type `back` to return to page 2.

## Russian version
Type `lang ru` in the terminal (or `lang en` to switch back). Russian pages live in `ru/` with the same file names. The choice is remembered in the browser.

## Learning features
- Every lesson has a MARK AS DONE button; progress is shown on the lesson page, on page 2 and with the `progress` command. It is stored in the visitor's browser (localStorage).
- Each language ends with a 5-question quiz; the best score is saved too.
- JavaScript lessons have RUN / RESET buttons: the code runs in a sandboxed iframe.

## Other files
- `style.css` — shared styles, `docs.css` — styles for doc pages
- `terminal.js` — the terminal window used on every page, `docs.js` — its setup on doc pages
- `progress.js` — lesson progress, `quiz.js` — quizzes, `runner.js` — RUN button for JavaScript lessons
- `favicon.svg` — site icon
- `_build/` — scripts that generate the pages (not published by GitHub Pages):
  `python3 _build/build.py` rebuilds `index.html`, `ru/index.html` (from `index.src.html`) and all lesson pages from `lessons.py`, `lessons_ru.py`, `quiz.py`;
  `python3 _build/verify.py` and `python3 _build/verify_quiz.py` run the code examples and check the outputs.
