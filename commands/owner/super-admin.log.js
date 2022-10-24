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

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 **/
export function get(context) {
  const {locale, interaction} = context;
  const {options} = interaction;

  const fileName = options.getString('log');
  const filePath = logger.getLogPath(fileName);
  if (fileExists(filePath) && (getFileSize(filePath) > 0)) {
    interaction.reply({
      content: l10n.s(locale, 'cmd.super-admin.log.get-result'),
      files: [{attachment: filePath, name: fileName}],
      ephemeral: true,
    });
    return true;
  }
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 */
function clear(context) {
  return false;
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
    case 'clear-all':
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
