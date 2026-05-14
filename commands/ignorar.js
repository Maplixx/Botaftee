const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'ignorar',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const targetUser = message.mentions.users.first() || client.users.cache.get(args[0]);
    if (!targetUser) return message.reply('❌ Mencione um usuário para ignorar.');

    try {
      const userData = await firebase.getDoc('users', targetUser.id) || { id: targetUser.id };
      const currentlyIgnored = !!userData.ignored;
      
      await firebase.setDoc('users', targetUser.id, {
        ignored: !currentlyIgnored
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(currentlyIgnored ? '✅ Usuário Restaurado' : '🚫 Usuário Ignorado')
        .setDescription(currentlyIgnored 
          ? `O usuário ${targetUser} não será mais ignorado nos logs.` 
          : `O usuário ${targetUser} agora será ignorado em todos os logs de keys e invites.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao alternar status de ignorar:', err);
      message.reply('❌ Erro ao alterar status do usuário.');
    }
  },
};
