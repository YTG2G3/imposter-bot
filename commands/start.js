const { SlashCommandBuilder } = require('@discordjs/builders');
const { servers, matches, results, members } = require('../firebase');
const { MessageEmbed, Permissions } = require('discord.js');
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

        if (serverDoc.data().members.length < 3) return await interaction.reply("[!] Not enough players!");

        await interaction.reply("[-] Starting game!");
        await interaction.guild.members.fetch();
        await interaction.guild.roles.fetch();
        await interaction.guild.channels.fetch();

        // Create match
        let _alive = {}, _votes = {};
        for (let m of serverDoc.data().members) {
            _alive[m] = true;
            _votes[m] = null;
        }

        let day = 0;

        let rand = threeRandomIntegers(serverDoc.data().members.length);
        let imposter = serverDoc.data().members[rand[0]];
        let doctor = serverDoc.data().members[rand[1]];
        let sheriff = serverDoc.data().members[rand[2]];

        let match = await matches.add({
            serverid: interaction.guild.id,
            state: 0,
            kill: null, heal: null, investigate: null,
            alive: _alive, votes: _votes,
            imposter, doctor, sheriff
        });

        await servers.doc(interaction.guild.id).update({ matchid: match.id });

        for (let m of serverDoc.data().members) {
            await members.doc(m).set({ matchid: match.id });
        }

        // Prepare stuff
        let channel = interaction.guild.channels.cache.get(serverDoc.data().channelid);
        let gamers = serverDoc.data().members.map(m => interaction.guild.members.cache.get(m));
        let memberNicks = gamers.map(m => m.displayName);

        // Let them know their roles
        for (let m of gamers) {
            switch (m.id) {
                case imposter:
                    await m.send("You are the imposter!");
                    break;
                case doctor:
                    await m.send("You are the doctor!");
                    break;
                case sheriff:
                    await m.send("You are the sheriff!");
                    break;
                default:
                    await m.send("You are a civilian!");
                    break;
            }
        }

        let embed = new MessageEmbed()
            .setTitle("List of Nicknames in " + interaction.guild.name)
            .setColor("DARK_RED");

        for (let i in memberNicks) {
            embed.addField(i, memberNicks[i]);
        }

        for (let m of gamers) {
            await m.send({ embeds: [embed] });
        }

        let victory = 0; // 1- imposter 2- citizens

        // Start game
        while (victory === 0) {
            // Night 0
            day++;

            await match.update({ state: 0 });
            await channel.send(`Day ${day}: Please check your DM for instructions. You are given 15 seconds to decide.`);

            for (let m of gamers) {
                switch (m.id) {
                    case imposter:
                        await m.send("Who do you wish to kill? (Enter a number)");
                        break;
                    case doctor:
                        await m.send("Who do you wish to save? (Enter a number)");
                        break;
                    case sheriff:
                        await m.send("Who do you wish to investigate on? (Enter a number)");
                        break;
                    default:
                        await m.send("**Control your own destiny or someone else will.** -Jack Welch");
                        break;
                }
            }

            await delay(15 * 1000);

            // Morning 1
            await match.update({ state: 1 });
            await channel.send(`Night has passed! Let's see what happened in the dark.`);

            let { kill, heal, investigate } = (await match.get()).data();
            await match.update({ kill: null, heal: null, investigate: null });
            let victim = null;

            if (kill !== null && kill !== heal) {
                victim = gamers[kill];
                _alive[victim.id] = false;

                await match.update({ [`alive.${victim.id}`]: false });
                await victim.roles.remove(interaction.guild.roles.cache.get(serverDoc.data().roleid));
                await victim.send("You have been eliminated :(");
                await channel.send(`Unfortunately, our good friend ${memberNicks[kill]} has passed away. RIP.`);
            }

            if (victim === null) {
                await channel.send("Wow, what a peaceful night!");
            }

            if (investigate !== null && sheriff !== victim) {
                if (serverDoc.data().members[investigate] === imposter) {
                    await gamers.find(m => m.id === sheriff).send(`${memberNicks[investigate]} is the imposter!`);
                }
                else {
                    await gamers.find(m => m.id === sheriff).send(`${memberNicks[investigate]} is not the imposter.`);
                }
            }

            await delay(5 * 1000);

            // Discussion 2
            await match.update({ state: 2 });
            await channel.edit({
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [Permissions.ALL]
                    },
                    {
                        id: serverDoc.data().roleid,
                        allow: [Permissions.FLAGS.READ_MESSAGE_HISTORY, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
                    }
                ]
            });
            await channel.send("Discussion time for 2 minutes!");

            await delay(5 * 1000); // FIXME - 120

            // Vote 3
            await match.update({ state: 3 });
            await channel.edit({
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [Permissions.ALL]
                    },
                    {
                        id: serverDoc.data().roleid,
                        allow: [Permissions.FLAGS.READ_MESSAGE_HISTORY, Permissions.FLAGS.VIEW_CHANNEL]
                    }
                ]
            });
            await channel.send("Time to vote! Check your DM for instructions. You are given 15 seconds to decide.");

            for (let m of gamers) {
                await m.send("Please respond with the number corresponding to the person you want to kick out! Choose wisely: you can only pick one person every vote.");
            }

            await delay(15 * 1000);

            // Count 4
            await match.update({ state: 4 });
            await channel.send("Time is over. Who shall be kicked out of the village this time?");

            let { votes } = (await match.get()).data();
            await match.update({ votes: _votes });
            let voteCnt = new Array(serverDoc.data().members.length).fill(0);

            for (let m of serverDoc.data().members) {
                if (votes[m]) {
                    await delay(500);
                    await channel.send(`${++voteCnt[votes[m]]} vote(s) for ${memberNicks[votes[m]]}`);
                }
            }

            let maxIndex = -1, max = -1, maxCnt = 0;
            for (let i in voteCnt) {
                if (voteCnt[i] > max) {
                    maxIndex = i;
                    max = voteCnt[i];
                    maxCnt = 1;
                }
                else if (voteCnt[i] === max) {
                    maxCnt++;
                }
            }

            if (maxCnt > 1) await channel.send("Tied!");
            else {
                let kick = gamers[maxIndex];
                _alive[kick.id] = false;

                await match.update({ [`alive.${kick.id}`]: false });
                await kick.roles.remove(interaction.guild.roles.cache.get(serverDoc.data().roleid));
                await kick.send("You have been kicked out :(");
                await channel.send(`Adiós, ${memberNicks[maxIndex]}!`);
            }

            // Check before next night
            let aliveCnt = 0;
            for (let m of serverDoc.data().members) {
                if (_alive[m]) aliveCnt++;
            }

            if (_alive[imposter] && aliveCnt <= 2) victory = 1;
            else if (!_alive[imposter]) victory = 2;
        }

        // Game over
        switch (victory) {
            case 1: // imposter wins
                await channel.send("Imposter wins! Game closes in 10 seconds.");
                break;
            case 2: // citizens win
                await channel.send("Citizens win! Game closes in 10 seconds.");
                break;
        }

        await match.update({ state: -1 });

        let savedNames = {};
        for (let m of gamers) {
            savedNames[m.id] = m.displayName;
        }

        let result = await results.add({
            createdAt: new Date(),
            matchid: match.id,
            nicknames: savedNames
        });

        // Reset
        for (let m of gamers) {
            await m.send(`Match is over! View your results in http://imposterbot.kro.kr/result/${result.id}`);
            await members.doc(m.id).set({ matchid: null });
            await m.roles.delete(interaction.guild.roles.cache.find(r => r.id === serverDoc.data().roleid));
        }

        await servers.doc(interaction.guild.id).update({ matchid: null, members: [] });
    }
};