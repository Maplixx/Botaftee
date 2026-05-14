const { Events } = require('discord.js');

module.exports = {
  name: Events.InviteCreate,
  async execute(invite, client) {
    const cachedInvites = client.invites.get(invite.guild.id);
    if (cachedInvites) {
      cachedInvites.set(invite.code, invite.uses);
    } else {
      client.invites.set(invite.guild.id, new Map([[invite.code, invite.uses]]));
    }
  },
};
