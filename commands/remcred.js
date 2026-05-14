const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'remcred',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const amount = parseInt(args[1]);

    if (!targetUser || isNaN(amount)) {
      return message.reply(`❌ Uso correto: \`${config.prefix}remcred @user {quantia}\``);
    }

    try {
      const userData = await firebase.getDoc('users', targetUser.id) || { credits: 0 };
      const newCredits = Math.max(0, (userData.credits || 0) - amount);

      await firebase.setDoc('users', targetUser.id, {
        credits: newCredits
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('💰 Créditos Removidos')
        .setDescription(`Você removeu \`${amount}\` créditos de ${targetUser}.\nNovo Saldo: \`${newCredits}\` créditos.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply('❌ Erro ao remover créditos.');
    }
  },
};
