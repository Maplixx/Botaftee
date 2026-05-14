const { Client, GatewayIntentBits, Collection, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.commands = new Collection();
client.invites = new Map();

// Carregar comandos de prefixo
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
      client.commands.set(command.name, command);
    }
  }
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// Registro de Slash Commands - LISTA COMPLETA ATUALIZADA (22 Comandos)
const slashCommandsData = [
  new SlashCommandBuilder().setName('ping').setDescription('Latência e estatísticas do bot.'),
  new SlashCommandBuilder().setName('infos').setDescription('Ver estatísticas de um usuário.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para ver as infos')),
  new SlashCommandBuilder().setName('cmds').setDescription('Lista de comandos (Apenas Admin)'),
  new SlashCommandBuilder().setName('setup').setDescription('Painel de configuração (Apenas Admin)'),
  new SlashCommandBuilder().setName('loginvite').setDescription('Configurar canal de logs de invites (Apenas Admin)')
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal para enviar os logs de entrada')),
  new SlashCommandBuilder().setName('logkey').setDescription('Configurar canal de logs de resgate (Apenas Admin)')
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal para enviar os logs de resgate')),
  new SlashCommandBuilder().setName('nologs').setDescription('Desativar todos os logs (Apenas Admin)'),
  new SlashCommandBuilder().setName('estocar').setDescription('Adicionar keys ao estoque (Apenas Admin)')
    .addStringOption(opt => opt.setName('produto').setDescription('ID do produto').setRequired(true).setAutocomplete(true))
    .addStringOption(opt => opt.setName('keys').setDescription('Keys (pode usar quebras de linha)').setRequired(true)),
  new SlashCommandBuilder().setName('addcred').setDescription('Adicionar créditos (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantia').setDescription('Quantia').setRequired(true)),
  new SlashCommandBuilder().setName('remcred').setDescription('Remover créditos (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantia').setDescription('Quantia').setRequired(true)),
  new SlashCommandBuilder().setName('reset').setDescription('Resetar invites (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)),
  new SlashCommandBuilder().setName('addcargo').setDescription('Adicionar cargo (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addStringOption(opt => opt.setName('cargo_id').setDescription('ID do cargo para adicionar').setRequired(true)),
  new SlashCommandBuilder().setName('remcargo').setDescription('Remover cargo (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addStringOption(opt => opt.setName('cargo_id').setDescription('ID do cargo para remover').setRequired(true)),
  new SlashCommandBuilder().setName('resgatado').setDescription('Ver histórico de resgates (Apenas Admin)'),
  new SlashCommandBuilder().setName('presentear').setDescription('Dar produto direto (Apenas Admin)')
    .addStringOption(opt => opt.setName('produto').setDescription('ID do produto').setRequired(true).setAutocomplete(true))
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)),
  new SlashCommandBuilder().setName('msg').setDescription('Enviar DM via bot (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addStringOption(opt => opt.setName('texto').setDescription('Mensagem').setRequired(true)),
  new SlashCommandBuilder().setName('blockuser').setDescription('Bloquear resgates (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)),
  new SlashCommandBuilder().setName('unblockuser').setDescription('Desbloquear resgates (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)),
  new SlashCommandBuilder().setName('ignorar').setDescription('Ignorar usuário nos logs (Apenas Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)),
  new SlashCommandBuilder().setName('zerar').setDescription('Limpar todos os estoques (Apenas Admin)'),
  new SlashCommandBuilder().setName('aviso').setDescription('Enviar aviso com limpeza (Apenas Admin)')
    .addChannelOption(opt => opt.setName('canal').setDescription('Canal para o aviso').setRequired(true))
    .addStringOption(opt => opt.setName('mensagem').setDescription('Mensagem (suporta @everyone/@here)').setRequired(true))
    .addStringOption(opt => opt.setName('excluir').setDescription('Quantia ou "tudo"').setRequired(false)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

client.once('ready', async () => {
    try {
        console.log('📡 Registrando Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommandsData },
        );
        console.log('✅ Slash Commands registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar Slash Commands:', error.message);
    }
});

client.login(config.token).catch(err => {
  console.error('Erro ao fazer login:', err.message);
});
