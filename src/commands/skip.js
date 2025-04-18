const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("skip")
		.setDescription("Skips the current song.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.skip(interaction);
	}
};