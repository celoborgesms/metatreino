#!/usr/bin/env python3
"""Servidor de teste: serve o site e faz o papel do Firestore para VÁRIOS navegadores ao mesmo tempo
(celular e computador), com as regras da Beta 34 simuladas nos caminhos que o app usa.
Uso: python3 testes/nuvem-simulada.py PASTA_DO_SITE PORTA
O site precisa usar testes/mock-firebase-rede.js no lugar do Firebase (veja testes/dois-aparelhos.py)."""
import json, sys, threading, re, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial

PASTA, PORTA = sys.argv[1], int(sys.argv[2])
LOJA = {}; VERSAO = [0]; TRAVA = threading.Lock(); NEGADOS = []
DONO = 'celoborgesms@gmail.com'

def confiavel(t): return bool(t.get('email')) and (t.get('verified') or t['email'].endswith('@aluno.metatreino.app'))
def admin(t):
    em = (t.get('email') or '').lower()
    if em == DONO and t.get('verified'): return True
    a = LOJA.get('admins/' + em); return bool(a and a.get('ativo') is True)
def vinculada(t, uid):
    em = (t.get('email') or '').lower(); c = LOJA.get('contas/' + em)
    return confiavel(t) and bool(c) and c.get('uid') == uid
def mesmo_email(t, uid):
    d = LOJA.get('usuarios/' + uid); em = (t.get('email') or '').lower()
    return confiavel(t) and bool(d) and str(d.get('email') or '').lower() == em
def email_ok(t, dados):
    if 'email' not in dados or dados.get('email') is None: return True
    return confiavel(t) and str(dados['email']).lower() == (t.get('email') or '').lower()

def permite(op, caminho, t, dados=None):
    """op: get | list | set | delete. Espelha firestore.rules (Beta 35) nos caminhos usados pelo app."""
    if not t.get('uid'): return caminho.startswith('config/contato') and op == 'get'
    p = caminho.split('/'); em = (t.get('email') or '').lower()
    if p[0] == 'usuarios':
        if len(p) == 1 and op == 'list': return admin(t) or (confiavel(t) and dados == ('email', t.get('email')))
        uid = p[1]
        if len(p) == 2:
            if op == 'get':
                d = LOJA.get(caminho)
                return t['uid'] == uid or vinculada(t, uid) or admin(t) or (confiavel(t) and bool(d) and d.get('email') == t.get('email'))
            if op == 'set': return ((t['uid'] == uid or vinculada(t, uid)) and email_ok(t, dados or {})) or admin(t)
            if op == 'delete': return t['uid'] == uid or vinculada(t, uid) or mesmo_email(t, uid) or admin(t)
        else:
            if op in ('get', 'list'): return t['uid'] == uid or vinculada(t, uid) or mesmo_email(t, uid) or admin(t)
            if op == 'delete': return t['uid'] == uid or vinculada(t, uid) or mesmo_email(t, uid) or admin(t)
            return t['uid'] == uid or vinculada(t, uid) or admin(t)
    if p[0] == 'contas':
        alvo = p[1] if len(p) > 1 else ''
        if op == 'get': return admin(t) or (confiavel(t) and em == alvo)
        if op == 'set': return confiavel(t) and em == alvo and isinstance((dados or {}).get('uid'), str) and (dados['uid'] == t['uid'] or mesmo_email(t, dados['uid']))
        if op == 'delete': return confiavel(t) and em == alvo
    if p[0] == 'desafiosTematicos' and len(p) >= 4 and p[2] == 'participantes':
        alvo = p[3]
        if op == 'list': return admin(t)
        if op == 'set': return t['uid'] == alvo or vinculada(t, alvo)
        return t['uid'] == alvo or vinculada(t, alvo) or admin(t)
    if p[0] == 'parceiros': return admin(t)
    if p[0] in ('videosExercicios', 'exerciciosCustom', 'caliExercicios', 'caliModelos', 'desafiosTematicos', 'config'):
        return op in ('get', 'list') or admin(t)
    if p[0] == 'usuariosAutorizados':
        alvo = p[1] if len(p) > 1 else ''
        if op == 'get': return admin(t) or (em == alvo and confiavel(t))
        if op == 'set':
            # Beta 40: o aluno CRIA uma vez o próprio Teste Premium (e-mail verificado, só os campos permitidos)
            if caminho not in LOJA and t.get('verified') and em == alvo and set((dados or {}).keys()) <= {'plano','testeInicio','origem','name'} and (dados or {}).get('plano') == 'teste' and (dados or {}).get('testeInicio'): return True
            return admin(t) and (em == DONO or em != alvo)
        if op == 'delete': return admin(t) and (em == DONO or em != alvo)
        return admin(t)
    if p[0] == 'adminLog': return (op == 'set' and admin(t) and (dados or {}).get('por') == em) or (op in ('get','list') and em == DONO and bool(t.get('verified')))
    if p[0] == 'admins': return op == 'get' and em == (p[1] if len(p) > 1 else '') or admin(t)
    if p[0] == 'familias': return familia(op, caminho, t, dados)
    return True   # demais coleções (mensagens etc.): fora do escopo deste teste

# Beta 49: firestore.rules de "familias" (administrador do cardápio; cada membro só a própria chave)
def _alteradas(a, b):
    a = a or {}; b = b or {}
    return [k for k in set(a) | set(b) if json.dumps(a.get(k), sort_keys=True) != json.dumps(b.get(k), sort_keys=True)]
