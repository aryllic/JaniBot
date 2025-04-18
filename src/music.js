const { EmbedBuilder, PermissionFlagsBits, VoiceState } = require("discord.js");
const { joinVoiceChannel, entersState, createAudioResource, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const playdl = require("play-dl");
const cases = require("./cases.js");
require("libsodium-wrappers");

const music = [];
const queues = new Map();

function createQueue(guildId, vc, textChannel) {
    const queueConstructor = {
        voiceChannel: vc,
        textChannel: textChannel,
        connection: null,
        player: null,
        playing: false,
        looping: false,
        songs: []
    };

    queues.set(guildId, queueConstructor);
};

async function getVc(interaction) {
    const memberVc = interaction.member.voice.channel;

    if (!memberVc) {
        await cases.reply(interaction, { content: "You need to be in a voice channel to use this command!", ephemeral: false });
        return null;
    } else {
        const permissions = memberVc.permissionsFor(interaction.client.user);

        if (!permissions.has(PermissionFlagsBits.Connect)) {
            await cases.reply(interaction, { content: "I dont have permissions to join this voice channel!", ephemeral: false });
            return null;
        };

        if (!permissions.has(PermissionFlagsBits.Speak)) {
            await cases.reply(interaction, { content: "I dont have permissions to speak in this voice channel!", ephemeral: false });
            return null;
        };

        return memberVc;
    };
};

async function joinVc(channel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
		return connection;
	} catch (error) {
		throw error;
	};
};

async function checkConnection(c, guildId) {
    c.on("stateChange", (oldState, newState) => {
        if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
            c.configureNetworking();
        };
    });

    c.on(VoiceConnectionStatus.Disconnected, async function () {
        const serverQueue = queues.get(guildId);

        if (serverQueue && serverQueue.connection) {
            serverQueue.connection.destroy();
            serverQueue.connection = null;

            const newConnection = await joinVc(serverQueue.voiceChannel);
            serverQueue.connection = newConnection;

            if (serverQueue.player && serverQueue.playing) {
                serverQueue.connection.subscribe(serverQueue.player);
            };

            checkConnection(newConnection, guildId);
        };
    });
};

async function videoFinder(query) {
    const videoResult = await playdl.search(query, {limit : 1});
    return videoResult[0];
};

async function videoPlayer(guildId, song) {
    try {
        const serverQueue = queues.get(guildId);
        serverQueue.playing = true;
        serverQueue.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause, maxMissedFrames: 1000000000000 } });

        if (!song) {
            if (serverQueue.connection) {
                serverQueue.connection.destroy();
                serverQueue.connection = null;
            };

            serverQueue.playing = false;
            queues.delete(guildId);
            return;
        };

        const source = await playdl.stream_from_info(song);
        const resource = createAudioResource(source.stream, { inputType: source.type });

        await serverQueue.player.play(resource);
        serverQueue.connection.subscribe(serverQueue.player);

        const msgEmbed = new EmbedBuilder()
            .setColor("#4ec200")
            .setTitle("Now playing:")
            .setDescription(song.video_details.title);

        serverQueue.textChannel.send({ embeds: [msgEmbed] });

        serverQueue.player.on('error', error => {
            console.log(`Audio-Player-Error: ${error.message}`);
        });

        let lastDuration = -1

        const songCheck = setInterval(() => {
            if (songCheck && lastDuration == resource.playbackDuration) {
                serverQueue.playing = false;

                if (!serverQueue.looping) {
                    serverQueue.songs.shift();
                } else if (serverQueue.looping == "Queue") {
                    serverQueue.songs.push(serverQueue.songs[0]);
                    serverQueue.songs.shift();
                };

                videoPlayer(guildId, serverQueue.songs[0]);
                clearInterval(songCheck);
            };

            lastDuration = resource.playbackDuration;
        }, 1000)

        /*serverQueue.player.on(AudioPlayerStatus.Idle, async () => {
            serverQueue.playing = false;
            
            if (!serverQueue.looping) {
                serverQueue.songs.shift();
            } else if (serverQueue.looping == "Queue") {
                serverQueue.songs.push(serverQueue.songs[0]);
                serverQueue.songs.shift();
            };
    
            videoPlayer(guild, serverQueue.songs[0]);
        });*/
    } catch (error) {
        console.log(error);
    };
};

