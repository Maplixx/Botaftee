const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'unblockuser',
  async execute(message, args, client) {
    if (!config.adminIds.includes(message.author.id)) return;

    const targetUser = message.mentions.users.first() || client.users.cache.get(args[0]);
    if (!targetUser) {
      return message.reply(`❌ Uso correto: \`${config.prefix}unblockuser @user\``);
    }

    try {
      await firebase.setDoc('users', targetUser.id, {
        blocked: false
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('✅ Usuário Desbloqueado')
        .setDescription(`${targetUser} foi desbloqueado com sucesso e agora pode resgatar produtos normalmente.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao desbloquear usuário:', err.message);
      message.reply('❌ Ocorreu um erro ao desbloquear o usuário no Firebase.');
    }
  },
};
