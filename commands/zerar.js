const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'zerar',
  async execute(message, args, client) {
    if (!config.adminIds.includes(message.author.id)) return;

    try {
      const products = await firebase.getAllDocs('products');
      let removedKeysMessage = '📦 **Keys Removidas dos Estoques**\n\n';
      let hasKeys = false;

      for (const product of products) {
        if (product.stock && product.stock.length > 0) {
          hasKeys = true;
          removedKeysMessage += `**Produto:** \`${product.id}\`\n**Keys:**\n\`\`\`\n${product.stock.join('\n')}\n\`\`\`\n`;
          
          await firebase.setDoc('products', product.id, {
            stock: []
          });
        }
      }

      if (!hasKeys) {
        return message.reply('ℹ️ Não há keys em nenhum estoque no momento.');
      }

      // Enviar no DM
      try {
        await message.author.send(removedKeysMessage);
        
        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('🧹 Estoque Zerado')
          .setDescription('Todos os estoques foram zerados com sucesso. As keys removidas foram enviadas no seu DM.')
          .setFooter({ text: config.footerText });

        message.reply({ embeds: [embed] });
      } catch (dmErr) {
        message.reply('❌ Consegui zerar os estoques, mas seu DM está fechado! Não pude enviar as keys removidas.');
      }

    } catch (err) {
      console.error('Erro ao zerar estoques:', err.message);
      message.reply('❌ Ocorreu um erro ao zerar os estoques no Firebase.');
    }
  },
};
