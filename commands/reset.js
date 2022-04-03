const { SlashCommandBuilder } = require('@discordjs/builders');
const { servers } = require('../firebase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Clean resets server.'),
    async execute(interaction) {
        if (interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            let serverDoc = await servers.doc(interaction.guild.id).get();

            if (serverDoc.exists) return await interaction.reply("[!] Nothing to reset.");

            if (serverDoc.data().matchid) return await interaction.reply("[!] Ongoing game.");

            await servers.doc(interaction.guild.id).delete();

            await interaction.reply("[-] Successfully resetted the server.");
        }
        else await interaction.reply("[!] Access denied.");
    }
};