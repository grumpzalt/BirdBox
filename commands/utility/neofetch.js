const { SlashCommandBuilder } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('neofetch')
		.setDescription('Runs neofetch on the server that the bot is hosted on.'),
    async execute(interaction) {
        exec("neofetch --stdout", (error, stdout, stderr) => {

            if (error) {
                //console.log(`error: ${error.message}`);
                interaction.reply({ content: 'couldn\'t run neofetch', ephemeral: true });
                return;
            }

            if (stderr) {
                interaction.reply({ content: `there was an error: ${stderr}`, ephemeral: true });
                console.log(`stderr: ${stderr}`);
                return;
            }

            interaction.reply(`\`\`\`\n${stdout}\n\`\`\``);
        })
    },
    async executeClassic({message}) {
        exec("neofetch --stdout", (error, stdout, stderr) => {

            if (error) {
                //console.log(`error: ${error.message}`);
                message.reply({ content: 'couldn\'t run neofetch', ephemeral: true });
                return;
            }

            if (stderr) {
                message.reply({ content: `there was an error: ${stderr}`, ephemeral: true });
                console.log(`stderr: ${stderr}`);
                return;
            }

            message.reply(`\`\`\`\n${stdout}\n\`\`\``);
        })
    }
}