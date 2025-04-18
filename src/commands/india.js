const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const settings = require("../settings.js");
const cases = require("../cases.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("india")
		.setDescription("Sends the specified user to india.")
		.addUserOption(option =>
			option
				.setName("member")
				.setDescription("The member to send to india"))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	ephemeral: true,
	async execute(interaction) {
		const member = interaction.options.getMember("member");

		if (member) {
			if (!cases.isImmune(member.user.id)) {
				const serverSettings = await settings.getGuild(interaction.guildId);
				const indiaChannel = serverSettings.indiaChannel;
		
				if (indiaChannel) {
					const indiaUsersArray = serverSettings.indiaUsers;
		
					if (indiaUsersArray.length > 0) {
						if (!indiaUsersArray.find(id => id == member.user.id)) {
							indiaUsersArray.push(member.user.id);
						};
					} else {
						indiaUsersArray.push(member.user.id);
					};

					settings.setGuildValue(interaction.guildId, "indiaUsers", indiaUsersArray);
		
					if (member && member.voice.channel) {
						member.voice.setChannel(indiaChannel);
					};
	
					await cases.reply(interaction, { content: `Sent ${member.user.username} to india!`, ephemeral: true });
				} else {
					await cases.reply(interaction, { content: "You need to set an india channel to use this command!", ephemeral: true });
				};
			} else {
				await cases.reply(interaction, { content: "The member you tried to send to india is immune!", ephemeral: true });
			};
		} else {
			settings.setGuildValue(interaction.guildId, "indiaUsers", []);
			await cases.reply(interaction, { content: "Cleared india!", ephemeral: true });
		};
	}
};