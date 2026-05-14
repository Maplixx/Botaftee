const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'msg',
  async execute(message, args, client) {
    if (!config.adminIds.includes(message.author.id)) return;

    if (args.length < 2) {
      return message.reply(`❌ Uso correto: \`${config.prefix}msg @user {mensagem}\``);
    }

    const targetUser = message.mentions.users.first() || client.users.cache.get(args[0]);
    if (!targetUser) {
      return message.reply('❌ Usuário não encontrado no servidor.');
    }

    const userMessage = args.slice(1).join(' ');

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('💬 Mensagem da Administração')
      .setDescription(userMessage)
      .setFooter({ text: config.footerText });

    try {
      await targetUser.send({ embeds: [embed] });
      message.reply(`✅ Mensagem enviada com sucesso para ${targetUser.tag}.`);
    } catch (dmErr) {
      message.reply(`❌ Não consegui enviar a mensagem para o DM de ${targetUser.tag}! O DM pode estar fechado.`);
    }
  },
};
