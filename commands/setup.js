const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { servers } = require('../firebase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Creates a game channel & role in your server.'),
    async execute(interaction) {
        if (interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            let serverDoc = await servers.doc(interaction.guild.id).get();

            if (serverDoc.exists) return await interaction.reply("[!] Please /reset before you setup the game.");

            let role = await interaction.guild.roles.create({
                name: "Mafia Players",
                color: "RED"
            });

            let channel = await interaction.guild.channels.create("imposter-game", {
                "type": "GUILD_TEXT",
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [Permissions.ALL]
                    },
                    {
                        id: role.id,
                        allow: [Permissions.FLAGS.READ_MESSAGE_HISTORY, Permissions.FLAGS.VIEW_CHANNEL]
                    }
                ]
            });

            servers.doc(interaction.guild.id).set({
                channelid: channel.id,
                roleid: role.id,
                members: [],
                matchid: null
            });

            await interaction.reply(`[-] Channel made: <#${channel.id}>`);
        }
        else await interaction.reply("[!] Access denied.");
    }
};