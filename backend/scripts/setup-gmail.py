"""Configure the activation email sender in the local backend environment."""
import getpass
import os
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import urlsplit

backend = Path(__file__).resolve().parents[1]
sender = "gymnasyum.id@gmail.com"
print(f"Pengirim Gymnasyum: {sender}")
origin = input("Alamat aplikasi yang dapat dibuka penerima (https://...): ").strip()
url = urlsplit(origin)
# Pengujian di komputer sendiri memakai alamat lokal; penerima di luar tetap butuh HTTPS.
local = url.hostname in ("127.0.0.1", "localhost", "::1")
scheme_ok = url.scheme == "https" or (local and url.scheme == "http")
if not scheme_ok or not url.hostname or url.username or url.password or url.path not in ("", "/") or url.query or url.fragment or any(c.isspace() or c in "#'\"\\" for c in origin):
    raise SystemExit("Masukkan alamat HTTPS aplikasi, misalnya https://portal.contoh.id, atau http://127.0.0.1:3001 untuk pengujian lokal.")
password = getpass.getpass("Sandi aplikasi Google (tersembunyi): ").replace(" ", "")
if not re.fullmatch(r"[A-Za-z0-9]{16}", password):
    raise SystemExit("Gunakan sandi aplikasi 16 karakter dari Google.")
settings = dict(SMTP_HOST="smtp.gmail.com", SMTP_PORT="465", SMTP_USER=sender,
                SMTP_PASS=password, MAIL_FROM=f"Gymnasyum <{sender}>", APP_PUBLIC_URL=origin.rstrip("/"))
check = """const mail=require('nodemailer').createTransport({host:process.env.SMTP_HOST,
port:465,secure:true,connectionTimeout:10000,socketTimeout:15000,
auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
mail.verify().catch(()=>{console.error('Koneksi atau login SMTP Gmail gagal. Periksa akun dan sandi aplikasi.');process.exitCode=1;});"""
subprocess.run(["node", "-e", check], cwd=backend, env={**os.environ, **settings}, check=True)
path = backend / ".env"
lines = [line for line in path.read_text().splitlines()
         if line.partition("=")[0].strip() not in settings]
with tempfile.NamedTemporaryFile(mode="w", dir=backend, delete=False) as output:
    output.write("\n".join(lines + [f"{k}={v}" for k, v in settings.items()]) + "\n")
os.replace(output.name, path)
print("Pengirim Gmail berhasil tersambung. Registrasi berikutnya akan mengirim email otomatis.")
