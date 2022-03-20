const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId } = require("./config.json");

let commands = [
  new SlashCommandBuilder()
    .setName("read")
    .setDescription("Reads a pdf file from a link!")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("The link of the PDF")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("ephemeral")
        .setDescription("Should the output be ephemeral")
    ),
];

const rest = new REST({ version: "9" }).setToken(process.env.token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "read") {

  }
});

client.login(process.env.token).then(() => {});
