const admin = require('firebase-admin');
const config = require('./config');

let initialized = false;

if (config.firebaseServiceAccount && config.databaseURL) {
  try {
    let serviceAccount = config.firebaseServiceAccount;
    
    if (typeof serviceAccount === 'string') {
      try {
        serviceAccount = JSON.parse(serviceAccount);
      } catch (e) {
        const sanitized = serviceAccount.replace(/\n/g, '\\n').trim();
        serviceAccount = JSON.parse(sanitized);
      }
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: config.databaseURL
      });
      initialized = true;
      console.log('✅ Firebase Realtime Database inicializado com sucesso.');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
  }
} else {
  console.warn('⚠️ AVISO: FIREBASE_SERVICE_ACCOUNT ou DATABASE_URL não configurada.');
}

const db = initialized ? admin.database() : null;

// Função auxiliar para lidar com erros de banco de dados
const handleDbError = (err, operation) => {
  console.error(`❌ Erro no Realtime Database na operação [${operation}]:`, err.message);
  return null;
};

const getDoc = async (path, id) => {
  if (!db) return null;
  try {
    const ref = db.ref(`${path}/${id}`);
    const snapshot = await ref.once('value');
    return snapshot.val();
  } catch (err) {
    return handleDbError(err, 'getDoc');
  }
};

const setDoc = async (path, id, data) => {
  if (!db) {
    console.error('❌ Erro: Banco de dados não inicializado.');
    return;
  }
  try {
    const ref = db.ref(`${path}/${id}`);
    await ref.update(data); // Usando update para manter outros campos (comportamento de merge)
    console.log(`📝 Gravação realizada com sucesso em [${path}/${id}]`);
    return true;
  } catch (err) {
    handleDbError(err, 'setDoc');
    throw err;
  }
};

const updateDoc = async (path, id, data) => {
  if (!db) return;
  try {
    const ref = db.ref(`${path}/${id}`);
    await ref.update(data);
    console.log(`📝 Atualização realizada com sucesso em [${path}/${id}]`);
    return true;
  } catch (err) {
    handleDbError(err, 'updateDoc');
    throw err;
  }
};

const getAllDocs = async (path) => {
  if (!db) return [];
  try {
    const ref = db.ref(path);
    const snapshot = await ref.once('value');
    const data = snapshot.val();
    if (!data) return [];
    
    // Converte o objeto do Realtime Database em um array compatível com o código anterior
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  } catch (err) {
    handleDbError(err, 'getAllDocs');
    return [];
  }
};

const deleteDoc = async (path, id) => {
  if (!db) return;
  try {
    const ref = db.ref(`${path}/${id}`);
    await ref.remove();
    console.log(`🗑️ Documento deletado: [${path}/${id}]`);
  } catch (err) {
    handleDbError(err, 'deleteDoc');
    throw err;
  }
};

module.exports = {
  db,
  getDoc,
  setDoc,
  updateDoc,
  getAllDocs,
  deleteDoc
};