music.play = async function(interaction) {
    try {
        const memberVc = await getVc(interaction);
        const songString = interaction.options.getString("song").toString();
    
        if (memberVc) {
            let serverQueue = queues.get(interaction.guildId);
            let songTitle;

            if (!serverQueue) {
                createQueue(interaction.guildId, memberVc, interaction.channel);
                serverQueue = queues.get(interaction.guildId);
            };
    
            if (await playdl.validate(songString) === "yt_video") {
                const song = await playdl.video_info(songString);

                songTitle = song.video_details.title;
                serverQueue.songs.push(song);
            } else if (await playdl.validate(songString) === "yt_playlist") {
                const playlist = await playdl.playlist_info(songString, { incomplete: true });

                if (playlist.total_videos < 50) {
                    const songs = await playlist.all_videos();

                    songTitle = playlist.title;
    
                    songs.forEach(async song => {
                        try {
                            serverQueue.songs.push(await playdl.video_info(song.url));
                        } catch(error) {
    
                        };
                    });
                } else {
                    await cases.reply(interaction, { content: "Playlist contains to many videos! (Maximum amount is 50.)", ephemeral: false });
                    return;
                };
            /*} else if (await playdl.validate(songString) === "sp_track") {
                console.log("SPOTIFY TRACK");
                console.log(await playdl.spotify(songString));
            /*} else if (await playdl.validate(songString) === "sp_playlist") {
                console.log("SPOTIFY PLAYLIST");
                console.log(await playdl.spotify(songString));*/
            } else {
                const video = await videoFinder(songString);
    
                if (video) {
                    songTitle = video.title;
                    serverQueue.songs.push(await playdl.video_info(video.url));
                } else {
                    await cases.reply(interaction, { content: "I couldn't find the video you were looking for!", ephemeral: false });
                    return;
                };
            };
    
            if (!serverQueue.connection) {
                try {
                    const connection = await joinVc(memberVc);                
                    serverQueue.connection = connection;
                    checkConnection(connection, interaction.guildId);
                } catch (err) {
                    await cases.reply(interaction, { content: "There was an error connecting!", ephemeral: false });
                    console.log(err);
                    return;
                };
            };
    
            const msgEmbed = new EmbedBuilder()
                    .setColor("#4ec200")
                    .setTitle("Added to queue:")
                    .setDescription(songTitle);
    
            await cases.reply(interaction, { embeds: [msgEmbed], ephemeral: false });
    
            if (!serverQueue.playing) {
                videoPlayer(interaction.guildId, serverQueue.songs[0]);
            };
        };
    } catch (error) {
        console.log(error);
        await cases.reply(interaction, { content: "There was an error while loading the song/playlist!", ephemeral: false });
    };
};

music.skip = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);

        if (serverQueue && serverQueue.playing) {
           if (serverQueue.player) {
               serverQueue.player.stop();
               await cases.reply(interaction, { content: "Skipped!", ephemeral: false });
           };
        } else {
            await cases.reply(interaction, { content: "There is no song playing to skip!", ephemeral: false });
        };
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while skipping the song!", ephemeral: false });
    };
};

music.jump = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);
        const songString = interaction.options.getString("song").toString();
    
        if (serverQueue) {
            let foundSong = false;
    
            serverQueue.songs.forEach(song => {
                if (song.video_details.title.toLowerCase().match(songString.toLowerCase())) {
                    foundSong = song;
                };
            });
            
            if (foundSong) {
                let shifts = 0;
    
                if (foundSong != serverQueue.songs[0]) {
                    shifts = serverQueue.songs.indexOf(foundSong);
                } else {
                    shifts = serverQueue.songs.length
                }; 
    
                for (let i = shifts; i > 1; i--) {
                    serverQueue.songs.push(serverQueue.songs[0]);
                    serverQueue.songs.shift();
                };
    
                if (!serverQueue.looping) {
                    serverQueue.songs.push(serverQueue.songs[0]);
                };
    
                if (serverQueue.playing && serverQueue.player) {
                    serverQueue.player.stop();
                } else {
                    serverQueue.songs.shift();
                    videoPlayer(interaction.guildId, serverQueue.songs[0]);
                };
    
                const msgEmbed = new EmbedBuilder()
                        .setColor("#4ec200")
                        .setTitle("Jumping to song:")
                        .setDescription(foundSong.video_details.title);
    
                await cases.reply(interaction, { embeds: [msgEmbed] });
            } else {
                await cases.reply(interaction, { content: "I couldn't find the song you were looking for!", ephemeral: false });
            };
        } else {
            await cases.reply(interaction, { content: "There is no song queue so I can switch songs!", ephemeral: false });
        };
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while jumping to the song!", ephemeral: false });
    };
};

music.seek = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);

        if (serverQueue && serverQueue.playing) {
            await cases.reply(interaction, { content: "Sorry! I am still working on this command. :(", ephemeral: false });
        } else {
            await cases.reply(interaction, { content: "There is no song playing so I can seek!", ephemeral: false });
        };
    } catch (error) {
        console.log(error);
    };
};