def familia(op, caminho, t, depois):
    uid = t.get('uid'); antes = LOJA.get(caminho); fid = caminho.split('/')[1] if '/' in caminho else ''
    dono_app = (t.get('email') or '').lower() == DONO and t.get('verified')
    if op in ('get', 'list'): return bool(dono_app or (antes and uid in (antes.get('membros') or [])))
    if op == 'delete': return bool(dono_app or (antes and uid in (antes.get('membros') or []) and len(antes['membros']) == 1))
    so = lambda lista, ok: all(k in ok for k in lista)
    if antes is None:   # create
        return bool(re.fullmatch(r'[A-Z2-9]{6}', fid)) and depois.get('membros') == [uid] and depois.get('dono') == uid \
            and so(depois.keys(), ['membros','dono','nomes','perfis','config','cardapio','registro','criadoEm','v']) \
            and so((depois.get('nomes') or {}).keys(), [uid]) and so((depois.get('perfis') or {}).keys(), [uid])
    dm = depois.get('membros'); am = antes.get('membros') or []
    if not isinstance(dm, list) or len(dm) > 6: return False
    mudou = _alteradas(antes, depois); saiu = [x for x in am if x not in dm]
    chaves = lambda campo, ok: so(_alteradas(antes.get(campo), depois.get(campo)), ok)
    if antes.get('dono') == uid:
        return so(mudou, ['config','cardapio','registro','dono','membros','nomes','perfis','v']) and all(x in am for x in dm) and depois.get('dono') in dm \
            and chaves('nomes', saiu + [uid]) and chaves('perfis', saiu + [uid])
    if uid in am:
        return so(mudou, ['membros','nomes','perfis']) and (dm == am or (all(x in am for x in dm) and saiu == [uid] and len(dm) == len(am) - 1)) \
            and chaves('nomes', [uid]) and chaves('perfis', [uid])
    entrou = [x for x in dm if x not in am]
    return all(x in dm for x in am) and entrou == [uid] and len(dm) == len(am) + 1 and so(mudou, ['membros','nomes','perfis']) \
        and chaves('nomes', [uid]) and chaves('perfis', [uid])

def aplica_update(doc, dados):
    import copy
    d = copy.deepcopy(doc)
    for k, v in dados.items():
        partes = k.split('.'); o = d
        for c in partes[:-1]:
            if not isinstance(o.get(c), dict): o[c] = {}
            o = o[c]
        u = partes[-1]
        if isinstance(v, dict) and v.get('__apagar') is True: o.pop(u, None)
        elif isinstance(v, dict) and v.get('__op') == 'union':
            a = list(o.get(u) or []) if isinstance(o.get(u), list) else []
            for x in v['v']:
                if x not in a: a.append(x)
            o[u] = a
        elif isinstance(v, dict) and v.get('__op') == 'remove': o[u] = [x for x in (o.get(u) or []) if x not in v['v']]
        else: o[u] = v
    return d

class H(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _json(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith('/__fs/estado'):
            with TRAVA: return self._json(200, { 'versao': VERSAO[0], 'loja': LOJA, 'negados': NEGADOS[-50:] })
        return super().do_GET()
    def do_POST(self):
        if not self.path.startswith('/__fs/'): return self._json(404, {})
        n = int(self.headers.get('Content-Length') or 0); corpo = json.loads(self.rfile.read(n) or b'{}')
        t = corpo.get('token') or {}; op = corpo.get('op'); caminho = corpo.get('caminho', '')
        with TRAVA:
            if op == 'semear':      # preparação do teste (sem regras)
                LOJA.update(corpo['dados']); VERSAO[0] += 1; return self._json(200, {'ok': True})
            if op == 'get':
                if not permite('get', caminho, t): NEGADOS.append(['get', caminho, t.get('uid')]); return self._json(403, {'erro': 'permission-denied'})
                return self._json(200, {'existe': caminho in LOJA, 'dados': LOJA.get(caminho), 'versao': VERSAO[0]})
            if op == 'list':
                pre = caminho + '/'; filtro = corpo.get('filtro')
                regra = ('email', filtro[2]) if filtro and filtro[0] == 'email' and filtro[1] == '==' else None
                if not permite('list', caminho, t, regra) and not (len(caminho.split('/')) == 3 and permite('list', caminho, t)):
                    NEGADOS.append(['list', caminho, t.get('uid')]); return self._json(403, {'erro': 'permission-denied'})
                docs = [{'id': k[len(pre):], 'dados': v} for k, v in LOJA.items() if k.startswith(pre) and '/' not in k[len(pre):]]
                if filtro: docs = [d for d in docs if d['dados'].get(filtro[0]) == filtro[2]]
                return self._json(200, {'docs': docs})
            if op == 'set':
                dados = corpo.get('dados') or {}; merge = corpo.get('merge')
                final = dict(LOJA.get(caminho) or {}, **dados) if merge else dados
                final = {k: v for k, v in final.items() if v != {'__apagar': True}}
                if not permite('set', caminho, t, final): NEGADOS.append(['set', caminho, t.get('uid')]); return self._json(403, {'erro': 'permission-denied'})
                LOJA[caminho] = final; VERSAO[0] += 1; return self._json(200, {'ok': True})
            if op == 'update':
                if caminho not in LOJA: return self._json(404, {'erro': 'not-found'})
                final = aplica_update(LOJA[caminho], corpo.get('dados') or {})
                if not permite('set', caminho, t, final): NEGADOS.append(['update', caminho, t.get('uid')]); return self._json(403, {'erro': 'permission-denied'})
                LOJA[caminho] = final; VERSAO[0] += 1; return self._json(200, {'ok': True})
            if op == 'delete':
                if not permite('delete', caminho, t): NEGADOS.append(['delete', caminho, t.get('uid')]); return self._json(403, {'erro': 'permission-denied'})
                LOJA.pop(caminho, None); VERSAO[0] += 1; return self._json(200, {'ok': True})
        return self._json(400, {})

ThreadingHTTPServer(('127.0.0.1', PORTA), partial(H, directory=PASTA)).serve_forever()
