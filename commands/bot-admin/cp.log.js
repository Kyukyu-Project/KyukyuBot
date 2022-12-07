/**
 * @typedef {import('../../src/typedef.js').ControlPanelHandler} ControlPanelHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('discord.js').SelectMenuComponentOptionData} SelectMenuComponentOptionData
 */

import fs from 'fs';
import path from 'path';

import {clientConfig} from '../../src/app-config.js';
const clientDataPath = clientConfig['client-data-dir'];
const ownerServerId = clientConfig['owner-server-id'];

import {ComponentType, ButtonStyle} from 'discord.js';

import {l10n} from '../../src/l10n.js';
import {logger} from '../../src/logger.js';

const controlPanelName = 'log';

// Component ids
const CompNormalClearButton = 'log.unset';
const CompNormalGetButton = 'log.get';

const CompSuperClearButton = 'log.super.clear';
const CompSuperClearSelect = 'log.super.clear.select';
const CompSuperGetButton = 'log.super.get';
const CompSuperGetSelect = 'log.super.get.select';
const CompSuperBackButton = 'log.super.back';
const CompTop = 'top';

/**
 * Get log menu items
 * @param {CommandContext} context - Interaction context
 * @return {SelectMenuComponentOptionData[]}
 */
function getLogMenuOptions(context) {
  const {client, locale} = context;

  const formatFileSize = (size) =>
    (size === 0)?'0 KB':((size < 1000)?'1 KB':`${Math.floor(size/1000)} KB`);

  const clientLogStats = fs.statSync(path.join(clientDataPath, 'client.log'));
  const errorLogStats = fs.statSync(path.join(clientDataPath, 'client.error'));

  /** @type {SelectMenuComponentOptionData[]} */
  const menuOptions = [
    {
      label: l10n.t(
          locale, 'cp.log.client-log-label',
          '{SIZE}', formatFileSize(clientLogStats.size)),
      value: 'client.log',
    },
    {
      label: l10n.t(
          locale, 'cp.log.error-log-label',
          '{SIZE}', formatFileSize(errorLogStats.size)),
      value: 'client.error',
    },
  ];

  const labelTemplate = l10n.s(locale, 'cp.log.server-log-label');

  fs.readdirSync(clientDataPath).forEach((fileName) => {
    const childPath = path.join(clientDataPath, fileName);
    const fileStats = fs.statSync(childPath);
    if (fileStats.isFile()) {
      const fileSize = fileStats.size;
      const fileExt = path.extname(childPath);
      const fileBase = path.basename(fileName, '.log');
      if (
        (fileBase !== 'client') &&
        (fileExt === '.log') &&
        (fileSize > 0)
      ) {
        const server = client.servers.find((s) => s.id === fileBase);
        if (server) {
          menuOptions.push({
            label: l10n.r(labelTemplate,
                '{SERVER}', server.name,
                '{SIZE}', formatFileSize(fileSize),
            ),
            value: fileName,
          });
        } else {
          menuOptions.push({
            label: l10n.r(labelTemplate,
                '{SERVER}', `<${fileBase}>`,
                '{SIZE}', formatFileSize(fileSize),
            ),
            value: fileName,
          });
        }
      }
    }
  });

  return menuOptions;
}

/**
 * Get 'get log' page (super-admin)
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getSuperAdminGetPage(context) {
  const {locale} = context;

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.log.super-admin.get.title'),
      description: l10n.s(locale, 'cp.log.super-admin.get.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: CompSuperGetSelect,
            placeholder: l10n.s(
                locale,
                'cp.log.super-admin.get.menu-placeholder',
            ),
            options: getLogMenuOptions(context),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompSuperBackButton,
            label: l10n.s(locale, 'cmd.bot-admin.back'),
          },
        ],
      },
    ],
  };

  return pageContent;
}

/**
 * Get 'clear log' page (super-admin)
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getSuperAdminClearPage(context) {
  const {locale} = context;

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.log.super-admin.clear.title'),
      description: l10n.s(locale, 'cp.log.super-admin.clear.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: CompSuperClearSelect,
            placeholder: l10n.s(
                locale,
                'cp.log.super-admin.clear.menu-placeholder',
            ),
            options: getLogMenuOptions(context),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompSuperBackButton,
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
function getNormalMainPage(context) {
  const {locale} = context;

  const pageTitle = l10n.s(locale, 'cp.log.normal.title');
  const pageDesc = l10n.s(locale, 'cp.log.normal.desc');

  return {
    embeds: [{
      title: pageTitle,
      description: pageDesc,
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
            custom_id: CompNormalGetButton,
            label: l10n.s(locale, 'cp.log.normal.set.button-label'),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompNormalClearButton,
            label: l10n.s(locale, 'cp.log.normal.clear.button-label'),
          },
        ],
      },
    ],
  };
}

/**
 * Get main page (super-admin)
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getSuperAdminMainPage(context) {
  const {locale} = context;
  const pageTitle = l10n.s(locale, 'cp.log.super-admin.title');
  const pageDesc = l10n.s(locale, 'cp.log.super-admin.desc');

  return {
    embeds: [{
      title: pageTitle,
      description: pageDesc,
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
            custom_id: CompSuperGetButton,
            label: l10n.s(locale, 'cp.log.super-admin.get.button-label'),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompSuperClearButton,
            label: l10n.s(locale, 'cp.log.super-admin.clear.button-label'),
          },
        ],
      },
    ],
  };
}

/**
 * Clear log (super-admin)
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 **/
function clearSuperLog(context, i) {
  const {client, locale} = context;

  const fileName = i.values[0];
  logger.clearLog(fileName);

  let responseMessage = '';

  if (fileName === 'client.log') {
    responseMessage = l10n.s(locale, 'cp.log.clear-result.client-log');
  } else if (fileName === 'client.error') {
    responseMessage = l10n.s(locale, 'cp.log.clear-result.error-log');
  } else {
    const serverId = fileName.slice(0, -4);
    const server = client.servers.find((s) => s.id === serverId);
    if (server) {
      responseMessage = l10n.t(
          locale, 'cp.log.clear-result.server-log',
          '{SERVER}', server.name,
      );
    } else {
      responseMessage = l10n.t(
          locale, 'cp.log.clear-result.server-log',
          '{SERVER}', `<${serverId}>`,
      );
    }
  }

  context.interaction.followUp(responseMessage);
}

