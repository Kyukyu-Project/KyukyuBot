/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';

import {deploy} from '../../app.js';

export const canonName = 'admin.slash-deploy';
export const name = 'slash-deploy';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;
export const cooldown = 0;

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  return deploy(context.guild, context.lang);
}
