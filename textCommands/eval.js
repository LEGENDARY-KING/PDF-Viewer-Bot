const dbobj = require("../helpers/database.js");
const config = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "eval",
  description: "Evaluates nodejs code",
  async execute(message, args) {
    if (message.author.id !== config.ownerId) return;
    try {
      const evaled = await eval(args.join(" "));
      const cleaned = await clean(evaled);
      message.channel.send(`\`\`\`js\n${cleaned}\n\`\`\``);
    } catch (err) {
      message.channel.send(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
    }
  },
};

async function clean(text) {
  if (text && text.constructor.name === "Promise") text = await text;
  if (typeof text !== "string")
    text = require("util").inspect(text, { depth: 1 });
  text = text
    .replace(/`/g, "`" + String.fromCharCode(8203))
    .replace(/@/g, "@" + String.fromCharCode(8203));
  text = text.replaceAll(config.token, "[REDACTED]");
  return text;
}
