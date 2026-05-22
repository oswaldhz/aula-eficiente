import os, sys, hashlib, json, shutil, subprocess, time, re
from pathlib import Path
import psutil
import requests
from datetime import datetime
from colorama import init, Fore, Style

init(autoreset=True)

# ===== Config =====
SUSPECT_EXT = {".exe", ".dll", ".scr", ".js", ".vbs", ".ps1", ".bat", ".cmd", ".msi", ".lnk"}
SCAN_DIRS = [
    Path(os.environ.get("USERPROFILE", str(Path.home()))) / "Downloads",
    Path(os.environ.get("TEMP", Path.home() / "AppData/Local/Temp")),
    Path(os.environ.get("APPDATA", Path.home() / "AppData/Roaming")) / "Microsoft/Windows/Start Menu/Programs/Startup",
]
REPORT_DIR = Path.cwd() / "antimal_reports"
QUARANTINE_DIR = REPORT_DIR / "quarantine"
VT_API_KEY = os.environ.get("VIRUSTOTAL_API_KEY")
USE_YARA = False
try:
    import yara  # type: ignore
    USE_YARA = True
except Exception:
    USE_YARA = False

YARA_RULES_PATH = Path.cwd() / "rules.yar"  # opcional

# ===== Util =====
def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def is_system_path(p: Path) -> bool:
    sys_roots = {"C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)"}
    return any(str(p).lower().startswith(sr.lower()) for sr in sys_roots)

def human_size(n):
    for unit in ["B","KB","MB","GB","TB"]:
        if n < 1024: return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}PB"

def print_info(msg): print(Fore.CYAN + "[i] " + Style.RESET_ALL + msg)
def print_warn(msg): print(Fore.YELLOW + "[!] " + Style.RESET_ALL + msg)
def print_bad(msg):  print(Fore.RED + "[X] " + Style.RESET_ALL + msg)
def print_ok(msg):   print(Fore.GREEN + "[OK] " + Style.RESET_ALL + msg)

# ===== VirusTotal =====
def vt_lookup_sha256(sha256: str):
    if not VT_API_KEY:
        return None
    url = f"https://www.virustotal.com/api/v3/files/{sha256}"
    headers = {"x-apikey": VT_API_KEY}
    r = requests.get(url, headers=headers, timeout=20)
    if r.status_code == 200:
        data = r.json()
        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        return {
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "undetected": stats.get("undetected", 0),
            "harmless": stats.get("harmless", 0),
            "timeout": stats.get("timeout", 0),
        }
    elif r.status_code == 404:
        return {"unknown": True}
    else:
        print_warn(f"VirusTotal HTTP {r.status_code} para {sha256}")
        return None

# ===== YARA =====
def load_yara():
    if USE_YARA and YARA_RULES_PATH.exists():
        try:
            return yara.compile(filepath=str(YARA_RULES_PATH))
        except Exception as e:
            print_warn(f"Error cargando YARA: {e}")
    return None

# ===== Defender =====
def defender_custom_scan(path: Path):
    # MpCmdRun.exe suele estar aquí:
    candidates = [
        Path("C:/Program Files/Windows Defender/MpCmdRun.exe"),
        Path("C:/Program Files/Windows Defender/MpCmdRun/MpCmdRun.exe"),
        Path("C:/ProgramData/Microsoft/Windows Defender/Platform")
    ]
    exe = None
    for c in candidates:
        if c.is_file():
            exe = c; break
        if c.is_dir():
            # Usa la versión más reciente dentro de Platform\*\MpCmdRun.exe
            mpc = list(c.glob("*/MpCmdRun.exe"))
            if mpc:
                exe = sorted(mpc)[-1]
                break
    if not exe or not exe.exists():
        print_warn("No encontré MpCmdRun.exe; omitiendo Defender custom scan.")
        return None

    print_info(f"Ejecutando Defender en: {path}")
    try:
        res = subprocess.run([str(exe), "-Scan", "-ScanType", "3", "-File", str(path)], capture_output=True, text=True, timeout=900)
        out = (res.stdout or "") + "\n" + (res.stderr or "")
        print(out.strip()[:1200])  # no inundar consola
        return out
    except Exception as e:
        print_warn(f"Defender falló: {e}")
        return None

