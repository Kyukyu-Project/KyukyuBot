/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'admin.prefix';
export const name = 'prefix';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const settingKey = 'command-prefix';

const INFO_PREFIX         = `commands.${canonName}.info-prefix`;
const INFO_DEFAULT        = `commands.${canonName}.info-default`;
const ERROR_ZERO_LEN      = `commands.${canonName}.error-zero-length`;
const SET_SUCCESS         = `commands.${canonName}.set-success`;

const fInfo  = ['--info', '-i'];
const fSet   = ['--set', '-s'];

/**
  * @param {CommandContext|IContext} context
  * @return {object}
  */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const commandHint = l10n.s(lang, `commands.${canonName}.command-hint`);
  const infoHint = l10n.s(lang, `commands.${canonName}.info-hint`);
  const setHint = l10n.s(lang, `commands.${canonName}.set-hint`);
  const prefixHint = l10n.s(lang, `commands.${canonName}.prefix-hint`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(commandHint)
      .addSubcommand((c) => c
          .setName('info')
          .setDescription(infoHint))
      .addSubcommand((c) => c
          .setName('set')
          .setDescription(setHint)
          .addStringOption((option) => option
              .setName('prefix')
              .setDescription(prefixHint)
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

  if (context.hasAdminPermission) {
    const subCommand = interaction.options.getSubcommand();
    let result;
    switch (subCommand) {
      case 'set':
        const newPrefix = interaction.options.getString('prefix').trim();
        result = set(context, newPrefix);
        break;
      case 'info':
      default:
        result = view(context);
    }
    interaction.reply({content: result.response, ephemeral: true});
    return result.success;
  }
  const response = l10n.s(lang, 'messages.no-permission');
  interaction.reply({content: response, ephemeral: true});
  return false;
}

/**
 * @param {CommandContext} context
 * @param {string|null} newPrefix - id of new bot-command channel
 * @return {ActionResult}
 */
function set(context, newPrefix) {
  const {client, lang, guild} = context;
  const l10n = client.l10n;
  if (newPrefix) {
    client.updateGuildSettings(guild, settingKey, newPrefix);
    return {
      response: l10n.t(lang, SET_SUCCESS, '{PREFIX}', newPrefix),
      success: true,
    };
  }
  return {
    response: l10n.s(lang, ERROR_ZERO_LEN),
    success: false,
  };
}


/**
 * @param {CommandContext} context
 * @return {ActionResult}
 */
function view(context) {
  const {client, lang, guildSettings} = context;
  const l10n = client.l10n;
  const currPrefix = guildSettings[settingKey] || null;

  return {
    response:
        (currPrefix)?
        l10n.t(lang, INFO_PREFIX, '{PREFIX}', currPrefix):
        l10n.t(lang, INFO_DEFAULT, '{PREFIX}', client.defaultPrefix),
    success: true,
  };
}


/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {channel, message, args} = context;
  /** @type {ActionResult} */ let actionResult;

  if (args.length === 0) {
    actionResult = view(context);
  } else {
    const firstArg = args[0].toLowerCase();
    if (fInfo.includes(firstArg)) {
      actionResult = view(context);
    } else if (fSet.includes(firstArg) && (args.length > 1)) {
      actionResult = set(context, args[1]);
    } else {
      actionResult = view(context);
    }
  }

  channel.send({
    content: actionResult.response,
    reply: {messageReference: message.id},
  });
  return actionResult.success;
}
