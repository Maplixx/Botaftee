const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'addcargo',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const roleId = args[1];

    if (!targetUser || !roleId) {
      return message.reply(`❌ Uso correto: \`${config.prefix}addcargo @user {id_do_cargo}\``);
    }

    const role = message.guild.roles.cache.get(roleId);
    if (!role) return message.reply('❌ Cargo não encontrado.');

    try {
      await targetUser.roles.add(role);
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('✅ Cargo Adicionado')
        .setDescription(`O cargo **${role.name}** foi adicionado a ${targetUser}.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply('❌ Erro ao adicionar cargo. Verifique minha hierarquia.');
    }
  },
};
