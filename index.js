import { Client as DiscordClient, Intents } from "discord.js";

import dotenv from 'dotenv';
dotenv.config();

const client = new DiscordClient({ intents: [Intents.FLAGS.DIRECT_MESSAGES] });

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.login(process.env.DISCORD_TOKEN);