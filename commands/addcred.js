const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'addcred',
  async execute(message, args, client) {
    if (!config.isAdmin(message.member)) return;

    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const amount = parseInt(args[1]);

    if (!targetUser || isNaN(amount)) {
      return message.reply(`❌ Uso correto: \`${config.prefix}addcred @user {quantia}\``);
    }

    try {
      const userData = await firebase.getDoc('users', targetUser.id) || { credits: 0 };
      const newCredits = (userData.credits || 0) + amount;

      await firebase.setDoc('users', targetUser.id, {
        credits: newCredits
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('💰 Créditos Adicionados')
        .setDescription(`Você adicionou \`${amount}\` créditos para ${targetUser}.\nNovo Saldo: \`${newCredits}\` créditos.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

      // Notificar usuário no PV
      const dmEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎉 Você ganhou Créditos!')
        .setDescription(`Um administrador adicionou **${amount} créditos** na sua conta!\nVocê pode trocá-los por produtos em nosso servidor.`)
        .addFields({ name: '📊 Seu Novo Saldo', value: `\`${newCredits}\` créditos` })
        .setFooter({ text: config.footerText });

      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.warn(`Não consegui enviar DM para ${targetUser.user.tag}.`);
      }

    } catch (err) {
      console.error(err);
      message.reply('❌ Erro ao adicionar créditos.');
    }
  },
};
