require('dotenv/config');
const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summ')
        .setDescription('Summarize the current chat'),
    async execute(interaction) {
        let prompt = 'Summarize the following conversation: \n';
        await interaction.channel.messages.fetch({ limit: 100, cache: true })
            .then(messages => {
                for (const msg of messages.values()) {
                    if (!msg.author.bot) {
                        prompt += `${msg.author} said ${msg.content}`;
                    }
                }
            })
            .catch(console.error);
        setImmediate(async () => {
            const result = await model.generateContent(prompt);
            const response = result.response;
            if (!('blockReason' in response.promptFeedback)) {
                await interaction.channel.send(response.text());
            }
            else {
                let reply = `Blocked due to ${response.promptFeedback.blockReason}:\n`;
                for (const cat of response.promptFeedback.safetyRatings) {
                    reply += `${cat.category} is ${cat.probability}\n`;
                }
                await interaction.channel.send(reply);
            }
        });

        await interaction.reply('Got Prompt!');
    },
};