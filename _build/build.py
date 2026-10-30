# Сборка всех страниц VIBE.EXE (английские в корне, русские в ru/).
# Запуск из корня репозитория: python3 _build/build.py
# Данные: lessons.py, lessons_ru.py (уроки), quiz.py (тесты), site_data.py (остальные тексты).
import os, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import importlib, hashlib
from lessons import LANGS
from lessons_ru import RU
from quiz import QUIZ
from site_data import UI, HOME, CARD, LANGS_PAGE, FACTS, LINUX

# Порядок языков на сайте
ORDER = ["python", "javascript", "typescript", "html", "css", "php", "java", "c", "cpp", "csharp", "go", "rust"]

# Подробности к урокам (details/<язык>.py) и новые языки (newlangs/<язык>.py) — переводим в общий формат
DETAILS = {}
for key in ["python", "javascript", "html", "css", "c", "cpp", "csharp", "rust"]:
    DETAILS[key] = importlib.import_module("details." + key).D
for key in ["typescript", "php", "java", "go"]:
    m = importlib.import_module("newlangs." + key)
    LANGS[key] = dict(file=m.LANG["file"], title=m.LANG["title"], cmd=m.LANG["cmd"], ext=m.LANG["ext"], lead=m.LANG["lead"][0],
                      lessons=[(L["title"][0], L["text"][0], L["code"], L["out"], L["mode"]) for L in m.LESSONS])
    RU[key] = dict(lead=m.LANG["lead"][1], lessons=[(L["title"][1], L["text"][1]) for L in m.LESSONS])
    QUIZ[key] = [dict(q, check=None) for q in m.QUIZ]
    FACTS[key] = m.FACT
    CARD[key] = m.CARD
    DETAILS[key] = [dict(about=L["about"], lines=L["lines"], mistakes=L["mistakes"], task=L["task"],
                         answer=L["answer"], answer_out=L["answer_out"]) for L in m.LESSONS]


def ver(name):
    # Метка версии файла: браузер увидит новый адрес и не возьмёт старую копию из кэша
    return name + "?v=" + hashlib.md5(open(os.path.join(ROOT, name), "rb").read()).hexdigest()[:8]

esc = html.escape
GH = "https://github.com/Shiro-dev1"


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(text)
    print("wrote", rel)


def page(lang, file, title, desc, body, active=None, scripts=()):
    """Общий шаблон: шапка с меню и переключателем языка, содержимое, подвал."""
    U = UI[lang]
    pre = "" if lang == "en" else "../"
    en_href = file if lang == "en" else "../" + file
    ru_href = "ru/" + file if lang == "en" else file
    other = "ru" if lang == "en" else "en"
    other_href = ru_href if lang == "en" else en_href
    nav = [("index.html", U["nav_home"], "home"), ("page2.html", U["nav_langs"], "langs"), ("page3.html", U["nav_linux"], "linux")]
    nav_html = "".join(
        f'<a href="{f}"{" aria-current=\"page\"" if key == active else ""}>{esc(t)}</a>' for f, t, key in nav)
    js = "".join(f'<script src="{pre}{ver(s)}"></script>\n' for s in ("site.js",) + tuple(scripts))
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="icon" href="{pre}favicon.svg" type="image/svg+xml">
<link rel="alternate" hreflang="en" href="{en_href}">
<link rel="alternate" hreflang="ru" href="{ru_href}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Unbounded:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}{ver("site.css")}">
<script>
  // Если раньше выбран другой язык — сразу открываем его версию страницы
  try {{ if (localStorage.getItem("vibe-lang") === "{other}") location.replace("{other_href}" + location.hash); }} catch (e) {{}}
</script>
</head>
<body>
<header class="site-head">
  <div class="wrap head-row">
    <a class="logo" href="index.html">VIBE<span>.EXE</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">{esc(U["menu"])}</button>
    <nav class="site-nav" id="site-nav">{nav_html}</nav>
    <div class="lang-switch" role="group" aria-label="Language">
      <a href="{en_href}" data-setlang="en" hreflang="en"{' aria-current="true"' if lang == "en" else ""}>EN</a>
      <a href="{ru_href}" data-setlang="ru" hreflang="ru"{' aria-current="true"' if lang == "ru" else ""}>RU</a>
    </div>
  </div>
