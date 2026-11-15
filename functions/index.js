// =====================================================================
// MetaTreino — Cloud Functions (Beta 40)
// Exclusão SEGURA de uma conta pelo painel do administrador principal.
//
// Por que no servidor: o JavaScript do navegador só consegue excluir o PRÓPRIO
// login. Excluir o login de outra pessoa (Firebase Authentication) exige o
// Firebase Admin SDK, que só roda no servidor.
//
// Requisito do Firebase: Cloud Functions só funciona no plano Blaze
// (pague pelo uso). Para este uso (algumas exclusões por mês) o custo fica
// dentro da cota gratuita do Blaze, mas o Google pede um cartão cadastrado.
//
// Publicar (na pasta do projeto, com o Firebase CLI):
//   firebase deploy --only functions
// Na primeira vez, o CLI pergunta o valor de DONO_EMAIL: digite o e-mail
// do administrador principal (o mesmo das regras do Firestore).
// =====================================================================
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// e-mail do administrador principal: informado no deploy (não fica escrito no código)
const DONO_EMAIL = defineString('DONO_EMAIL', { description: 'E-mail do administrador principal do MetaTreino' });
const DONO_UID = defineString('DONO_UID', { default: 'CJpmKyaTYtgR9I7FpigMPuXwICG2', description: 'UID do administrador principal' });

const OPCOES = { region: 'southamerica-east1', cors: true, maxInstances: 2, timeoutSeconds: 120 };

function ehDono(auth) {
  if (!auth || !auth.token) return false;
  if (auth.uid === DONO_UID.value()) return true;
  const em = String(auth.token.email || '').toLowerCase();
  return !!em && em === String(DONO_EMAIL.value() || '').toLowerCase() && auth.token.email_verified === true;
}

async function registrar(acao, por, alvo, detalhe) {
  try {
    await db.collection('adminLog').add({ acao, por, alvo, detalhe: detalhe || null, em: FieldValue.serverTimestamp(), origem: 'servidor' });
  } catch (e) { console.error('adminLog', e); }
}

// Todos os logins da mesma pessoa (Google e e-mail/senha podem gerar UIDs diferentes)
async function uidsDaPessoa(email) {
  const uids = new Set();
  try { const u = await getAuth().getUserByEmail(email); uids.add(u.uid); } catch (e) { /* sem login com esse e-mail */ }
  try {
    const c = await db.collection('contas').doc(email).get();
    if (c.exists) { const d = c.data(); if (d.uid) uids.add(d.uid); (d.uids || []).forEach((x) => x && uids.add(x)); }
  } catch (e) { /* segue */ }
  try {
    const q = await db.collection('usuarios').where('email', '==', email).get();
    q.forEach((d) => uids.add(d.id));
  } catch (e) { /* segue */ }
  return [...uids];
}

// Confere quem é a conta ANTES de excluir (o painel mostra isso na confirmação)
exports.adminConsultarConta = onCall(OPCOES, async (req) => {
  if (!ehDono(req.auth)) throw new HttpsError('permission-denied', 'Somente o administrador principal pode consultar contas para exclusão.');
  const email = String((req.data && req.data.email) || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpsError('invalid-argument', 'E-mail inválido.');
  const uids = await uidsDaPessoa(email);
  const logins = [];
  for (const uid of uids) {
    try { const u = await getAuth().getUser(uid); logins.push({ uid, provedores: u.providerData.map((p) => p.providerId), criadoEm: u.metadata.creationTime, ultimoAcesso: u.metadata.lastSignInTime }); }
    catch (e) { logins.push({ uid, semLogin: true }); }
  }
  return { email, logins };
});

exports.adminExcluirConta = onCall(OPCOES, async (req) => {
  if (!ehDono(req.auth)) throw new HttpsError('permission-denied', 'Somente o administrador principal pode excluir contas.');
  const email = String((req.data && req.data.email) || '').trim().toLowerCase();
  const confirmacao = String((req.data && req.data.confirmacao) || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpsError('invalid-argument', 'E-mail inválido.');
  // a confirmação digitada precisa ser o próprio e-mail: evita excluir a conta errada
  if (confirmacao !== email) throw new HttpsError('failed-precondition', 'A confirmação não confere com o e-mail da conta.');
  const meu = String(req.auth.token.email || '').toLowerCase();
  if (email === meu || email === String(DONO_EMAIL.value() || '').toLowerCase()) throw new HttpsError('failed-precondition', 'A conta do administrador principal não pode ser excluída por aqui.');

  const uids = await uidsDaPessoa(email);
  if (uids.includes(DONO_UID.value())) throw new HttpsError('failed-precondition', 'Essa conta pertence ao administrador principal.');
  const feito = { logins: 0, documentos: 0, participacoes: 0 };

  // 1) dados no Firestore (documento do aluno + arquivo anual + participações em desafios)
  for (const uid of uids) {
    const ref = db.collection('usuarios').doc(uid);
    try { await db.recursiveDelete(ref); feito.documentos++; } catch (e) { console.error('usuarios', uid, e); throw new HttpsError('internal', 'Falha ao apagar os dados do aluno no Firestore. Nada foi dado como concluído.'); }
    try {
      const parts = await db.collectionGroup('participantes').where('uid', '==', uid).get();
      for (const d of parts.docs) { await d.ref.delete(); feito.participacoes++; }
    } catch (e) { /* desafios sem o campo uid: o documento tem o id do aluno */ }
  }
  try {
    const desafios = await db.collection('desafiosTematicos').get();
    for (const d of desafios.docs) for (const uid of uids) {
      const p = d.ref.collection('participantes').doc(uid);
      const s = await p.get(); if (s.exists) { await p.delete(); feito.participacoes++; }
    }
  } catch (e) { console.error('participantes', e); }

  // 2) vínculos e permissões (não deixa nada órfão)
  await db.collection('contas').doc(email).delete().catch(() => {});
  await db.collection('admins').doc(email).delete().catch(() => {});
  // O registro do plano fica só com a marca da exclusão (sem nome, telefone ou anotações):
  // impede que a mesma pessoa ganhe um novo Teste Premium com o mesmo e-mail.
  await db.collection('usuariosAutorizados').doc(email).set({ plano: 'gratuito', contaExcluidaEm: Date.now() }).catch(() => {});

  // 3) logins (Authentication) — por último, para nunca deixar dados sem dono
  if (uids.length) {
    const r = await getAuth().deleteUsers(uids);
    feito.logins = r.successCount;
    if (r.failureCount) {
      const falhas = r.errors.map((x) => x.error && x.error.code).filter((c) => c !== 'auth/user-not-found');
      if (falhas.length) {
        await registrar('excluir-conta-parcial', meu, email, { feito, falhas });
        throw new HttpsError('internal', 'Os dados foram apagados, mas ' + falhas.length + ' login(s) não puderam ser excluídos do Authentication. Tente de novo.');
      }
    }
  }
  await registrar('excluir-conta', meu, email, feito);
  return { ok: true, email, ...feito };
});
