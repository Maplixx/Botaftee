const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'remcargo',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const roleId = args[1];

    if (!targetUser || !roleId) {
      return message.reply(`❌ Uso correto: \`${config.prefix}remcargo @user {id_do_cargo}\``);
    }

    const role = message.guild.roles.cache.get(roleId);
    if (!role) return message.reply('❌ Cargo não encontrado no servidor.');

    try {
      await targetUser.roles.remove(role);
      message.reply(`✅ Cargo **${role.name}** removido de ${targetUser}.`);
    } catch (err) {
      console.error(err);
      message.reply('❌ Não consegui remover o cargo. Verifique minha hierarquia.');
    }
  },
};
