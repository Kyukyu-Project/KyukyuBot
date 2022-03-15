/*
 * Role command helper
 **/

/* eslint max-len: ["error", { "ignoreComments": true }] */

/**
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').InteractionContext} IContext
 */

import {getRoleId} from '../utils/utils.js';

import {SlashCommandBuilder} from '@discordjs/builders';
const fInfo   = ['--info', '-i'];
const fAdd    = ['--add', '-a', '+'];
const fRemove = ['--remove', '-r', '-'];
const fClear  = ['--clear', '-c'];

/**
 * @typedef {Object} RoleCommandStrings
 * @property {string} `command-name` - command name
 * @property {string} `command-hint` - "View, add, or remove the XXX roles"
 * @property {string} `info-desc' - "Users with XXX roles can..."
 * @property {string} `info-one'  - "XXX role: {ROLE}"
 * @property {string} `info-many' - "XXX roles: {ROLES}"
 * @property {string} `info-none' - "XXX roles: none"
 * @property {string} `error-add-none` - "XXX role added: none"
 * @property {string} `add-one`  - "Done! 1 role has been added: {ROLE}"
 * @property {string} `add-many' - "Done! {COUNT} roles have been added: {ROLES}"
 * @property {string} `remove-one`  - "Done! 1 role has been removed: {ROLE}"
 * @property {string} `remove-many' - "Done! {COUNT} roles have been removed: {ROLES}"
 * @property {string} `clear-one`  - "Done! 1 role has been removed: {ROLE}"
 * @property {string} `clear-many' - "Done! {COUNT} roles have been removed: {ROLES}"
 * @property {string} `error-remove-none` - "Error: {ROLE} is not an mod role"
 * @property {string} `error-empty-list` - "Error: the list of XXX roles is already empty"
 * @property {string} `info-hint`   - "Show information about the XXX roles"
 * @property {string} `add-hint'    - "Add a role to the list of XXX roles"
 * @property {string} `remove-hint' - "Remove a role from the list of XXX roles"
 * @property {string} `clear`-hint  - "Clear (reset) the list of XXX roles"
 * @property {string} `role-to-add-hint` - "Role to add"
 * @property {string} `role-to-remove-hint` - "Role to remove"
 * @property {string} `delimiter` - List delimiter (", ")
 * @property {string} `please-update` - "Please update..."
 */

/**
 * @typedef {Object} RoleActionResult
 * @property {string} response - Response message
 * @property {boolean} success - Is the command successful?
 */

/**
  * Get translation strings
  * @param {object} l10n
  * @param {string} lang - language
  * @param {string} name - command name
  * @param {string} canonName - command canonical name
  * @return {RoleCommandStrings}
  */
