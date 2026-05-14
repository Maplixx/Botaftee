const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'reset',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!targetUser) return message.reply('❌ Mencione um usuário para resetar.');

    try {
      await firebase.setDoc('users', targetUser.id, {
        invites: 0,
        totalInvites: 0,
        fakeInvites: 0,
        invitedList: []
      });

      message.reply(`✅ Todos os invites de ${targetUser} foram resetados.`);
    } catch (err) {
      console.error(err);
      message.reply('❌ Erro ao resetar invites.');
    }
  },
};
