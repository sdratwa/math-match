#!/usr/bin/env python3
"""Integracja HTTP bez przeglądarki i bez bazy, wyłącznie 127.0.0.1."""
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]

class Unit3Http(unittest.TestCase):
    def test_module_without_database(self):
        with tempfile.TemporaryDirectory(prefix='mathmatch-unit3-http-') as folder:
            env = dict(os.environ, MATH_MATCH_STORAGE=folder)
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
            process = subprocess.Popen([env.get('PHP_BINARY', 'php'), '-S', f'127.0.0.1:{port}', '-t', str(ROOT / 'public')], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            try:
                client = urllib.request.build_opener(urllib.request.ProxyHandler({}))
                base = f'http://127.0.0.1:{port}/'
                for _ in range(100):
                    try:
                        response = client.open(base + 'cambridge-unit3.php', timeout=3)
                        break
                    except urllib.error.URLError:
                        if process.poll() is not None:
                            self.fail('Serwer testowy nie wystartował')
                        time.sleep(.05)
                else:
                    self.fail('Brak odpowiedzi lokalnego HTTP')
                with response:
                    html = response.read().decode('utf-8')
                    self.assertEqual(response.status, 200)
                    self.assertIn('no-store', response.headers['Cache-Control'])
                    self.assertIn("connect-src 'none'", response.headers['Content-Security-Policy'])
                    self.assertIn("script-src 'self'", response.headers['Content-Security-Policy'])
                    self.assertNotIn('unsafe-inline', response.headers['Content-Security-Policy'])
                    self.assertIsNone(response.headers.get('Set-Cookie'))
                    self.assertIn('id="unitApp"', html)
                for asset, content_type in [('core.js', 'javascript'), ('draft.js', 'javascript'), ('ui.js', 'javascript'), ('unit3.css', 'text/css')]:
                    with client.open(base + 'assets/unit3/' + asset, timeout=3) as response:
                        self.assertEqual(response.status, 200)
                        self.assertIn(content_type, response.headers['Content-Type'])
                        self.assertGreater(len(response.read()), 100)
                    self.assertIn('assets/unit3/' + asset, html)
                self.assertEqual(list(Path(folder).iterdir()), [], 'Moduł nie tworzy bazy ani plików sesji')
            finally:
                process.terminate()
                process.wait(timeout=10)

if __name__ == '__main__':
    unittest.main(verbosity=2)
