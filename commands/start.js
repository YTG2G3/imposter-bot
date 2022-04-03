const { SlashCommandBuilder } = require('@discordjs/builders');
const { servers, matches } = require('../firebase');
const { MessageEmbed } = require('discord.js');
const delay = require('delay');

const threeRandomIntegers = (max) => {
    let taken = new Array(max);
    let ans = [];

    while (ans.length < 3) {
        let r = Math.floor(Math.random() * max);
        if (!taken[r]) {
            ans.push(r);
            taken[r] = true;
        }
    }

    return ans;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start the game.'),
    async execute(interaction) {
        let serverDoc = await servers.doc(interaction.guild.id).get();

        if (!serverDoc.exists) return await interaction.reply("[!] Server not set up.");

        if (serverDoc.data().matchid) return await interaction.reply("[!] Ongoing game.");

        if (serverDoc.data().members.length < 5) return await interaction.reply("[!] Not enough players!");

        // Create match
        let alive = {}, votes = {};
        for (let m of serverDoc.data().members) {
            alive[m] = true;
            votes[m] = null;
        }

        let day = 0;

        let rand = threeRandomIntegers(max);
        let imposter = serverDoc.data().members[rand[0]];
        let doctor = serverDoc.data().members[rand[1]];
        let sheriff = serverDoc.data().members[rand[2]];

        let match = await matches.add({
            serverid: interaction.guild.id,
            state: 0, ongoing: true,
            kill: null, heal: null, investigate: null,
            alive, votes, imposter, doctor, sheriff
        });

        await servers.doc(interaction.guild.id).update({ matchid: match.id });

        // Prepare stuff
        let channel = interaction.guild.channels.cache.find(c => c.id === serverDoc.data().channelid);
        let members = interaction.guild.members.cache.filter(m => alive[m.id]);
        let memberNicks = interaction.guild.members.cache.filter(m => alive[m.id]).map(m => m.nickname);
        let matchid = match.id;

        // Let them know their roles
        for (let m of members) {
            switch (m[0]) {
                case imposter:
                    await m[1].send("You are the imposter!");
                    break;
                case doctor:
                    await m[1].send("You are the doctor!");
                    break;
                case sheriff:
                    await m[1].send("You are the sheriff!");
                    break;
                default:
                    await m[1].send("You are a civilian!");
                    break;
            }
        }

        let embed = new MessageEmbed()
            .setTitle("List of Nicknames in " + interaction.guild.name)
            .setColor("DARK_RED");

        for (let i in memberNicks) {
            embed.addField(i, memberNicks[i]);
        }

        for (let m of members) {
            await m[1].send(embed);
        }

        // Start game
        while (true) {
            // Night 0
            day++;

            await match.update({ state: 0 });
            await channel.send(`Day ${day}: Please check your DM for instructions. You are given 15 seconds to decide.`);

            for (let m of members) {
                switch (m[0]) {
                    case imposter:
                        await m[1].send("Who do you wish to kill? (Enter a number)");
                        break;
                    case doctor:
                        await m[1].send("Who do you wish to save? (Enter a number)");
                        break;
                    case sheriff:
                        await m[1].send("Who do you wish to investigate on? (Enter a number)");
                        break;
                    default:
                        await m[1].send("**Control your own destiny or someone else will.** -Jack Welch");
                        break;
                }
            }
            await delay(15 * 1000);

            // Morning 1
            let { kill, heal, investigate } = await match.get();

            await match.update({ state: 1 });
            await channel.send(`Night has passed! Let's see what happened in the dark.`);


            if (kill !== heal) {
                let victim = members.find(m => m.id === serverDoc.data().members[kill]);

                await victim.roles.remove(interaction.guild.roles.cache.find(r => r.id === serverDoc.data().roleid));
                await victim.send("You have been eliminated :(");
                await channel.send(`Unfortunately, our good friend ${memberNicks[kill]} has passed away. RIP.`);
            }
        }
    }
};