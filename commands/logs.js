const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'logs',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

    try {
      await firebase.setDoc('config', 'panel', {
        lastLogChannelId: channel.id
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📡 Canal de Logs Configurado')
        .setDescription(`Agora todos os resgates serão avisados no canal ${channel}.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao configurar logs:', err);
      message.reply('❌ Erro ao configurar canal de logs.');
    }
  },
};
