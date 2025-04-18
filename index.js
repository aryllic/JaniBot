require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Collection, Events, ActivityType } = require("discord.js");
const playdl = require("play-dl");
const path = require("node:path");
const fs = require("fs");
const client = new Client({
    intents: [
        [GatewayIntentBits.Guilds],
        [GatewayIntentBits.GuildMessages],
        [GatewayIntentBits.GuildMembers],
        [GatewayIntentBits.GuildPresences],
        [GatewayIntentBits.GuildVoiceStates],
        [GatewayIntentBits.GuildModeration],
        [GatewayIntentBits.DirectMessages],
        [GatewayIntentBits.MessageContent]
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});
const settings = require("./src/settings.js");
const cases = require("./src/cases.js");
const commandsPath = path.join(__dirname, "src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
const { hiddenCommands, findHiddenCmd, findSlashCmd } = require("./src/hidden-commands.js");
//const { sendListing, updateListings, getListings } = require("./src/willhaben.js");

function loadCommands() {
    client.commands = new Collection();

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
        };
    };
};

loadCommands();

client.once(Events.ClientReady, async () => {
    client.guilds.cache.forEach(guild => {
        settings.newGuild(guild.id);
    });

    await playdl.setToken({
        spotify: {
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
            market: "EU"
        }
    });

    client.user.setActivity({
        name: "/commands",
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/discord"
    });

    /*updateListings(client);
    setInterval(() => {
        updateListings(client);
    }, 3600000 * 6);*/

    console.log("The bot is ready!");
});

client.on(Events.GuildCreate, guild => {
    settings.newGuild(guild.id);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
    await cases.defer(interaction, command.ephemeral);
    await cases.checkAlerts(interaction.member.user.id);

    if (!command) {
        cases.reply(interaction, { content: "Sorry! I couldn't find the command you were looking for.", ephemeral: false });
        return;
    };
    
    if (cases.isBlacklisted(interaction.member.user.id)) {
        cases.reply(interaction, { content: "Sorry! You're blacklisted. :)", ephemeral: false });
        return;
    };

	try {
		await command.execute(interaction);
	} catch (error) {
		await cases.reply(interaction, { content: "There was an error while executing this command!", ephemeral: true });
        console.log(error);
	};
});

client.on(Events.MessageCreate, async msg => {
    if (msg.guildId) {
        if (!msg.author.bot && cases.isOwner(msg.member.user.id)) {
            const prefix = msg.content.slice(0, 1);
            const args = msg.content.split(" ");
            const commandAndPrefix = args.shift();
    
            if (prefix == "-") {
                msg.delete();
    
                const slashCommand = findSlashCmd(client.commands, commandAndPrefix.slice(1, commandAndPrefix.length));
    
                if (slashCommand) {
                    const option = args[0];
                    let simulatedInteraction = {
                        type: "APPLICATION_COMMAND",
                        name: slashCommand.data.name,
                        description: slashCommand.data.description,
                        commandId: "0",
                        guildId: msg.guildId,
                        client: client,
                        member: msg.member,
                        user: msg.member.user,
                        channel: msg.channel,
                        deferred: false,
                        replied: false,
                        options: {},
                        isChatInputCommand: function() {
                            return false;
                        },
                        reply: function(data) {
                            msg.member.send(data);
                        },
                        followUp: function(data) {
                            msg.member.send(data);
                        },
                        deferReply: function() {}
                    };
    
                    if (option) {
                        const filteredOption = option.replace(/user:|member:|channel:|role:|string:/g, "");
    
                        switch (option) {
                            case option.match("user:") && option.match("user:").input:
                                simulatedInteraction.options.getUser = function() {
                                    const user = msg.guild.members.cache.get(filteredOption).user;
                                    return user;
                                };
    
                                break;
                            case option.match("member:") && option.match("member:").input:
                                simulatedInteraction.options.getMember = function() {
                                    const member = msg.guild.members.cache.get(filteredOption);
                                    return member;
                                };
    
                                break;
                            case option.match("channel:") && option.match("channel:").input:
                                simulatedInteraction.options.getChannel = function() {
                                    const channel = msg.guild.channels.cache.get(filteredOption);
                                    return channel;
                                };
    
                                break;
                            case option.match("role:") && option.match("role:").input:
                                simulatedInteraction.options.getRole = function() {
                                    const role = msg.guild.roles.cache.get(filteredOption);
                                    return role;
                                };
    
                                break;
                            case option.match("string:") && option.match("string:").input:
                                simulatedInteraction.options.getString = function() {
                                    const string = filteredOption;
                                    return string;
                                };
    
                                break;
                            default:
                                break;
                        };
                    };
    
                    try {
                        await slashCommand.execute(simulatedInteraction);
                    } catch (error) {
                        console.log(error);
                    };
                };
            } else if (prefix == "+") {
                msg.delete();
    
                const command = findHiddenCmd(commandAndPrefix.slice(1, commandAndPrefix.length));
    
                if (command) {
                    command.func(client, msg, args);
                };
            };
        };
    } else {
        if (!msg.author.bot && cases.isOwner(msg.author.id)) {
            const prefix = msg.content.slice(0, 1);

            if (prefix == "+") {
                const args = msg.content.split(" ");
                const guildId = args.splice(1, 1)[0];
                const commandAndPrefix = args.shift();
                const command = findHiddenCmd(commandAndPrefix.slice(1, commandAndPrefix.length));
                const guild = client.guilds.cache.find(guild => guild.id == guildId);

                if (command && guild) {
                    msg.guildId = guildId;
                    msg.guild = guild;
                    command.func(client, msg, args);
                };
            };
        };
    };
});

/*client.on(Events.PresenceUpdate, (oldPresence, presence) => {
    const member = presence.guild.members.cache.get(presence.userId);
    let playing = false;

    if (presence.activities) {
        presence.activities.forEach(async activity => {
            if (activity.name.match("League of Legends") && !playing) {
                playing = true;

                try {
                    await member.user.send("Stop playing League of Legends!");
                } catch (error) {
                    console.log(error);
                };
            };
        })
    };
});*/

client.on(Events.VoiceStateUpdate, async (oldVoiceState, newVoiceState) => {
    const serverSettings = await settings.getGuild(newVoiceState.guild.id);
    const indiaUsersArray = serverSettings.indiaUsers;
    const indiaChannel = serverSettings.indiaChannel;

    if (newVoiceState.channel) {
        indiaUsersArray.forEach(id => {
            if (id == newVoiceState.member.user.id) {
                if (newVoiceState.channelId != indiaChannel) {
                    newVoiceState.member.voice.setChannel(indiaChannel);
                };
            };
        });
    };
});

cases.loadMemes();
setInterval(cases.loadMemes, 600000);
client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = { client };