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

  let shellCommand = '';
  switch (interaction.options.getSubcommand()) {
    case 'git-pull': shellCommand = 'git pull'; break;
    case 'npm-update': shellCommand = 'npm update'; break;
    case 'npm-run-build': shellCommand = 'npm run build'; break;
    case 'npm-run-deploy': shellCommand = 'npm run deploy'; break;
  }

  interaction.deferReply();

  return new Promise((resolve, reject) => {
    exec(shellCommand, (error, stdout, stderr) => {
      if (error) {
        interaction.editReply(
            l10n.s(locale, 'cmd.super-admin.run.error') + '\n' +
            '```' + stderr + '```',
        );
        reject(error);
      } else {
        interaction.editReply(
            l10n.s(locale, 'cmd.super-admin.run.result') + '\n' +
            '```' + stdout + '```',
        );
        resolve(true);
      }
    });
  });
}
