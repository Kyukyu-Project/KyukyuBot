/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_TYPE} from '../../src/typedef.js';

export const canonName = 'admin.mod-roles';
export const name = 'mod-roles';
export const requireArgs = false;
export const commandType = COMMAND_TYPE.ADMIN;
export const cooldown = 0;

import {getRoleId} from '../../utils/utils.js';

const SHOW_MODE_ROLES     = `commands.${canonName}.show-mod-roles`;
const NO_MOD_ROLES        = `commands.${canonName}.no-mod-roles`;
const ADD_SUCCESS         = `commands.${canonName}.add-success`;
const DEL_SUCCESS         = `commands.${canonName}.del-success`;
const INVALID_COMMAND     = `messages.invalid-command`;
const VIEW_FLAGS          = `commands.${canonName}.flags.view`;
const ADD_FLAGS           = `commands.${canonName}.flags.add`;
const DEL_FLAGS           = `commands.${canonName}.flags.del`;
const RESET_FLAGS         = `commands.${canonName}.flags.reset`;

/**
 * @param {CommandContext} context
 * @param {number} firstArgIdx - index to first item
 * @return {boolean}
 */
function addRoles(context, firstArgIdx) {
  const {client, lang, guild, guildSettings, channel, message, args} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  const modRoles = guildSettings['mod-roles'] || [];
  const addedRoles = [];

  let argIdx = firstArgIdx;
  while (argIdx < args.length) {
    const newModId = getRoleId(args[argIdx]);
    if (
      (newModId) &&
      (modRoles.indexOf(newModId) == -1) &&
      (addedRoles.indexOf(newModId) == -1)
    ) {
      addedRoles.push(newModId);
    }
    argIdx++;
  }
  if (addedRoles.length) {
    guildSettings['mod-roles'] = modRoles.concat(addedRoles);
    client.updateGuildSettings(guild, guildSettings);
    const addedRoleList = addedRoles
        .map((el)=>`<@&${el}>`)
        .join(l10n.s(lang, 'delimiter'));
    response = l10n.t(lang, ADD_SUCCESS, '{ROLES}', addedRoleList);
    result = true;
  } else {
    response = l10n.s(lang, INVALID_COMMAND);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @param {number} firstArgIdx - index to first item
 * @return {boolean}
 */
function delRoles(context, firstArgIdx) {
  const {client, lang, guild, guildSettings, channel, message, args} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  const modRoles = guildSettings['mod-roles'] || [];
  const deletedRoles = [];

  let argIdx = firstArgIdx;
  while (argIdx < args.length) {
    const oldModId = getRoleId(args[argIdx]);
    if (oldModId) {
      const spiceAt = modRoles.indexOf(oldModId);
      if (spiceAt !== -1) {
        modRoles.splice(spiceAt, 1);
        deletedRoles.push(oldModId);
      }
    }
    argIdx++;
  }

  if (deletedRoles.length) {
    client.updateGuildSettings(guild, guildSettings);
    const deletedRoleList = deletedRoles
        .map((el)=>`<@&${el}>`)
        .join(l10n.s(lang, 'delimiter'));
    response = l10n.t(lang, DEL_SUCCESS, '{ROLES}', deletedRoleList);
    result = true;
  } else {
    response = l10n.s(lang, INVALID_COMMAND);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @return {boolean}
 */
function reset(context) {
  const {client, lang, guild, guildSettings, channel, message} = context;
  const l10n = client.l10n;
  let response;
  let result = false;

  const modRoles = guildSettings['mod-roles'];
  if (modRoles.length) {
    const deletedRoleList = modRoles
        .map((el)=>`<@&${el}>`)
        .join(l10n.s(lang, 'delimiter'));
    guildSettings['mod-roles'] = [];
    client.updateGuildSettings(guild, guildSettings);
    response = l10n.t(lang, DEL_SUCCESS, '{ROLES}', deletedRoleList);
    result = true;
  } else {
    response = l10n.s(lang, NO_MOD_ROLES);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return result;
}

/**
 * @param {CommandContext} context
 * @return {boolean}
 */
function view(context) {
  const {client, lang, guildSettings, channel, message} = context;
  const l10n = client.l10n;
  let response;

  const modRoles = guildSettings['mod-roles'];
  if (modRoles.length) {
    const roleList = modRoles
        .map((el)=>`<@&${el}>`)
        .join(l10n.s(lang, 'delimiter'));
    response = l10n.t(lang, SHOW_MODE_ROLES, '{ROLES}', roleList);
  } else {
    response = l10n.s(lang, NO_MOD_ROLES);
  }

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, lang, args} = context;
  const l10n = client.l10n;

  if (args.length == 0) return view(context);

  const firstArg = args[0].toLowerCase();
  const viewFlags = l10n.s(lang, VIEW_FLAGS);
  const addFlags = l10n.s(lang, ADD_FLAGS);
  const delFlags = l10n.s(lang, DEL_FLAGS);
  const resetFlags = l10n.s(lang, RESET_FLAGS);

  if (viewFlags.includes(firstArg)) return view(context);

  if (resetFlags.includes(firstArg)) return reset(context);

  if (delFlags.includes(firstArg) && (args.length > 1)) {
    return delRoles(context, 1);
  }

  if (addFlags.includes(firstArg) && (args.length > 1)) {
    return addRoles(context, 1);
  }

  return view(context);
}
