const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'presentear',
  async execute(message, args, client) {
    // Verificação de Admin por ID ou Cargo
    const isUserAdmin = config.adminIds.includes(message.author.id);
    const hasAdminRole = config.adminRoleId && message.member.roles.cache.has(config.adminRoleId);
    
    if (!isUserAdmin && !hasAdminRole) {
      return message.reply('❌ Você não tem permissão para usar este comando.').catch(() => {});
    }

    if (args.length < 2) {
      return message.reply(`❌ Uso correto: \`${config.prefix}presentear {id_produto} @user\``);
    }

    const productId = args[0];
    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(args[1]);

    if (!targetUser) {
      return message.reply('❌ Usuário não encontrado no servidor.');
    }

    try {
      const productData = await firebase.getDoc('products', productId);
      if (!productData) {
        return message.reply(`❌ Produto \`${productId}\` não encontrado no Firebase. Verifique se o ID interno está correto.`);
      }

      const stock = productData.stock || [];
      if (stock.length === 0) {
        return message.reply(`❌ O produto **${productData.name || productId}** está sem estoque.`);
      }

      // Consumir 1 key
      const key = stock.shift();
      await firebase.setDoc('products', productId, {
        stock: stock
      });

      // Adicionar ao histórico do usuário
      const userData = await firebase.getDoc('users', targetUser.id) || { rescues: [] };
      const userRescues = userData.rescues || [];
      userRescues.push({
        productName: productData.name || productId,
        key: key,
        timestamp: Date.now(),
        type: 'gift'
      });
      await firebase.setDoc('users', targetUser.id, {
        rescues: userRescues
      });

      // Enviar key no DM
      const giftEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎁 Você recebeu um Presente!')
        .setDescription(`Você recebeu o produto **${productData.name || productId}** de um administrador.`)
        .addFields(
          { name: '🔑 Sua Key', value: `\`${key}\`` },
          { name: 'ℹ️ Importante', value: 'Aviso: Não há suporte para keys por invite. Tickets abertos sobre isso serão fechados.' }
        )
        .setFooter({ text: config.footerText });

      try {
        await targetUser.send({ embeds: [giftEmbed] });
      } catch (dmErr) {
        message.reply(`⚠️ Não consegui enviar a key para o DM de ${targetUser}! A key removida foi: \`${key}\`.`).catch(() => {});
      }

      // Adicionar cargo se existir
      if (productData.roleId) {
        const role = message.guild.roles.cache.get(productData.roleId);
        if (role) {
          await targetUser.roles.add(role).catch(console.error);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎁 Presente Enviado')
        .setDescription(`O produto **${productData.name || productId}** foi enviado com sucesso para ${targetUser}.`)
        .setFooter({ text: config.footerText });

      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Erro ao presentear usuário:', err.message);
      message.reply('❌ Ocorreu um erro ao processar o presente no Firebase.');
    }
  },
};
