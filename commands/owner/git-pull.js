/**
 * Update the source code from git
 */

/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import {exec} from 'child_process';

import {l10n} from '../../src/l10n.js';

export const canonName = 'owner.git-pull';
export const name = 'git-pull';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.OWNER;
export const cooldown = 0;

const COMMAND_SUCCESS     = `commands.${canonName}.success`;
const COMMAND_ERROR       = `commands.${canonName}.error`;

/**
 * @param {CommandContext} context
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
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;
  return new Promise((resolve, reject) => {
    exec('git pull', (error, stdout, stderr) => {
      if (error) {
        interaction.reply({
          content: l10n.t(lang, COMMAND_ERROR, '{LOG}', stderr),
          ephemeral: true});
        reject(new Error(stderr));
      } else {
        interaction.reply({
          content: l10n.t(lang, COMMAND_SUCCESS, '{LOG}', stdout),
          ephemeral: true});
        resolve(true);
      }
    });
  });
}

/**
 * @param {CommandContext} context
 * @return {Promise<boolean>}
 */
export async function execute(context) {
  const {lang, channel} = context;
  return new Promise((resolve, reject) => {
    exec('git pull', (error, stdout, stderr) => {
      if (error) {
        channel.send(l10n.t(lang, COMMAND_ERROR, '{LOG}', stderr));
        reject(new Error(stderr));
      } else {
        channel.send(l10n.t(lang, COMMAND_SUCCESS, '{LOG}', stdout));
        resolve(true);
      }
    });
  });
}
