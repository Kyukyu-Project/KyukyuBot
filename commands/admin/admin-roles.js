/* eslint-disable max-len */
/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/role-manager.js').RoleCommandStrings} RoleCommandStrings
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import * as RoleManager from '../../src/role-manager.js';

export const canonName = 'admin.admin-roles';
export const name = 'admin-roles';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const settingKey = 'admin-roles';

/**
  * Get translation strings
  * @param {object} l10n
  * @param {string} lang
  * @return {RoleCommandStrings}
  */
function getStrings(l10n, lang) {
  const s1 =
      {
        'command-name': name,
        'no-permission': l10n.s(lang, 'messages.no-permission'),
        'invalid-command': l10n.s(lang, 'messages.invalid-command'),
        'delimiter': l10n.s(lang, 'delimiter'),
        'please-update': l10n.s(lang, 'commands.common.roles.please-update'),
        'role-to-add-hint': l10n.s(lang, 'commands.common.roles.role-to-add-hint'),
        'role-to-remove-hint': l10n.s(lang, 'commands.common.roles.role-to-remove-hint'),
      };
  const s2 = [
    'command-hint',
    'info-desc', 'info-one', 'info-many', 'info-none',
    'add-one', 'add-many',
    'remove-one', 'remove-many',
    'error-add-none', 'error-add-one', 'error-remove-one', 'error-remove-none',
    'info-hint', 'add-hint', 'remove-hint', 'clear-hint',
  ].reduce((res, prop)=> {
    res[prop] = l10n.s(lang, `commands.${canonName}.${prop}`);
    return res;
  }, {});

  const strings = Object.assign(s1, s2);
  return strings;
}

/**
  * @param {CommandContext|IContext} context
  * @return {object}
  */
export function getSlashData(context) {
  const {client, lang} = context;
  return RoleManager
      .getSlashData(context, settingKey, getStrings(client.l10n, lang));
}

/**
  * @param {IContext} context
  * @return {boolean} - true if command is executed
  */
export async function slashExecute(context) {
  const {client, lang} = context;
  return RoleManager
      .slashExecute(context, settingKey, getStrings(client.l10n, lang));
}

/**
  * @param {CommandContext} context
  * @return {boolean} - true if command is executed
  */
export async function execute(context) {
  const {client, lang} = context;
  return RoleManager
      .execute(context, settingKey, getStrings(client.l10n, lang));
}
