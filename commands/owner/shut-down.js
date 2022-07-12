/**
 * Update the source code from git
 */

/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';

export const canonName = 'owner.shut-down';
export const name = 'shut-down';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.OWNER;
export const cooldown = 0;

const SHUT_DOWN_TIME      = 3 * 60 * 1000;
const SHUTTING_DOWN       = `commands.${canonName}.shutting-down`;

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}

/**
 * @param {IContext} context
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;

  if (!context.hasOwnerPermission) {
    const response = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: response, ephemeral: true});
    return false;
  }

  client.pauseProcess = true;
  interaction.reply({content: l10n.s(lang, SHUTTING_DOWN), ephemeral: true});
  setTimeout(()=> process.exit(0), SHUTTING_DOWN);
  return true;
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, lang, channel, message} = context;
  if (!context.hasOwnerPermission) return false;
  client.pauseProcess = true;
  channel.send({
    content: l10n.s(lang, SHUTTING_DOWN),
    reply: {messageReference: message.id},
  });
  setTimeout(()=> process.exit(0), SHUT_DOWN_TIME);
  return true;
}