</header>
<main>
{body}
</main>
<footer class="site-foot">
  <div class="wrap foot-row">
    <span>VIBE.EXE · {esc(U["footer_made"])}</span>
    <a href="{GH}" target="_blank" rel="noopener">{esc(U["footer_gh"])}: github.com/Shiro-dev1</a>
  </div>
</footer>
{js}</body>
</html>
"""


def card_title(key):
    return {"PYTHON": "Python", "JAVASCRIPT": "JavaScript", "RUST": "Rust"}.get(LANGS[key]["title"], LANGS[key]["title"])


def lang_cards(lang):
    U = UI[lang]
    out = []
    for key in ORDER:
        d = CARD[key][0 if lang == "en" else 1]
        out.append(f"""    <a class="card" href="{LANGS[key]['file']}">
      <h3>{esc(card_title(key))}</h3>
      <p>{esc(d)}</p>
      <div class="pbar" data-progress="{key}"></div>
      <span class="go">{esc(U['open_lessons'])} →</span>
    </a>""")
    return "\n".join(out)


# ---------------------------------------------------------------- главная
for lang in ("en", "ru"):
    H = HOME[lang]
    steps = "\n".join(f"      <li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>" for t, d in H["steps"])
    body = f"""<section class="hero wrap">
  <div class="eye-box"><canvas id="eye" role="img" aria-label="{esc(H['eye_label'])}"></canvas></div>
  <h1>{esc(H['h1'])}</h1>
  <p class="lead">{esc(H['lead'])}</p>
  <div class="btn-row">
    <a class="btn" href="page2.html">{esc(H['start'])} →</a>
    <a class="btn ghost" href="page3.html">{esc(H['linux'])}</a>
  </div>
</section>
<section class="section wrap" id="languages">
  <div class="section-head"><h2>{esc(H['langs_h'])}</h2><p>{esc(H['langs_sub'])}</p></div>
  <div class="cards">
{lang_cards(lang)}
  </div>
</section>
<section class="section wrap">
  <div class="section-head"><h2>{esc(H['how_h'])}</h2></div>
  <ol class="steps">
{steps}
  </ol>
</section>"""
    write(("" if lang == "en" else "ru/") + "index.html",
          page(lang, "index.html", H["title"], H["desc"], body, "home", ("progress.js", "eye.js")))

# ---------------------------------------------------------------- языки (page2)
for lang in ("en", "ru"):
    U, P = UI[lang], LANGS_PAGE[lang]
    items = []
    for key in ORDER:
        born, author, used, text = FACTS[key][lang]
        items.append(f"""  <article class="lang-item" id="{key}">
    <div>
      <h2>{esc(card_title(key))}</h2>
      <dl class="facts"><dt>{esc(U['born'])}</dt><dd>{esc(born)}</dd><dt>{esc(U['author'])}</dt><dd>{esc(author)}</dd><dt>{esc(U['used_for'])}</dt><dd>{esc(used)}</dd></dl>
      <p>{esc(text)}</p>
      <div class="pbar" data-progress="{key}"></div>
      <div class="btn-row"><a class="btn small" href="{LANGS[key]['file']}">{esc(U['open_lessons'])} →</a></div>
    </div>
    <div><pre><code>{esc(FACTS[key]['hello'])}</code></pre></div>
  </article>""")
    body = f"""<div class="wrap">
  <header class="page-head"><h1>{esc(P['h1'])}</h1><p class="lead">{esc(P['lead'])}</p></header>
  <div class="lang-list">
{chr(10).join(items)}
  </div>
