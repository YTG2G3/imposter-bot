const { SlashCommandBuilder } = require('@discordjs/builders');
const { servers } = require('../firebase');
const { firestore } = require('firebase-admin');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join/Leave the game.'),
    async execute(interaction) {
        let serverDoc = await servers.doc(interaction.guild.id).get();

        if (!serverDoc.exists) return await interaction.reply("[!] Server not set up.");

        if (serverDoc.data().matchid) return await interaction.reply("[!] Ongoing game.");

        if (serverDoc.data().members.find(v => v === interaction.user.id)) { // leave
            await servers.doc(interaction.guild.id).update({
                members: firestore.FieldValue.arrayRemove(interaction.user.id)
            });

            await interaction.member.roles.remove(interaction.guild.roles.cache.find(r => r.id === serverDoc.data().roleid));
            await interaction.reply("[-] Left the game.");
        }
        else { // join
            await servers.doc(interaction.guild.id).update({
                members: firestore.FieldValue.arrayUnion(interaction.user.id)
            });

            await interaction.member.roles.add(interaction.guild.roles.cache.find(r => r.id === serverDoc.data().roleid));
            await interaction.reply("[-] Joined the game!");
        }
    }
};