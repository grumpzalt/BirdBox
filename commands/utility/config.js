const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ChannelSelectMenuBuilder, ChannelType, UserSelectMenuBuilder, RoleSelectMenuBuilder, MentionableSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js");
const configOptions = require("../../utils/json/config.json")

module.exports = { //MARK: COMMAND DATA
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configures server and client settings.")
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("What class of settings you would like to modify.")
        .addChoices(
          { name: "user", value: "user" },
          { name: "server", value: "server" },
          { name: "bot", value: "bot" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the setting you would like to modify.")
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) { //MARK: AUTOCOMPLETE

    const options = configOptions[interaction.options?.getString("scope") ?? "user"];
    const choices = Object.keys(options).map((key) => key);

    const focusedOption = interaction.options.getFocused(true);
    const value = focusedOption.value.charAt(0).toUpperCase() + focusedOption.value.slice(1);
    let filtered = choices.filter((choice) => choice.startsWith(value));
    filtered = filtered.map((choice) => ({ name: choice, value: choice }));
    filtered = filtered.slice(0, 25);

    await interaction.respond(filtered);
  },
  async execute(interaction, {db, admins}) { //MARK: MODERN MODE
    admins = admins.map((item) => item.userId);

    const scope = interaction.options?.getString("scope") ?? "user";
    let name = interaction.options?.getString("name") ?? "default";

    // Reject the user if they are not included in the devs list.
    if (scope != "user" && !admins.includes(interaction.user.id)) return interaction.reply({content:"sorry, you must be a birdbox admin to modify those settings", ephemeral: true});

    // Reject the user if the configuration option does not exist.
    if (!configOptions[scope][name] && !("default" === name)) return await interaction.reply("thats not a setting lol, please try again");

    const settingId = scope == "user" ? interaction.user.id : interaction.guild.id

    const response = await interaction.reply({
      embeds: await updateEmbed(scope, name),
      components: await updateRow(settingId, db, scope, name),
    });

    const filter = (i) => i.user.id === interaction.user.id;

    /* RESPOND TO BUTTONS */
    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_600_000,
      filter,
    });

    buttonCollector.on("collect", async (i) => { //MARK: button response
      if (i.customId === "modal") {
        await customModal(i, configOptions[scope][name]);
        return;
      }
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], i.customId);
      await interaction.editReply({components: await updateRow(settingId, db, scope, name)})
    });
    
    buttonCollector.on("end", async () => {
      await response.edit({ components: [] })
    });

    /* RESPOND TO SELECTS */
    const selectCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 3_600_000,
      filter,
    });

    selectCollector.on("collect", async (i) => { //MARK: selector response
      const nameCollect = i.values[0];
      await i.deferUpdate();

      if (i.customId == "settingSelect") {
        name = nameCollect

        const settingId = scope == "user" ? interaction.user.id : interaction.guild.id
        await i.message.edit({
          embeds: await updateEmbed(scope, nameCollect),
          components: await updateRow(settingId, db, scope, nameCollect),
          //content: `settings.${nameCollect}.${interaction.user.id}`,
        });

      } else if (i.customId == "settingOptionsSelect") {
        console.log(nameCollect);
      }
    });

    /* RESPOND TO CONFIG OPTIONS */
    const channelCollector = response.createMessageComponentCollector({ //MARK: channel responses
      componentType: ComponentType.ChannelSelect,
      time: 3_600_000,
      filter,
    });

    channelCollector.on("collect", async (i) => {
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });

    const MentionableCollector = response.createMessageComponentCollector({ //MARK: mention responses
      componentType: ComponentType.MentionableSelect,
      time: 3_600_000,
      filter,
    });

    MentionableCollector.on("collect", async (i) => { 
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });

    const RoleCollector = response.createMessageComponentCollector({ //MARK: role responses
      componentType: ComponentType.RoleSelect,
      time: 3_600_000,
      filter,
    });

    RoleCollector.on("collect", async (i) => { 
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });

    const UserCollector = response.createMessageComponentCollector({ //MARK: user responses
      componentType: ComponentType.UserSelect,
      time: 3_600_000,
      filter,
    });

    UserCollector.on("collect", async (i) => { 
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });
  },
  async executeClassic({message, args}, {db, admins}) { //MARK: CLASSIC MODE
    admins = admins.map((item) => item.userId);

    const scope = args[0] ?? "user";
    let name = args[1] ?? "default";

    if (!["user", "server", "bot"].includes(scope)) return message.reply("thats not even close to a command scope, try using `user`, `server`, or `bot`");

    // Reject the user if they are not included in the devs list.
    if (scope != "user" && !admins.includes(message.author.id)) return message.reply("sorry, you must be a birdbox admin to modify those settings");

    // Reject the user if the configuration option does not exist.
    if (!configOptions[scope][name] && !("default" === name)) return await message.reply("thats not a setting lol, please try again");

    const settingId = scope == "user" ? message.author.id : message.guild.id

    const response = await message.reply({
      embeds: await updateEmbed(scope, name),
      components: await updateRow(settingId, db, scope, name),
    });

    const filter = (i) => i.user.id === message.author.id;

    /* RESPOND TO BUTTONS */
    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_600_000,
      filter,
    });

    buttonCollector.on("collect", async (i) => { //MARK: button response
      if (i.customId === "modal") {
        await customModal(i, configOptions[scope][name]);
        return;
      }
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], i.customId);
      await response.edit({components: await updateRow(settingId, db, scope, name)})
    });
    
    buttonCollector.on("end", async () => {
      await response.edit({ components: [] })
    });

    /* RESPOND TO SELECTS */
    const selectCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 3_600_000,
      filter,
    });

    selectCollector.on("collect", async (i) => { //MARK: selector response
      const nameCollect = i.values[0];
      await i.deferUpdate();

      if (i.customId == "settingSelect") {
        name = nameCollect
        
        const settingId = scope == "user" ? i.user.id : i.guild.id
        await i.message.edit({
          embeds: await updateEmbed(scope, nameCollect),
          components: await updateRow(settingId, db, scope, nameCollect),
          //content: `settings.${nameCollect}.${message.author.id}`,
        });

      } else if (i.customId == "settingOptionsSelect") {
        console.log(nameCollect);
      }
    });

    /* RESPOND TO CONFIG OPTIONS */
    const channelCollector = response.createMessageComponentCollector({ //MARK: channel responses
      componentType: ComponentType.ChannelSelect,
      time: 3_600_000,
      filter,
    });

    channelCollector.on("collect", async (i) => {
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });

    const MentionableCollector = response.createMessageComponentCollector({ //MARK: mention responses
      componentType: ComponentType.MentionableSelect,
      time: 3_600_000,
      filter,
    });

    MentionableCollector.on("collect", async (i) => { 
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });

    const RoleCollector = response.createMessageComponentCollector({ //MARK: role responses
      componentType: ComponentType.RoleSelect,
      time: 3_600_000,
      filter,
    });

    RoleCollector.on("collect", async (i) => { 
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });

    const UserCollector = response.createMessageComponentCollector({ //MARK: user responses
      componentType: ComponentType.UserSelect,
      time: 3_600_000,
      filter,
    });

    UserCollector.on("collect", async (i) => { 
      const nameCollect = i.values[0];
      await i.deferUpdate();

      const settingId = scope == "user" ? i.user.id : i.guild.id
      await setSetting(settingId, db, configOptions[scope][name], nameCollect);
    });
  },
};

