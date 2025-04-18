const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const cases = require("../cases.js");

function getMeme() {
	try {
		const memes = JSON.parse(fs.readFileSync("./src/memes.json"));
        const children = memes.data.children;
    	const randomPostIndex = Math.floor(Math.random() * children.length);
        const meme = children[randomPostIndex].data;

		return meme;
	} catch (error) {
		console.log(error);
	};
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("meme")
		.setDescription("Replies with a random meme from r/memes.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		const meme = getMeme();

		const row = new ActionRowBuilder()
			.setComponents(
				cases.newButton(
					`nextMeme${interaction.id}`,
					"Next Meme",
					ButtonStyle.Primary,
					false
				)
			);

		const msgEmbed = new EmbedBuilder()
			.setColor("#4ec200")
			.setTitle(meme.title)
			.setURL(`https://www.reddit.com${meme.permalink}`)
			.setImage(meme.url)
			.setFooter({ text: `${meme.subreddit_name_prefixed} | Posted by: u/${meme.author}` });

		const collector = interaction.channel.createMessageComponentCollector({ time: 300000 });

		collector.on("collect", async i => {
			if (i.customId == `nextMeme${interaction.id}`) {
				await i.deferUpdate();

				const nextMeme = await getMeme();

				const updateEmbed = new EmbedBuilder()
					.setColor("#4ec200")
					.setTitle(nextMeme.title)
					.setURL(`https://www.reddit.com${nextMeme.permalink}`)
					.setImage(nextMeme.url)
					.setFooter({ text: `${nextMeme.subreddit_name_prefixed} | Posted by: u/${nextMeme.author}` });

				await interaction.editReply({ embeds: [updateEmbed], components: [row] });
			};
		});

		await cases.reply(interaction, { embeds: [msgEmbed], components: [row] });
	}
};