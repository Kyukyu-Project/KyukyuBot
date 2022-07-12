/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';

import {l10n} from '../../src/l10n.js';

export const canonName = 'general.ping';
export const name = 'ping';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 3;

const PING_PONG           = `commands.${canonName}.ping-pong`;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {channel, lang, commandAliasUsed} = context;
  const aliasUsed = commandAliasUsed.toLowerCase();

  /** @type {string[]} */
  const pingPong = l10n.s(lang, PING_PONG);

  if (Array.isArray(pingPong)) {
    const pingIdx = pingPong.findIndex((el)=>el.toLowerCase() == aliasUsed);
    if (pingIdx !== -1) {
      channel.send(pingPong[pingIdx+1]);
      return true;
    }
  }
  return true;
}
