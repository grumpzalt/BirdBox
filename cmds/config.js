const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ChannelSelectMenuBuilder, ChannelType } = require("discord.js")

module.exports = {
    name: 'config',
    description: "Change bot-related settings for the user and server.",
    async execute({message, args}, {prefix, db, devs}){
        if (args[0] && !["user", "server"].includes(args[0])) {
            args[2] = args[1]; args[1] = args[0]; args[0] = "user";} //effectively, insert "user" into the original message
        
        const mode = args[0];
        const setting = args[1];
        const change = args[2];

        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) === "enable")
        
        //reject server settings if not admin
        if (mode == "server" && !devs.includes(message.author.id)) {return message.tryreply("sorry, you must be a birdbox admin to modify server settings")};

        //redirect in case of modern mode
        if (!classic) {return modernMode(message, {prefix, db, classic}, {mode, setting, change});} 
        else {return classicMode(message, {prefix, db, classic}, {mode, setting, change})}
    }
}

// IMPORTANT NOTICE
// if anyone comes in trying to add new config options, 
// please just fill out the required info in settingsText
// and it ought to work

/*/
 * --------------------------------
 * classic mode functions are below
 * --------------------------------
/*/

function classicMode(message, {prefix, db, classic}, {mode, setting, change}) {    
    //create embed for user settings
    const userEmbed = new EmbedBuilder()
    .setColor('#cbe1ec')
    .setTitle('User Settings')
    .setDescription('Personalize the bot!')
    .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'});
    for (let item of Object.keys(settingsText(prefix).user)) {
        userEmbed.addFields(settingsText(prefix).user[item])}

    //create embed for server settings
    const serverEmbed = new EmbedBuilder()
    .setColor('#cbe1ec')
    .setTitle('Server Settings')
    .setDescription('Personalize the bot!')
    .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'});
    for (let item of Object.keys(settingsText(prefix).server)) {
        serverEmbed.addFields(settingsText(prefix).server[item])}

    //if no mode, they must have done just e;config
    if (!mode) {return message.tryreply({embeds: [userEmbed]})};

    //selected a mode at this point (including logic from main execute)
    if (mode == "user") {
        if (!setting || !change) {return message.tryreply({embeds: [userEmbed]})};
        if (!settingsText(prefix).user[setting]) {return message.tryreply({content: "invalid setting, try again"})};

        //previous returns mean this is guaranteed to work
        modifyUserSetting(message, {prefix, db, classic}, {setting, change})
    } else if (mode == "server") {
        if (!setting || !change) {return message.tryreply({embeds: [serverEmbed]})};
        if (!settingsText(prefix).server[setting]) {return message.tryreply({content: "invalid setting, try again"})};

        //previous returns mean this is guaranteed to work
        modifyServerSetting(message, {prefix, db, classic}, {setting, change})
    }
}

