/**
 * Update the source code from git
 */

/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
*/

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'owner.reload';
export const name = 'reload';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.OWNER;
export const cooldown = 0;

const RELOADING_LANG      = `commands.${canonName}.reloading-lang`;
const LANG_RELOADED       = `commands.${canonName}.lang-reloaded`;
// const LANG_RELOADING_ERR  = `commands.${canonName}.lang-reloading-error`;

const RELOADING_CMD      = `commands.${canonName}.reloading-cmd`;
const CMD_RELOADED       = `commands.${canonName}.cmd-reloaded`;
const CMD_RELOADING_ERR  = `commands.${canonName}.cmd-reloading-error`;

const INVALID_COMMAND     = `messages.invalid-command`;

const scGeneralLabel  = 'general-command';
const scAdminLabel    = 'admin-command';
const scOwnerLabel    = 'owner-command';
const optCommandLabel = 'command-name';
const scLangLabel  = 'language';
const optLangLabel = 'language';

const fLang    = ['--lang', '--language', '-l'];
const fCommand = ['--command', '--cmd', '-c'];

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;
  // if (guild.id !== client.ownerGuildId) return null;
  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scGeneralHint = l10n.s(lang, `commands.${canonName}.sc-general-hint`);
  const scAdminHint = l10n.s(lang, `commands.${canonName}.sc-admin-hint`);
  const scOwnerHint = l10n.s(lang, `commands.${canonName}.sc-owner-hint`);
  const optCommandHint = l10n.s(lang, `commands.${canonName}.opt-cmd-hint`);
  const scLangHint = l10n.s(lang, `commands.${canonName}.sc-lang-hint`);
  const optLangHint = l10n.s(lang, `commands.${canonName}.opt-lang-hint`);
  const generalChoices = [];
  const adminChoices = [];
  const ownerChoices = [];

  client.commands.forEach((cmd) => {
    const choice = [cmd.name, cmd.canonName];
    switch (cmd.commandPerm) {
      case COMMAND_PERM.OWNER: ownerChoices.push(choice); break;
      case COMMAND_PERM.ADMIN: adminChoices.push(choice); break;
      case COMMAND_PERM.GENERAL:
      default: generalChoices.push(choice); break;
    }
  });

  const langChoices = Array.from(l10n.keys()).map((langCode) =>
    [l10n.s(lang, `languages.${langCode}`), langCode]);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((command) => command
          .setName(scGeneralLabel)
          .setDescription(scGeneralHint)
          .addStringOption((option) => option
              .setName(optCommandLabel)
              .setDescription(optCommandHint)
              .setRequired(true)
              .addChoices(generalChoices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scAdminLabel)
          .setDescription(scAdminHint)
          .addStringOption((option) => option
              .setName(optCommandLabel)
              .setDescription(optCommandHint)
              .setRequired(true)
              .addChoices(adminChoices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scOwnerLabel)
          .setDescription(scOwnerHint)
          .addStringOption((option) => option
              .setName(optCommandLabel)
              .setDescription(optCommandHint)
              .setRequired(true)
              .addChoices(ownerChoices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scLangLabel)
          .setDescription(scLangHint)
          .addStringOption((option) => option
              .setName(optLangLabel)
              .setDescription(optLangHint)
              .setRequired(true)
              .addChoices(langChoices),
          ),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;

  if (!context.hasOwnerPermission) {
    const response = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: response, ephemeral: true});
    return false;
  }

  const subCommand = interaction.options.getSubcommand();

  if ((subCommand === scLangLabel)) {
    client.pauseProcess = true;
    interaction.reply({
      content: l10n.s(lang, RELOADING_LANG),
      ephemeral: true,
    });

    const langCode =
        interaction.options.getString(optLangLabel) ||
        l10n.defaultLang;

    const reloadLangFunctions = [
      new Promise((resolve) => setTimeout(resolve, 3 * 1000)),
      async () => l10n.reloadLanguage(langCode),
    ];

    return Promise
        .all(reloadLangFunctions)
        .then(() => {
          interaction.editReply(l10n.s(lang, LANG_RELOADED));
          client.pauseProcess = false;
          return true;
        });
  } else {
    client.pauseProcess = true;
    interaction.reply({
      content: l10n.s(lang, RELOADING_CMD),
      ephemeral: true,
    });

    const cmdCanonName = interaction.options.getString(optCommandLabel);

    const reloadCmdFunctions = [
      new Promise((resolve) => setTimeout(resolve, 3 * 1000)),
      new Promise((resolve, reject) => client.commands
          .reloadCommand(cmdCanonName)
          .then(()=> resolve(true))
          .catch((err) => reject(err)),
      ),
    ];

    return Promise
        .all(reloadCmdFunctions)
        .then(() => {
          interaction.editReply(l10n.s(lang, CMD_RELOADED));
          client.pauseProcess = false;
          return true;
        })
        .catch((error) => {
          interaction.editReply(l10n.s(lang, CMD_RELOADING_ERR));
          console.error(error);
          client.pauseProcess = false;
          return false;
        });
  }
}


/**
 * @param {CommandContext} context
 * @return {Promise<boolean>}
 */
export async function execute(context) {
  const {client, lang, channel, message, args} = context;
  const l10n = client.l10n;

  const firstArg = args[0].toLowerCase();

  if (fLang.includes(firstArg)) {
    client.pauseProcess = true;
    channel.send(l10n.s(lang, RELOADING_LANG));

    const langCode = args?.[1] || l10n.defaultLang;

    const reloadLangFunctions = [
      new Promise((resolve) => setTimeout(resolve, 3 * 1000)),
      async () => l10n.reloadLanguage(langCode),
    ];

    return Promise
        .all(reloadLangFunctions)
        .then(() => {
          channel.send({
            content: l10n.s(lang, LANG_RELOADED),
            reply: {messageReference: message.id},
          });
          client.pauseProcess = false;
          return true;
        }) /*
        // l10n.reloadLanguage never throws an error
        .catch(() => {
          channel.send({
            content: l10n.s(lang, LANG_RELOADING_ERR),
            reply: {messageReference: message.id},
          });
          client.pauseProcess = false;
          return false;
        }) */;
  } else if (fCommand.includes(firstArg)) {
    client.pauseProcess = true;
    channel.send(l10n.s(lang, RELOADING_CMD));

    const cmdCanonName =
        l10n.getCanonicalName(lang, 'aliases.commands', args[1]);

    const reloadCmdFunctions = [
      new Promise((resolve) => setTimeout(resolve, 3 * 1000)),
      new Promise((resolve, reject) => client.commands
          .reloadCommand(cmdCanonName)
          .then(()=> resolve(true))
          .catch((err) => reject(err)),
      ),
    ];

    return Promise
        .all(reloadCmdFunctions)
        .then(() => {
          channel.send({
            content: l10n.s(lang, CMD_RELOADED),
            reply: {messageReference: message.id},
          });
          client.pauseProcess = false;
          return true;
        })
        .catch((error) => {
          channel.send({
            content: l10n.s(lang, CMD_RELOADING_ERR),
            reply: {messageReference: message.id},
          });
          console.error(error);
          client.pauseProcess = false;
          return false;
        });
  } else {
    channel.send({
      content: l10n.s(lang, INVALID_COMMAND),
      reply: {messageReference: message.id},
    });
    return false;
  }
}
