const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'blockuser',
  async execute(message, args, client) {
    if (!config.adminIds.includes(message.author.id)) return;

    const targetUser = message.mentions.users.first() || client.users.cache.get(args[0]);
    if (!targetUser) {
      return message.reply(`❌ Uso correto: \`${config.prefix}blockuser @user\``);
    }

    try {
      await firebase.setDoc('users', targetUser.id, {
        blocked: true
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🚫 Usuário Bloqueado')
        .setDescription(`${targetUser} foi bloqueado com sucesso. Ele continuará acumulando invites, mas não poderá resgatar produtos.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao bloquear usuário:', err.message);
      message.reply('❌ Ocorreu um erro ao bloquear o usuário no Firebase.');
    }
  },
};
