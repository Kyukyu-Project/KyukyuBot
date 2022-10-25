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
  const {locale, guild, interaction} = context;
  const fileName = guild.id + '.log';
  const filePath = logger.getLogPath(fileName);
  if (fileExists(filePath) && (getFileSize(filePath) > 0)) {
    interaction.reply({
      content: l10n.s(locale, 'cmd.bot-admin.log.get-result'),
      files: [{attachment: filePath, name: fileName + '.txt'}],
      ephemeral: ephemeral,
    });
    return true;
  }

  interaction.reply({
    content: l10n.s(locale, 'cmd.bot-admin.log.get-error'),
    ephemeral: ephemeral,
  });
  return false;
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean}
 */
function clear(context) {
  const {locale, guild, interaction} = context;
  const fileName = guild.id + '.log';

  if (logger.clearLog(fileName)) {
    interaction.reply({
      content: l10n.s(locale, 'cmd.bot-admin.log.clear-result'),
      ephemeral: ephemeral,
    });
    return true;
  }

  interaction.reply({
    content: l10n.s(locale, 'cmd.bot-admin.log.clear-error'),
    ephemeral: ephemeral,
  });
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
    default:
  }

  return false;
}
