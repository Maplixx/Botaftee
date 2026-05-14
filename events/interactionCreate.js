const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, Collection, MessageFlags } = require('discord.js');
const firebase = require('../firebase');
const config = require('../config');

// Função global para atualizar o menu de resgate em tempo real
async function updateMenuRealTime(client, guild) {
    try {
        const panelData = await firebase.getDoc('config', 'panel');
        if (!panelData || !panelData.lastMenuMessageId || !panelData.lastMenuChannelId) return;
        const channel = client.channels.cache.get(panelData.lastMenuChannelId);
        if (!channel) return;
        const message = await channel.messages.fetch(panelData.lastMenuMessageId).catch(() => null);
        if (!message) return;
        const products = await firebase.getAllDocs('products');
        const activeProducts = products.filter(p => p.status !== 'inativo');
        const embed = new EmbedBuilder().setColor(config.embedColor).setTitle(panelData.title || 'Menu de Resgate').setDescription(panelData.description || 'Escolha um produto abaixo para resgatar com seus invites.').setFooter({ text: config.footerText });
        if (panelData.banner) embed.setImage(panelData.banner);
        if (activeProducts.length === 0) return message.edit({ embeds: [embed.setDescription('❌ Não há produtos cadastrados ou ativos.')], components: [] });
        const selectMenu = new StringSelectMenuBuilder().setCustomId('rescue_select').setPlaceholder('Escolha um produto para resgatar').addOptions(activeProducts.map(p => ({ label: p.name || p.id, description: `${p.price} invites | Estoque: ${p.stock ? p.stock.length : 0}`, value: p.id })));
        const row = new ActionRowBuilder().addComponents(selectMenu);
        await message.edit({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error('Erro ao atualizar menu em tempo real:', err.message);
    }
}

// Função para atualizar o embed do SETUP dinamicamente
async function updateSetupEmbed(interaction) {
    const panelData = await firebase.getDoc('config', 'panel') || {};
    const title = panelData.title || '🛍️ Menu de Resgate';
    const description = panelData.description || 'Bem-vindo ao nosso sistema de resgate por invites!';
    const banner = panelData.banner || '';
    const shortDesc = String(description).length > 100 ? String(description).slice(0, 100) + '...' : String(description);

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚙️ Configuração do Menu Público')
        .setDescription('Use os botões abaixo para configurar o painel de resgate.')
        .addFields(
            { name: '📝 Título Atual', value: `\`${title}\``, inline: true },
            { name: '📄 Descrição Atual', value: `\`${shortDesc}\``, inline: false },
            { name: '🖼️ Banner Link', value: banner ? `[Ver Banner](${banner})` : '`Nenhum`', inline: true }
        )
        .setFooter({ text: config.footerText });

    await interaction.editReply({ embeds: [embed] });
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const isUserAdmin = config.isAdmin(interaction.member);

    // 1. Lidar com Autocomplete (Sugestões do Slash Command)
    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused();
        const products = await firebase.getAllDocs('products');
        const filtered = products.filter(p => p.id.toLowerCase().includes(focusedValue.toLowerCase()) || p.name.toLowerCase().includes(focusedValue.toLowerCase()));
        await interaction.respond(
            filtered.slice(0, 25).map(p => ({ name: `${p.name} (${p.id})`, value: p.id }))
        ).catch(() => {});
        return;
    }

    // 2. Lidar com Slash Commands
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        
        // Verificação de Admin para Slash Commands
        const publicSlash = ['ping', 'infos'];
        if (!publicSlash.includes(commandName) && !isUserAdmin) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', flags: [MessageFlags.Ephemeral] });
        }

        // Especial para estocar via Slash
        if (commandName === 'estocar') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const productId = interaction.options.getString('produto');
            const keysRaw = interaction.options.getString('keys');
            const keys = keysRaw.split(/\r?\n/).map(k => k.trim()).filter(k => k.length > 0);
            
            try {
                const productData = await firebase.getDoc('products', productId);
                if (!productData) return interaction.editReply(`❌ Produto \`${productId}\` não encontrado.`);
                const updatedStock = [...(productData.stock || []), ...keys];
                await firebase.setDoc('products', productId, { stock: updatedStock });
                await updateMenuRealTime(client, interaction.guild);
                return interaction.editReply(`✅ Adicionadas \`${keys.length}\` keys ao produto **${productData.name || productId}**.`);
            } catch (err) {
                return interaction.editReply('❌ Erro ao estocar.');
            }
        }

        // Redirecionar para os comandos de prefixo
        const command = client.commands.get(commandName);
        if (!command) return interaction.reply({ content: '❌ Comando não encontrado.', flags: [MessageFlags.Ephemeral] });

        // Adaptar args para Slash
        let args = [];
        if (commandName === 'infos' || commandName === 'reset' || commandName === 'blockuser' || commandName === 'unblockuser' || commandName === 'ignorar') {
            args = [interaction.options.getUser('usuario')?.id || interaction.user.id];
        }
        if (commandName === 'addcred' || commandName === 'remcred') {
            args = [interaction.options.getUser('usuario').id, interaction.options.getInteger('quantia').toString()];
        }
        if (commandName === 'remcargo' || commandName === 'addcargo') {
            args = [interaction.options.getUser('usuario').id, interaction.options.getString('cargo_id')];
        }
        if (commandName === 'presentear') {
            args = [interaction.options.getString('produto'), interaction.options.getUser('usuario').id];
        }
        if (commandName === 'msg') {
            args = [interaction.options.getUser('usuario').id, interaction.options.getString('texto')];
        }
        if (commandName === 'logkey' || commandName === 'loginvite') {
            args = [interaction.options.getChannel('canal')?.id || interaction.channelId];
        }
        if (commandName === 'aviso') {
            args = [interaction.options.getChannel('canal').id, interaction.options.getString('mensagem'), interaction.options.getString('excluir') || ''];
        }

        // Executar comandos normais adaptados
        try {
            const mockMessage = {
                author: interaction.user,
                member: interaction.member,
                guild: interaction.guild,
                mentions: { 
                    members: new Collection([[args[0], interaction.guild.members.cache.get(args[0])]]), 
                    users: new Collection([[args[0], client.users.cache.get(args[0])]]),
                    channels: new Collection([[args[0], interaction.guild.channels.cache.get(args[0])]])
                },
                reply: (content) => interaction.reply(content),
                channel: interaction.channel,
                isSlash: true,
                interaction: interaction
            };
            await command.execute(mockMessage, args, client);
        } catch (err) {
            console.error(`Erro ao executar /${commandName}:`, err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro ao executar comando.', flags: [MessageFlags.Ephemeral] });
            }
        }
        return;
    }

    // 3. Lidar com Botões de Setup
    if (interaction.isButton()) {
      const customId = interaction.customId;
      if (customId.startsWith('setup_')) {
        if (!isUserAdmin) return interaction.reply({ content: '❌ Você não tem permissão para usar este botão.', flags: [MessageFlags.Ephemeral] });

        if (customId === 'setup_title') {
          const modal = new ModalBuilder().setCustomId('modal_title').setTitle('Mudar Título');
          const input = new TextInputBuilder().setCustomId('title_input').setLabel('Novo Título').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
        if (customId === 'setup_desc') {
          const modal = new ModalBuilder().setCustomId('modal_desc').setTitle('Mudar Descrição');
          const input = new TextInputBuilder().setCustomId('desc_input').setLabel('Nova Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
        if (customId === 'setup_banner') {
          const modal = new ModalBuilder().setCustomId('modal_banner').setTitle('Mudar Banner');
          const input = new TextInputBuilder().setCustomId('banner_input').setLabel('Link do Banner').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
        if (customId === 'setup_add_prod') {
          const modal = new ModalBuilder().setCustomId('modal_add_prod').setTitle('Adicionar Produto');
          const idInput = new TextInputBuilder().setCustomId('prod_id').setLabel('ID Interno').setStyle(TextInputStyle.Short).setRequired(true);
          const nameInput = new TextInputBuilder().setCustomId('prod_name').setLabel('Nome Visível').setStyle(TextInputStyle.Short).setRequired(true);
          const priceInput = new TextInputBuilder().setCustomId('prod_price').setLabel('Preço').setStyle(TextInputStyle.Short).setRequired(true);
          const roleInput = new TextInputBuilder().setCustomId('prod_role').setLabel('ID do Cargo (Opcional)').setStyle(TextInputStyle.Short).setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(idInput), new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(priceInput), new ActionRowBuilder().addComponents(roleInput));
          return interaction.showModal(modal);
        }
        if (customId === 'setup_edit_prod') {
            const modal = new ModalBuilder().setCustomId('modal_edit_prod').setTitle('Editar Produto');
            const idInput = new TextInputBuilder().setCustomId('edit_id').setLabel('ID do Produto').setStyle(TextInputStyle.Short).setRequired(true);
            const nameInput = new TextInputBuilder().setCustomId('edit_name').setLabel('Novo Nome').setStyle(TextInputStyle.Short).setRequired(true);
            const priceInput = new TextInputBuilder().setCustomId('edit_price').setLabel('Novo Preço').setStyle(TextInputStyle.Short).setRequired(true);
            const roleInput = new TextInputBuilder().setCustomId('edit_role').setLabel('Novo ID do Cargo (Opcional)').setStyle(TextInputStyle.Short).setRequired(false);
            modal.addComponents(new ActionRowBuilder().addComponents(idInput), new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(priceInput), new ActionRowBuilder().addComponents(roleInput));
            return interaction.showModal(modal);
        }
        if (customId === 'setup_view_all') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const products = await firebase.getAllDocs('products');
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle('📋 Todos os Produtos').setDescription(products.length > 0 ? products.map(p => `**ID:** \`${p.id}\` | **Nome:** ${p.name}\n**Preço:** ${p.price} | **Cargo ID:** ${p.roleId || 'Nenhum'}\n**Resgates:** ${p.rescueCount || 0} | **Estoque:** ${p.stock ? p.stock.length : 0}`).join('\n\n') : 'Nenhum produto cadastrado.');
            return interaction.editReply({ embeds: [embed] });
        }
        if (customId === 'setup_send_panel') {
          await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
          try {
            const panelData = await firebase.getDoc('config', 'panel') || { title: 'Menu de Resgate', description: 'Bem-vindo!' };
            const products = await firebase.getAllDocs('products');
            const embed = new EmbedBuilder().setColor(config.embedColor).setTitle(panelData.title || 'Menu de Resgate').setDescription(panelData.description || 'Escolha um produto abaixo para resgatar com seus invites.').setFooter({ text: config.footerText });
            if (panelData.banner) embed.setImage(panelData.banner);
            const activeProducts = products.filter(p => p.status !== 'inativo');
            if (activeProducts.length === 0) return interaction.editReply('❌ Não há produtos ativos.');
            const selectMenu = new StringSelectMenuBuilder().setCustomId('rescue_select').setPlaceholder('Escolha um produto para resgatar').addOptions(activeProducts.map(p => ({ label: p.name || p.id, description: `${p.price} invites | Estoque: ${p.stock ? p.stock.length : 0}`, value: p.id })));
            const row = new ActionRowBuilder().addComponents(selectMenu);
            const sentMessage = await interaction.channel.send({ embeds: [embed], components: [row] });
            await firebase.setDoc('config', 'panel', { lastMenuMessageId: sentMessage.id, lastMenuChannelId: sentMessage.channelId });
            await interaction.message.delete().catch(() => {});
            await interaction.editReply('✅ Menu enviado e setup fechado!');
          } catch (err) {
            await interaction.editReply('❌ Erro ao enviar.');
          }
        }
      }
    }

    // 4. Lidar com Modais (Edição Dinâmica)
    if (interaction.isModalSubmit()) {
        await interaction.deferUpdate(); 
        const customId = interaction.customId;
        try {
            if (customId === 'modal_title') await firebase.setDoc('config', 'panel', { title: interaction.fields.getTextInputValue('title_input') });
            if (customId === 'modal_desc') await firebase.setDoc('config', 'panel', { description: interaction.fields.getTextInputValue('desc_input') });
            if (customId === 'modal_banner') await firebase.setDoc('config', 'panel', { banner: interaction.fields.getTextInputValue('banner_input') });
            if (customId === 'modal_add_prod') {
                const id = interaction.fields.getTextInputValue('prod_id');
                const roleId = interaction.fields.getTextInputValue('prod_role');
                await firebase.setDoc('products', id, { id, name: interaction.fields.getTextInputValue('prod_name'), price: parseInt(interaction.fields.getTextInputValue('prod_price')), roleId: roleId || null, status: 'ativo', stock: [], rescueCount: 0 });
            }
            if (customId === 'modal_edit_prod') {
                const id = interaction.fields.getTextInputValue('edit_id');
                const roleId = interaction.fields.getTextInputValue('edit_role');
                await firebase.setDoc('products', id, { name: interaction.fields.getTextInputValue('edit_name'), price: parseInt(interaction.fields.getTextInputValue('edit_price')), roleId: roleId || null });
            }
            await updateSetupEmbed(interaction);
            await updateMenuRealTime(client, interaction.guild);
        } catch (err) {
            console.error(err);
        }
    }

    // 5. Select Menu (Resgate)
    if (interaction.isStringSelectMenu() && interaction.customId === 'rescue_select') {
        const productId = interaction.values[0];
        const userId = interaction.user.id;
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        try {
            const userData = await firebase.getDoc('users', userId) || { invites: 0, credits: 0 };
            const productData = await firebase.getDoc('products', productId);
            if (!productData) return interaction.editReply('❌ Produto não encontrado.');
            if (userData.blocked) return interaction.editReply('❌ Você está bloqueado de realizar resgates.');

            const invites = userData.invites || 0;
            const credits = userData.credits || 0;
            const totalBalance = invites + credits;

            if (totalBalance < productData.price) {
                return interaction.editReply(`❌ Você não possui saldo suficiente (Invites + Créditos) para resgatar esse produto!\nSaldo atual: **${totalBalance}** | Necessário: **${productData.price}**`);
            }

            const stock = productData.stock || [];
            if (stock.length === 0) return interaction.editReply('❌ Este produto está sem estoque no momento.');
            
            const key = stock.shift();
            let rem = productData.price;
            let currentCredits = credits;
            let currentInvites = invites;
            let spentC = 0;
            let spentI = 0;

            // LÓGICA DE COBRANÇA: PRIORIZAR O SALDO MAIOR
            if (currentCredits >= currentInvites) {
                if (currentCredits >= rem) { spentC = rem; currentCredits -= rem; rem = 0; }
                else { spentC = currentCredits; rem -= currentCredits; currentCredits = 0; spentI = rem; currentInvites -= rem; }
            } else {
                if (currentInvites >= rem) { spentI = rem; currentInvites -= rem; rem = 0; }
                else { spentI = currentInvites; rem -= currentInvites; currentInvites = 0; spentC = rem; currentCredits -= rem; }
            }
            
            await firebase.setDoc('products', productId, { stock, rescueCount: (productData.rescueCount || 0) + 1 });
            await firebase.setDoc('users', userId, { 
                invites: currentInvites, 
                credits: currentCredits, 
                spentInvites: (userData.spentInvites || 0) + spentI, 
                spentCredits: (userData.spentCredits || 0) + spentC, 
                rescues: [...(userData.rescues || []), { productName: productData.name, key, timestamp: Date.now() }] 
            });

            // ENTREGA DE CARGOS (GLOBAL E ESPECÍFICO)
            try {
                const member = await interaction.guild.members.fetch(userId);
                // Cargo de Cliente (Global)
                if (config.resgateRoleId) await member.roles.add(config.resgateRoleId).catch(() => {});
                // Cargo do Produto (Específico)
                if (productData.roleId) await member.roles.add(productData.roleId).catch(() => {});
            } catch (err) {
                console.error('Erro ao entregar cargos:', err.message);
            }

            // DM ESTILO PRESENTE COM RETRY
            const dmEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎁 Você recebeu um presente!')
                .setDescription(`Sua key para o produto **${productData.name}** acaba de chegar.`)
                .addFields({ name: '🔑 Key de Acesso', value: `\`${key}\`` })
                .setFooter({ text: '⚠️ Este é um sistema automático. Não oferecemos suporte total (nem via bot, nem via ticket/servidor).' });

            let dmSent = false;
            try { await interaction.user.send({ embeds: [dmEmbed] }); dmSent = true; } catch (err) {
                await new Promise(r => setTimeout(r, 1000));
                try { await interaction.user.send({ embeds: [dmEmbed] }); dmSent = true; } catch (err2) { dmSent = false; }
            }

            // LOGS DINÂMICOS DE KEYS
            if (!userData.ignored) {
                const panelData = await firebase.getDoc('config', 'panel');
                if (panelData && panelData.logKeyChannelId) {
                    const logChannel = client.channels.cache.get(panelData.logKeyChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder().setColor(config.embedColor).setTitle('📦 Novo Resgate Realizado').addFields({ name: '👤 Usuário', value: `<@${userId}>`, inline: true }, { name: '🛍️ Produto', value: productData.name, inline: true }, { name: '🔑 Key Entregue', value: `\`${key}\``, inline: false }).setTimestamp().setFooter({ text: config.footerText });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            }

            await updateMenuRealTime(client, interaction.guild);
            if (!dmSent) return interaction.editReply(`✅ Resgate concluído! Mas não consegui te enviar a DM. Sua key é: \`${key}\` (Mantenha sua DM aberta para futuros resgates).`);
            await interaction.editReply('✅ Resgate concluído com sucesso! Verifique sua DM.');
        } catch (e) { 
            console.error(e);
            await interaction.editReply('❌ Ocorreu um erro interno durante o resgate.'); 
        }
    }
  },
  updateMenuRealTime
};
