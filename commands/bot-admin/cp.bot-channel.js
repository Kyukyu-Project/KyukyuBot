/**
 * @typedef {import('../../src/typedef.js').ControlPanelHandler} ControlPanelHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('discord.js').SelectMenuComponentOptionData} SelectMenuComponentOptionData
 */
import {ComponentType, ButtonStyle, ChannelType} from 'discord.js';

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';
import {logger} from '../../src/logger.js';

const controlPanelName = 'bot-channel';

// Component ids
const CompUnsetButton = 'bot-channel.unset';
const CompSetButton = 'bot-channel.set';
const CompSetSelect = 'bot-channel.set.select';
const CompBackButton = 'bot-channel.back';
const CompTop = 'top';

/**
 * Get 'set channel' page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getSetPage(context) {
  const {locale} = context;

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.bot-channel.set.title'),
      description: l10n.s(locale, 'cp.bot-channel.set.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.ChannelSelect,
            custom_id: CompSetSelect,
            channel_types: [ChannelType.GuildText],
            placeholder: l10n.s(locale, 'cp.bot-channel.set.menu-placeholder'),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompBackButton,
            label: l10n.s(locale, 'cmd.bot-admin.back'),
          },
        ],
      },
    ],
  };

  return pageContent;
}

/**
 * Get main page
 * @param {CommandContext} context - Interaction context
 * @param {string|undefined} status - Status message
 * @return {InteractionReplyOptions}
 */
function getMainPage(context, status) {
  const {locale, guildSettings} = context;

  const currChannelId = guildSettings['bot-channel'];

  const pageTitle = l10n.s(locale, 'cp.bot-channel.main.title');
  const pageDesc = l10n.s(locale, 'cp.bot-channel.main.desc');

  if (!status) {
    status =
      currChannelId?
      l10n.t(
          locale, 'cp.bot-channel.main.list',
          '{CHANNEL}', `<#${currChannelId}>`,
      ):
      l10n.s(locale, 'cp.bot-channel.main.list-none');
  }

  return {
    embeds: [{
      title: pageTitle,
      description: pageDesc + '\n\n' + status,
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompTop,
            label: l10n.s(locale, 'cmd.bot-admin.top'),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompSetButton,
            label: l10n.s(locale, 'cp.bot-channel.set.button-label'),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompUnsetButton,
            label: l10n.s(locale, 'cp.bot-channel.unset.button-label'),
            disabled: (!currChannelId),
          },
        ],
      },
    ],
  };
}


/**
 * Unset bot-channel
 * @param {CommandContext} context - Originating interaction context
 * @return {InteractionReplyOptions}
 **/
function unsetChannel(context) {
  const {locale, guild, user} = context;

  context.guildSettings = servers
      .updateSettings(guild, 'bot-channel', undefined);

  const status = l10n.s(locale, 'cp.bot-channel.unset.success');

  logger.writeLog(
      `${guild.id}.log`,
      `${user.tag} unset bot-channel`,
  );

  return getMainPage(context, status);
}

/**
 * Add a role
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function setChannel(context, i) {
  const {locale, guild, user} = context;
  const channelId = i.values[0];

  context.guildSettings = servers
      .updateSettings(guild, 'bot-channel', channelId);

  const status = l10n.t(
      locale, 'cp.bot-channel.set.success',
      '{CHANNEL ID}', channelId,
  );

  logger.writeLog(
      `${guild.id}.log`,
      `${user.tag} set bot-channel to <#${channelId}>`,
  );

  return getMainPage(context, status);
}

/**
 * Handle component interaction
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function handleInteraction(context, i) {
  /** @type {string} */
  const customId = i.customId;

  if (!customId.startsWith('bot-channel')) return undefined;

  switch (customId) {
    case CompBackButton:
      context.responseContent = getMainPage(context, undefined);
      return true;
    case CompSetButton:
      context.responseContent = getSetPage(context);
      return true;
    case CompSetSelect:
      context.responseContent = setChannel(context, i);
      return true;
    case CompUnsetButton:
      context.responseContent = unsetChannel(context);
      return true;
    default: return false;
  }
}

/**
 * Main panel page getter
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getContent(context) {
  return getMainPage(context, undefined);
}

/**
 * Top nav-menu item getter
 * @param {CommandContext} context - Interaction context
 * @return {SelectMenuComponentOptionData}
 **/
function getNavMenuItem(context) {
  const {locale} = context;
  return {
    label: l10n.s(locale, 'cp.bot-channel.name'),
    description: l10n.s(locale, 'cp.bot-channel.desc'),
    value: controlPanelName,
  };
}

/** @type {ControlPanelHandler} */
export const controlPanel = {
  name: controlPanelName,
  super: false,
  getNavMenuItem: getNavMenuItem,
  getContent: getContent,
  handleInteraction: handleInteraction,
};
