const { SlashCommandBuilder } = require("discord.js");
const cases = require("../cases.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("repeat")
		.setDescription("Repeats everything you say.")
		.addStringOption(option =>
			option
				.setName("sentence")
				.setDescription("The sentence to repeat")
				.setRequired(true))
		.setDMPermission(false),
	ephemeral: true,
	async execute(interaction) {
		const replyString = interaction.options.getString("sentence");

		await cases.reply(interaction, { content: replyString, ephemeral: true });
	}
};