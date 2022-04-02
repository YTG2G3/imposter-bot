// Load .env
require('dotenv').config();

// Create new discord bot client
const { Client, Intents, Collection } = require("discord.js");
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });

// Load commands
bot.commands = new Collection();

// Bot ready
bot.on('ready', () => {
    console.log('Bot is ready!');
});

// Bot received message
bot.on('message', msg => {

});

bot.login(process.env.DISCORD_TOKEN);
