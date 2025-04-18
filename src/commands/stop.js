const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the groove.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.stop(interaction);
	}
};