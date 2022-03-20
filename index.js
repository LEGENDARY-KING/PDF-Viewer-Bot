const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS],
});
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json");
const pdfToPng = require("pdf-to-png-converter").pdfToPng;
const fetch = require("node-fetch");

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
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number of the PDF (Defaults to 1)")
        .setMinValue(0)
    )
    .addStringOption((option) =>
      option.setName("password").setDescription("Password of PDF if required")
    ),
];

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "read") {
    let page = interaction.options.getInteger("page") || 1,
      password = interaction.options.getString("password");
    await interaction.deferReply({ ephemeral: true });
    try {
      let fileSizeRes = await fetch(
        interaction.options.getString("link").trim(),
        {
          method: "HEAD",
        }
      );
      let size = fileSizeRes.headers.get("content-length"),
        type = fileSizeRes.headers.get("content-type");
      if (size > 100 * 1e6)
        return interaction.editReply({
          content: "File size too big. Limit 100 MBs",
          ephemeral: true,
        });
      if (type !== "application/pdf")
        return interaction.editReply({
          content: "Link received not of a PDF file",
          ephemeral: true,
        });
      interaction.editReply({
        content: "Downloading... This might take a bit depending on the size",
        ephemeral: true,
      });
      let res = await fetch(interaction.options.getString("link").trim());
      let response = await res.blob();
      interaction.editReply({
        content: "Downloaded! Processing the PDF",
        ephemeral: true,
      });
      let arrayBuffer = await response.arrayBuffer();
      let pdfBuffer = Buffer.from(arrayBuffer);
      let pageFile = await getPage(pdfBuffer, page, password);
      let totalPages = pageFile.totalPages;
      let components = new Discord.MessageActionRow().setComponents([
        new Discord.MessageButton()
          .setStyle("SUCCESS")
          .setEmoji("◀")
          .setCustomId("previous"),
        new Discord.MessageButton()
          .setStyle("SECONDARY")
          .setDisabled(true)
          .setLabel("Page " + page + "/" + pageFile.totalPages)
          .setCustomId("."),
        new Discord.MessageButton()
          .setStyle("SUCCESS")
          .setEmoji("▶")
          .setCustomId("next"),
        new Discord.MessageButton()
          .setStyle("DANGER")
          .setLabel("End")
          .setCustomId("end"),
      ]);
      let attachment = new Discord.MessageAttachment(
        pageFile.content,
        "Page.png"
      );
      let embed = new Discord.MessageEmbed()
        .setColor("#99ff00")
        .setImage("attachment://Page.png")
        .setFooter({ text: "Used by " + interaction.user.tag });
      try {
        let message = await interaction.channel.send({
          files: [attachment],
          embeds: [embed],
          components: [components],
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({
          filter,
        });
        collector.on("collect", async (i) => {
          if (i.customId === "previous") page--;
          if (i.customId === "next") page++;
          if (i.customId === "end") {
            collector.stop();
            i.deferUpdate();
            return;
          }
          if (page < 1 || page > totalPages) {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            return i.reply("Uh-oh. You have reached the end of the pdf");
          }
          await i.deferUpdate();
          let pageFile = await getPage(pdfBuffer, page, password);
          let attachment = new Discord.MessageAttachment(
            pageFile.content,
            "Page.png"
          );
          components.components[1].setLabel(
            "Page " + page + "/" + pageFile.totalPages
          );
          await message.edit({
            files: [attachment],
            embeds: [embed],
            components: [components],
          });
        });
        collector.on("end", (collected) => {
          let components2 = new Discord.MessageActionRow().setComponents([
            new Discord.MessageButton()
              .setDisabled(true)
              .setStyle("SUCCESS")
              .setEmoji("◀")
              .setCustomId("previous"),
            ,
            new Discord.MessageButton()
              .setStyle("SECONDARY")
              .setDisabled(true)
              .setLabel("Page " + page + "/" + pageFile.totalPages)
              .setCustomId("."),
            ,
            new Discord.MessageButton()
              .setDisabled(true)
              .setStyle("SUCCESS")
              .setEmoji("▶")
              .setCustomId("next"),
            ,
          ]);
          embed.setTitle("Will not reply anymore");
          message.edit({ embeds: [embed], components: [components2] });
        });
      } catch (e) {
        interaction.editReply({
          content:
            "I could not send the file. Please check if i have perms here",
          ephemeral: true,
        });
      }
    } catch (e) {
      console.log(e);
      interaction.channel.send({
        content: "Uh-oh, Unknown error " + e?.message,
      });
    }
  }
});

async function getPage(pdfBuffer, page, password) {
  let pages = await pdfToPng(pdfBuffer, {
    disableFontFace: false,
    useSystemFonts: true,
    viewportScale: 2.0,
    pages: [page],
    pdfFilePassword: password,
  });
  return pages[0];
}

client.login(token).then(() => {});
