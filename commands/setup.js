const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { servers } = require('../firebase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Creates a game channel in your server.'),
    async execute(interaction) {
        if (interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            let channel = await interaction.guild.channels.create("imposter-game", {
                "type": "GUILD_TEXT",
                permissionOverwrites: [{
                    id: interaction.guild.roles.everyone,
                    deny: [Permissions.ALL]
                }]
            });

            servers.doc(interaction.guild.id).set({ channelid: channel.id });

            await interaction.reply(`[-] Channel made: <#${channel.id}>`);
        }
        else await interaction.reply("[!] Access denied.");
    },
};