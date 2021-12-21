/**
 * @typedef {import('../../typedef.js').CommandContext} CommandContext
 */
import {COMMAND_TYPE} from '../../typedef.js';

export const name = 'general.ping';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.GENERAL;
export const cooldown = 3;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  context.channel.send('Pong!');
  return true;
}
