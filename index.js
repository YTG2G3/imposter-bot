// Load .env
require('dotenv').config();

// Load firebase
const { initializeApp, applicationDefault } = require('firebase-admin/app');
initializeApp({ credential: applicationDefault() });

// Create new discord bot client
const { Client, Intents } = require("discord.js");
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });

// Bot ready
bot.on('ready', () => {
    console.log('Bot is ready!');
});

// Bot received command
bot.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) return;

    let cmd = interaction.commandName;

    if (cmd === "open") {

    }
});

bot.login(process.env.DISCORD_TOKEN);
