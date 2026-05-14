const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');
const { updateMenuRealTime } = require('../events/interactionCreate');

module.exports = {
  name: 'estocar',
  async execute(message, args, client) {
    // Verificação de Admin por ID ou Cargo
    if (!config.isAdmin(message.member)) {
      return message.reply('❌ Você não tem permissão para usar este comando.').catch(() => {});
    }

    if (args.length < 2) {
      return message.reply(`❌ Uso correto: \`${config.prefix}estocar {id_produto} {keys...}\` ou \`${config.prefix}estocar {id_produto} "key1\\nkey2"\``);
    }

    const productId = args[0];
    
    // Capturar as keys considerando aspas e quebras de linha
    const fullContent = message.content.slice(config.prefix.length + this.name.length + 1 + productId.length).trim();
    let keys = [];

    if (fullContent.startsWith('"') && fullContent.endsWith('"')) {
      // Caso de aspas: separa por quebras de linha
      keys = fullContent.slice(1, -1).split(/\r?\n/).map(k => k.trim()).filter(k => k.length > 0);
    } else {
      // Caso normal: separa por espaços
      keys = args.slice(1);
    }

    if (keys.length === 0) {
      return message.reply('❌ Nenhuma key válida foi fornecida.');
    }

    if (keys.length > 100) {
      return message.reply('❌ Você só pode estocar até 100 keys de uma vez.');
    }

    try {
      const productData = await firebase.getDoc('products', productId);
      if (!productData) {
        return message.reply(`❌ Produto \`${productId}\` não encontrado.`);
      }

      const currentStock = productData.stock || [];
      const updatedStock = [...currentStock, ...keys];

      await firebase.setDoc('products', productId, {
        stock: updatedStock
      });

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📦 Estoque Atualizado')
        .setDescription(`Adicionadas \`${keys.length}\` keys ao produto **${productData.name || productId}**.`)
        .addFields({ name: '📊 Estoque Total', value: `\`${updatedStock.length}\` keys` })
        .setFooter({ text: config.footerText });

      await message.reply({ embeds: [embed] });
      await updateMenuRealTime(client, message.guild);

    } catch (err) {
      console.error('Erro ao estocar:', err.message);
      message.reply('❌ Erro ao atualizar o estoque.');
    }
  },
};
