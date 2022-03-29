const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getlinks")
    .setDescription(
      "Shows all the PDF links of a message and the exact command to copy paste"
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setRequired(true)
        .setDescription("URL of the message")
    ),
  async execute(interaction) {
    let url = interaction.options.getString("url");
    let split = url.split("/");
    let guildId = split[4];
    let channelId = split[5];
    let messageId = split[6];
    if (!guildId || !channelId || !messageId)
      return interaction.reply({
        content: "URL received not of a message",
        ephemeral: true,
      });
    let guild = interaction.client.guilds.cache.get(guildId);
    if (!guild)
      return interaction.reply({
        content: "Guild " + guildId + " not found",
        ephemeral: true,
      });
    let channel = guild.channels.cache.get(channelId);
    if (!channel)
      return interaction.reply({
        content: "Channel " + channelId + " not found",
        ephemeral: true,
      });
    let message = await channel.messages.fetch(messageId);
    if (!message)
      return interaction.reply({
        content: "Message " + messageId + " not found",
        ephemeral: true,
      });
    let attachments = message.attachments.filter(
      (a) => a.contentType === "application/pdf"
    );
    let i = 1;
    let allLinks = attachments.map((a) => {
      return a.url;
    });
    let allLinksButtons = attachments.map((a) => {
      let button = new Discord.MessageButton()
        .setLabel("Link " + i)
        .setCustomId(i - 1 + "")
        .setStyle("PRIMARY");
      i++;
      return button;
    });
    const chunkSize = 5;
    let components = [];
    for (let i = 0; i < allLinksButtons.length; i += chunkSize) {
      components.push(
        new Discord.MessageActionRow().setComponents(
          allLinksButtons.slice(i, i + chunkSize)
        )
      );
    }
    let m = await interaction.reply({
      content:
        "**Press on the button to open the PDF in your DM**\n" +
        attachments
          .map((a) => {
            return `/read link: ${a.url}`;
          })
          .join("\n"),
      components: components,
      fetchReply: true,
    });
    let collector = m.createMessageComponentCollector({ time: 60000 });
    collector.on("collect", async (i) => {
      try {
        let channel = await interaction.user.createDM();
        i.channel.send = async (options) => {
          return channel.send(options);
        };
        i.options = {};
        i.options.getString = (id) => {
          if (id === "link") return allLinks[parseInt(i.customId)];
        };
        i.options.getBoolean = () => {
          return false;
        };
        i.options.getInteger = () => {
          return 1;
        };
        i.toString = () => {
          return "/read " + allLinks[parseInt(i.customId)];
        };
        interaction.client.slashCommands.get("read").execute(i);
      } catch (e) {
        console.log(e);
        if (i.replied)
          await i.editReply({
            content: "Uh-oh unknown error " + e.message,
            ephemeral: true,
          });
        else
          await i.reply({
            content: "Uh-oh unknown error " + e.message,
            ephemeral: true,
          });
      }
    });
  },
};
