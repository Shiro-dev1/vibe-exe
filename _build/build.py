# Сборка страниц VIBE.EXE.
# Запуск из корня репозитория: python3 _build/build.py
# Что делает:
#   - index.html и ru/index.html из _build/index.src.html (+ картинка рук из hands.b64)
#   - страницы уроков (python.html, ...) на английском в корне и на русском в ru/
# page2.html, page3.html и их русские версии в ru/ пишутся вручную.
import os, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from lessons import LANGS, ORDER
from lessons_ru import RU
from quiz import QUIZ

def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(text)
    print("wrote", rel)

# ---------------------------------------------------------------- главная
src = open(os.path.join(HERE, "index.src.html")).read()
src = src.replace("__HANDS__", open(os.path.join(HERE, "hands.b64")).read().strip())
write("index.html", src)

ru_index = src
for a, b in [
    ('<html lang="en">', '<html lang="ru">'),
    ('href="favicon.svg"', 'href="../favicon.svg"'),
    ('href="style.css"', 'href="../style.css"'),
    ('src="progress.js"', 'src="../progress.js"'),
    ('src="terminal.js"', 'src="../terminal.js"'),
    ('content="VIBE.EXE — a black and white pixel experiment."', 'content="VIBE.EXE — чёрно-белый пиксельный эксперимент."'),
    ('aria-label="Two pixel hands reaching for each other"', 'aria-label="Две пиксельные руки тянутся друг к другу"'),
    ('>EXPERIMENT_01<', '>ЭКСПЕРИМЕНТ_01<'),
    ('"> booting vibe.exe..."', '"> загрузка vibe.exe..."'),
    ('"> loading hands ....... ok"', '"> загружаю руки ....... ok"'),
    ('"> human  <->  machine"', '"> человек  <->  машина"'),
]:
    assert a in ru_index, a
    ru_index = ru_index.replace(a, b)
write("ru/index.html", ru_index)

# ---------------------------------------------------------------- уроки
UI = {
    "en": dict(htmllang="en", pre="", label="// PAGE 02 / {t}", h1="{t} LESSONS", title="{t} LESSONS — VIBE.EXE",
               desc="{t} lessons: from Hello, world to a mini project.", say="// say: {s}", back="&lt; PAGE_02",
               out="OUTPUT", quiz="QUIZ", quizbar="QUIZ.EXE", qn="{n} QUESTIONS",
               tip='// type "back" in the terminal to return to the languages, or type another language: {o}',
               loaded="{c} lessons loaded"),
    "ru": dict(htmllang="ru", pre="../", label="// СТРАНИЦА 02 / {t}", h1="УРОКИ {t}", title="УРОКИ {t} — VIBE.EXE",
               desc="Уроки {t}: от Hello, world до мини-проекта.", say="// читается: {s}", back="&lt; СТРАНИЦА_02",
               out="ВЫВОД", quiz="ТЕСТ", quizbar="ТЕСТ.EXE", qn="{n} ВОПРОСОВ",
               tip='// введи "back" в терминале, чтобы вернуться к языкам, или другой язык: {o}',
               loaded="уроки {c} загружены"),
}

PAGE = """<!DOCTYPE html>
<html lang="{htmllang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{pre}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}style.css">
<link rel="stylesheet" href="{pre}docs.css">
</head>
<body>
<div class="scan"></div>
<a class="corner tl" href="index.html">VIBE.EXE<span class="blink">_</span></a>
<a class="corner tr" href="page2.html">{back}</a>

<main>
  <div class="label">{label}</div>
  <h1>{h1}</h1>
{say}  <p class="lead">{lead}</p>

  <nav class="toc">
{toc}
  </nav>
  <p class="pline" data-progress="{key}"></p>
{lessons}
{quiz}
  <p class="tip">{tip}</p>
</main>

<script src="{pre}progress.js"></script>
<script src="{pre}terminal.js"></script>
<script src="{pre}docs.js"></script>
<script src="{pre}quiz.js"></script>
{runner}<script>startDocsTerminal("{key}", "{loaded}");</script>
</body>
</html>
"""

def slug(title):
    return title.replace(", ", "_").replace(": ", "_").replace(" ", "_")

