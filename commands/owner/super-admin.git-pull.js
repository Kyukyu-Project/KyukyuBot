/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {exec} from 'child_process';

import {PermissionFlagsBits} from 'discord.js';
import {l10n} from '../../src/l10n.js';

const requiredAppPermissions = PermissionFlagsBits.SendMessages;

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  const {locale, appPermissions} = interaction;

  if (!appPermissions.has(requiredAppPermissions)) {
    interaction.reply(
        l10n.s(locale, 'messages.command-error.no-app-permission'),
    );
    return false;
  }

  return new Promise((resolve, reject) => {
    exec('git pull', (error, stdout, stderr) => {
      if (error) {
        interaction.reply(
            l10n.s(locale, 'cmd.super-admin.git-pull.error') + '\n' +
            '```' + stderr + '```',
        );
        reject(error);
      } else {
        interaction.reply(
            l10n.s(locale, 'cmd.super-admin.git-pull.result') + '\n' +
            '```' + stdout + '```',
        );
        resolve(true);
      }
    });
  });
}
