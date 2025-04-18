const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cases = require("../cases.js");

function getStatus(presence) {
	if (presence) {
		return presence.status.charAt(0).toUpperCase() + presence.status.slice(1);
	} else {
		return "Offline";
	};
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("memberinfo")
		.setDescription("Fetches info about the specified member.")
		.addUserOption(option =>
			option
				.setName("member")
				.setDescription("The member to get the info of")
				.setRequired(true))
		.setDMPermission(false),
	ephemeral: false,
	async execute(interaction) {
		const member = interaction.options.getMember("member");

		const msgEmbed = new EmbedBuilder()
			.setColor("#4ec200")
        	.setTitle(`**${member.user.username}**`)
			.setThumbnail(member.user.avatarURL())
			.addFields(
				{ name: "Username", value: member.user.username, inline: true },
				{ name: "Nickname", value: member.displayName, inline: true },
				{ name: "Tag", value: member.user.tag, inline: true },
				{ name: "Id", value: member.user.id },
				{ name: "Status", value: getStatus(member.presence), inline: true },
				{ name: "Joined Discord", value: member.user.createdAt.toDateString(), inline: true },
				{ name: "Joined Server", value: member.joinedAt.toDateString() }
				//{ name: "About Me", value: "TEXT" }
			);

		await cases.reply(interaction, { embeds: [msgEmbed], ephemeral: false });
	}
};