const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");

module.exports = {
  name: "getlinks",
  type: 3,
  async execute(interaction) {
    let message = await interaction.channel.messages.fetch(
      interaction.targetId
    );

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
      content: attachments
        .map((a) => {
          return `/read link: ${a.url}`;
        })
        .join("\n"),
      components: components,
      ephemeral: true,
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
