const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const https = require("https");
const fs = require("fs");
const assert = require("assert");

const cases = [];

cases.immune = [
    "660830692157947905"
];

cases.blacklist = [
    
];

cases.isOwner = function(id) {
    return id == "660830692157947905";
};

cases.isImmune = function(id) {
    return cases.immune.find(immuneId => immuneId == id);
};

cases.isBlacklisted = function(id) {
    return cases.blacklist.find(blacklistId => blacklistId == id);
};

cases.reply = async function(interaction, replyContent) {
    try {
        assert(interaction);
        assert(replyContent);

        if (interaction.replied || interaction.deferred) {
            return interaction.followUp(replyContent);
        } else {
            return interaction.reply(replyContent);
        };
    } catch (error) {
        console.log(error);
    };
};

cases.defer = async function(interaction, ephemeral) {
    try {
        assert(interaction);

        if (!interaction.replied && !interaction.deferred) {
            return interaction.deferReply({ ephemeral: ephemeral });
        };
    } catch (error) {
        console.log(error);
    };
};

cases.checkAlerts = async function(id) {
    return true
};

cases.newButton = function(customId, label, style, disabled) {
	let button = new ButtonBuilder()
		.setCustomId(customId)
		.setLabel(label || "Button")
		.setStyle(style || ButtonStyle.Primary)
		.setDisabled(disabled || false);

	return button;
};

cases.loadPage = function(interactionId, title, pages, pageIndex) {
    const page = pages[pageIndex - 1];

	const row = new ActionRowBuilder()
		.setComponents(
			cases.newButton(
                `previousPage${interactionId}`,
                "Previous Page",
                ButtonStyle.Primary,
                pageIndex == 1
            ),
            cases.newButton(
                `nextPage${interactionId}`,
                "Next Page",
                ButtonStyle.Primary,
                pageIndex == pages.length
            )
		);

	const msgEmbed = new EmbedBuilder()
			.setColor("#4ec200")
        	.setTitle(title)
        	.setDescription(page.join(""))
			.setFooter({ text: `Page ${pageIndex} of ${pages.length}` });

	return { embeds: [msgEmbed], components: [row] };
};

cases.loadMemes = async function() {
    return new Promise((resolve) => {
        const req = https.request("https://www.reddit.com/r/memes/hot.json?limit=100", {
            method: "GET",
            headers: {
                "User-Agent": toString(Math.random()),
                "Content-Type": "application/json"
            }
        }, res => {
            let data = "";

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                fs.writeFileSync("./src/memes.json", data);
                resolve(data);
            });
        });

        req.end();
    });
};

module.exports = cases;