# Проверяет ответы тестов, у которых указан check: запускает код и сравнивает с правильным вариантом.
import subprocess, os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from quiz import QUIZ
D = tempfile.mkdtemp()
def ind(c): return "\n".join("    " + l if l else l for l in c.split("\n"))
TPL = {"c": "#include <stdio.h>\nint main(void) {\n%s\nreturn 0;\n}\n",
       "cpp": "#include <iostream>\n#include <string>\n#include <vector>\nint main() {\n%s\n}\n",
       "rs": "fn main() {\n%s\n}\n", "rs-full": "%s", "py": "%s", "js": "%s"}
bad = 0
for lang, qs in QUIZ.items():
    for n, q in enumerate(qs, 1):
        ck = q["check"]
        if not ck: continue
        src = TPL[ck] % (ind(q["code"]) if ck in ("c", "cpp", "rs") else q["code"])
        ext = {"py": "py", "js": "js", "c": "c", "cpp": "cpp", "rs": "rs", "rs-full": "rs"}[ck]
        f = os.path.join(D, f"{lang}{n}.{ext}"); open(f, "w").write(src); exe = f + ".bin"
        if ck == "py": r = subprocess.run(["python3", f], capture_output=True, text=True)
        elif ck == "js": r = subprocess.run(["node", f], capture_output=True, text=True)
        else:
            comp = {"c": ["gcc"], "cpp": ["g++", "-std=c++17"], "rs": ["rustc"], "rs-full": ["rustc"]}[ck]
            c = subprocess.run(comp + [f, "-o", exe], capture_output=True, text=True)
            if c.returncode: print("COMPILE FAIL", lang, n, c.stderr[:400]); bad += 1; continue
            r = subprocess.run([exe], capture_output=True, text=True)
        got = r.stdout.strip(); want = q["options"][q["answer"]]
        if isinstance(want, tuple): want = want[0]
        print("ok " if got == want else "BAD", lang, n, repr(got), "want", repr(want))
        bad += got != want
print("BAD", bad)
