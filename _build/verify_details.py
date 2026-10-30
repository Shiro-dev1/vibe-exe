# Проверяет ответы заданий «Попробуй сам»: запускает код и сравнивает с answer_out.
# Запуск: python3 _build/verify_details.py [язык ...]
import subprocess, os, sys, tempfile, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lessons import C_MAIN, CPP_MAIN, RS_MAIN, indent
D = tempfile.mkdtemp()
TPL = {"c": C_MAIN, "cpp": CPP_MAIN, "rust": RS_MAIN,
       "java": "public class Main {\n    public static void main(String[] args) {\n%s\n    }\n}\n",
       "go": 'package main\n\nimport "fmt"\n\nfunc main() {\n%s\n}\n',
       "php": "<?php\n%s\n"}
EXT = {"python": "py", "javascript": "js", "c": "c", "cpp": "cpp", "rust": "rs", "java": "java", "go": "go", "php": "php", "typescript": "ts"}

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=180, **kw)

def execute(key, src, n, tag, run_it=True):
    d = os.path.join(D, f"{key}{n}{tag}"); os.makedirs(d, exist_ok=True)
    f = os.path.join(d, ("Main" if key == "java" else "main") + "." + EXT[key]); open(f, "w").write(src)
    exe = os.path.join(d, "prog")
    if key == "python": return run(["python3", f])
    if key == "javascript": return run(["node", f])
    if key == "php": return run(["php", f])
    if key == "typescript":
        c = run(["tsc", "--strict", "--target", "es2020", "--outDir", d, f])
        if c.returncode: return c
        return run(["node", os.path.join(d, "main.js")])
    if key == "go": return run(["go", "build" if not run_it else "run"] + (["-o", exe] if not run_it else []) + [f], env={**os.environ, "GOCACHE": os.path.join(D, "gocache"), "GOPATH": os.path.join(D, "gopath")})
    if key == "java":
        c = run(["javac", f])
        if c.returncode or not run_it: return c
        return run(["java", "-cp", d, "Main"])
    comp = {"c": ["gcc", "-Wall", "-Wno-unused-variable", "-std=c11"], "cpp": ["g++", "-Wall", "-Wno-unused-variable", "-std=c++17"], "rust": ["rustc", "--edition", "2021"]}[key]
    c = run(comp + [f, "-o", exe])
    if c.returncode or not run_it: return c
    return run([exe])

def check(key, items, label):
    bad = 0
    for n, (code, out, mode) in enumerate(items, 1):
        if mode in ("SKIP", "CS") or out is None and mode != "COMPILE": continue
        src = code
        if mode == "MAIN": src = TPL[key] % indent(code, 8 if key == "java" else 4)
        if mode == "COMPILE":
            if key not in ("c", "cpp", "rust", "java", "go"): continue
        r = execute(key, src, n, label, run_it=mode != "COMPILE")
        if mode == "COMPILE":
            ok = r.returncode == 0
        else:
            ok = r.returncode == 0 and r.stdout.rstrip("\n") == out
        if not ok:
            bad += 1; print("BAD", key, label, n, repr(r.stdout[:200]), "want", repr(out), r.stderr[:500])
    return bad

if __name__ == "__main__":
    keys = sys.argv[1:] or ["python", "javascript", "c", "cpp", "rust"]
    total = 0
    for key in keys:
        mod = importlib.import_module("details." + key)
        total += check(key, [(d["answer"], d["answer_out"], d["mode"]) for d in mod.D], "answer")
        print(key, "checked", len(mod.D))
    print("BAD", total)