/**
 * Clear log (super-admin)
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 **/
function clearNormalLog(context, i) {
  const {guild, locale} = context;

  const fileName = `${guild.id}.log`;
  logger.clearLog(fileName);

  const responseMessage = l10n.t(
      locale, 'cp.log.clear-result.server-log',
      '{SERVER}', guild.name,
  );

  context.interaction.followUp(responseMessage);
}

/**
 * Get log (super-admin)
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 **/
function getSuperLog(context, i) {
  const {client, locale} = context;

  const fileName = i.values[0];
  const filePath = path.join(clientDataPath, fileName);

  const response = {};

  if (fileName === 'client.log') {
    response.content = l10n.s(locale, 'cp.log.get-result.client-log');
  } else if (fileName === 'client.error') {
    response.content = l10n.s(locale, 'cp.log.get-result.error-log');
  } else {
    const serverId = fileName.slice(0, -4);
    const server = client.servers.find((s) => s.id === serverId);
    if (server) {
      response.content = l10n.t(
          locale, 'cp.log.get-result.server-log',
          '{SERVER}', server.name,
      );
    } else {
      response.content = l10n.t(
          locale, 'cp.log.get-result.server-log',
          '{SERVER}', `<${serverId}>`,
      );
    }
  }

  if (fs.existsSync(filePath) && (fs.statSync(filePath).size > 0)) {
    response.files = [{attachment: filePath, name: fileName + '.txt'}];
  }

  context.interaction.followUp(response);
}

/**
 * Get log (normal super-admin)
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 **/
function getNormalLog(context, i) {
  const {guild, locale} = context;

  const fileName = `${guild.id}.log`;
  const filePath = path.join(clientDataPath, fileName);

  const response = {
    content: l10n.t(
        locale, 'cp.log.get-result.server-log',
        '{SERVER}', guild.name,
    ),
  };

  if (fs.existsSync(filePath) && (fs.statSync(filePath).size > 0)) {
    response.files = [{attachment: filePath, name: fileName + '.txt'}];
  }

  context.interaction.followUp(response);
}

/**
 * Handle component interaction
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function handleInteraction(context, i) {
  // const CompNormalClearButton = 'log.unset';
  // const CompNormalGetButton = 'log.get';
  // const CompGetSelect = 'log.get.select';
  // const CompBackButton = 'log.back';

  // const CompSuperClearButton = 'log.super.clear';
  // const CompSuperClearSelect = 'log.super.clear.select';
  // const CompSuperGetButton = 'log.super.get';
  // const CompSuperGetSelect = 'log.super.get.select';
  // const CompSuperBackButton = 'log.super.back';

  /** @type {string} */
  const customId = i.customId;

  if (!customId.startsWith('log')) return undefined;

  switch (customId) {
    case CompSuperClearSelect:
      clearSuperLog(context, i);
      return true;
    case CompSuperGetSelect:
      getSuperLog(context, i);
      return true;

    case CompSuperClearButton:
      context.responseContent = getSuperAdminClearPage(context);
      return true;
    case CompSuperGetButton:
      context.responseContent = getSuperAdminGetPage(context);
      return true;
    case CompSuperBackButton:
      context.responseContent = getSuperAdminMainPage(context);
      return true;

    case CompNormalGetButton:
      getNormalLog(context, i);
      return true;
    case CompNormalClearButton:
      clearNormalLog(context, i);
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
  const {guild} = context;
  let content;
  if (ownerServerId === guild.id) {
    content = getSuperAdminMainPage(context);
  } else {
    content = getNormalMainPage(context);
  }
  // console.log(content);
  return content;
}

/**
 * Top nav-menu item getter
 * @param {CommandContext} context - Interaction context
 * @return {SelectMenuComponentOptionData}
 **/
function getNavMenuItem(context) {
  const {locale} = context;
  return {
    label: l10n.s(locale, 'cp.log.name'),
    description: l10n.s(locale, 'cp.log.desc'),
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