# ===== Persistencia =====
def get_registry_runs():
    runs = []
    try:
        import winreg
        KEYS = [
            (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\RunOnce"),
        ]
        for hive, path in KEYS:
            try:
                k = winreg.OpenKey(hive, path)
                i = 0
                while True:
                    try:
                        name, value, _ = winreg.EnumValue(k, i)
                        runs.append({"key": f"{path}\\{name}", "value": value})
                        i += 1
                    except OSError:
                        break
            except OSError:
                continue
    except Exception as e:
        print_warn(f"No pude leer Run keys: {e}")
    return runs

def get_startup_folder_entries():
    entries = []
    for p in [
        Path(os.environ.get("APPDATA", "")) / r"Microsoft\Windows\Start Menu\Programs\Startup",
        Path(os.environ.get("PROGRAMDATA", "")) / r"Microsoft\Windows\Start Menu\Programs\StartUp",
    ]:
        if p.exists():
            for f in p.glob("*"):
                entries.append(str(f))
    return entries

def get_schtasks():
    try:
        res = subprocess.run(["schtasks", "/Query", "/FO", "LIST", "/V"], capture_output=True, text=True, timeout=60)
        return res.stdout.splitlines()
    except Exception as e:
        print_warn(f"No pude listar tareas: {e}")
        return []

# ===== Heurística simple =====
def score_file(path: Path, vt: dict | None, yara_hits: list[str] | None) -> int:
    score = 0
    if path.suffix.lower() in SUSPECT_EXT: score += 2
    if not is_system_path(path): score += 1
    if path.stat().st_size > 50*1024*1024: score -= 1  # grandes no suelen ser malware común
    if vt:
        score += min(vt.get("malicious", 0), 10) * 3
        score += min(vt.get("suspicious", 0), 10) * 2
        if vt.get("unknown"): score += 0
    if yara_hits:
        score += 5 * len(yara_hits)
    return score

def try_yara_scan(yc, file: Path):
    if not yc: return []
    try:
        matches = yc.match(str(file))
        return [m.rule for m in matches]
    except Exception:
        return []

# ===== Cuarentena =====
def quarantine(file: Path, manifest: dict):
    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)
    target = QUARANTINE_DIR / f"{file.name}.{int(time.time())}.q"
    try:
        shutil.move(str(file), str(target))
        manifest["quarantined_to"] = str(target)
        print_bad(f"CUARENTENA: {file} -> {target}")
        return True
    except Exception as e:
        print_warn(f"No pude mover a cuarentena {file}: {e}")
        return False

# ===== Network snapshot =====
def snapshot_network():
    conns = []
    for c in psutil.net_connections(kind="inet"):
        try:
            if c.raddr:
                conns.append({
                    "laddr": f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None,
                    "raddr": f"{c.raddr.ip}:{c.raddr.port}",
                    "status": c.status,
                    "pid": c.pid,
                    "proc": psutil.Process(c.pid).name() if c.pid else None
                })
        except Exception:
            continue
    return conns

# ===== Main =====
def main(paths: list[Path], do_quarantine=False):
    REPORT_DIR.mkdir(exist_ok=True)
    report = {
        "when": datetime.utcnow().isoformat() + "Z",
        "targets": [str(p) for p in paths],
        "findings": [],
        "persistence": {},
        "network": snapshot_network(),
        "notes": []
    }

    yc = load_yara()
    if yc:
        print_ok("YARA cargado.")
    elif YARA_RULES_PATH.exists():
        print_warn("No se pudo cargar YARA; revisa instalación de yara-python.")

    for base in paths:
        if not base.exists():
            print_warn(f"No existe: {base}")
            continue
        print_info(f"Escaneando: {base}")
        for f in base.rglob("*"):
            try:
                if not f.is_file(): continue
                if f.suffix.lower() not in SUSPECT_EXT and f.stat().st_size > 5*1024*1024:
                    continue  # salta archivos grandes no ejecutables
                h = sha256_of(f)
                vt = vt_lookup_sha256(h) if VT_API_KEY else None
                yh = try_yara_scan(yc, f) if yc else []
                sc = score_file(f, vt, yh)
                if sc >= 5 or (vt and vt.get("malicious", 0) >= 1) or yh:
                    item = {
                        "file": str(f),
                        "size": human_size(f.stat().st_size),
                        "sha256": h,
                        "virustotal": vt,
                        "yara_matches": yh,
                        "score": sc
                    }
                    print_bad(f"SOSPECHOSO ({sc}): {f}")
                    if do_quarantine and ( (vt and vt.get("malicious",0) >= 3) or yh ):
                        quarantine(f, item)
                    report["findings"].append(item)
            except (PermissionError, OSError):
                continue

    # Persistencia
    report["persistence"]["registry_runs"] = get_registry_runs()
    report["persistence"]["startup_entries"] = get_startup_folder_entries()
    report["persistence"]["schtasks"] = [l for l in get_schtasks() if "TaskName:" in l or "Task To Run:" in l]

    # Defender: escaneo puntual en cada target
    for base in paths:
        defender_custom_scan(base)

    # Guardar reporte
    out = REPORT_DIR / f"report_{int(time.time())}.json"
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)
    print_ok(f"Reporte guardado en {out}")
    print_info("Revisa 'findings' y, si confirmas, ejecuta de nuevo con --quarantine para aislar.")

if __name__ == "__main__":
    # Uso: python antimal_fw.py [--quarantine] [ruta1] [ruta2] ...
    args = sys.argv[1:]
    do_q = False
    targets = []
    for a in args:
        if a == "--quarantine":
            do_q = True
        else:
            targets.append(Path(a))
    if not targets:
        targets = SCAN_DIRS
    main(targets, do_quarantine=do_q)
