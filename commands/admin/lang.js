/**
 * @typedef {import('../../src/typedef.js').DeploymentContext} DeploymentContext
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';
import {slowDeploy} from '../../src/deployment.js';

export const canonName = 'admin.lang';
export const name = 'lang';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const settingKey = 'lang';

const SET_SUCCESS         = `commands.${canonName}.set-success`;
const INVALID_COMMAND     = `messages.invalid-command`;
const optLangLabel        = 'language';
const fSet                = ['--set', '-s'];

/**
 * @param {DeploymentContext} context
 * @return {SlashCommandBuilder}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scSetHint = l10n.s(lang, `commands.${canonName}.sc-set-hint`);
  const optLangHint = l10n.s(lang, `commands.${canonName}.opt-lang-hint`);
  const choices = Array.from(l10n.keys()).map((langCode) => ({
    name: l10n.s(lang, `languages.${langCode}`),
    value: langCode,
  }));

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((c) => c.setName('set').setDescription(scSetHint)
          .addStringOption((option) => option
              .setName(optLangLabel)
              .setDescription(optLangHint)
              .setRequired(true)
              .addChoices(...choices),
          ),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  if (context.hasAdminPermission) {
    const newLanguage = interaction.options.getString('language');

    /** @type {ActionResult}*/
    const result = set(context, newLanguage);

    interaction.reply({content: result.response, ephemeral: true});
    return result.success;
  }
  const response = l10n.s(lang, 'messages.no-permission');
  interaction.reply({content: response, ephemeral: true});
  return false;
}

/**
 * @param {CommandContext} context
 * @param {string|null} langCode - new language
 * @return {ActionResult}
 */
function set(context, langCode) {
  const {guild, guildSettings} = context;
  const currLang = context.lang;

  if (l10n.has(langCode)) {
    if (guildSettings.lang !== langCode) {
      servers.updateSettings(guild, settingKey, langCode);
      slowDeploy(guild);
    }
    const langDisplay = l10n.s(langCode, `languages.${langCode}`);
    return {
      response: l10n.t(langCode, SET_SUCCESS, '{LANG}', langDisplay),
      success: true,
    };
  }
  return {
    response: l10n.s(currLang, INVALID_COMMAND),
    success: false,
  };
}
/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {channel, message, args} = context;
  if ((args.length >= 2) && (fSet.includes(args[0].toLowerCase()))) {
    /** @type {ActionResult} */ const actionResult = set(context, args[1]);
    channel.send({
      content: actionResult.response,
      reply: {messageReference: message.id},
    });
    return actionResult.success;
  }
}
