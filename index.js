// Load .env
require('dotenv').config();

// Load firebase
const { members, matches } = require('./firebase');

// Create new discord bot client
const { Client, Intents, Collection } = require("discord.js");
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });

// Load commands
const fs = require('fs');
require('./deploy-command');

bot.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
    let command = require(`./commands/${file}`);
    bot.commands.set(command.data.name, command);
}

// Bot ready
bot.once('ready', async () => {
    console.log('Bot is ready!');
});

// Bot receive number
bot.on('message', async msg => {
    if (isNaN(msg.content)) return;

    let udoc = await members.doc(msg.author.id).get();

    if (udoc.exists && udoc.data().matchid) {
        // in game
        let matchDoc = await matches.doc(udoc.data().matchid).get();

        if (!matchDoc.data().alive[msg.author.id]) return; // dead

        // Ability
        if (matchDoc.data().state === 0) {
            if (matchDoc.data().imposter === msg.author.id) {
                await matches.doc(udoc.data().matchid).set();
            }
        }
    }
});

// Bot received command
bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.user.bot) return;

    if (interaction.guild.roles.cache.size === 0) {
        console.log("Fetching roles...");
        await interaction.guild.roles.fetch();
    }

    if (interaction.guild.channels.cache.size === 0) {
        console.log("Fetching channels...");
        await interaction.guild.channels.fetch();
    }

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
