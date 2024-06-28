const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

const { sleep } = require("../../utils/scripts/util_scripts.js");
const questions = require("../../utils/json/trivia-questions.json");

module.exports = {
  //MARK: command data
  data: new SlashCommandBuilder()
    .setName("trivia")
    .setDescription("Gives a random trivia question!"),
  async execute(interaction, { embedColors }) {
    const question = questions[Math.floor(Math.random() * questions.length)];
    let questionText = `**${question.question}**\n`;

    let peopleGuessed = 0;
    let remainingTime = 15;
    const questionEmbed = new EmbedBuilder()
      .setTitle(questionText)
      .setFooter({
        text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`,
      })
      .setColor(embedColors.blue);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("0")
          .setStyle(ButtonStyle.Primary)
          .setLabel(question.options[0])
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("1")
          .setStyle(ButtonStyle.Primary)
          .setLabel(question.options[1])
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("2")
          .setStyle(ButtonStyle.Primary)
          .setLabel(question.options[2])
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("3")
          .setStyle(ButtonStyle.Primary)
          .setLabel(question.options[3])
      );

    const response = await interaction.reply({
      embeds: [questionEmbed],
      components: [row],
    });

    const buttonCollector = response.createMessageComponentCollector({
      ComponentType: ComponentType.Button,
      time: 15000,
    });

    let correctUsers = [];
    let wrongUsers = [interaction.member.id];
    const rightOptionIndex = question.answer;

    buttonCollector.on("collect", async (i) => {
      //MARK: handle guess
      const userId = i.member.id;

      if (i.customId == rightOptionIndex && !correctUsers.includes(userId)) {
        if (wrongUsers.includes(userId)) {
          wrongUsers.splice(wrongUsers.indexOf(userId), 1);
        }
        correctUsers.push(userId);
      }

      if (i.customId != rightOptionIndex && !wrongUsers.includes(userId)) {
        if (correctUsers.includes(userId)) {
          correctUsers.splice(correctUsers / indexOf(userId), 1);
        }
        wrongUsers.push(userId);
      }
      peopleGuessed = correctUsers.length + wrongUsers.length;

      questionEmbed.setFooter({
        text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`,
      });
      await response.edit({
        embeds: [questionEmbed],
        components: [row],
      });
      i.deferUpdate();
    });

    buttonCollector.on("end", async () => {
      //MARK: game ended
      row.components.forEach(async (button) => {
        await button.setStyle(ButtonStyle.Danger).setDisabled(true);
        await row.components[rightOptionIndex % 4].setStyle(
          ButtonStyle.Success
        );

        await response.edit({
          embeds: [questionEmbed],
          components: [row],
        });
        
      });



      const usersFormatter = new Intl.ListFormat("en", {
        type: "conjunction",
      });
      const correctUserString = usersFormatter.format(
        correctUsers.map((userId) => `<@${userId}>`)
      );
      const wrongUserString = usersFormatter.format(
        wrongUsers.map((userId) => `<@${userId}>`)
      );

      let responseText = "";
      responseText += !correctUsers.length
        ? `Nobody got it right! \n`
        : `${correctUserString} got it right! gg\n`;
      responseText += !wrongUsers.length
        ? `That means nobody got it wrong... pretty good ig`
        : `That means ${wrongUserString} got it wrong, massive L`;

      await interaction.followUp(responseText);
    });
   

    while (remainingTime) {
      await sleep(700);

      remainingTime -= 1;
      questionEmbed.setFooter({
        text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`,
      });

      await response.edit({
        embeds: [questionEmbed],
        components: [row],
      });
    }
  },
};
