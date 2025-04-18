const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const settings = require("../settings.js");
const cases = require("../cases.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setindia")
		.setDescription("Sets an india channel.")
		.addChannelOption(option =>
			option
				.setName("channel")
				.setDescription("The india channel to be set")
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	ephemeral: true,
	async execute(interaction) {
		const channel = interaction.options.getChannel("channel");

        if (channel.type == ChannelType.GuildVoice) {
            settings.setGuildValue(interaction.guildId, "indiaChannel", channel.id);
			await cases.reply(interaction, { content: `Set the india channel as '${channel.name}'!`, ephemeral: true });
        } else {
			await cases.reply(interaction, { content: "India needs to be a voice channel!", ephemeral: true });
		};
	}
};