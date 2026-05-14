const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'logkey',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

    try {
      await firebase.setDoc('config', 'panel', {
        logKeyChannelId: channel.id
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📡 Logs de Keys Configurado')
        .setDescription(`Agora os avisos de **resgate de keys** serão enviados no canal ${channel}.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao configurar logkey:', err);
      message.reply('❌ Erro ao configurar canal de logs de keys.');
    }
  },
};
