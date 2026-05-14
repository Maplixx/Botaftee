const { Events } = require('discord.js');

module.exports = {
  name: Events.InviteDelete,
  async execute(invite, client) {
    const cachedInvites = client.invites.get(invite.guild.id);
    if (cachedInvites) {
      cachedInvites.delete(invite.code);
    }
  },
};
