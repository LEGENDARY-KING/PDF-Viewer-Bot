const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json");
const commands = [];
const commandFiles = fs
  .readdirSync("./slashCommands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  let command = require(`./slashCommands/${file}`);
  // Set a new item in the CollectionŚ
  // With the key as the command name and the value as the exported module
  console.log(
    `Registered Slash Command ${command.data.name}: ${command.data.description}`
  );
  let data = command.data.toJSON();
  // Discord.js Max/Min Value is bugged and does not convert to manual case therefore manually converting it
  if (data.options[0]?.options) {
    data.options[0].options[0].max_value =
      data.options[0].options[0].maxValue ||
      data.options[0].options[0].max_value;
    data.options[0].options[0].min_value =
      data.options[0].options[0].minValue ||
      data.options[0].options[0].min_value;
  }
  commands.push(data);
}

const messageCommandsFiles = fs
  .readdirSync("./messageCommands")
  .filter((file) => file.endsWith(".js"));

for (const file of messageCommandsFiles) {
  let command = require(`./messageCommands/${file}`);
  commands.push({ name: command.name, type: command.type });
}
commands.push({ name: "read blank", type: 3 });
const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
