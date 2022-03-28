module.exports = {
  name: "interactionCreate",
  description: "Manages all the slash commands initiation",
  once: false,
  async execute(interaction) {
    if (!interaction.isApplicationCommand()) return;
    let command = interaction.client.messageCommands.get(
      interaction.commandName
    );
    if (interaction.commandName === "read blank")
      command = interaction.client.messageCommands.get("read");
    if (!command) return;

    try {
      if (interaction.commandName !== "read blank")
        await command.execute(interaction);
      else await command.execute(interaction, true);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
