/**
 * @typedef {import('../../typedef.js').CommandContext} CommandContext
 */
import {COMMAND_TYPE} from '../../typedef.js';

export const name = 'general.ping';
export const requireArgs = true;

export const commandType = COMMAND_TYPE.GENERAL;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  return context.channel.send({
    content: 'Pong!',
    reply: {messageReference: context.message.id},
  });
}
