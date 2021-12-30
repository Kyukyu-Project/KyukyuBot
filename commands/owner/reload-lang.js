/**
 * Update the source code from git
 */

/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';
import {wait} from '../../utils/utils.js';

export const canonName = 'owner.reload-lang';
export const name = 'owner.reload-lang';
export const requireArgs = true;
export const commandType = COMMAND_TYPE.OWNER;
export const cooldown = 0;

const COMMAND_SUCCESS     = `commands.${canonName}.success`;
const COMMAND_ERROR       = `commands.${canonName}.error`;
const PLEASE_WAIT         = `commands.${canonName}.please-wait`;

/**
 * @param {CommandContext} context
 * @return {Promise<boolean>}
 */
export async function execute(context) {
  const {client, lang, channel, args} = context;
  const l10n = client.l10n;

  client.pauseProcess = true;

  channel.send(l10n.s(lang, PLEASE_WAIT));
  wait(3);

  const successMessage = l10n.s(lang, COMMAND_SUCCESS);
  const failMessage = l10n.s(lang, COMMAND_ERROR);
  const result = l10n.reloadLanguage(args[0]);
  channel.send(result?successMessage:failMessage);

  client.pauseProcess = false;
  return result;
}
