const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'nologs',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    try {
      await firebase.setDoc('config', 'panel', {
        logKeyChannelId: null,
        logInviteChannelId: null,
        lastLogChannelId: null // Limpar o antigo também por segurança
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🚫 Logs Desativados')
        .setDescription('Todos os canais de logs foram removidos. O bot não enviará mais avisos de resgate ou invites.')
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao desativar logs:', err);
      message.reply('❌ Erro ao desativar canais de logs.');
    }
  },
};
