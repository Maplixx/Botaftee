const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'ping',
  async execute(message, args, client) {
    const latency = Date.now() - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    
    // Uptime calculation
    let totalSeconds = (client.uptime / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);
    
    const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 Latência', value: `\`${latency}ms\``, inline: true },
        { name: '🌐 API Latência', value: `\`${apiLatency}ms\``, inline: true },
        { name: '💾 Uso de RAM', value: `\`${ramUsage} MB\``, inline: true },
        { name: '🕒 Uptime', value: `\`${uptime}\``, inline: false }
      )
      .setFooter({ text: config.footerText });

    message.reply({ embeds: [embed] });
  },
};
