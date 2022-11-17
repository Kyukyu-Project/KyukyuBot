/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {PermissionFlagsBits} from 'discord.js';
import {l10n} from '../../src/l10n.js';

const requiredAppPermissions = PermissionFlagsBits.SendMessages;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {client, interaction} = context;
  const {locale, appPermissions} = interaction;

  if (!appPermissions.has(requiredAppPermissions)) {
    interaction.reply(
        l10n.s(locale, 'messages.command-error.no-app-permission'),
    );
    return false;
  }
  interaction.reply(l10n.s(locale, 'cmd.super-admin.shut-down.result'));

  client.pauseProcess = true;
  setTimeout(()=> process.exit(0), 10 * 1000);
  return true;
}
