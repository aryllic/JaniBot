const { SlashCommandBuilder } = require("discord.js");
const music = require("../music");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Plays the song you're looking for.")
		.addStringOption(option =>
			option
				.setName("song")
				.setDescription("Takes songs from youtube of spotify")
				.setRequired(true))
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		music.play(interaction);
	}
};