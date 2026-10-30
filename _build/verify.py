# Проверяет уроки: запускает примеры (Python, JS, C, C++, Rust) и сравнивает вывод с блоком OUTPUT.
# Запуск: python3 _build/verify.py
import subprocess, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lessons import *
import tempfile
D = tempfile.mkdtemp()
bad = 0
def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=120, **kw)
for key in ["python", "javascript", "c", "cpp", "rust"]:
    L = LANGS[key]
    for n, (title, text, code, out, mode) in enumerate(L["lessons"], 1):
        if mode == "SKIP": continue
        src = code
        if mode == "MAIN":
            tpl = {"c": C_MAIN, "cpp": CPP_MAIN, "rust": RS_MAIN}[key]
            src = tpl % indent(code)
        f = os.path.join(D, f"{key}{n}.{L['ext']}")
        open(f, "w").write(src)
        exe = f + ".bin"
        if key == "python": r = run(["python3", f])
        elif key == "javascript": r = run(["node", f])
        else:
            comp = {"c": ["gcc", "-Wall", "-Wno-unused-variable", "-std=c11"], "cpp": ["g++", "-Wall", "-Wno-unused-variable", "-std=c++17"], "rust": ["rustc", "--edition", "2021"]}[key]
            r = run(comp + [f, "-o", exe])
            if r.returncode or ("warning" in r.stderr and key != "rust"):
                print("COMPILE", key, n, r.stderr[:600]); bad += 1; continue
            if r.stderr and key == "rust": print("rust warn", n, r.stderr[:300])
            if mode == "COMPILE": print("ok compile", key, n); continue
            r = run([exe])
        got = r.stdout.rstrip("\n")
        if got != out or r.returncode:
            bad += 1; print("MISMATCH", key, n, title, repr(got), repr(out), r.stderr[:300])
        else: print("ok", key, n)
print("BAD", bad)
