const { Events } = require('discord.js');
const firebase = require('../firebase');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);
    
    // Inicializar cache de invites global se não existir
    if (!client.invites) client.invites = new Map();

    // Inicializar cache de invites para cada servidor
    for (const guild of client.guilds.cache.values()) {
      try {
        const currentInvites = await guild.invites.fetch();
        const inviteMap = new Map(currentInvites.map((invite) => [invite.code, invite.uses]));
        client.invites.set(guild.id, inviteMap);
        
        // Salvar snapshot no Realtime Database para persistência
        const snapshot = Object.fromEntries(inviteMap);
        await firebase.setDoc('guilds', guild.id, {
          inviteSnapshot: snapshot,
          lastUpdate: Date.now()
        });
        
        console.log(`📡 Cache de invites inicializado para o servidor: ${guild.name}`);
      } catch (err) {
        console.error(`❌ Não foi possível buscar invites para o servidor ${guild.name}:`, err.message);
        
        // Tentar restaurar do Realtime Database se falhar ao buscar do Discord
        const guildData = await firebase.getDoc('guilds', guild.id);
        if (guildData && guildData.inviteSnapshot) {
          const restoredMap = new Map(Object.entries(guildData.inviteSnapshot));
          client.invites.set(guild.id, restoredMap);
          console.log(`🧠 Cache de invites restaurado do Firebase para o servidor: ${guild.name}`);
        }
      }
    }
    
    client.user.setActivity('$cmds | /cmds');
  },
};
