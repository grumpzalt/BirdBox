const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping the bot. Useful for checking latency or downtime.'),
	async execute(interaction, {client, embedColors}) {

		const pingEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

		await interaction.reply({ embeds: [pingEmbed] });
		
	},
	async executeClassic({message}, {client, embedColors}) {

		const pingEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

		await message.reply({ embeds: [pingEmbed] });
		
	}
};
