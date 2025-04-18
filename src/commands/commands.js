const { SlashCommandBuilder } = require("discord.js");
const cases = require("../cases.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("commands")
		.setDescription("Returns all the commands this bot has available.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		let currentPage = 1
		let pages = [[]]

		interaction.client.commands.forEach(command => {
			if (pages[pages.length - 1].length >= 10) {
				pages.push([]);
			};

			pages[pages.length - 1].push("**" + command.data.name + "**: " + command.data.description + "\n\n");
		});

		const collector = interaction.channel.createMessageComponentCollector({ time: 300000 });

		collector.on("collect", async i => {
			if (i.customId == `previousPage${interaction.id}`) {
				await i.deferUpdate();

				currentPage = Math.max(currentPage - 1, 1);
				await interaction.editReply(cases.loadPage(interaction.id, "Commands:", pages, currentPage));
			} else if (i.customId == `nextPage${interaction.id}`) {
				await i.deferUpdate();
				
				currentPage = Math.min(currentPage + 1, pages.length);
				await interaction.editReply(cases.loadPage(interaction.id, "Commands:", pages, currentPage));
			};
		});

		await cases.reply(interaction, cases.loadPage(interaction.id, "Commands:", pages, currentPage));
	}
};