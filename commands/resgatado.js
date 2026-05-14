const { EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'resgatado',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    try {
      const users = await firebase.getAllDocs('users');
      const allRescues = [];

      for (const user of users) {
        if (user.rescues && Array.isArray(user.rescues)) {
          for (const rescue of user.rescues) {
            allRescues.push({
              userTag: user.id, // ID ou Tag
              productName: rescue.productName,
              key: rescue.key,
              timestamp: rescue.timestamp
            });
          }
        }
      }

      if (allRescues.length === 0) {
        return message.reply('❌ Nenhum resgate encontrado no banco de dados.');
      }

      // Ordenar por data (mais recentes primeiro)
      allRescues.sort((a, b) => b.timestamp - a.timestamp);

      // Limitar a exibição aos 15 mais recentes para não exceder limites do Embed
      const recentRescues = allRescues.slice(0, 15);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📋 Histórico de Resgates (Mais Recentes)')
        .setDescription(recentRescues.map(r => 
          `**Usuário:** <@${r.userTag}>\n**Produto:** ${r.productName}\n**Key:** \`${r.key}\`\n**Data:** <t:${Math.floor(r.timestamp / 1000)}:R>`
        ).join('\n\n'))
        .setFooter({ text: `${allRescues.length} resgates totais | ${config.footerText}` });

      // Se for Slash, responder efemeramente se necessário
      if (message.isSlash) {
        return message.interaction.editReply({ embeds: [embed] });
      }

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao buscar histórico de resgates:', err);
      message.reply('❌ Erro ao buscar histórico de resgates.');
    }
  },
};
