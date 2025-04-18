const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("loop")
		.setDescription("Loops the queue.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.loop(interaction);
	}
};