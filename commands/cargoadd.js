const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'cargoadd',
  async execute(message, args, client) {
    if (!config.adminIds.includes(message.author.id)) return;

    if (args.length < 2) {
      return message.reply(`❌ Uso correto: \`${config.prefix}cargoadd {idCargo} @user\``);
    }

    const roleId = args[0];
    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[1]);

    if (!targetUser) {
      return message.reply('❌ Usuário não encontrado no servidor.');
    }

    const role = message.guild.roles.cache.get(roleId);
    if (!role) {
      return message.reply(`❌ Cargo com ID \`${roleId}\` não encontrado no servidor.`);
    }

    try {
      await targetUser.roles.add(role);
      
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('✅ Cargo Adicionado')
        .setDescription(`O cargo ${role} foi adicionado com sucesso para ${targetUser}.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao adicionar cargo:', err.message);
      message.reply('❌ Ocorreu um erro ao adicionar o cargo. Verifique se o bot tem permissões suficientes e se o cargo não está acima do cargo do bot.');
    }
  },
};