</div>"""
    write(("" if lang == "en" else "ru/") + "page2.html",
          page(lang, "page2.html", P["title"] + " — VIBE.EXE", P["desc"], body, "langs", ("progress.js",)))

# ---------------------------------------------------------------- Linux (page3)
for lang in ("en", "ru"):
    L = LINUX[lang]
    groups = []
    for title, cmds in L["sections"]:
        rows = "\n".join(
            f'      <div class="cmd"><code>{esc(c)}</code><div>{esc(d)}{f"<small>{esc(n)}</small>" if n else ""}</div></div>'
            for c, d, n in cmds)
        groups.append(f'    <section class="cmd-group"><h2>{esc(title)}</h2>\n{rows}\n    </section>')
    body = f"""<div class="wrap">
  <header class="page-head"><h1>{esc(L['h1'])}</h1><p class="lead">{esc(L['lead'])}</p></header>
  <section class="intro-block"><h2>{esc(L['intro_h'])}</h2><p>{esc(L['intro'])}</p><pre><code>{esc(L['intro_code'])}</code></pre></section>
{chr(10).join(groups)}
</div>"""
    write(("" if lang == "en" else "ru/") + "page3.html",
          page(lang, "page3.html", L["title"] + " — VIBE.EXE", L["desc"], body, "linux"))

# ---------------------------------------------------------------- уроки
LESSON_UI = {
    "en": dict(h1="{t} lessons", title="{t} lessons — VIBE.EXE", desc="{t} lessons: from Hello, world to a mini project."),
    "ru": dict(h1="Уроки {t}", title="Уроки {t} — VIBE.EXE", desc="Уроки {t}: от Hello, world до мини-проекта."),
}


def opt_text(o, lang):
    return (o[0] if lang == "en" else o[1]) if isinstance(o, tuple) else o


def nice_title(s):
    # ЗАГОЛОВКИ В ДАННЫХ ЗАПИСАНЫ КАПСОМ — делаем «Как в предложении», не трогая названия языков
    keep = {"CSS", "HTML", "FLEXBOX", "GRID"}
    words = s.split(" ")
    out = []
    for i, w in enumerate(words):
        core = w.strip(",:")
        if core in keep:
            out.append(w.replace("FLEXBOX", "Flexbox").replace("GRID", "Grid"))
        elif i == 0:
            out.append(w[:1] + w[1:].lower())
        else:
            out.append(w.lower())
    return " ".join(out).replace("hello, world", "Hello, world").replace("Hello, world", "Hello, world")


for idx, key in enumerate(ORDER):
    L = LANGS[key]
    total = len(L["lessons"])
    is_js = key == "javascript"
    name = card_title(key)
    for lang in ("en", "ru"):
        U, LU, R = UI[lang], LESSON_UI[lang], RU[key]
        side, body = [], []
        for n, (title, text, code, out, _) in enumerate(L["lessons"], 1):
            if lang == "ru":
                title, text = R["lessons"][n - 1]
                for a, b in R.get("code", {}).get(n, []):
                    assert a in code, (key, n, a)
                    code = code.replace(a, b)
                out = R.get("out", {}).get(n, out)
            t = nice_title(title)
            side.append(f'        <li><a href="#lesson-{n}" data-lang="{key}" data-n="{n}"><span class="num"><span>{n}</span></span>{esc(t)}</a></li>')
            if is_js:
                code_html = ('    <div class="runbox">\n'
                             f'      <textarea id="code-{n}" spellcheck="false" autocapitalize="off" aria-label="Code">{esc(code)}</textarea>\n'
                             '      <div class="run-btns"><button class="btn small run" type="button">Run</button>'
                             '<button class="btn small ghost reset" type="button">Reset</button></div>\n'
                             '    </div>')
            else:
                code_html = f"    <pre><code>{esc(code)}</code></pre>"
            out_html = ""
            if out is not None:
                out_html = f'\n    <div class="out"><span class="out-label">{esc(U["out"])}</span><pre>{esc(out)}</pre></div>'
            D = DETAILS[key][n - 1]
            li = 0 if lang == "en" else 1
            about = "".join(f"\n    <p>{para}</p>" for para in D["about"][li].split("\n\n"))
            rows = "".join(f'\n        <div class="bd-row"><code>{esc(c)}</code><span>{(e if lang == "en" else r)}</span></div>' for c, e, r in D["lines"])
            mist = "".join(f"\n        <li>{m[li]}</li>" for m in D["mistakes"])
            ans_out = (f'\n        <div class="out"><span class="out-label">{esc(U["out"])}</span><pre>{esc(D["answer_out"])}</pre></div>'
                       if D.get("answer_out") else "")
            extra = f"""
    <div class="more">{about}
    </div>
    <section class="sub breakdown"><h3>{esc(U['breakdown'])}</h3>{rows}
    </section>
    <section class="sub mistakes"><h3>{esc(U['mistakes'])}</h3><ul>{mist}
      </ul>
    </section>
    <section class="sub task"><h3>{esc(U['task'])}</h3>
      <p>{D['task'][li]}</p>
      <details class="answer"><summary>{esc(U['show_answer'])}</summary>
        <pre><code>{esc(D['answer'])}</code></pre>{ans_out}
      </details>
    </section>"""
            body.append(f"""  <article class="lesson" id="lesson-{n}">
    <span class="lesson-kicker">{n:02d} / {total:02d}</span>
    <h2>{esc(t)}</h2>
    <p>{text}</p>
{code_html}{out_html}{extra}
    <button class="done-btn" type="button" data-lang="{key}" data-n="{n}"></button>
  </article>""")

        qs = []
        for i, q in enumerate(QUIZ[key], 1):
            qt = q["q"][0] if lang == "en" else q["q"][1]
            qcode = f'\n      <pre><code>{esc(q["code"])}</code></pre>' if q["code"] else ""
            opts = "".join(f'<button type="button">{esc(opt_text(o, lang))}</button>' for o in q["options"])
            why = q["why"][0] if lang == "en" else q["why"][1]
            qs.append(f"""    <div class="q" data-answer="{q['answer']}">
      <p class="q-text">{i}. {esc(qt)}</p>{qcode}
      <div class="opts">{opts}</div>
      <p class="why" hidden>{esc(why)}</p>
    </div>""")
        quiz = f"""  <section class="quiz" id="quiz" data-lang="{key}">
    <div class="quiz-head"><h2>{esc(U['quiz_title'])}</h2><p>{esc(U['quiz_sub'])}</p></div>
{chr(10).join(qs)}
    <p class="score" hidden></p>
    <button class="btn retry" type="button" hidden></button>
  </section>"""

        prev_k, next_k = ORDER[idx - 1] if idx > 0 else None, ORDER[idx + 1] if idx + 1 < len(ORDER) else None
        pager = '  <nav class="pager">'
        pager += f'<a class="btn ghost" href="{LANGS[prev_k]["file"]}">← {esc(U["prev_lang"])}: {esc(card_title(prev_k))}</a>' if prev_k else "<span></span>"
        pager += f'<a class="btn ghost" href="{LANGS[next_k]["file"]}">{esc(U["next_lang"])}: {esc(card_title(next_k))} →</a>' if next_k else ""
        pager += "</nav>"

        say_txt = L.get("say") if lang == "en" else R.get("say")
        say = f'\n    <p class="say">{esc(U["say"])}{esc(say_txt)}</p>' if say_txt else ""
        lead = L["lead"] if lang == "en" else R["lead"]
        body_html = f"""<div class="wrap">
  <header class="page-head">
    <nav class="crumbs"><a href="page2.html">{esc(U['crumbs_langs'])}</a><span>›</span><span>{esc(name)}</span></nav>
    <h1>{esc(LU['h1'].format(t=name))}</h1>{say}
    <p class="lead">{lead}</p>
  </header>
  <div class="lesson-layout">
    <details class="side" open>
      <summary>{esc(U['lessons_title'])}</summary>
      <div class="side-inner">
        <div class="side-title">{esc(U['lessons_title'])}</div>
        <div class="pbar" data-progress="{key}"></div>
        <ol>
{chr(10).join(side)}
          <li><a href="#quiz"><span class="num">?</span>{esc(U['quiz_link'])}</a></li>
        </ol>
      </div>
    </details>
    <div class="lesson-main">
{chr(10).join(body)}
{quiz}
{pager}
    </div>
  </div>
</div>"""
        scripts = ("progress.js", "quiz.js") + (("runner.js",) if is_js else ())
        write(("" if lang == "en" else "ru/") + L["file"],
              page(lang, L["file"], LU["title"].format(t=name), LU["desc"].format(t=name), body_html, "langs", scripts))
