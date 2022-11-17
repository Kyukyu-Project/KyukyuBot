/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {PermissionFlagsBits} from 'discord.js';

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';

const requiredAppPermissions = PermissionFlagsBits.SendMessages;
const settingKey = 'bot-channel';
const localeKeyPrefix = 'cmd.bot-admin.bot-channel';

/**
 * Get guild setting
 * @param {GuildSettings} settings - Guild settings
 * @return {(string[]|undefined)} - Guild setting (`undefined` if it is empty)
 **/
function getSetting(settings) {
  const currSetting = settings[settingKey];
  if ((typeof currSetting === 'string') && (currSetting.trim().length > 0)) {
    return currSetting;
  } else {
    return undefined;
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 **/
function set(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale, options} = interaction;

  const newChannelId = options.getChannel('channel').id;
  const currChannelId = getSetting(guildSettings);
  const newChannelTag = `<#${newChannelId}>`;

  if (currChannelId !== newChannelId) {
    servers.updateSettings(guild, settingKey, newChannelId);
    return ({
      success: true,
      response: l10n.t(
          locale, `${localeKeyPrefix}.set-result`,
          '{CHANNEL}', newChannelTag,
      ),
    });
  } else {
    return ({
      success: false,
      response: l10n.s(locale, `${localeKeyPrefix}.set-error`),
    });
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function clear(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale} = interaction;

  const currChannelId = getSetting(guildSettings);

  if (currChannelId) {
    servers.updateSettings(guild, settingKey, '');
    return ({
      success: true,
      response: l10n.s(locale, `${localeKeyPrefix}.clear-result`),
    });
  } else {
    return ({
      success: false,
      response: l10n.s(locale, `${localeKeyPrefix}.clear-error`),
    });
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 **/
function info(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale, appPermissions} = interaction;

  const currChannelId = getSetting(guildSettings);
  if (currChannelId) {
    // Remove invalid channel from server settings
    if (appPermissions.has(PermissionFlagsBits.ManageChannels)) {
      if (guild.channels.cache.has(currChannelId)) {
        // do nothing
      } else {
        servers.updateSettings(guild, settingKey, '');
        currChannelId = undefined;
      }
    }
  }

  if (currChannelId) {
    const currChannelTag = `<#${currChannelId}>`;
    return ({
      success: true,
      response: l10n.t(
          locale, `${localeKeyPrefix}.info-result`,
          '{CHANNEL}', currChannelTag,
      ),
    });
  } else {
    return ({
      success: true,
      response: l10n.s(locale, `${localeKeyPrefix}.info-result-none`),
    });
  }
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  const {locale, appPermissions, options} = interaction;

  if (!appPermissions.has(requiredAppPermissions)) {
    interaction.reply(
        l10n.s(locale, 'messages.command-error.no-app-permission'),
    );
    return false;
  }

  const subCommand = options.getSubcommand();
  let actionResult;
  switch (subCommand) {
    case 'set': actionResult = set(context); break;
    case 'clear': actionResult = clear(context); break;
    case 'info':
    default: actionResult = info(context);
  }

  interaction.reply({
    content: actionResult.response,
    ephemeral: true,
  });

  return actionResult.success;
}
