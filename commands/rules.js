const { SlashCommandBuilder } = require('@discordjs/builders');

let rules = "The rules are as follows:\n1. Minimum of 5 players required to play.\n2. Each player will be privately messaged with the role of doctor, sheriff, civlian or mafia";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Gives the rules!'),
	async execute(interaction) {
		await interaction.reply(rules);
	},
};