music.shuffle = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);

        if (serverQueue && serverQueue.playing && serverQueue.songs.length > 0) {
            let currentIndex = serverQueue.songs.length, randomIndex;
            let playingSong = serverQueue.songs[0]
    
            while (currentIndex != 0) {
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex--;
    
              [serverQueue.songs[currentIndex], serverQueue.songs[randomIndex]] = [
                serverQueue.songs[randomIndex], serverQueue.songs[currentIndex]];
            };
    
            serverQueue.songs.forEach(song => {
                if (song.video_details.title.toLowerCase().match(playingSong.video_details.title.toLowerCase())) {
                    playingSong = song;
                };
            });
    
            const playingSongIndex = serverQueue.songs.indexOf(playingSong);
    
            [serverQueue.songs[playingSongIndex], serverQueue.songs[0]] = [
                serverQueue.songs[0], serverQueue.songs[playingSongIndex]];
    
            await cases.reply(interaction, { content: "Shuffled the song queue!", ephemeral: false });
    
            serverQueue.player.stop();
        } else {
            await cases.reply(interaction, { content: "There is no song queue so I can shuffle songs!", ephemeral: false });
        };
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while shuffling the queue!", ephemeral: false });
    };
};

music.loop = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);

        if (serverQueue) {
            if (!serverQueue.looping) {
                serverQueue.looping = "Queue";
                await cases.reply(interaction, { content: "Now looping the queue!", ephemeral: false });
            } else if (serverQueue.looping == "Queue") {
                serverQueue.looping = "Song";
                await cases.reply(interaction, { content: "Now looping the current song!", ephemeral: false });
            } else {
                serverQueue.looping = false;
                await cases.reply(interaction, { content: "Looping is now disabled!", ephemeral: false });
            };
        } else {
            await cases.reply(interaction, { content: "There is no song queue to loop!", ephemeral: false });
        }; 
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while looping the queue!", ephemeral: false });
    };
};

music.remove = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);
        const songString = interaction.options.getString("song").toString();
    
        if (serverQueue) {        
            let foundSong = null;
    
            serverQueue.songs.forEach(song => {
                if (song.video_details.title.toLowerCase().match(songString.toLowerCase())) {
                    foundSong = song;
                };
            });
            
            if (!foundSong) {
                await cases.reply(interaction, { content: "I couldn't find the song you were looking for!", ephemeral: false });
            } else {
                if (serverQueue.player && serverQueue.playing) {
                    if (serverQueue.songs.indexOf(foundSong) == 0) {
                        if (serverQueue.looping == "Queue" || serverQueue.looping == "Song") {
                            serverQueue.songs.shift();
                            serverQueue.player.stop();
                        } else {
                            serverQueue.player.stop();
                        };
                    } else {
                        serverQueue.songs.splice(serverQueue.songs.indexOf(foundSong), 1);
                    };
    
                    const msgEmbed = new EmbedBuilder()
                        .setColor("#4ec200")
                        .setTitle("Removed:")
                        .setDescription(foundSong.video_details.title);
    
                    await cases.reply(interaction, { embeds: [msgEmbed] });
                };
            };
        } else {
            await cases.reply(interaction, { content: "There is no song queue so I can remove songs!", ephemeral: false });
        };
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while removing the song!", ephemeral: false });
    };
};

music.stop = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);

        if (serverQueue && serverQueue.playing) {
           if (serverQueue.player) {
               serverQueue.songs = [];
               serverQueue.player.stop();
               await cases.reply(interaction, { content: "Stopped! :thumbsup:", ephemeral: false });
           };
        } else {
            await cases.reply(interaction, { content: "I am not playing any songs!", ephemeral: false });
        };
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while stopping the song!", ephemeral: false });
    };
};

music.queue = async function(interaction) {
    try {
        const serverQueue = queues.get(interaction.guildId);
    
        if (serverQueue) {    
            let currentPage = 1
            let pages = [[]]
    
            serverQueue.songs.forEach((song, index) => {
                if (pages[pages.length - 1].length >= 10) {
                    pages.push([]);
                };
    
                pages[pages.length - 1].push(song.video_details.title + "\n\n");
            });
    
            const collector = interaction.channel.createMessageComponentCollector({ time: 300000 });
    
            collector.on("collect", async i => {    
                if (i.customId == `previousPage${interaction.id}`) {
                    await i.deferUpdate();

                    currentPage = Math.max(currentPage - 1, 1);
                await interaction.editReply(cases.loadPage(interaction.id, "Queue:", pages, currentPage));
                } else if (i.customId == `nextPage${interaction.id}`) {
                    await i.deferUpdate();

                    currentPage = Math.min(currentPage + 1, pages.length);
                    await interaction.editReply(cases.loadPage(interaction.id, "Queue:", pages, currentPage));
                };
            });
    
            await cases.reply(interaction, cases.loadPage(interaction.id, "Queue:", pages, currentPage));
        } else {
            await cases.reply(interaction, { content: "There is no song queue!", ephemeral: false });
        };
    } catch (error) {
        await cases.reply(interaction, { content: "There was an error while loading the queue!", ephemeral: false });
    };
};

module.exports = music;
