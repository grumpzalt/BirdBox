const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const topics = require("../../utils/json/topics.json")

module.exports = {
    data: new SlashCommandBuilder() 
    .setName("topic")
    .setDescription(("Gives a random topic to keep the conversation flowing!")),
    async execute(interaction, { embedColors }) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const topicEmbed = new EmbedBuilder() 
            .setTitle(topic.topic)
            .setDescription(topic.description)
            .setColor(embedColors.blue)
            .setFooter({ text: "chat is this real?"})

        await interaction.reply({ embeds: [topicEmbed] });
    }
}
