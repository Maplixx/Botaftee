const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'loginvite',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

    try {
      await firebase.setDoc('config', 'panel', {
        logInviteChannelId: channel.id
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📡 Logs de Invites Configurado')
        .setDescription(`Agora os avisos de **entrada de convites** serão enviados no canal ${channel}.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao configurar loginvite:', err);
      message.reply('❌ Erro ao configurar canal de logs de invites.');
    }
  },
};
