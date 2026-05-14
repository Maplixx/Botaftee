const { Events, EmbedBuilder } = require('discord.js');
const firebase = require('../firebase');
const config = require('../config');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member, client) {
    const guild = member.guild;
    const cachedInvites = client.invites.get(guild.id);
    if (!cachedInvites) return;

    try {
      const newInvites = await guild.invites.fetch();
      const usedInvite = newInvites.find(inv => (cachedInvites.get(inv.code) || 0) < inv.uses);
      
      // Atualizar cache global
      client.invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

      if (!usedInvite || !usedInvite.inviter) return;
      const inviter = usedInvite.inviter;

      // Verificar se o convidador está ignorado
      const inviterCheck = await firebase.getDoc('users', inviter.id);
      if (inviterCheck && inviterCheck.ignored) return;

      // Anti-fraude: Conta criada há menos de 3 dias
      const minAge = 3 * 24 * 60 * 60 * 1000;
      const isFake = (Date.now() - member.user.createdTimestamp) < minAge;

      // Salvar quem convidou no Firebase
      await firebase.setDoc('users', member.id, {
        invitedBy: inviter.id,
        inviterTag: inviter.tag,
        joinTimestamp: Date.now(),
        isFake: isFake
      });

      // Creditar para o convidador
      const inviterData = inviterCheck || { 
        invites: 0, 
        fakeInvites: 0, 
        totalInvites: 0,
        credits: 0,
        spentInvites: 0,
        spentCredits: 0,
        invitedList: [] 
      };

      const invitedList = inviterData.invitedList || [];
      if (!invitedList.includes(member.id)) {
        invitedList.push(member.id);
      }

      const updateData = {
        invitedList: invitedList,
        totalInvites: (inviterData.totalInvites || 0) + 1
      };

      if (isFake) {
        updateData.fakeInvites = (inviterData.fakeInvites || 0) + 1;
      } else {
        updateData.invites = (inviterData.invites || 0) + 1;
      }

      await firebase.setDoc('users', inviter.id, updateData);

      // LOGS DE INVITES (NO NOVO CANAL)
      const panelData = await firebase.getDoc('config', 'panel');
      if (panelData && panelData.logInviteChannelId) {
        const logChannel = guild.channels.cache.get(panelData.logInviteChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(isFake ? '#FFFF00' : '#00FF00')
            .setTitle('📥 Novo Membro Convidado')
            .addFields(
              { name: '👤 Membro', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
              { name: '🤝 Convidado por', value: `${inviter.tag} (\`${inviter.id}\`)`, inline: true },
              { name: '⚠️ Status', value: isFake ? '❌ Conta Nova (Não contou)' : '✅ Conta Válida', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: config.footerText });
          logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

    } catch (err) {
      console.error('Erro ao processar entrada de membro:', err.message);
    }
  },
};
