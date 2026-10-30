# Проверяет новые языки (newlangs/*.py): код уроков, ответы заданий и тест.
# Запуск: python3 _build/verify_new.py [язык ...]
import os, sys, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from verify_details import execute, TPL
from lessons import indent

def one(key, code, out, mode, n, tag):
    if mode in ("SKIP",) or (out is None and mode != "COMPILE"): return 0
    src = TPL[key] % indent(code, 8 if key == "java" else 4) if mode == "MAIN" else code
    r = execute(key, src, n, tag, run_it=mode != "COMPILE")
    ok = r.returncode == 0 and (mode == "COMPILE" or r.stdout.rstrip("\n") == out)
    if not ok: print("BAD", key, tag, n, repr(r.stdout[:300]), "want", repr(out), (r.stderr or "")[:600])
    return 0 if ok else 1

if __name__ == "__main__":
    bad = 0
    for key in sys.argv[1:] or ["typescript", "php", "java", "go"]:
        m = importlib.import_module("newlangs." + key)
        for n, L in enumerate(m.LESSONS, 1):
            bad += one(key, L["code"], L["out"], L["mode"], n, "lesson")
            bad += one(key, L["answer"], L["answer_out"], L["amode"], n, "answer")
        for n, q in enumerate(m.QUIZ, 1):
            if not q["check"]: continue
            want = q["options"][q["answer"]]
            want = want[0] if isinstance(want, tuple) else want
            bad += one(key, q["code"], want, "MAIN" if q["check"] == "main" else None, n, "quiz")
        print(key, "lessons", len(m.LESSONS), "quiz", len(m.QUIZ))
    print("BAD", bad)
