/* eslint-disable max-len */
/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/role-manager.js').RoleCommandStrings} RoleCommandStrings
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import * as RoleManager from '../../src/role-manager.js';

export const canonName = 'admin.helper-roles';
export const name = 'helper-roles';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const settingKey = 'helper-roles';

/**
  * @param {CommandContext|IContext} context
  * @return {object}
  */
export function getSlashData(context) {
  const {client, lang} = context;
  return RoleManager.getSlashData(
      context, settingKey,
      RoleManager.getStrings(client.l10n, lang, name, canonName));
}

/**
  * @param {IContext} context
  * @return {boolean} - true if command is executed
  */
export async function slashExecute(context) {
  const {client, lang} = context;
  return RoleManager.slashExecute(
      context, settingKey,
      RoleManager.getStrings(client.l10n, lang, name, canonName));
}

/**
  * @param {CommandContext} context
  * @return {boolean} - true if command is executed
  */
export async function execute(context) {
  const {client, lang} = context;
  return RoleManager.execute(
      context, settingKey,
      RoleManager.getStrings(client.l10n, lang, name, canonName));
}
