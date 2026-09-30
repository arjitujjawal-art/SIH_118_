"""
STRELA — Application Entrypoint
Run with: python run.py
"""
import os
import sys
from pathlib import Path
import uvicorn

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Fix Windows console CTRL_C broadcasting bug in Uvicorn:
# Uvicorn by default calls os.kill(pid, signal.CTRL_C_EVENT) on Windows during reload,
# which broadcasts CTRL_C to ALL processes attached to the console/terminal (including IDE & Antigravity).
# Replacing this with process.terminate() safely terminates only the child worker process without broadcasting CTRL_C.
try:
    import uvicorn.supervisors.basereload
    def _safe_restart(self) -> None:
        if hasattr(self, "process") and self.process is not None:
            try:
                self.process.terminate()
                self.process.join(timeout=2.0)
            except Exception:
                pass
        from uvicorn.supervisors.basereload import get_subprocess
        self.process = get_subprocess(config=self.config, target=self.target, sockets=self.sockets)
        self.process.start()

    def _safe_shutdown(self) -> None:
        self.should_exit.set()
        if hasattr(self, "process") and self.process is not None:
            try:
                self.process.terminate()
                self.process.join(timeout=2.0)
            except Exception:
                pass
        for sock in self.sockets:
            try:
                sock.close()
            except Exception:
                pass

    uvicorn.supervisors.basereload.BaseReload.restart = _safe_restart
    uvicorn.supervisors.basereload.BaseReload.shutdown = _safe_shutdown
except Exception:
    pass

if __name__ == "__main__":
    print("=================================================================")
    print("🛡️  Starting STRELA H2S Advisory Platform with Rakshak AI...")
    print("🌐  Web Interface: http://127.0.0.1:8000")
    print("🚀  1-Click Demo Login: http://127.0.0.1:8000/login")
    print("👔  Manager Control Room: http://127.0.0.1:8000/manager")
    print("📷  AI Optical Scanner: http://127.0.0.1:8000/manager/scan")
    print("📚  Swagger API Docs: http://127.0.0.1:8000/docs")
    print("=================================================================")

    backend_dir = str(BASE_DIR / "backend")
    frontend_dir = str(BASE_DIR / "frontend")
    reload_dirs = [d for d in [backend_dir, frontend_dir] if os.path.exists(d)]

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=reload_dirs,
        reload_includes=["*.py", "*.html", "*.css", "*.js", "*.json"],
        reload_excludes=[
            "*.db",
            "*.db-journal",
            "*.db-wal",
            "*.sqlite",
            "*.sqlite3",
            "*.pyc",
            "__pycache__/*",
            "*.log",
            "*.tmp",
            "*.pdf",
            ".git/*",
            "venv/*",
            ".pytest_cache/*",
            "Agent.md",
            "README.md",
            "*.md",
            "*.txt",
            ".gemini/*"
        ],
        reload_delay=0.5
    )