export function getStrings(l10n, lang, name, canonName) {
  const strings = {
    'command-name': name,
    'delimiter': l10n.s(lang, 'delimiter'),
    'invalid-command': l10n.s(lang, 'messages.invalid-command'),
    'please-update': l10n.s(lang, 'commands.common.roles.please-update'),
    'role-to-add-hint': l10n.s(lang, 'commands.common.roles.role-to-add-hint'),
    'role-to-remove-hint': l10n.s(lang,
        'commands.common.roles.role-to-remove-hint'),
  };

  [
    'add-one', 'add-many', 'error-add-none', 'error-add-one',
    'remove-one', 'remove-many', 'error-remove-one', 'error-remove-none',
    'clear-one', 'clear-many', 'error-empty-list',
    'info-desc', 'info-one', 'info-many', 'info-none',
    'command-hint', 'info-hint', 'add-hint', 'remove-hint', 'clear-hint',
  ].forEach((prop) => {
    strings[prop] = l10n.s(lang, `commands.${canonName}.${prop}`);
  });

  return strings;
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @return {object}
 */
export function getSlashData(CTX, KEY, STR) {
  const roleList = [];

  const {guild, guildSettings} = CTX;

  const currRoles = guildSettings[KEY] || [];
  currRoles.forEach((id) => {
    const role = guild.roles.cache.get(id);
    if (role) roleList.push([role.name, id]);
  });

  const data = new SlashCommandBuilder()
      .setName(STR['command-name'])
      .setDescription(STR['command-hint'])
      .addSubcommand((c) => c
          .setName('info')
          .setDescription(STR['info-hint']),
      )
      .addSubcommand((c) => c
          .setName('add')
          .setDescription(STR['add-hint'])
          .addRoleOption((o) => o
              .setName('role')
              .setDescription(STR['role-to-add-hint'])
              .setRequired(true),
          ),
      );
  if (roleList.length) {
    data
        .addSubcommand((c) => c
            .setName('remove')
            .setDescription(STR['remove-hint'])
            .addStringOption((o) => o
                .setName('role')
                .setChoices(roleList)
                .setDescription(STR['role-to-remove-hint'])
                .setRequired(true),
            ),
        )
        .addSubcommand((c) => c
            .setName('clear')
            .setDescription(STR['clear-hint']),
        );
  }
  return data;
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @param {string[]} what - what roles to add
 * @return {RoleActionResult}
 */
function addRoles(CTX, KEY, STR, what) {
  const {client, guild, guildSettings} = CTX;
  const {l10n} = client;
  const currRoles = guildSettings[KEY] || [];
  const added = what.filter((id) => currRoles.indexOf(id) === -1);
  if (added.length) {
    client.updateGuildSettings(guild, KEY, currRoles.concat(added));
    const response =
        (added.length > 1)?
        l10n.r(STR['add-many'],
            '{ROLES}', added.map((r)=>`<@&${r}>`).join(STR['delimiter']),
            '{COUNT}', added.length.toString()):
        STR['add-one'].replace('{ROLE}', `<@&${added[0]}>`);
    return {success: true, response: response};
  } else {
    return {success: false, response: STR['error-add-none']};
  }
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @param {string} what - what role to add
 * @return {object}
 */
function addOneRole(CTX, KEY, STR, what) {
  const {client, guild, guildSettings} = CTX;
  const currRoles = guildSettings[KEY] || [];
  if (currRoles.indexOf(what) === -1) {
    currRoles.push(what);
    client.updateGuildSettings(guild, KEY, currRoles);
    const response = STR['add-one'].replace('{ROLE}', `<@&${what}>`);
    return {success: true, response: response};
  } else {
    const response = STR['error-add-one'].replace('{ROLE}', `<@&${what}>`);
    return {success: false, response: response};
  }
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @param {string[]} what - what roles to remove
 * @return {object}
 */
function removeManyRoles(CTX, KEY, STR, what) {
  const {client, guild, guildSettings} = CTX;
  const {l10n} = client;
  const currRoles = guildSettings[KEY];
  if ((!Array.isArray(currRoles)) || (!currRoles.length)) {
    return {success: false, response: STR['error-empty-list']};
  }
  const removed = [];
  what.forEach((r) => {
    const spliceAt = currRoles.indexOf(r);
    if (spliceAt !== -1) {
      currRoles.splice(spliceAt, 1);
      removed.push(r);
    }
  });
  if (removed.length) {
    client.updateGuildSettings(guild, KEY, currRoles);
    const response = (removed.length == 1)?
      STR['remove-one'].replace('{ROLE}', `<@&${removed[0]}>`):
      l10n.r(
          STR['remove-many'],
          '{ROLES}', removed.map((r)=>`<@&${r}>`).join(STR['delimiter']),
          '{COUNT}', removed.length.toString());
    return {success: true, response: response};
  } else {
    return {success: false, response: STR['error-remove-none']};
  }
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @param {string} what - what role to remove
 * @return {object}
 */
function removeOneRole(CTX, KEY, STR, what) {
  const {client, guild, guildSettings} = CTX;
  const currRoles = guildSettings[KEY] || [];
  const spliceAt = currRoles.indexOf(what);
  if (spliceAt !== -1) {
    currRoles.splice(spliceAt, 1);
    client.updateGuildSettings(guild, KEY, currRoles);
    const response = STR['remove-one'].replace('{ROLE}', `<@&${what}>`);
    return {success: true, response: response};
  } else {
    const response = STR['error-remove-one'].replace('{ROLE}', `<@&${what}>`);
    return {success: false, response: response};
  }
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @return {object}
 */
function clearRoles(CTX, KEY, STR) {
  const {client, guild, guildSettings} = CTX;
  const l10n = client.l10n;
  const currRoles = guildSettings[KEY] || [];

  if (currRoles.length) {
    let response;
    if (currRoles.length > 1) {
      response = l10n.r(
          STR['clear-many'],
          '{ROLES}', currRoles.map((r)=>`<@&${r}>`).join(STR['delimiter']),
          '{COUNT}', currRoles.length.toString(),
      );
    } else {
      response = STR['clear-one'].replace('{ROLE}', `<@&${currRoles[0]}>`);
    }
    client.updateGuildSettings(guild, KEY, []);
    return {success: true, response: response};
  } else {
    return {success: false, response: STR['error-empty-list']};
  }
}

/**
 * @param {CommandContext|IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @return {object}
 */
function viewRoles(CTX, KEY, STR) {
  const {client, guild, guildSettings} = CTX;
  const l10n = client.l10n;

  const currRoles = guildSettings[KEY] || [];
  const validRoles = currRoles.filter((id) => guild.roles.cache.get(id));

  if (currRoles.length !== validRoles.length) {
    client.updateGuildSettings(guild, KEY, validRoles);
  }

  let response = STR['info-desc'];
  if (validRoles.length == 1) {
    response += STR['info-one'].replace('{ROLE}', `<@&${validRoles[0]}>`);
  } else if (currRoles.length > 1) {
    response = l10n.r(
        STR['info-many'],
        '{ROLES}', validRoles.map((r)=>`<@&${r}>`).join(STR['delimiter']),
        '{COUNT}', validRoles.length.toString(),
    );
  } else {
    response += STR['info-none'];
  }
  return {success: true, response: response};
}

/**
 * @param {IContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(CTX, KEY, STR) {
  const {interaction} = CTX;
  const subCommand = interaction.options.getSubcommand();
  let result;
  switch (subCommand) {
    case 'info': result = viewRoles(CTX, KEY, STR); break;
    case 'clear': result = clearRoles(CTX, KEY, STR); break;
    case 'add': result = addOneRole(CTX, KEY, STR,
        interaction.options.getRole('role').id);
      break;
    case 'remove': result = removeOneRole(CTX, KEY, STR,
        interaction.options.getString('role').id);
      break;
  }
  interaction.reply({content: result.response, ephemeral: true});
  return result.success;
}

/**
 * @param {CommandContext} CTX
 * @param {string} KEY - key of the guild setting
 * @param {RoleCommandStrings} STR
 * @return {boolean} - true if command is executed
 */
export async function execute(CTX, KEY, STR) {
  const {guild, channel, message, args} = CTX;
  const ACTION = {INFO: 1, ADD: 2, REMOVE: 3, CLEAR: 4};
  const INFO = 1;
  const ADD = 2;
  const REMOVE = 3;
  const CLEAR = 4;
  const INVALID = 9;

  /** @type {string[]} - List of unique and valid role ids */
  const parsedIds = (() => {
    if (args.length === 1) return [];
    const result = [];
    for (let idx = 1; idx < args.length; idx++) {
      const id = getRoleId(args[idx]);
      if ( (id) && (guild.roles.cache.get(id)) ) {
        if (result.indexOf(id) === -1) result.push(id);
      } else {
        break;
      }
    }
    return result;
  })();

  let action = INFO;
  if (args.length > 0) {
    const flag = args[0].toLowerCase();
    if (fInfo.includes(flag)) action = INFO;
    else if (fAdd.includes(flag)) action = parsedIds.length?ADD:INVALID;
    else if (fRemove.includes(flag)) action = parsedIds.length?REMOVE:INVALID;
    else if (fClear.includes(flag)) action = CLEAR;
  }

  let result;
  switch (action) {
    case ACTION.ADD:
      result = (parsedIds.length > 1)?
        addRoles(CTX, KEY, STR, parsedIds):
        addOneRole(CTX, KEY, STR, parsedIds[0]);
      break;
    case ACTION.REMOVE:
      result = (parsedIds.length > 1)?
        removeManyRoles(CTX, KEY, STR, parsedIds):
        removeOneRole(CTX, KEY, STR, parsedIds[0]);
      break;
    case ACTION.CLEAR:
      result = clearRoles(CTX, KEY, STR);
      break;
    case ACTION.INFO:
    default:
      result = viewRoles(CTX, KEY, STR);
  }
  channel.send({
    content: result.response, reply: {messageReference: message.id},
  });
  return result.success;
}
