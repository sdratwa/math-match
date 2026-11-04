#!/usr/bin/env python3
"""Testy bez przeglądarki; wszystkie bazy, sesje i hasła są tymczasowe."""
import http.cookiejar
from contextlib import closing
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PHP = os.environ.get('PHP_BINARY', 'php')


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='math-match-test-')
        self.addCleanup(self.temp.cleanup)
        folder = Path(self.temp.name)
        (folder / 'data').mkdir()
        (folder / 'sessions').mkdir()
        self.env = dict(os.environ, MATH_MATCH_STORAGE=str(folder / 'data'),
                        MATH_MATCH_ALLOW_PUBLIC_CREATION='0')
        subprocess.run([PHP, str(ROOT / 'bin/init.php')], env=self.env, check=True, capture_output=True)
        self.password = secrets.token_urlsafe(24)
        self.set_password(self.password)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        self.url = f'http://127.0.0.1:{port}/index.php?api='
        self.server = subprocess.Popen(
            [PHP, '-d', f'session.save_path={folder / "sessions"}',
             '-S', f'127.0.0.1:{port}', '-t', str(ROOT / 'public')],
            cwd=ROOT, env=self.env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.addCleanup(self.stop_server)
        for _ in range(100):
            try:
                self.request(self.client(), 'bootstrap')
                break
            except urllib.error.URLError:
                if self.server.poll() is not None:
                    self.fail('Lokalny serwer PHP zakończył działanie.')
                time.sleep(.05)
        else:
            self.fail('Lokalny serwer PHP nie wystartował.')

    def stop_server(self):
        if self.server.poll() is None:
            self.server.terminate()
            self.server.wait(timeout=10)

    def set_password(self, password, repeat=None, expected=0):
        result = subprocess.run([PHP, str(ROOT / 'bin/admin.php'), 'set-password'],
                                input=password + '\n' + (repeat or password) + '\n',
                                text=True, capture_output=True, env=self.env, cwd=ROOT)
        self.assertEqual(result.returncode, expected, 'Nieoczekiwany wynik CLI.')

    def client(self):
        return urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def request(self, client, action, body=None, token=None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['X-CSRF-Token'] = token
        request = urllib.request.Request(self.url + action, headers=headers,
                                         data=None if body is None else json.dumps(body).encode())
        try:
            with client.open(request, timeout=10) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def login(self, client, password):
        token = self.request(client, 'bootstrap')[1]['csrf']
        status, data = self.request(client, 'login', {'password': password}, token)
        self.assertEqual(status, 200)
        return data['csrf']

    def test_rotation_revokes_two_devices_and_preserves_quizzes(self):
        first, second = self.client(), self.client()
        a, b = self.login(first, self.password), self.login(second, self.password)
        quiz = {'title': 'Test syntetyczny', 'pairs': [
            {'term': 'A', 'description': 'Opis A'}, {'term': 'B', 'description': 'Opis B'}]}
        status, created = self.request(first, 'create', quiz, a)
        self.assertEqual(status, 200)
        before = self.request(first, 'bootstrap')[1]['quizzes']
        new_password = secrets.token_urlsafe(24)
        self.set_password(new_password)
        for client, token in [(first, a), (second, b)]:
            # Bez wcześniejszego bootstrap: chroniona operacja sama sprawdza wersję.
            self.assertEqual(self.request(client, 'update', dict(quiz, id=created['id']), token)[0], 403)
            self.assertEqual(self.request(client, 'delete', {'id': created['id']}, token)[0], 403)
            self.assertEqual(self.request(client, 'create', quiz, token)[0], 403)
            data = self.request(client, 'bootstrap')[1]
            self.assertFalse(data['admin'])
            self.assertFalse(data['canCreate'])
            self.assertEqual(data['quizzes'], before)
        self.assertEqual(self.request(first, 'login', {'password': self.password}, a)[0], 401)
        fresh = self.login(first, new_password)
        self.assertTrue(self.request(first, 'bootstrap')[1]['admin'])
        self.assertEqual(self.request(first, 'update', dict(quiz, id=created['id'], revision=1), fresh)[0], 200)
        self.assertEqual(self.request(first, 'delete', {'id': created['id']}, fresh)[0], 200)
        self.assertEqual(self.request(first, 'logout', {}, fresh)[0], 200)
        self.assertFalse(self.request(first, 'bootstrap')[1]['admin'])

    def test_same_password_also_revokes_sessions(self):
        client = self.client()
        self.login(client, self.password)
        self.set_password(self.password)
        self.assertFalse(self.request(client, 'bootstrap')[1]['admin'])
        self.login(client, self.password)
        self.assertTrue(self.request(client, 'bootstrap')[1]['admin'])

    def test_failed_password_change_preserves_session(self):
        client = self.client()
        self.login(client, self.password)
        self.set_password(secrets.token_urlsafe(24), repeat='different', expected=1)
        self.assertTrue(self.request(client, 'bootstrap')[1]['admin'])
        self.login(self.client(), self.password)

    def test_profile_api_csrf_and_isolation(self):
        first, second = self.client(), self.client()
        a = self.request(first, 'bootstrap')[1]['csrf']
        b = self.request(second, 'bootstrap')[1]['csrf']
        data = dict(nickname='Synthetic', avatar='🦊', password='zielony las pachnie', password_repeat='zielony las pachnie', consent=False)
        self.assertEqual(self.request(first, 'profile.register', data)[0], 403)
        status, profile = self.request(first, 'profile.register', data, a)
        self.assertEqual(status, 200)
        self.assertNotIn('password_hash', profile['profile'])
        self.assertEqual(self.request(second, 'stats', {}, b)[0], 422)
        self.assertEqual(self.request(first, 'admin.list', {}, a)[0], 422)
        self.assertEqual(self.request(first, 'stats', {'id': 999999}, a)[0], 200)
        self.assertEqual(self.request(first, 'profile.logout', {}, a)[0], 200)
        self.assertIsNone(self.request(first, 'bootstrap')[1]['profile'])
        code = profile['profile']['nickname']
        self.assertEqual(self.request(second, 'profile.login', dict(nickname=code, password='zielony las pachnie'), b)[0], 200)
        self.assertEqual(self.request(second, 'bootstrap')[1]['profile']['nickname'], code)

    def test_login_neutral_errors_and_unicode(self):
        client = self.client()
        token = self.request(client, 'bootstrap')[1]['csrf']
        data = dict(nickname='Małgosia', avatar='🦊', password='zielony las pachnie', password_repeat='zielony las pachnie', consent=False)
        status, registered = self.request(client, 'profile.register', data, token)
        self.assertEqual(status, 200)
        self.request(client, 'profile.logout', {}, token)
        errors = []
        for bad, pwd in [('Małgosia','złe hasło'),('nieznany','zielony las pachnie'),('', 'x'),(None, 'x'),(['name'],'x')]:
            status, result = self.request(client, 'profile.login', dict(nickname=bad, password=pwd), token)
            self.assertEqual(status, 422)
            errors.append(result['error'])
            self.assertIsNone(self.request(client, 'bootstrap')[1]['profile'])
        self.assertEqual(len(set(errors)), 1)
        status, result = self.request(client, 'profile.login', dict(nickname='  MAŁGOSIA  ', password='zielony las pachnie'), token)
        self.assertEqual(status, 200)
        self.assertEqual(result['profile']['id'], registered['profile']['id'])

    def test_shared_device_switching(self):
        shared, csrf, quiz_id, _ = self.guest_fixture()
        other = self.client()
        other_csrf = self.request(other, 'bootstrap')[1]['csrf']
        def call(action, body, status=200, client=shared, token=csrf):
            actual, data = self.request(client, action, body, token)
            self.assertEqual(actual, status, data)
            return data
        def register(client, token, pin):
            return call('profile.register', dict(nickname='Gracz '+pin, avatar='🐼',
                password=pin, password_repeat=pin, consent=True), client=client, token=token)['profile']
        a = register(shared, csrf, 'zielony las pachnie')
        b = register(other, other_csrf, 'drugi zielony las')
        self.assertNotEqual(a['nickname'], b['nickname'])
        call('profile.login', dict(nickname=a['nickname'], password='zielony las pachnie'), client=other, token=other_csrf)
        learn = call('attempt.start', dict(id=quiz_id, mode='learn', request_key=secrets.token_hex(16)))['attempt']
        pair = learn['pairs'][0]['id']
        call('attempt.answer', dict(attempt_id=learn['id'], term=pair, definition=pair, event_key=secrets.token_hex(16)))
        before = call('stats', {})
        attempt = call('attempt.start', dict(id=quiz_id, mode='test', request_key=secrets.token_hex(16)))['attempt']
        ids = [p['id'] for p in attempt['pairs']]
        attempt = call('attempt.save', dict(attempt_id=attempt['id'], revision=attempt['revision'], answers={ids[0]:ids[1]}))['attempt']
        # Syntetyczne tokeny dwóch urządzeń. Tokeny nie są wypisywane.
        import hashlib
        raw, other_raw = secrets.token_hex(32), secrets.token_hex(32)
        hashes = [hashlib.sha256(x.encode()).hexdigest() for x in [raw, other_raw]]
        jar = next(h.cookiejar for h in shared.handlers if isinstance(h, urllib.request.HTTPCookieProcessor))
        jar.set_cookie(http.cookiejar.Cookie(0, 'mathmatch_account_device', raw, None, False,
            '127.0.0.1', False, False, '/', True, False, None, True, None, None, {}))
        dbpath = Path(self.env['MATH_MATCH_STORAGE']) / 'math_match.sqlite'
        with closing(sqlite3.connect(dbpath)) as db:
            db.executemany('INSERT INTO profile_tokens VALUES(?,?,?,?)', [(h,a['id'],int(time.time())+600,'device') for h in hashes])
            db.execute("CREATE TRIGGER fail_pause BEFORE UPDATE ON sessions BEGIN SELECT RAISE(ABORT, 'synthetic'); END")
            db.commit()
        payload = dict(attempt_id=attempt['id'], expected_profile_id=a['id'])
        call('profile.logout', payload, 500)
        self.assertEqual(self.request(shared, 'bootstrap')[1]['profile']['id'], a['id'])
        with closing(sqlite3.connect(dbpath)) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM profile_tokens').fetchone()[0], 2)
            db.execute('DROP TRIGGER fail_pause')
            db.commit()
        self.assertEqual(self.request(shared, 'profile.logout', payload)[0], 403)
        self.assertEqual(self.request(shared, 'profile.logout')[0], 405)
        call('profile.logout', payload)
        call('profile.logout', payload)  # Powtórzenie po utracie odpowiedzi.
        boot = self.request(shared, 'bootstrap')[1]
        self.assertIsNone(boot['profile'])
        self.assertTrue(boot['admin'])
        call('stats', {}, 422)
        call('profile.login', dict(id=b['id']), 422)
        call('profile.login', dict(nickname=b['nickname'], password='niepoprawne hasło'), 422)
        self.assertIsNone(self.request(shared, 'bootstrap')[1]['profile'])
        with closing(sqlite3.connect(dbpath)) as db:
            self.assertIsNone(db.execute('SELECT 1 FROM profile_tokens WHERE hash=?', [hashes[0]]).fetchone())
            self.assertIsNotNone(db.execute('SELECT 1 FROM profile_tokens WHERE hash=?', [hashes[1]]).fetchone())
        self.assertEqual(self.request(other, 'bootstrap')[1]['profile']['id'], a['id'])
        call('profile.login', dict(nickname=b['nickname'], password='drugi zielony las'))
        self.assertEqual(call('stats', dict(id=a['id']))['history'], [])
        call('stats', dict(expected_profile_id=a['id']), 422)
        call('attempt.get', dict(attempt_id=attempt['id']), 422)
        call('profile.logout', dict(attempt_id=attempt['id']), 422)
        self.assertEqual(self.request(shared, 'bootstrap')[1]['profile']['id'], b['id'])
        call('profile.logout', payload, 422)  # Stara karta nie wyloguje gracza B.
        b_learn = call('attempt.start', dict(id=quiz_id, mode='learn', request_key=secrets.token_hex(16)))['attempt']
        bp = b_learn['pairs'][0]['id']
        call('attempt.answer', dict(attempt_id=b_learn['id'], term=bp, definition=bp, event_key=secrets.token_hex(16)))
        b_stats = call('stats', {})
        call('profile.logout', {})
        call('profile.login', dict(nickname=a['nickname'], password='zielony las pachnie'))
        after = call('stats', {})
        self.assertEqual(after['progress'], before['progress'])
        self.assertEqual(after['events'], before['events'])
        self.assertEqual(len(after['history']), 2)
        resumed = call('attempt.get', dict(attempt_id=attempt['id']))['attempt']
        self.assertEqual(resumed['status'], 'paused')
        self.assertEqual(resumed['answers'], {ids[0]: ids[1]})
        resumed = call('attempt.resume', dict(attempt_id=resumed['id'], revision=resumed['revision']))['attempt']
        self.assertEqual(resumed['status'], 'active')
        self.assertEqual(resumed['paused'], 1)
        finished = call('attempt.finish', dict(attempt_id=resumed['id'], revision=resumed['revision'], answers={p:p for p in ids}))['attempt']
        self.assertEqual(finished['score'], 2)
        self.assertEqual(call('leaderboard', dict(id=quiz_id))['ranking'], [])
        call('profile.logout', dict(attempt_id=resumed['id']))
        call('profile.login', dict(nickname=b['nickname'], password='drugi zielony las'))
        self.assertEqual(call('stats', {}), b_stats)
        self.assertTrue(self.request(shared, 'bootstrap')[1]['admin'])

    def guest_fixture(self):
        admin = self.client()
        token = self.login(admin, self.password)
        quiz = dict(title='Gość — syntetyczny', pairs=[
            dict(term='A', description='Opis A'), dict(term='B', description='Opis B')])
        status, created = self.request(admin, 'create', quiz, token)
        self.assertEqual(status, 200)
        return admin, token, created['id'], quiz

    def learning_data(self):
        # Wyłącznie baza utworzona przez setUp w katalogu tymczasowym.
        with closing(sqlite3.connect(Path(self.env['MATH_MATCH_STORAGE']) / 'math_match.sqlite')) as db:
            return {table: db.execute('SELECT * FROM ' + table).fetchall()
                    for table in ['profiles', 'profile_tokens', 'sessions', 'progress', 'learning_events', 'quiz_versions', 'quizzes']}

    def test_cancel_test_discards_attempt(self):
        owner, token, quiz_id, _ = self.guest_fixture()
        data = dict(nickname='Rezygnacja', avatar='🐼', password='zielony las pachnie', password_repeat='zielony las pachnie', consent=True)
        self.assertEqual(self.request(owner,'profile.register',data,token)[0],200)
        other = self.client()
        other_token = self.request(other,'bootstrap')[1]['csrf']
        data['nickname'] = 'Drugi gracz'
        self.assertEqual(self.request(other,'profile.register',data,other_token)[0],200)
        def call(action, body):
            status, result = self.request(owner,action,body,token)
            self.assertEqual(status,200,result)
            return result
        def start(mode='test'):
            return call('attempt.start',dict(id=quiz_id,mode=mode,request_key=secrets.token_hex(16)))['attempt']
        for paused in [False,True]:
            attempt = start()
            ids = [p['id'] for p in attempt['pairs']]
            attempt = call('attempt.save',dict(attempt_id=attempt['id'],revision=0,answers={ids[0]:ids[1]}))['attempt']
            if paused:
                call('attempt.pause',dict(attempt_id=attempt['id'],revision=attempt['revision']))
            payload = dict(attempt_id=attempt['id'])
            self.assertEqual(self.request(other,'attempt.cancel',payload,other_token)[0],422)
            self.assertEqual(self.request(owner,'attempt.cancel',payload)[0],403)
            self.assertEqual(self.request(owner,'attempt.cancel')[0],405)
            call('attempt.cancel',payload)
            call('attempt.cancel',payload)
            self.assertEqual(self.request(owner,'attempt.get',payload,token)[0],422)
        self.assertEqual(call('attempt.list',{})['attempts'],[])
        stats = call('stats',{})
        self.assertEqual(stats['history'],[])
        self.assertEqual(stats['progress'],[])
        self.assertEqual(call('leaderboard',dict(id=quiz_id))['ranking'],[])
        finished = start()
        call('attempt.finish',dict(attempt_id=finished['id'],revision=0,answers={p['id']:p['id'] for p in finished['pairs']}))
        self.assertEqual(self.request(owner,'attempt.cancel',dict(attempt_id=finished['id']),token)[0],422)
        learn = start('learn')
        self.assertEqual(self.request(owner,'attempt.cancel',dict(attempt_id=learn['id']),token)[0],422)
        guest = self.client()
        gt = self.request(guest,'bootstrap')[1]['csrf']
        self.assertEqual(self.request(guest,'guest.enter',dict(confirm=True),gt)[0],200)
        attempt = self.request(guest,'guest.start',dict(id=quiz_id,request_key=secrets.token_hex(16)),gt)[1]['attempt']
        payload = dict(attempt_id=attempt['id'])
        before = self.learning_data()
        self.assertEqual(self.request(guest,'guest.cancel',dict(attempt_id='a'*32),gt)[0],422)
        self.assertEqual(self.request(guest,'guest.cancel',payload,gt)[0],200)
        self.assertEqual(self.request(guest,'guest.cancel',payload,gt)[0],200)
        self.assertEqual(self.request(guest,'guest.get',payload,gt)[0],422)
        self.assertEqual(self.learning_data(),before)

    def test_guest_play_has_no_persistent_results(self):
        admin, admin_token, quiz_id, quiz = self.guest_fixture()
        client = self.client()
        boot = self.request(client, 'bootstrap')[1]
        token = boot['csrf']
        self.assertIsNone(boot['profile'])
        self.assertFalse(boot['guest'])
        self.assertEqual(len(boot['quizzes']), 1)
        owner = self.client()
        owner_token = self.request(owner, 'bootstrap')[1]['csrf']
        owner_profile = self.request(owner, 'profile.register', dict(nickname='Właściciel', avatar='🐱', password='zielony las pachnie', password_repeat='zielony las pachnie', consent=True), owner_token)[1]['profile']
        initial = self.learning_data()
        payload = dict(id=quiz_id, request_key=secrets.token_hex(16))
        self.assertEqual(self.request(client, 'guest.start', payload, token)[0], 422)
        self.assertEqual(self.request(client, 'guest.enter', dict(confirm=True))[0], 403)
        self.assertEqual(self.request(client, 'guest.enter', dict(confirm=False), token)[0], 422)
        self.assertEqual(self.request(client, 'guest.enter', dict(confirm=True), token)[0], 200)
        self.assertTrue(self.request(client, 'bootstrap')[1]['guest'])
        status, data = self.request(client, 'guest.start', payload, token)
        self.assertEqual(status, 200)
        attempt = data['attempt']
        self.assertFalse(attempt['ranking_eligible'])
        self.assertIsNone(attempt['score'])
        self.assertEqual(self.request(client, 'guest.start', payload, token)[1]['attempt']['id'], attempt['id'])
        ids = [p['id'] for p in attempt['pairs']]
        def command(action, **extra):
            nonlocal attempt
            status, data = self.request(client, 'guest.' + action,
                dict(attempt_id=attempt['id'], revision=attempt['revision'], **extra), token)
            self.assertEqual(status, 200, data)
            attempt = data['attempt']
        command('save', answers={ids[0]: ids[1]})
        command('save', answers={})
        command('pause')
        self.assertEqual(attempt['status'], 'paused')
        command('resume')
        for bad in [{ids[0]: ids[0]}, {ids[0]: ids[0], ids[1]: ids[0]}, {ids[0]: 'fake', ids[1]: ids[1]}]:
            self.assertEqual(self.request(client, 'guest.finish', dict(attempt_id=attempt['id'], revision=attempt['revision'], answers=bad), token)[0], 422)
        command('finish', answers={p: p for p in ids}, score=999, active_seconds=-99, profile_id=owner_profile['id'], ranking_eligible=True)
        self.assertEqual(attempt['score'], 2)
        self.assertGreaterEqual(attempt['active_seconds'], 0)
        self.assertFalse(attempt['ranking_eligible'])
        command('finish', answers={ids[0]: ids[1], ids[1]: ids[0]})
        self.assertEqual(attempt['score'], 2)
        # Gość nie może przesłać lokalnej Nauki do historii ani użyć endpointów profilu.
        for action, body in [('stats', {}), ('admin.list', {}), ('leaderboard', dict(id=quiz_id)),
                             ('attempt.start', dict(id=quiz_id, mode='learn', request_key=secrets.token_hex(16))),
                             ('attempt.answer', dict(attempt_id=attempt['id'], term=ids[0], definition=ids[0], event_key=secrets.token_hex(16))),
                             ('attempt.finish', dict(attempt_id=attempt['id'], answers={p:p for p in ids}))]:
            self.assertEqual(self.request(client, action, body, token)[0], 422)
        self.assertEqual(self.learning_data(), initial)
        self.assertEqual(self.request(owner, 'stats', {}, owner_token)[1]['history'], [])
        self.assertEqual(self.request(owner, 'leaderboard', dict(id=quiz_id), owner_token)[1]['ranking'], [])
        # Rejestracja nie importuje anonimowego wyniku.
        status, result = self.request(client, 'profile.register', dict(nickname='Test',avatar='🦊',password='zielony las pachnie',password_repeat='zielony las pachnie',consent=True), token)
        self.assertEqual(status, 200)
        self.assertFalse(self.request(client, 'bootstrap')[1]['guest'])
        self.assertEqual(self.request(client, 'stats', {}, token)[1]['history'], [])
        self.assertEqual(self.request(client, 'leaderboard', dict(id=quiz_id), token)[1]['ranking'], [])
        self.assertEqual(self.request(client, 'guest.get', dict(attempt_id=attempt['id']), token)[0], 422)
        self.request(client, 'profile.logout', {}, token)
        self.request(client, 'guest.enter', dict(confirm=True), token)
        self.assertEqual(self.request(client, 'guest.get', dict(attempt_id=attempt['id']), token)[0], 422)

    def test_guest_snapshot_isolation_and_admin_separation(self):
        admin, token, quiz_id, quiz = self.guest_fixture()
        self.assertEqual(self.request(admin, 'guest.enter', dict(confirm=True), token)[0], 200)
        self.assertTrue(self.request(admin, 'bootstrap')[1]['admin'])
        payload = dict(id=quiz_id, request_key=secrets.token_hex(16))
        attempt = self.request(admin, 'guest.start', payload, token)[1]['attempt']
        ids = [p['id'] for p in attempt['pairs']]
        other = self.client()
        t = self.request(other, 'bootstrap')[1]['csrf']
        self.request(other, 'guest.enter', dict(confirm=True), t)
        self.assertEqual(self.request(other, 'guest.get', dict(attempt_id=attempt['id']), t)[0], 422)
        changed = dict(quiz, id=quiz_id, revision=1, pairs=[dict(term='C', description='Nowy opis'), quiz['pairs'][1]])
        self.assertEqual(self.request(admin, 'update', changed, token)[0], 200)
        result = self.request(admin, 'guest.finish', dict(attempt_id=attempt['id'], revision=0, answers={p:p for p in ids}), token)[1]['attempt']
        self.assertEqual(result['score'], 2)
        self.assertEqual(result['version_id'], attempt['version_id'])
        # Zalogowanie do istniejącego profilu usuwa grę gościa, zachowując admina.
        profile_client = self.client()
        ptoken = self.request(profile_client, 'bootstrap')[1]['csrf']
        p = self.request(profile_client, 'profile.register',dict(nickname='Inny',avatar='🐼',password='drugi zielony las',password_repeat='drugi zielony las',consent=False),ptoken)[1]['profile']
        self.assertEqual(self.request(admin, 'profile.login',dict(nickname=p['nickname'],password='drugi zielony las'),token)[0],200)
        boot = self.request(admin,'bootstrap')[1]
        self.assertTrue(boot['admin'])
        self.assertFalse(boot['guest'])
        self.assertEqual(boot['profile']['id'],p['id'])
        self.assertEqual(self.request(admin,'stats',{},token)[1]['history'],[])
        self.assertEqual(self.request(admin,'guest.enter',dict(confirm=True),token)[0],422)
        self.assertEqual(self.request(admin,'delete',dict(id=quiz_id),token)[0],200)
        self.assertEqual(self.request(other,'guest.start',payload,t)[0],422)


class StorageTests(unittest.TestCase):
    def test_accounts(self):
        with tempfile.TemporaryDirectory(prefix='math-match-accounts-') as folder:
            env = dict(os.environ, MATH_MATCH_STORAGE=folder)
            subprocess.run([PHP, str(ROOT / 'bin/init.php')], env=env, check=True, capture_output=True)
            result = subprocess.run([PHP, str(ROOT / 'tests/accounts.php')], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_guest_domain(self):
        with tempfile.TemporaryDirectory(prefix='math-match-guest-') as folder:
            env = dict(os.environ, MATH_MATCH_STORAGE=folder)
            subprocess.run([PHP, str(ROOT / 'bin/init.php')], env=env, check=True, capture_output=True)
            result = subprocess.run([PHP, str(ROOT / 'tests/guest.php')], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_features(self):
        with tempfile.TemporaryDirectory(prefix='math-match-features-') as folder:
            subprocess.run([PHP, str(ROOT / 'bin/init.php')], env=dict(os.environ, MATH_MATCH_STORAGE=folder), check=True, capture_output=True)
            result = subprocess.run([PHP, str(ROOT / 'tests/features.php')], env=dict(os.environ, MATH_MATCH_STORAGE=folder), capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_auth_functions(self):
        with tempfile.TemporaryDirectory(prefix='math-match-unit-') as folder:
            subprocess.run([PHP, str(ROOT / 'bin/init.php')], env=dict(os.environ, MATH_MATCH_STORAGE=folder), check=True, capture_output=True)
            result = subprocess.run([PHP, str(ROOT / 'tests/auth.php')],
                                    env=dict(os.environ, MATH_MATCH_STORAGE=folder),
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_initialization_refuses_existing_database(self):
        with tempfile.TemporaryDirectory(prefix='math-match-init-') as folder:
            env = dict(os.environ, MATH_MATCH_STORAGE=folder)
            command = [PHP, str(ROOT / 'bin/init.php')]
            subprocess.run(command, env=env, check=True, capture_output=True)
            path = Path(folder) / 'math_match.sqlite'
            with sqlite3.connect(path) as db:
                db.execute("INSERT INTO settings VALUES('sentinel','keep')")
                db.commit()
            self.assertNotEqual(subprocess.run(command, env=env, capture_output=True).returncode, 0)
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("SELECT value FROM settings WHERE key='sentinel'").fetchone()[0], 'keep')
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
                self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(), [])
                self.assertEqual(db.execute('PRAGMA user_version').fetchone()[0], 2)

    def test_ignore_rules(self):
        for path in ['storage/.env', 'storage/math_match.sqlite', 'storage/nested/copy.zip',
                     '.env', '.env.production', 'copy.sqlite', 'copy.sqlite-wal',
                     'copy.sqlite-shm', 'copy.sqlite3', 'copy.sqlite3-wal',
                     'copy.sqlite3-shm', 'copy.db', 'copy.db-wal', 'copy.db-shm']:
            result = subprocess.run(['git', 'check-ignore', '--no-index', '-q', path], cwd=ROOT)
            self.assertEqual(result.returncode, 0, path)
        result = subprocess.run(['git', 'check-ignore', '--no-index', '-q', 'storage/.gitkeep'], cwd=ROOT)
        self.assertEqual(result.returncode, 1)
        self.assertEqual((ROOT / 'storage/.gitkeep').read_bytes(), b'')

    def test_clean_clone_with_pending_patch(self):
        # Klon HEAD oraz wyłącznie jawnie wskazane pliki poprawki, bez commita/pusha.
        # Nie kopiujemy lokalnego storage ani żadnych danych użytkownika.
        with tempfile.TemporaryDirectory(prefix='math-match-clone-') as folder:
            clone = Path(folder) / 'clone'
            subprocess.run(['git', 'clone', '--quiet', '--no-hardlinks', str(ROOT), str(clone)], check=True)
            for relative in ['.gitignore', 'src/lib.php', 'public/index.php', 'bin/admin.php',
                             'README.md', 'src/schema.php', 'src/accounts.php', 'src/domain.php', 'src/profile-api.php', 'src/guest-api.php', 'bin/init.php', 'storage/.gitkeep']:
                target = clone / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / relative, target)
            self.assertEqual(sorted(p.name for p in (clone / 'storage').iterdir()), ['.gitkeep'])
            env = dict(os.environ)
            env['MATH_MATCH_STORAGE'] = str(clone / 'storage')
            subprocess.run([PHP, 'bin/init.php'], cwd=clone, env=env, check=True, capture_output=True)
            password = secrets.token_urlsafe(24)
            result = subprocess.run([PHP, 'bin/admin.php', 'set-password'], cwd=clone,
                                    input=password + '\n' + password + '\n', text=True,
                                    capture_output=True, env=env)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            read = subprocess.run([PHP, '-r', 'require "src/lib.php"; echo count(fetchQuizzes());'],
                                  cwd=clone, env=env, capture_output=True, text=True)
            self.assertEqual(read.returncode, 0, read.stderr)
            self.assertEqual(read.stdout, '0')
            result = subprocess.run(['git', 'check-ignore', '-q', 'storage/math_match.sqlite'], cwd=clone)
            self.assertEqual(result.returncode, 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
