const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Displays all of the songs in the queue.")
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.queue(interaction);
	}
};