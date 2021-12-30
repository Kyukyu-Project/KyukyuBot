/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */
import {COMMAND_TYPE} from '../../src/typedef.js';

export const canonName = 'general.help';
export const name = 'help';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.GENERAL;
export const cooldown = 1;

const OWNER               = `commands.${canonName}.owner-commands`;
const ADMIN               = `commands.${canonName}.admin-commands`;
const GENERAL             = `commands.${canonName}.general-commands`;
const OWNER_FLAGS         = `commands.${canonName}.flags.owner`;
const ADMIN_FLAGS         = `commands.${canonName}.flags.admin`;
const GENERAL_FLAGS       = `commands.${canonName}.flags.general`;

/**
 * List owner commands
 * @param {CommandContext} context
 * @return {boolean}
 */
function listOwner(context) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  if (!context.hasOwnerPermission) return false;

  const commandList = client.commands
      .filter((cmd)=>cmd.commandType==COMMAND_TYPE.OWNER)
      .map((cmd)=>cmd.name)
      .join(l10n.s(lang, 'delimiter'));

  const response = l10n.t( lang, OWNER, '{COMMANDS}', commandList);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * List guild administrator commands
 * @param {CommandContext} context
 * @return {boolean}
 */
function listAdmin(context) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  if (!context.hasAdminPermission) return false;

  const commandList = client.commands
      .filter((cmd)=>cmd.commandType==COMMAND_TYPE.ADMIN)
      .map((cmd)=>cmd.name)
      .join(l10n.s(lang, 'delimiter'));
  const response = l10n.t(lang, ADMIN, '{COMMANDS}', commandList);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * List general commands
 * @param {CommandContext} context
 * @return {boolean}
 */
function listGeneral(context) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  const commandList = client.commands
      .filter((cmd)=>cmd.commandType==COMMAND_TYPE.GENERAL)
      .map((cmd)=>cmd.name)
      .join(l10n.s(lang, 'delimiter'));
  const response = l10n.t(lang, GENERAL, '{COMMANDS}', commandList);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, channel, message, lang, commandPrefix, args} = context;
  const l10n = client.l10n;

  if (args.length == 0) return listGeneral(context);

  const firstArg = args[0].toLowerCase();
  const ownerFlags = l10n.s(lang, OWNER_FLAGS);
  const adminFlags = l10n.s(lang, ADMIN_FLAGS);
  const generalFlags = l10n.s(lang, GENERAL_FLAGS);

  if (ownerFlags.includes(firstArg)) return listOwner(context);
  if (adminFlags.includes(firstArg)) return listAdmin(context);
  if (generalFlags.includes(firstArg)) return listGeneral(context);

  const __cmdAlias =
    firstArg.startsWith(commandPrefix)?
    firstArg.slice(commandPrefix.length):
    firstArg;

  const __cmdCanonName =
    l10n.getCanonicalName(lang, 'aliases.commands', __cmdAlias);

  if (!__cmdCanonName) return false;

  const __cmd = client.commands.get(__cmdCanonName);

  switch (__cmd.commandType) {
    case COMMAND_TYPE.OWNER:
      if (!context.hasOwnerPermission) return false;
      break;
    case COMMAND_TYPE.ADMIN:
      if (!context.hasAdminPermission) return false;
      break;
  }

  const helpTxt = l10n.getCommandHelp(lang, __cmdCanonName);
  if (helpTxt) {
    channel.send({
      content: '```' + helpTxt.replaceAll('?', commandPrefix) + '```',
      reply: {messageReference: message.id},
    });
    return true;
  }

  return false;
}
