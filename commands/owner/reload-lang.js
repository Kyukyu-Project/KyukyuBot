/**
 * Update the source code from git
 */

/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
*/

import {COMMAND_PERM} from '../../src/typedef.js';
import {wait} from '../../utils/utils.js';

export const canonName = 'owner.reload';
export const name = 'reload';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.OWNER;
export const cooldown = 0;

const COMMAND_SUCCESS     = `commands.${canonName}.success`;
const COMMAND_ERROR       = `commands.${canonName}.error`;
const PLEASE_WAIT         = `commands.${canonName}.please-wait`;
const INVALID_COMMAND     = `messages.invalid-command`;

const fLang    = ['--lang', '--language', '-l'];
const fCommand = ['--command', '--cmd', '-c'];

/**
 * @param {CommandContext} context
 * @param {string} langCode - language code
 * @return {ActionResult}
 */
function reloadLang(context, langCode) {
  const {client, lang, channel} = context;

  client.pauseProcess = true;

  channel.send(l10n.s(lang, PLEASE_WAIT));
  wait(3);

  const result = l10n.reloadLanguage(langCode);

  client.pauseProcess = false;

  if (result) {
    return {
      response: l10n.s(lang, COMMAND_SUCCESS),
      success: true,
    };
  } else {
    return {
      response: l10n.s(lang, COMMAND_ERROR),
      success: false,
    };
  }
}

/**
 * @param {CommandContext} context
 * @param {string} cmdName - command name
 * @return {ActionResult}
 */
async function reloadCommand(context, cmdName) {
  const {client, lang, channel} = context;
  const {l10n, commands} = client;

  channel.send(l10n.s(lang, PLEASE_WAIT));
  wait(3);

  const cmdCanonName =
    l10n.getCanonicalName(lang, 'aliases.commands', cmdName);

  if (cmdCanonName) {
    try {
      client.pauseProcess = true;
      const sourceUrl =
          commands.getSourcePath(cmdCanonName) +
          '?update=' + (new Date()).getTime();
      const newCmd = await import(sourceUrl);
      l10n.set(cmdCanonName, newCmd);
      client.pauseProcess = false;
      return {
        response: l10n.s(lang, COMMAND_SUCCESS),
        success: true,
      };
    } catch (error) {
      console.error(error);
    }
  }

  client.pauseProcess = false;

  return {
    response: l10n.s(lang, COMMAND_ERROR),
    success: false,
  };
}

/**
 * @param {CommandContext} context
 * @return {Promise<boolean>}
 */
export async function execute(context) {
  const {client, channel, message, args} = context;
  const l10n = client.l10n;

  /** @type {ActionResult} */ let actionResult;

  const firstArg = args[0].toLowerCase();
  if (fLang.includes(firstArg)) {
    actionResult = reloadLang(context, args?.[1] || l10n.defaultLang);
  } else if (fCommand.includes(firstArg) && (args.length > 1)) {
    actionResult = await reloadCommand(context, args[1]);
  } else {
    actionResult = {response: l10n.s(lang, INVALID_COMMAND), success: false};
  }

  channel.send({
    content: String(actionResult.response),
    reply: {messageReference: message.id},
  });
  return actionResult.success;
}
