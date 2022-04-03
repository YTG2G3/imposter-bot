// Load .env
require('dotenv').config();

// Load firebase
const { members, matches, servers } = require('./firebase');

// Create new discord bot client
const { Client, Intents, Collection } = require("discord.js");
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });

// Load commands
const fs = require('fs');
const { match } = require('assert');
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
        // In game
        let matchDoc = await matches.doc(udoc.data().matchid).get();
        let serverDoc = await servers.doc(matchDoc.data().serverid).get();
        let pick = Number(msg.content);
        let aliveCnt = matchDoc.data().alive.length;

        if (!matchDoc.data().alive[msg.author.id]) return await msg.reply("Dead men tell no tales.");
        if (!(0 <= pick && pick < aliveCnt)) return await msg.reply("Out of index!");
        if (!matchDoc.data().alive[serverDoc.data().members[pick]]) return await msg.reply("Already late. Pick someone else.");

        // Ability
        if (matchDoc.data().state === 0) {
            switch (msg.author.id) {
                case matchDoc.data().imposter:
                    await matches.doc(udoc.data().matchid).update({ kill: pick });
                    await msg.reply("Target aimed...");
                    break;
                case matchDoc.data().doctor:
                    await matches.doc(udoc.data().matchid).update({ heal: pick });
                    await msg.reply("Scalpel...");
                    break;
                case matchDoc.data().sheriff:
                    await matches.doc(udoc.data().matchid).update({ investigate: pick });
                    await msg.reply("Suspicious huh...");
                    break;
                default:
                    await msg.reply("**Control your own destiny or someone else will.** -Jack Welch");
                    break;
            }
        }
        else if (matchDoc.data().state === 2) {
            await matches.doc(udoc.data().matchid).update({ [`votes.${msg.author.id}`]: pick });
            await msg.reply("Voted!");
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