/* UTIL FUNCTIONS */
async function updateEmbed(scope, name) { //MARK: update embed
  // Returns an updated embed on request.
  let configEmbed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`${scope.charAt(0).toUpperCase() + scope.slice(1)} Settings`)
    .setFooter({ text: "Made by TheBirdWasHere, with help from friends." });
  if (name == "default") {
    configEmbed.setDescription("Use the menu below to select a setting.");
  } else {
    configEmbed.setDescription(
      `**${configOptions[scope][name].name}**\n ${configOptions[scope][name].desc
      }`
    );
  }
  return [configEmbed];
}
async function updateRow(settingId, db, scope, name) { //MARK: update row
  // Returns an updated row on request.

  /* STRINGSELECT ROW */
  const choices = Object.entries(configOptions[scope]).map((item) => [
    item[1].value,
    item[1].name,
  ]);

  const settingSelect = new StringSelectMenuBuilder()
    .setCustomId("settingSelect")
    .setPlaceholder("Select setting...");
  choices.forEach((item) => {
    settingSelect.addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel(item[1])
        .setValue(item[0]),
    ]);
  });

  const configSelectRow = new ActionRowBuilder().addComponents(settingSelect);
  if (name == "default") return [configSelectRow];

  /* BUTTON ROW */
  const configButtonRow = new ActionRowBuilder();
  const optionsList = await optionsBuilder(settingId, db, scope, name)

  optionsList.forEach((item) => {
    configButtonRow.addComponents(item);
  });

  /* LET 'ER RIP */
  return [configSelectRow, configButtonRow];
}

