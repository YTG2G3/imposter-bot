const { SlashCommandBuilder } = require('@discordjs/builders');

let rules = 
`The rules are as follows:\n
1. Minimum of 5 players required to play\n
2. Each player will be privately messaged with the role of doctor, sheriff, civlian or mafia\n
3. If the player is murdered by the mafia, they must mute\n4. 
4. Vote is every morning, using replies to the bot\n
5. If mafia kills all players, they win\n
6.If players vote out mafia before all are dead, they win`;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Gives the rules!'),
	async execute(interaction) {
		await interaction.reply(rules);
	},
};
