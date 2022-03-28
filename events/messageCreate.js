const config = require("../config.json");

module.exports = {
  name: "messageCreate",
  description: "Manages all the text commands initiation",
  once: false,
  async execute(message) {
    if (message.author.bot || message.author === message.client.user) return;

    if (!message.content.startsWith(config.prefix)) return;
    let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = message.client.textCommands.get(args.shift().toLowerCase());

    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(error);
      await message.reply({
        content: "There was an error while executing this command!",
      });
    }
  },
};
