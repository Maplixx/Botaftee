// ==========================================
// CONFIGURAÇÕES DO BOT - ALTERE AQUI
// ==========================================

const SETTINGS = {
  // Token do Bot (Obrigatório via .env ou aqui)
  token: process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI',
  
  // IDs dos Administradores (Ex: ['ID_1', 'ID_2'])
  adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [], 
  
  // ID do Cargo de Administrador (Qualquer um com esse cargo será admin)
  adminRoleId: process.env.ADMIN_ROLE_ID || '', 
  
  // URL do Realtime Database (Ex: https://projeto-default-rtdb.firebaseio.com/)
  databaseURL: process.env.DATABASE_URL || 'https://after-free-cb44d-default-rtdb.firebaseio.com/',

  // Prefixo para comandos
  prefix: '$',
  
  // Cor dos Embeds (Hexadecimal)
  embedColor: '#FF0000', // Vermelho
  
  // Texto do Rodapé dos Embeds
  footerText: 'Sistema de Invites & Resgate',
  
  // IDs de Canais e Cargos (Opcionais)
  resgateRoleId: process.env.RESGATE_ROLE_ID || '',
  logChannelId: process.env.LOG_CHANNEL_ID || '',
};

// ==========================================
// NÃO ALTERE ABAIXO DESTA LINHA
// ==========================================

require('dotenv').config();

// Função auxiliar para verificar se um membro é admin
const isAdmin = (member) => {
  if (!member) return false;
  const isIdAdmin = SETTINGS.adminIds.includes(member.id);
  const hasRoleAdmin = SETTINGS.adminRoleId && member.roles.cache.has(SETTINGS.adminRoleId);
  return isIdAdmin || hasRoleAdmin;
};

// Tratamento robusto para a conta de serviço do Firebase
let firebaseConfig = null;
const rawFirebase = process.env.FIREBASE_SERVICE_ACCOUNT;

if (rawFirebase) {
  try {
    const cleanedJson = rawFirebase.trim().replace(/^['"]|['"]$/g, '');
    firebaseConfig = JSON.parse(cleanedJson);
  } catch (e) {
    try {
        const sanitized = rawFirebase.replace(/\n/g, '\\n').trim();
        firebaseConfig = JSON.parse(sanitized);
    } catch (e2) {
        console.error('ERRO CRÍTICO: Não foi possível ler a variável FIREBASE_SERVICE_ACCOUNT.');
        firebaseConfig = rawFirebase;
    }
  }
}

module.exports = {
  ...SETTINGS,
  isAdmin,
  firebaseServiceAccount: firebaseConfig,
};
