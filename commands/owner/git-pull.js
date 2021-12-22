/**
 * Update the source code from git
 */

/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';

import {exec} from 'child_process';

export const name = 'owner.git-pull';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.OWNER;
export const cooldown = 0;

const COMMAND_SUCCESS     = `commands.${name}.success`;
const COMMAND_ERROR       = `commands.${name}.error`;

/**
 * @param {CommandContext} context
 * @return {Promise<boolean>}
 */
export async function execute(context) {
  const {client, lang, channel} = context;
  return new Promise((resolve, reject) => {
    exec('git pull', (error, stdout, stderr) => {
      if (error) {
        channel.send(client.l10n.t(lang, COMMAND_ERROR, '{LOG}', stderr));
      } else {
        channel.send(client.l10n.t(lang, COMMAND_SUCCESS, '{LOG}', stdout));
      }
      resolve(error? false : true);
    });
  });
}
