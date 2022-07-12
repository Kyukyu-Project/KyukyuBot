/**
 * @typedef {import('../../src/typedef.js').DeploymentContext} DeploymentContext
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
*/
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {client} from '../../src/client.js';
import {l10n} from '../../src/l10n.js';
import {fastDeploy} from '../../src/deployment.js';

export const canonName = 'admin.slash-deploy';
export const name = 'slash-deploy';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const DEPLOY_THIS        = `commands.${canonName}.deploy-this`;
const DEPLOY_ALL         = `commands.${canonName}.deploy-all`;

/**
 * @param {DeploymentContext} context
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
  const {guild, lang, interaction} = context;

  if (guild.id === client.ownerGuildId) {
    interaction.reply({content: l10n.s(lang, DEPLOY_ALL), ephemeral: true});

    const guilds = Array
        .from(client.guilds.cache)
        .map(([name, value]) => value);

    for (let i=0; i<guilds.length; i++) {
      fastDeploy(guilds[i]);
    }
  } else {
    interaction.reply({content: l10n.s(lang, DEPLOY_THIS), ephemeral: true});
    fastDeploy(guild);
  }

  return true;
}
