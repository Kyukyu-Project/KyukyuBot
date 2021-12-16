/**
 * Update the source code from git
 */

/**
* @typedef {import('../../typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../typedef.js';

import {exec} from 'child_process';

export const name = 'owner.git-pull';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.OWNER;

const keyPrefix = `commands.${name}`;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, lang, channel} = context;
  const l10n = client.l10n;
  exec('git pull', (error, stdout, stderr) => {
    if (error) {
      return channel.send(
          l10n.t(lang, `${keyPrefix}.error`, '{LOG}', stderr));
    } else {
      return channel.send(
          l10n.t(lang, `${keyPrefix}.success`), '{LOG}', stdout);
    }
  });
}
