const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'cmds',
  async execute(message, args, client) {
    // Verificação de Admin por ID ou Cargo
    if (!config.isAdmin(message.member)) {
      return message.reply('❌ Você não tem permissão para usar este comando.').catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📜 Lista Completa de Comandos')
      .setDescription('Aqui estão todos os comandos disponíveis para a equipe administrativa.')
      .addFields(
        { 
          name: '👤 Comandos Públicos', 
          value: '`/ping` - Ver latência e estatísticas do bot.\n`/infos [@user]` - Ver estatísticas detalhadas de um usuário.' 
        },
        { 
          name: '⚙️ Configuração e Menu', 
          value: '`/setup` - Abrir o painel de configuração dinâmico.\n`/loginvite [#canal]` - Canal de logs de invites.\n`/logkey [#canal]` - Canal de logs de resgate.\n`/nologs` - Desativar logs.\n`/aviso #canal "mensagem" [excluir]` - Envia aviso com limpeza.' 
        },
        { 
          name: '📦 Estoque e Produtos', 
          value: '`/estocar {id} {keys...}` - Adicionar keys (com Autocomplete).\n`/zerar` - Limpar todos os estoques.\n`/presentear {id} @user` - Enviar produto direto.' 
        },
        { 
          name: '💰 Créditos e Invites', 
          value: '`/addcred @user {quantia}` - Adicionar créditos.\n`/remcred @user {quantia}` - Remover créditos.\n`/reset @user` - Zerar todos os invites.' 
        },
        { 
          name: '🛡️ Administração de Membros', 
          value: '`/addcargo @user {id_cargo}` - Adicionar cargo.\n`/remcargo @user {id_cargo}` - Remover cargo.\n`/blockuser @user` - Bloquear resgates.\n`/unblockuser @user` - Desbloquear resgates.\n`/ignorar @user` - Ignorar usuário nos logs.\n`/msg @user {texto}` - Enviar DM via bot.' 
        },
        { 
          name: '📋 Histórico e Auditoria', 
          value: '`/resgatado` - Ver o histórico de todos os resgates realizados.' 
        }
      )
      .setFooter({ text: `Total de Comandos: 21 | ${config.footerText}` });

    // Se for Slash, responder efemeramente
    if (message.isSlash) {
      return message.interaction.editReply({ embeds: [embed] });
    }

    message.reply({ embeds: [embed] });
  },
};
