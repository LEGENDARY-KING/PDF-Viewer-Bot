const fetch = require("node-fetch");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { dbobj } = require("../helpers/database.js");
const config = require("../config.json");
const { getPage } = require("../helpers/utils.js");
const fileType = require("file-type");
const { generateRandomSplitString } = require("../helpers/utils");
const Discord = require("discord.js");
const sharp = require("sharp");
const bsplit = require("buffer-split");
const { Modal, TextInputComponent, showModal } = require("discord-modals"); // Now we extract the showModal method

module.exports = {
  name: "read",
  type: 3,
  async execute(interaction, blank, url) {
    let message = await interaction.channel.messages.fetch(
      interaction.targetId
    );
    let page = 1,
      password = "",
      dff = true,
      pdfBuffer,
      pageFile,
      totalPages,
      totalPagesBuffer,
      pagesBufferArray = [],
      link = url || message.attachments?.first()?.url?.trim(),
      usf = false;
    if (blank === true) {
      dff = false;
      usf = true;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      let fileSizeRes = await fetch(link, {
        method: "HEAD",
      });
      let size = fileSizeRes.headers.get("content-length"),
        type = fileSizeRes.headers.get("content-type"),
        etag = fileSizeRes.headers.get("etag");
      let data = dbobj.getCachedDB(etag);
      if (data.notSaved === true) {
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
        await interaction.editReply({
          content: "Downloading... This might take a bit depending on the size",
          ephemeral: true,
        });
        let res = await fetch(link);
        let response = await res.blob();
        await interaction.editReply({
          content: "Downloaded! Processing the PDF",
          ephemeral: true,
        });
        let arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
        data.splitString = generateRandomSplitString(pdfBuffer);
        pageFile = await getPage(pdfBuffer, page, password, dff, usf);
        pagesBufferArray.push({ buffer: pageFile.content, page: page });
        totalPages = pageFile.totalPages;
        let previousPage = page - 1;
        if (previousPage < 1) previousPage = page + 2;
        if (previousPage > totalPages) nextPage = totalPages;
        let nextPage = page + 1;
        if (nextPage > totalPages) nextPage = page - 2;
        if (nextPage < 1) nextPage = 1;
        let nextPageBuffer = await getPage(
          pdfBuffer,
          nextPage,
          password,
          dff,
          usf
        );
        pagesBufferArray.push({
          page: nextPage,
          buffer: nextPageBuffer.content,
        });
        let previousPageBuffer = await getPage(
          pdfBuffer,
          nextPage,
          password,
          dff,
          usf
        );

        pagesBufferArray.push({
          page: previousPage,
          buffer: previousPageBuffer.content,
        });
        let arr = [
          Buffer.from(`${previousPage}${data.splitString}`, "utf-8"),
          pagesBufferArray.find((p) => p.page === previousPage).buffer,
          Buffer.from(`${data.splitString}${page}${data.splitString}`, "utf-8"),
          pageFile.content,
          Buffer.from(
            `${data.splitString}${nextPage}${data.splitString}`,
            "utf-8"
          ),
          pagesBufferArray.find((p) => p.page === nextPage).buffer,
        ];
        totalPagesBuffer = Buffer.concat(arr);
        data.pages = totalPagesBuffer;
        delete data.notSaved;
        data.totalPages = totalPages;
        data.file = pdfBuffer;
        dbobj.setCached.run(data);
      } else {
        totalPages = data.totalPages;
        pdfBuffer = data.file;
        let tempData = bsplit(data.pages, Buffer.from(data.splitString));
        const chunkSize = 2;
        for (let i = 0; i < tempData.length; i += chunkSize) {
          const chunk = tempData.slice(i, i + chunkSize);
          pagesBufferArray.push({
            page: parseInt(Buffer.from(chunk[0])),
            buffer: chunk[1],
          });
        }
        let pf = pagesBufferArray.find((p) => p.page === page);
        pageFile = { content: pf?.buffer };
        if (!pf) pageFile = await getPage(pdfBuffer, page, password, dff, usf);
      }
      type = await fileType.fromBuffer(pdfBuffer);
      totalPagesBuffer = data.pages;
      if (type?.mime !== "application/pdf")
        return interaction.editReply({
          content: "File cached/downloaded was not a PDF file",
          ephemeral: true,
        });
      let components = [
        new Discord.MessageActionRow().setComponents([
          new Discord.MessageButton()
            .setStyle("SUCCESS")
            .setEmoji("◀")
            .setLabel("Previous")
            .setCustomId("previous"),
          new Discord.MessageButton()
            .setStyle("SECONDARY")
            .setLabel("Page " + page + "/" + totalPages)
            .setCustomId("."),
          new Discord.MessageButton()
            .setStyle("SUCCESS")
            .setEmoji("▶")
            .setLabel("Next")
            .setCustomId("next"),
          new Discord.MessageButton()
            .setStyle("DANGER")
            .setLabel("End")
            .setCustomId("end"),
        ]),
        new Discord.MessageActionRow().setComponents([
          new Discord.MessageButton()
            .setStyle("PRIMARY")
            .setEmoji("🔄")
            .setLabel("Left 90°")
            .setCustomId("left"),
          new Discord.MessageButton()
            .setStyle("PRIMARY")
            .setLabel("Reset")
            .setCustomId("reset"),
          new Discord.MessageButton()
            .setStyle("PRIMARY")
            .setEmoji("🔃")
            .setLabel("Right 90°")
            .setCustomId("right"),
          new Discord.MessageButton()
            .setStyle("SECONDARY")
            .setLabel("Custom Rotation")
            .setCustomId("custom"),
        ]),
      ];
      let attachment = new Discord.MessageAttachment(
        pageFile.content,
        "Page.png"
      );
      let embed = new Discord.MessageEmbed()
        .setColor("#99ff00")
        .setImage("attachment://Page.png")
        .setFooter({ text: "Used by " + interaction.user.tag });
      try {
        let message = await interaction.user.send({
          files: [attachment],
          embeds: [embed],
          components: components,
        });
        await interaction.followUp({
          ephemeral: true,
          content:
            "shh, is the PDF blank? Try using the command again with blank option\nCheck your DM for pdf",
        });
        const collector = message.createMessageComponentCollector();
        collector.on("collect", async (i) => {
          if (i.user.id !== interaction.user.id)
            return i.reply({
              content: "Shhh you arent allowed to manage this pdf",
              ephemeral: true,
            });
          if (i.customId === "previous") page--;
          if (i.customId === "next") page++;
          if (i.customId === "end") {
            collector.stop();
            await i.deferUpdate();
            return;
          }
          if (i.customId === ".") {
            const modal = new Modal() // We create a Modal
              .setCustomId("modal")
              .setTitle("Enter page number")
              .addComponents([
                new TextInputComponent() // We create a Text Input Component
                  .setCustomId("page")
                  .setLabel("Page Number")
                  .setStyle("SHORT") //IMPORTANT: Text Input Component Style can be 'SHORT' or 'LONG'
                  .setPlaceholder("Make sure the page actually exists")
                  .setRequired(true), // If it's required or not
              ]);
            showModal(modal, { client: interaction.client, interaction: i });
            interaction.client.on("modalSubmit", pgModalHandler);
            async function pgModalHandler(modal) {
              if (modal.user.id !== interaction.user.id) return;
              interaction.client.removeListener("modalSubmit", pgModalHandler);
              const firstResponse = parseInt(modal.getTextInputValue("page"));
              if (
                isNaN(firstResponse) ||
                firstResponse > totalPages ||
                firstResponse < 0
              )
                return modal.reply("Value must be between 0 to " + totalPages);
              await modal.reply({
                content: "Going to page " + firstResponse,
                ephemeral: true,
              });
              page = firstResponse;
              let m = await modal.fetchReply();
              setTimeout(() => {
                m.delete();
              }, 15000);
              await updatePage();
            }
          } else if (i.customId === "custom") {
            const modal = new Modal() // We create a Modal
              .setCustomId("modal")
              .setTitle("Enter custom rotation")
              .addComponents([
                new TextInputComponent() // We create a Text Input Component
                  .setCustomId("degree")
                  .setLabel("Rotation in degrees")
                  .setStyle("SHORT") //IMPORTANT: Text Input Component Style can be 'SHORT' or 'LONG'
                  .setMaxLength(4)
                  .setPlaceholder("-360 to 360")
                  .setRequired(true), // If it's required or not
              ]);
            showModal(modal, { client: interaction.client, interaction: i });
            interaction.client.on("modalSubmit", modalHandler);
            async function modalHandler(modal) {
              if (modal.user.id !== interaction.user.id) return;
              interaction.client.removeListener("modalSubmit", modalHandler);
              const firstResponse = parseInt(modal.getTextInputValue("degree"));
              if (
                isNaN(firstResponse) ||
                firstResponse > 360 ||
                firstResponse < -360
              )
                return modal.reply("Value must be between 360 to -360");
              await modal.reply({
                content: "Rotating by " + firstResponse + "°",
                ephemeral: true,
              });
              let m = await modal.fetchReply();
              setTimeout(() => {
                m.delete();
              }, 15000);
              await updatePage(firstResponse);
            }
          } else {
            await i.deferUpdate();
            await updatePage();
          }
          async function updatePage(rotation = 0) {
            if (page < 1 || page > totalPages) {
              if (page < 1) page = 1;
              if (page > totalPages) page = totalPages;
              return i.reply("Uh-oh. You have reached the end of the pdf");
            }
            let pageFile = pagesBufferArray.find((p) => p.page === page);
            if (!pageFile) {
              pageFile = await getPage(pdfBuffer, page, password, dff, usf);
              pagesBufferArray.push({
                page: page,
                buffer: pageFile.content,
              });
              let arr = [
                totalPagesBuffer,
                Buffer.from(
                  `${data.splitString}${page}${data.splitString}`,
                  "utf-8"
                ),
                pageFile.content,
              ];
              totalPagesBuffer = Buffer.concat(arr);
              data.pages = totalPagesBuffer;
              dbobj.setCached.run(data);
            }
            let pageFileIndex = pagesBufferArray.findIndex(
              (p) => p.page === page
            );

            if (!pagesBufferArray[pageFileIndex].rotation)
              pagesBufferArray[pageFileIndex].rotation = 0;
            if (rotation !== 0)
              pagesBufferArray[pageFileIndex].rotation += rotation;
            if (!pageFile.content) pageFile.content = pageFile.buffer;
            if (i.customId === "right") {
              pagesBufferArray[pageFileIndex].rotation += 90;
              rotation = 90;
            }
            if (i.customId === "left") {
              pagesBufferArray[pageFileIndex].rotation -= 90;
              rotation = -90;
            }
            if (i.customId === "reset") {
              rotation = -pagesBufferArray[pageFileIndex].rotation;
              pagesBufferArray[pageFileIndex].rotation = 0;
            }
            if (rotation !== 0)
              pageFile.content = await sharp(pageFile.content)
                .rotate(rotation)
                .trim()
                .toBuffer();
            let attachment = new Discord.MessageAttachment(
              pageFile.content,
              "Page.png"
            );
            components[0].components[1].setLabel(
              "Page " + page + "/" + totalPages
            );
            await message.edit({
              files: [attachment],
              embeds: [embed],
              components: components,
            });
          }
        });
        collector.on("end", (collected) => {
          dbobj.setCached.run(data);
          let components2 = new Discord.MessageActionRow().setComponents([
            new Discord.MessageButton()
              .setDisabled(true)
              .setStyle("SUCCESS")
              .setEmoji("◀")
              .setCustomId("previous"),
            new Discord.MessageButton()
              .setStyle("SECONDARY")
              .setDisabled(true)
              .setLabel("Page " + page + "/" + totalPages)
              .setCustomId("."),
            new Discord.MessageButton()
              .setDisabled(true)
              .setStyle("SUCCESS")
              .setEmoji("▶")
              .setCustomId("next"),
          ]);
          embed.setTitle("Will not reply anymore");
          message.edit({ embeds: [embed], components: [components2] });
        });
      } catch (e) {
        console.log(e);
        await interaction.editReply({
          content:
            "I could not send the file. Please check if i have perms here. Error message: " +
            e.message,
          ephemeral: true,
        });
      }
    } catch (e) {
      console.log(e);
      interaction.channel.send({
        content: "Uh-oh, Unknown error " + e?.message,
      });
    }
  },
};
