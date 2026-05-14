const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const firebase = require('../firebase');

module.exports = {
  name: 'setup',
  async execute(message, args, client) {
    // Verificação de Admin por ID ou Cargo
    if (!config.isAdmin(message.member)) {
      return message.reply('❌ Você não tem permissão para usar este comando.').catch(() => {});
    }

    try {
      const panelData = await firebase.getDoc('config', 'panel') || {};
      
      const title = panelData.title || '🛍️ Menu de Resgate';
      const description = panelData.description || 'Bem-vindo ao nosso sistema de resgate por invites!';
      const banner = panelData.banner || '';

      const shortDesc = String(description).length > 100 
        ? String(description).slice(0, 100) + '...' 
        : String(description);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚙️ Configuração do Menu Público')
        .setDescription('Use os botões abaixo para configurar o painel de resgate. Esta mensagem será atualizada em tempo real.')
        .addFields(
          { name: '📝 Título Atual', value: `\`${title}\``, inline: true },
          { name: '📄 Descrição Atual', value: `\`${shortDesc}\``, inline: false },
          { name: '🖼️ Banner Link', value: banner ? `[Ver Banner](${banner})` : '`Nenhum`', inline: true }
        )
        .setFooter({ text: config.footerText });

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_title').setLabel('Mudar Título').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('setup_desc').setLabel('Mudar Descrição').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('setup_banner').setLabel('Mudar Banner').setStyle(ButtonStyle.Primary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_add_prod').setLabel('Adicionar Produto').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('setup_rem_prod').setLabel('Remover Produto').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('setup_edit_prod').setLabel('Editar Produto').setStyle(ButtonStyle.Secondary)
      );

      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_view_all').setLabel('Ver Tudo').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('setup_send_panel').setLabel('Enviar Menu Público').setStyle(ButtonStyle.Success)
      );

      message.reply({ embeds: [embed], components: [row1, row2, row3] });
    } catch (err) {
      console.error('Erro ao abrir setup:', err.message);
      message.reply('❌ Ocorreu um erro ao abrir o menu de setup.');
    }
  },
};
