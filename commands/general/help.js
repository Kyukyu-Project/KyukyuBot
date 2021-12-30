/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */
import {COMMAND_TYPE} from '../../src/typedef.js';

export const canonName = 'general.help';
export const name = 'help';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.GENERAL;
export const cooldown = 1;

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, channel, message, lang, commandPrefix, args} = context;

  if (args.length == 0) return; // TODO: list all commands

  const __cmdAlias = args[0];
  const __cmdName =
    client.l10n.getCanonicalName(lang, 'aliases.commands', __cmdAlias);

  if (!__cmdName) return false;

  const __cmd = client.commands.get(__cmdName);

  switch (__cmd.commandType) {
    case COMMAND_TYPE.OWNER:
      if (!context.hasOwnerPermission) return false;
      break;
    case COMMAND_TYPE.ADMIN:
      if (!context.hasAdminPermission) return false;
      break;
  }

  const helpTxt = client.l10n.getCommandHelp(lang, __cmdName);
  if (helpTxt) {
    channel.send({
      content: '```' + helpTxt.replaceAll('?', commandPrefix) + '```',
      reply: {messageReference: message.id},
    });
    return true;
  }

  return false;
}
