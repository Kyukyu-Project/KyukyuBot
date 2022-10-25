/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {PermissionFlagsBits} from 'discord.js';

import {getFileSize, fileExists} from '../../src/utils.js';

import {l10n} from '../../src/l10n.js';
import {logger} from '../../src/logger.js';

const requiredAppPermissions = PermissionFlagsBits.SendMessages;

const ephemeral = false;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 **/
export function get(context) {
  const {client, locale, interaction} = context;
  const {options} = interaction;

  /** @type {string} */
  const fileName = options.getString('log');
  const filePath = logger.getLogPath(fileName);
  if (fileExists(filePath) && (getFileSize(filePath) > 0)) {
    let response;
    if (fileName === 'client.log') {
      response = l10n.s(
          locale,
          'cmd.super-admin.log.get-result.client-log',
      );
    } else if (fileName === 'error.log') {
      response = l10n.s(
          locale,
          'cmd.super-admin.log.get-result.client-error-log',
      );
    } else {
      const serverId = fileName.slice(0, -4);
      const server = client.servers.find((s) => s.id === serverId);
      response = l10n.t(
          locale, 'cmd.super-admin.log.get-result.server-log',
          '{SERVER}', server.name,
      );
    }

    interaction.reply({
      content: response,
      files: [{attachment: filePath, name: fileName + '.txt'}],
      ephemeral: ephemeral,
    });
    return true;
  }

  interaction.reply({
    content: l10n.s(locale, 'cmd.super-admin.log.get-error'),
    ephemeral: ephemeral,
  });
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 */
function clear(context) {
  const {client, locale, interaction} = context;
  const {options} = interaction;

  const fileName = options.getString('log');
  const filePath = logger.getLogPath(fileName);

  if (fileExists(filePath) && (getFileSize(filePath) > 0)) {
    let response;
    if (fileName === 'client.log') {
      response = l10n.s(
          locale,
          'cmd.super-admin.log.clear-result.client-log',
      );
    } else if (fileName === 'error.log') {
      response = l10n.s(
          locale,
          'cmd.super-admin.log.clear-result.client-error-log',
      );
    } else {
      const serverId = fileName.slice(0, -4);
      const server = client.servers.find((s) => s.id === serverId);
      response = l10n.t(
          locale, 'cmd.super-admin.log.clear-result.server-log',
          '{SERVER}', server.name,
      );
    }

    if (logger.clearLog(fileName)) {
      interaction.reply({content: response, ephemeral: ephemeral});
      return true;
    }
  }

  interaction.reply({
    content: l10n.s(locale, 'cmd.super-admin.log.clear-error'),
    ephemeral: ephemeral,
  });
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 */
function clearAll(context) {
  const {locale, interaction} = context;

  logger.clearAllLog();

  interaction.reply({
    content: l10n.s(locale, 'cmd.super-admin.log.clear-all-result'),
    ephemeral: ephemeral,
  });

  return true;
}

/**
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

  switch (subCommand) {
    case 'get': return get(context);
    case 'clear': return clear(context);
    case 'clear-all': return clearAll(context);
    default:
  }

  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {client, locale, interaction} = context;

  const logList = [];

  let fPath = logger.getLogPath('client.log');

  if ((fileExists(fPath)) && (getFileSize(fPath) > 0)) {
    logList.push({
      name: l10n.s(locale, 'cmd.super-admin.log.client-log-name'),
      value: 'client.log',
    });
  }

  fPath = logger.getLogPath('client.error');

  if ((fileExists(fPath)) && (getFileSize(fPath) > 0)) {
    logList.push({
      name: l10n.s(locale, 'cmd.super-admin.log.client-error-log-name'),
      value: 'client.error',
    });
  }

  client.servers.forEach((server) => {
    const fName = server.id + '.log';
    const fPath = logger.getLogPath(fName);

    if ((fileExists(fPath)) && (getFileSize(fPath) > 0)) {
      logList.push({
        name: l10n.t(
            locale,
            'cmd.super-admin.log.server-log-name',
            '{SERVER}', server.name),
        value: fName,
      });
    }
  });

  interaction.respond(logList);
}
