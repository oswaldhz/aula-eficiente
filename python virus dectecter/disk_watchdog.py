import os, time, psutil, logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from colorama import Fore, Style, init

init(autoreset=True)

# Carpeta a vigilar (cámbiala si tu disco principal no es C:)
WATCH_DIR = Path("C:/")

# Umbral de alerta (en MB)
ALERT_SIZE_MB = 2000  # si un archivo nuevo o modificado pesa más de 100 MB

# Log
logging.basicConfig(filename="disk_watchdog.log",
                    level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")

def human_size(bytes):
    for unit in ["B","KB","MB","GB","TB"]:
        if bytes < 1024:
            return f"{bytes:.1f}{unit}"
        bytes /= 1024
    return f"{bytes:.1f}PB"

class DiskHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            try:
                size = os.path.getsize(event.src_path)
                if size > ALERT_SIZE_MB * 1024 * 1024:
                    msg = f"⚠️ Archivo NUEVO grande: {event.src_path} ({human_size(size)})"
                    print(Fore.YELLOW + msg)
                    logging.warning(msg)
            except Exception:
                pass

    def on_modified(self, event):
        if not event.is_directory:
            try:
                size = os.path.getsize(event.src_path)
                if size > ALERT_SIZE_MB * 1024 * 1024:
                    msg = f"⚠️ Archivo MODIFICADO grande: {event.src_path} ({human_size(size)})"
                    print(Fore.CYAN + msg)
                    logging.warning(msg)
            except Exception:
                pass

def main():
    print(Fore.GREEN + f"👁️ Vigilando: {WATCH_DIR} (alerta si archivos > {ALERT_SIZE_MB} MB)")
    observer = Observer()
    handler = DiskHandler()
    observer.schedule(handler, str(WATCH_DIR), recursive=True)
    observer.start()

    try:
        while True:
            # Estado actual del disco
            usage = psutil.disk_usage(str(WATCH_DIR))
            print(Fore.MAGENTA + f"💽 Libre: {human_size(usage.free)} / Total: {human_size(usage.total)}")
            time.sleep(30)  # cada 30s muestra espacio libre
    except KeyboardInterrupt:
        print(Style.RESET_ALL + "\nSaliendo...")
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
