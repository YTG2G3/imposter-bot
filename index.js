// Load .env
require('dotenv').config();

// Load firebase
const { servers } = require('./firebase');

// Create new discord bot client
const fs = require('fs');
const { Client, Intents, Collection } = require("discord.js");
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });

// Load commands
require('./deploy-command');

bot.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
    let command = require(`./commands/${file}`);
    bot.commands.set(command.data.name, command);
}

// Bot ready
bot.once('ready', () => {
    console.log('Bot is ready!');
});

// Bot joins
bot.on('guildCreate', guild => {

});

// Bot received command
bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.user.bot) return;

    const cmd = bot.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
        await cmd.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

bot.login(process.env.DISCORD_TOKEN);
