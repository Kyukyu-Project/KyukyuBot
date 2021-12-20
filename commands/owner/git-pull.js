/**
 * Update the source code from git
 */

/**
* @typedef {import('../../typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../typedef.js';

// import {promisify} from 'util';
import {exec} from 'child_process';

// const execProcess = promisify(exec);

export const name = 'owner.git-pull';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.OWNER;

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
