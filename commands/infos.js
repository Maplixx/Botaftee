const { EmbedBuilder } = require('discord.js');
const firebase = require('../firebase');
const config = require('../config');

module.exports = {
  name: 'infos',
  async execute(message, args, client) {
    const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const userId = targetMember.id;

    try {
      const userData = await firebase.getDoc('users', userId) || { 
        invites: 0, 
        credits: 0, 
        fakeInvites: 0, 
        totalInvites: 0,
        spentInvites: 0,
        spentCredits: 0,
        rescues: [] 
      };

      const daysInServer = Math.floor((Date.now() - targetMember.joinedTimestamp) / (1000 * 60 * 60 * 24));
      const rescues = userData.rescues || [];
      const lastRescue = rescues.length > 0 ? new Date(rescues[rescues.length - 1].timestamp).toLocaleDateString('pt-BR') : 'Nenhum';

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`📊 Informações de ${targetMember.user.tag}`)
        .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🤝 Convites Válidos', value: `\`${userData.invites || 0}\``, inline: true },
          { name: '💰 Créditos Atuais', value: `\`${userData.credits || 0}\``, inline: true },
          { name: '❌ Invites Inválidos (Fake)', value: `\`${userData.fakeInvites || 0}\``, inline: true },
          { name: '📈 Total de Convites', value: `\`${userData.totalInvites || 0}\``, inline: true },
          { name: '💸 Gastos (Invites)', value: `\`${userData.spentInvites || 0}\``, inline: true },
          { name: '💸 Gastos (Créditos)', value: `\`${userData.spentCredits || 0}\``, inline: true },
          { name: '🎁 Keys Resgatadas', value: `\`${rescues.length}\``, inline: true },
          { name: '📅 Último Resgate', value: `\`${lastRescue}\``, inline: true },
          { name: '🕒 Tempo no Servidor', value: `\`${daysInServer} dias\``, inline: true },
          { name: '🚫 Bloqueado', value: userData.blocked ? '✅ Sim' : '❌ Não', inline: true }
        )
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply('❌ Erro ao buscar informações.');
    }
  },
};
