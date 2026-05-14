const { EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'aviso',
  description: 'Envia um aviso em um canal específico com opção de limpeza.',
  async execute(message, args, client) {
    const isUserAdmin = config.isAdmin(message.member);
    if (!isUserAdmin) {
        if (message.isSlash) return message.interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', flags: [MessageFlags.Ephemeral] });
        return message.reply('❌ Você não tem permissão para usar este comando.');
    }

    let channel, content, deleteOption;

    if (message.isSlash) {
        channel = message.interaction.options.getChannel('canal');
        content = message.interaction.options.getString('mensagem');
        deleteOption = message.interaction.options.getString('excluir');
    } else {
        // Lógica para prefixo: $aviso #canal "mensagem" excluir
        channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ Você precisa mencionar um canal! Ex: `$aviso #geral "Olá a todos" 2`');
        
        // Extrair mensagem entre aspas ou o resto
        const rawArgs = args.slice(1).join(' ');
        const match = rawArgs.match(/"([^"]+)"/);
        if (match) {
            content = match[1];
            deleteOption = rawArgs.replace(`"${content}"`, '').trim();
        } else {
            content = args.slice(1).join(' ');
            deleteOption = '';
        }
    }

    if (!channel || !content) {
        if (message.isSlash) return message.interaction.reply({ content: '❌ Canal ou mensagem inválidos.', flags: [MessageFlags.Ephemeral] });
        return message.reply('❌ Uso correto: `$aviso #canal "mensagem" [quantidade/tudo]`');
    }

    // Processar quebras de linha explicitamente para o Discord
    // Se o usuário usar \n ou apenas pular linha no comando, vamos garantir que funcione
    const formattedContent = content.replace(/\\n/g, '\n');

    if (message.isSlash) await message.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
        // Lógica de exclusão
        if (deleteOption) {
            if (deleteOption.toLowerCase() === 'tudo') {
                let fetched;
                do {
                    fetched = await channel.messages.fetch({ limit: 100 });
                    if (fetched.size > 0) {
                        await channel.bulkDelete(fetched).catch(() => {});
                    }
                } while (fetched.size >= 2);
            } else {
                const amount = parseInt(deleteOption);
                if (!isNaN(amount) && amount > 0) {
                    await channel.bulkDelete(Math.min(amount, 100)).catch(() => {});
                }
            }
        }

        // Enviar aviso formatado
        await channel.send(formattedContent);

        const successMsg = `✅ Aviso enviado com sucesso no canal <#${channel.id}>!`;
        if (message.isSlash) return message.interaction.editReply(successMsg);
        return message.reply(successMsg);
    } catch (err) {
        console.error('Erro no comando aviso:', err);
        const errorMsg = '❌ Ocorreu um erro ao enviar o aviso. Verifique minhas permissões no canal.';
        if (message.isSlash) return message.interaction.editReply(errorMsg);
        return message.reply(errorMsg);
    }
  }
};
