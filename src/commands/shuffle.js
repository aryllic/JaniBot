const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("shuffle")
		.setDescription("Shuffles the queue.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.shuffle(interaction);
	}
};