const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription("Removes the song you're looking for.")
		.addStringOption(option =>
			option
				.setName("song")
				.setDescription("The name of the song")
				.setRequired(true))
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.remove(interaction);
	}
};