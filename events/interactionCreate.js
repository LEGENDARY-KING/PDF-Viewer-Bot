module.exports = {
  name: "interactionCreate",
  description: "Manages all the slash commands initiation",
  once: false,
  async execute(interaction) {
    if (!interaction.isCommand()) return;
    const command = interaction.client.slashCommands.get(
      interaction.commandName
    );

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