def opt_text(o, lang):
    if isinstance(o, tuple): return o[0] if lang == "en" else o[1]
    return o

for key in ORDER:
    L = LANGS[key]
    total = len(L["lessons"])
    is_js = key == "javascript"
    for lang in ("en", "ru"):
        U = UI[lang]
        R = RU[key]
        toc, body = [], []
        for n, (title, text, code, out, _) in enumerate(L["lessons"], 1):
            if lang == "ru":
                title, text = R["lessons"][n - 1]
                for a, b in R.get("code", {}).get(n, []):
                    assert a in code, (key, n, a)
                    code = code.replace(a, b)
                out = R.get("out", {}).get(n, out)
            num = f"{n:02d}"
            toc.append(f'    <a href="#lesson-{n}">{num} {html.escape(title)}</a>')
            if is_js:
                code_html = ('      <div class="runbox">\n'
                             f'        <textarea spellcheck="false" autocapitalize="off" aria-label="Code">{html.escape(code)}</textarea>\n'
                             '        <div class="run-btns"><button class="run" type="button">[ RUN ]</button>'
                             '<button class="reset" type="button">[ RESET ]</button></div>\n'
                             '      </div>')
            else:
                code_html = f"      <pre><code>{html.escape(code)}</code></pre>"
            out_html = ""
            if out is not None:
                out_html = f'\n      <div class="out"><span>{U["out"]}</span><pre>{html.escape(out)}</pre></div>'
            body.append(f"""
  <article class="doc" id="lesson-{n}">
    <div class="doc-bar"><span>{num}_{slug(title)}</span><span>{num}/{total:02d}</span></div>
    <div class="doc-body">
      <p>{text}</p>
{code_html}{out_html}
      <button class="done-btn" type="button" data-lang="{key}" data-n="{n}"></button>
    </div>
  </article>
""")
        toc.append(f'    <a href="#quiz">{U["quiz"]}</a>')

        # тест
        qs = []
        for i, q in enumerate(QUIZ[key], 1):
            qt = q["q"][0] if lang == "en" else q["q"][1]
            code = f'\n      <pre><code>{html.escape(q["code"])}</code></pre>' if q["code"] else ""
            opts = "".join(f'<button type="button">{html.escape(opt_text(o, lang))}</button>' for o in q["options"])
            why = q["why"][0] if lang == "en" else q["why"][1]
            qs.append(f"""      <div class="q" data-answer="{q['answer']}">
      <p class="q-text">{i:02d}. {html.escape(qt)}</p>{code}
      <div class="opts">{opts}</div>
      <p class="why" hidden>{html.escape(why)}</p>
      </div>""")
        quiz = f"""  <section class="quiz" id="quiz" data-lang="{key}">
    <div class="doc-bar"><span>{U['quizbar']}</span><span>{U['qn'].format(n=len(QUIZ[key]))}</span></div>
    <div class="doc-body">
{chr(10).join(qs)}
      <p class="score" hidden></p>
      <button class="retry" type="button" hidden></button>
    </div>
  </section>"""

        say = ""
        if lang == "en" and L.get("say"): say = f'  <p class="say">{U["say"].format(s=L["say"])}</p>\n'
        if lang == "ru" and R.get("say"): say = f'  <p class="say">{U["say"].format(s=R["say"])}</p>\n'
        others = ", ".join(LANGS[k]["cmd"] for k in ORDER if k != key)
        page = PAGE.format(
            htmllang=U["htmllang"], pre=U["pre"], title=U["title"].format(t=L["title"]),
            desc=U["desc"].format(t=L["title"]), back=U["back"], label=U["label"].format(t=L["title"]),
            h1=U["h1"].format(t=L["title"]), say=say, lead=L["lead"] if lang == "en" else R["lead"],
            toc="\n".join(toc), key=key, lessons="".join(body), quiz=quiz,
            tip=U["tip"].format(o=others), loaded=U["loaded"].format(c=L["cmd"]),
            runner=f'<script src="{U["pre"]}runner.js"></script>\n' if is_js else "")
        write(("" if lang == "en" else "ru/") + L["file"], page)
