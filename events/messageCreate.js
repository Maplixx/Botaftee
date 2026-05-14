const { Events } = require('discord.js');
const config = require('../config');

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    // Comandos públicos que qualquer um pode usar: $ping, $infos
    const publicCommands = ['ping', 'infos'];
    
    // Verificação de Admin para todos os outros comandos (incluindo $cmds)
    if (!publicCommands.includes(commandName)) {
      const isUserAdmin = config.adminIds.includes(message.author.id);
      const hasAdminRole = config.adminRoleId && message.member.roles.cache.has(config.adminRoleId);
      
      if (!isUserAdmin && !hasAdminRole) {
        return message.reply('❌ Você não tem permissão para usar este comando.').catch(() => {});
      }
    }

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`Erro ao executar comando ${commandName}:`, error.message);
      message.reply('❌ Ocorreu um erro ao executar esse comando.').catch(() => {});
    }
  },
};