function settingsText(prefix) { //everything here is funky because i wanted properties to work for both embed declaration in classic and selector declaration in modern, all without duplicating text too much. so, constructor functions. yay
    return {
        user: {
            notifs: new function () {this.title = `Notifications`;
            this.desc = 'Change where bot notifications show up.';
            this.name = `${prefix}config user notifs log/reply`; this.options = ["reply", "log"]; this.default = "reply";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**log:** Only log in the server channel dedicated to bot notifications. \n**reply:** Reply to the original message as well as log it.`},
            snipes: new function () {this.title = `Snipe Logging`;
            this.desc =  `Change whether your deleted messages are logged by ${prefix}snipe.`;
            this.name = `${prefix}config user snipes enable/disable`; this.options = ["enable", "disable"]; this.default = "disable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Log your deleted messages for snipes, regardless of who deleted it. \n**disable:** Do not log your deleted messages.`},
            classic: new function () {this.title = `BirdBox Classic`;
            this.desc = 'Toggle between modern and classic interfaces.';
            this.name = `${prefix}config user classic enable/disable`; this.options = ["enable", "disable"]; this.default = "disable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Use old text-based interfaces for content entry. \n**disable:** Use modern modal/button interfaces for content entry.`; }
        }, server: {
            notif_channel: new function() {this.title = `Notifications Channel`;
            this.desc = `Change the channel notification logs are sent to.`;
            this.name = `${prefix}config server notif_channel (id)`; this.options = "channel"; this.default = "";
            this.value = `${this.desc} \nIf not set, logs will be disabled. \n\n**id:** The ID of the log channel being set.`; },
            announce_channel: new function() {this.title = `Announcement Channel`; 
            this.desc = `Change the channel ${prefix}announce sends to.`;
            this.name = `${prefix}config server announce_channel (id)`; this.options = "channel"; this.default = "";
            this.value = `${this.desc} \nIf not set or set to an invalid ID, disables ${prefix}announce. \n\n**id:** The ID of the announcement channel being set.`; },
            responses: new function() {this.title = `Responses`; 
            this.desc = `Toggles whether message and lyric responses are enabled for this server.`;
            this.name = `${prefix}config server responses enable/disable`; this.options = ["enable", "disable"]; this.default = "enable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Allow BirdBox to respond to messages with keywords. \n**disable:** Do not allow keyword-based responses.`; },
            jinxes: new function() {this.title = `Jinx Detection`; 
            this.desc = `Toggles whether BirdBox responds to identical messages sent at the same time.`;
            this.name = `${prefix}config server jinxes enable/disable`; this.options = ["enable", "disable"]; this.default = "enable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Allow BirdBox to add to a chain of identical messages. \n**disable:** Do not allow jinx detection or response.`; },
            pinning: new function() {this.title = `Pin/Unpin`;
            this.desc = `Modifies the usability of pin and unpin commands.`;
            this.name = `${prefix}config server pinning enable/restrict/disable`; this.options = ["enable", "restrict", "disable"]; this.default = "restrict";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Allow any messages to be pinned at any time by any user. \n**restrict:** Restrict users from pinning messages under certain circumstances. Criteria is outlined in the help page for these commands. \n**disable:** Do not allow messages to be pinned by any users except devs.`; },
            snipes_server: new function() {this.title = `Snipe Logging`;
            this.desc = `Change whether this server's deleted messages are logged by ${prefix}snipe.`;
            this.name = `${prefix}config server snipes_server enable/disable`; this.options = ["enable", "disable"]; this.default = "enable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Allows deleted messages to be logged for users that opt in. \n**disable:** Do not allow any messages to be logged for any users.`; }
    }}
}

async function updateDefaultUserSetting(message, {prefix, db, classic}, {setting, change}) {
    if (!settingsText(prefix).user[setting].options.includes(change)) {
        return message.tryreply(`not sure what ${change} means but it sure isnt "${settingsText(prefix).user[setting].options.join('" or "')}"`)}
    
    await db.set(`setting_${setting}_${message.author.id}`, change)
    if (await db.get(`setting_${setting}_${message.author.id}`) === change) {
        if (classic) {message.tryreply(`Setting updated successfully!`);}}
    else {message.tryreply(`setting failed to update, try again`)};
}

const modifyUserSettingArray = {}; //futureproofing

function modifyUserSetting(message, {prefix, db, classic}, {setting, change}) {
    return new Promise((res) => {
        if (modifyUserSettingArray[setting]) modifyUserSettingArray[setting](message, {prefix, db, classic}, change)
        else updateDefaultUserSetting(message, {prefix, db, classic}, {setting, change})

        res(true)
    })
}

async function updateDefaultServerSetting(message, {prefix, db}, {setting, change}) {
    if (!settingsText(prefix).server[setting].options.includes(change)) {
        return message.tryreply(`not sure what ${change} means but it sure isnt "${settingsText(prefix).server[setting].options.join('" or "')}"`)}
    
    await db.set(`setting_${setting}_${message.guildId}`, change)
    if (await db.get(`setting_${setting}_${message.guildId}`) === change) {
        message.tryreply(`Setting updated successfully!`);}
    else {message.tryreply(`setting failed to update, try again`);};
}

const modifyServerSettingArray = {
    notif_channel: async (message, {db}, change) => {
        if (!Number(change)) {
            await db.set(`setting_notif_channel_${message.guildId}`, false); 
            return message.channel.trysend(`invalid id, notification logging disabled`)};
        await message.guild.channels.fetch(change).catch(async error => {
            await db.set(`setting_notif_channel_${message.guildId}`, false); 
            return message.channel.trysend(`id not found, notification logging disabled`);
        })

        await db.set(`setting_notif_channel_${message.guildId}`, change);
        await message.channel.trysend(`Notification channel set successfully!`);

    }, announce_channel: async (message, {db}, change) => {
        if (!Number(change)) {
            await db.set(`setting_announce_channel_${message.guildId}`, false); 
            return message.channel.trysend(`invalid id, announcements disabled`)};
        await message.guild.channels.fetch(change).catch(async error => {
            await db.set(`setting_announce_channel_${message.guildId}`, false); 
            return message.channel.trysend(`id not found, announcements disabled`);
        })

        await db.set(`setting_announce_channel_${message.guildId}`, change);
        await message.channel.trysend(`Announcement channel set successfully!`);
}}

function modifyServerSetting(message, {prefix, db, classic}, {setting, change}) {
    return new Promise((res) => {
        if (modifyServerSettingArray[setting]) modifyServerSettingArray[setting](message, {prefix, db, classic}, change)
        else updateDefaultServerSetting(message, {prefix, db, classic}, {setting, change})

        res(true)
    })
}

/*/
 * -------------------------------
 * modern mode functions are below
 * -------------------------------
/*/

async function modernMode(message, {prefix, db}, {mode, setting, change}) {
    if (!mode) {mode = "user"}

    let select = selectorTemplate(mode, settingsText(prefix));
    const row = new ActionRowBuilder().addComponents(select)
    
    let sent = await sendConfigMessage(message, {prefix, db}, {mode, setting, change}, row)

    //collector for the selector responses
    const interactcollector = sent.createMessageComponentCollector({ time: 30000 });

    interactcollector.on('collect', async i => {
        if (i.member.id !== message.author.id) { return; }

        if (Number(i.values?.[0])) {change = i.values[0]}                    //this would be a channel selector
        else if (typeof i.values?.[0] === "string") {setting = i.values[0]}  //this would be a normal selector
        else if (!i.values) {change = i.customId.replace(`${setting}-`, "")} //and this would be a button
        
        if (i.isButton() || i.isChannelSelectMenu()) { //either means a setting was changed
            if (mode == "user") {await modifyUserSetting(message, {prefix, db}, {setting, change});}
            else {await modifyServerSetting(message, {prefix, db}, {setting, change})}};

        await db.get(`setting_${setting}_${message.guildlId}`) //this. this right here fixed an issue where buttons
                                                               //would wait until another setting is changed to properly update.
                                                               //it's messy, it's unnecessary, it's impossible to understand, but it works. and so, i leave it.
        let updatedEmbed, options
        [updatedEmbed, options] = await displaySetting(message, {prefix, db}, {mode, setting});
        options.unshift(row);
        
        sent.edit({ embeds: [updatedEmbed], components: options });
        i.deferUpdate();
    });

    interactcollector.on('end', () => {
        //disable the selector and remove buttons
        row.components[0].setDisabled(true)
        sent.edit({ components: [row] })
    })
}

function selectorTemplate(mode, settings) {
    const select = new StringSelectMenuBuilder()
    .setCustomId(`settings-${mode}`)
    .setPlaceholder(`Select a setting`);
    for (let item of Object.keys(settings[mode])) {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(settings[mode][item].title)
                .setDescription(settings[mode][item].desc)
                .setValue(item)
    )}
    return select
}

function embedTemplate(mode) {
    const embed = new EmbedBuilder()
        .setColor(0xcbe1ec)
        .setTitle(`${mode[0].toUpperCase()}${mode.slice(1)} Settings`)
        .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'});

    return embed
}

async function displaySetting(message, {prefix, db}, {mode, setting}) {
    let selectedOption
    if (mode == "user") {selectedOption = await db.get(`setting_${setting}_${message.author.id}`);}
    else {selectedOption = await db.get(`setting_${setting}_${message.guildId}`);}
    return new Promise((res, rej) => {
        const settingText = settingsText(prefix)[mode][setting]
        settingText.name = settingText.title; //name uses classic interface, title more appropriate here
        const embed = embedTemplate(mode).addFields(settingText);

        if (!selectedOption && selectedOption !== false) {selectedOption = settingText.default};

        const settingsArray = []
        settingsArray[0] = new ActionRowBuilder()
        if (Array.isArray(settingText.options)) { //array means button options
            settingText.options.forEach(opt => {
                const capsOpt = `${opt[0].toUpperCase()}${opt.slice(1)}`
                const button = new ButtonBuilder()
                .setLabel(capsOpt)
                .setCustomId(`${setting}-${opt}`)
                .setDisabled(false)
                if (opt === selectedOption) {button.setDisabled(true)}
                if (opt == "enable") { button.setStyle(ButtonStyle.Success)
                } else if (opt == "disable") { button.setStyle(ButtonStyle.Danger)
                } else { button.setStyle(ButtonStyle.Primary) }

                settingsArray[0].addComponents(button)
        })} else if (settingText.options == "channel") { //channel means channel selector
            const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId(`${setting}-channel`)
            .setChannelTypes(ChannelType.GuildText)
            .setPlaceholder("Choose a channel")

            const disableButton = new ButtonBuilder()
            .setLabel("Disable")
            .setCustomId(`${setting}-disable`)
            .setDisabled(false)
            .setStyle(ButtonStyle.Danger)

            if (selectedOption === false) {disableButton.setDisabled(true)}

            settingsArray[1] = new ActionRowBuilder()
            settingsArray[0].addComponents(channelSelect)
            settingsArray[1].addComponents(disableButton)
        }

        res([embed, settingsArray])
})}

async function sendConfigMessage(message, {prefix, db}, {mode, setting}, row) {
    let sent, newEmbed

    if (!setting) {
        newEmbed = embedTemplate(mode);
        newEmbed.setDescription('Use the menu below to select a setting!')
        sent = await message.tryreply({ components: [row], embeds: [newEmbed] });}
    else if (!settingsText(prefix)[mode][setting]) {
        newEmbed = embedTemplate(mode);
        newEmbed.setDescription(':x: Invalid setting, use the menu below to select a valid one!')
        sent = await message.tryreply({ components: [row], embeds: [newEmbed] });}
    else {
        let options
        [newEmbed, options] = await displaySetting(message, {prefix, db}, {mode, setting}); //i am baffled by this syntax working, but it does 
                                                                                            //(edit: used this syntax elsewhere now, this was written when i discovered it)
        options.unshift(row)
        sent = await message.tryreply({ components: options, embeds: [newEmbed]});
    }

    return sent
}