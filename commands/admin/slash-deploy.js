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

const REFRESH_START       = `commands.${canonName}.refresh-start`;
const REFRESH_SUCCESS     = `commands.${canonName}.refresh-success`;
const REFRESH_ERROR       = `commands.${canonName}.refresh-error`;

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, user, lang, guild, channel} = context;
  const {l10n} = client;
  const userTag = `<@${user.id}>`;

  channel.send(l10n.t(lang, REFRESH_START, '{USER TAG}', userTag));

  return new Promise((resolve, reject) => {
    deploy(context).then(() => {
      channel.send(l10n.t(lang, REFRESH_SUCCESS, '{USER TAG}', userTag));
      resolve(true);
    }).catch((error) => {
      channel.send(l10n.t(lang, REFRESH_ERROR, '{USER TAG}', userTag));
      reject(error);
    });
  });
}