async function optionsBuilder(settingId, db, scope, name) { //MARK: options builder
  const currentSetting = configOptions[scope][name];
  const displayOptionsAs = currentSetting.displayOptionsAs; // Get preset option
  const currentSelection = await getSetting(settingId, db, currentSetting)
  
  switch (displayOptionsAs) { // Switch by preset option  - TODO IN FUTURE: ADD OPTION FOR ADDING CUSTOM MULTI-ROW OPTIONS
    case "toggle":
      let disableButton = new ButtonBuilder()
        .setCustomId("disable")
        .setLabel("Disable")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(currentSelection == "disable");
      let enableButton = new ButtonBuilder()
        .setCustomId("enable")
        .setLabel("Enable")
        .setStyle(ButtonStyle.Success)
        .setDisabled(currentSelection == "enable");
      return [disableButton, enableButton];
    case "buttons":
      let buttonArray = [];
      configOptions[scope][name].options.forEach((item) => {
        buttonArray.push(
          new ButtonBuilder()
            .setCustomId(item.value)
            .setLabel(item.name)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentSelection == item.value)
        );
      });

      return buttonArray;
    case "select":
      let settingOptionsSelect = new StringSelectMenuBuilder()
        .setCustomId("settingOptionsSelect")
        .setPlaceholder("Select option...");
      configOptions[scope][name].options.forEach((item) => {
        settingOptionsSelect.addOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel(item.name)
            .setValue(item.value),
        ]);
      });
      return [settingOptionsSelect];
    case "channel":
      let channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId(`channelSelect`)
        .setChannelTypes(ChannelType.GuildText)
        .setPlaceholder("Select channel...");
      return [channelSelect];
    case "user":
      let userSelect = new UserSelectMenuBuilder()
        .setCustomId(`userSelect`)
        .setPlaceholder("Select user...");
      return [userSelect];
    case "role":
      let roleSelect = new RoleSelectMenuBuilder()
        .setCustomId(`roleSelect`)
        .setPlaceholder("Select role...");
      return [roleSelect];
    case "mentionable":
      let mentionableSelect = new MentionableSelectMenuBuilder()
        .setCustomId(`mentionableSelect`)
        .setPlaceholder("Select mentionable...");
      return [mentionableSelect];
    case "modal":
      let modalButton = new ButtonBuilder()
        .setCustomId("modal")
        .setLabel("Open Modal")
        .setStyle(ButtonStyle.Primary);
      return [modalButton];
  }
  return [
    new ButtonBuilder()
      .setCustomId("error")
      .setLabel("ERROR FETCHING OPTIONS")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
  ];
}

async function customModal(i, setting) { //MARK: custom modal
  const modal = new ModalBuilder()
    .setCustomId("settingsModal")
    .setTitle(setting.name);
  
  const optionInput = new TextInputBuilder()
    .setCustomId(setting.options.value)
    .setLabel(setting.options.name)
    .setPlaceholder(setting.options.placeholder)
  
  const setInputStyle = (styleName) => {
    if (styleName == "short") {
      optionInput.setStyle(TextInputStyle.Short)
    } else {
      optionInput.setStyle(TextInputStyle.Paragraph)
    }
  }

  setInputStyle(setting.options.type)

  modal.addComponents(new ActionRowBuilder().addComponents(optionInput));

  await i.showModal(modal);
}

async function setSetting(id, db, setting, value) { //MARK: set/get setting
  await db.set(`settings.${setting.value}.${id}`, value);
}

async function getSetting(id, db, setting) {
  let settingValue = await db.get(`settings.${setting.value}.${id}`);
  if (!settingValue) return setting.default;
  return settingValue;
}