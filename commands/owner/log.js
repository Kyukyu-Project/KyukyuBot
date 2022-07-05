/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {statSync} from 'fs';

import {SlashCommandBuilder} from '@discordjs/builders';

import {COMMAND_PERM} from '../../src/typedef.js';
import {logger} from '../../src/logger.js';

export const canonName = 'owner.log';
export const name = 'log';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.OWNER;
export const cooldown = 0;

const LOG_ATTACHED        = `commands.${canonName}.log-attached`;
const LOG_IS_EMPTY        = `commands.${canonName}.log-is-empty`;
const LOG_CLEARED         = `commands.${canonName}.log-cleared`;
const ALL_LOG_CLEARED     = `commands.${canonName}.all-log-cleared`;

const scGetLabel   = 'get';
const scClearLabel  = 'clear';
const optGuildLabel = 'server';

/**
  * @param {CommandContext|IContext} context
  * @return {object}
  */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scGetHint = l10n.s(lang, `commands.${canonName}.sc-get-hint`);
  const scClearHint = l10n.s(lang, `commands.${canonName}.sc-clear-hint`);
  const optGuildHint = l10n.s(lang, `commands.${canonName}.opt-guild-hint`);
  const choiceAllLabel = l10n.s(lang, `commands.${canonName}.choice-all-label`);

  const guildChoices = client.guilds.cache.map((g) => [g.name, g.id]);
  const guildChoicesAll = guildChoices.concat([[choiceAllLabel, 'all']]);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((c) => c
          .setName(scGetLabel)
          .setDescription(scGetHint)
          .addStringOption((option) => option
              .setName(optGuildLabel)
              .setDescription(optGuildHint)
              .setChoices(guildChoices)
              .setRequired(true),
          ),
      )
      .addSubcommand((c) => c
          .setName(scClearLabel)
          .setDescription(scClearHint)
          .addStringOption((option) => option
              .setName(optGuildLabel)
              .setDescription(optGuildHint)
              .setChoices(guildChoicesAll)
              .setRequired(true),
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

  if (context.hasOwnerPermission) {
    const subCommand = interaction.options.getSubcommand();
    const guildId = interaction.options.getString(optGuildLabel);
    if (subCommand === scGetLabel) {
      const guild = client.guilds.cache.get(guildId);
      const filePath = logger.getLogPath(guildId);
      const {size: fileSize} = statSync(filePath);
      if (fileSize) {
        interaction.reply({
          content: l10n.t(lang, LOG_ATTACHED, '{GUILD}', guild.name),
          files: [{attachment: filePath, name: `${guildId}.log`}],
          ephemeral: true,
        });
      } else {
        interaction.reply({
          content: l10n.t(lang, LOG_IS_EMPTY, '{GUILD}', guild.name),
          ephemeral: true,
        });
      }
    } else if (subCommand === scClearLabel) {
      if (guildId !== 'all') {
        const guild = client.guilds.cache.get(guildId);
        logger.clearLog(guildId);
        interaction.reply({
          content: l10n.t(lang, LOG_CLEARED, '{GUILD}', guild.name),
          ephemeral: true,
        });
      } else {
        logger.clearAllLog();
        interaction.reply({
          content: l10n.s(lang, ALL_LOG_CLEARED),
          ephemeral: true,
        });
      }
    }
    return true;
  }
  const response = l10n.s(lang, 'messages.no-permission');
  interaction.reply({content: response, ephemeral: true});
  return false;
}
