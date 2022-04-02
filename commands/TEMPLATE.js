const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('TEMPLATE')
        .setDescription('SOME KIND OF DESCRIPTION'),
    async execute(interaction) {
        // Code starts here...
    },
};