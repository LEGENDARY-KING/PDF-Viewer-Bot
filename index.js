const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});
const discordModals = require("discord-modals");
discordModals(client);

const { token } = require("./config.json");
const fs = require("fs");

const { exec } = require("child_process");
// Registers the slash commands to the discord guild

exec("node ./deploy-commands.js", (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

//Slash Commands
client.slashCommands = new Discord.Collection();

const slashCommandFiles = fs
  .readdirSync("./slashCommands")
  .filter((file) => file.endsWith(".js"));
for (const file of slashCommandFiles) {
  let command = require(`./slashCommands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.slashCommands.set(command.data.name, command);
}
//Text Commands

client.textCommands = new Discord.Collection();

const textCommandFiles = fs
  .readdirSync("./textCommands")
  .filter((file) => file.endsWith(".js"));

for (const file of textCommandFiles) {
  let command = require(`./textCommands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  console.log(
    `Registered Text Command ${command.name}: ${command.description}`
  );
  client.textCommands.set(command.name, command);
}
//Message Commands

client.messageCommands = new Discord.Collection();

const messageCommandsFiles = fs
  .readdirSync("./messageCommands")
  .filter((file) => file.endsWith(".js"));

for (const file of messageCommandsFiles) {
  let command = require(`./messageCommands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  console.log(`Registered Text Command ${command.name}`);
  client.messageCommands.set(command.name, command);
}

// Event Handling
const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  let event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    console.log(`Registered Event ${event.name}: ${event.description}`);
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(token).then(() => {});
