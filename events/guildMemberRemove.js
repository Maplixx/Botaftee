const { Events } = require('discord.js');
const firebase = require('../firebase');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member, client) {
    try {
      const userData = await firebase.getDoc('users', member.id);
      if (!userData || !userData.invitedBy) return;

      const inviterId = userData.invitedBy;
      const inviterData = await firebase.getDoc('users', inviterId);

      if (inviterData) {
        // Se a conta era nova (menos de 15 dias), o convidador não recebeu invite, então não removemos nada
        if (userData.isNewAccount) return;

        const currentInvites = Math.max(0, (inviterData.invites || 0) - 1);
        const currentInvitedList = (inviterData.invitedList || []).filter(id => id !== member.id);

        await firebase.setDoc('users', inviterId, {
          invites: currentInvites,
          invitedList: currentInvitedList
        });

        console.log(`${member.user.tag} saiu do servidor. Removido 1 invite de ${inviterId}. Saldo atual: ${currentInvites}`);
      }
    } catch (err) {
      console.error('Erro ao processar saída de membro:', err.message);
    }
  },
};
