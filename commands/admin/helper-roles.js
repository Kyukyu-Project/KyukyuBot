/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'admin.helper-roles';
export const name = 'helper-roles';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

import {getRoleId} from '../../utils/utils.js';

const SHOW_INFO           = `commands.${canonName}.show-info`;
const SHOW_ONE            = `commands.${canonName}.show-one`;
const SHOW_MANY           = `commands.${canonName}.show-many`;
const NO_HELPER_ROLE      = `commands.${canonName}.no-helper-role`;
const ADD_ONE             = `commands.${canonName}.add-one`;
const ADD_MANY            = `commands.${canonName}.add-many`;
const REMOVE_ONE          = `commands.${canonName}.remove-one`;
const REMOVE_MANY         = `commands.${canonName}.remove-many`;
const NONE_ADDED          = `commands.${canonName}.none-added`;
const NONE_REMOVED        = `commands.${canonName}.none-removed`;
const NOT_A_HELPER_ROLE   = `commands.${canonName}.not-a-helper-role`;
const ALREADY_A_HELP_ROLE = `commands.${canonName}.already-a-helper-role`;
const infoFlags   = ['--info', '-i'];
const addFlags    = ['--add', '-a', '+'];
const removeFlags = ['--remove', '-r', '-'];
const clearFlags  = ['--clear', '-c'];
const infoLabel = 'info';
const addLabel = 'add';
const removeLabel = 'remove';
const clearLabel = 'clear';

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const desc = l10n.s(lang, `commands.${canonName}.desc`);
  const infoDesc = l10n.s(lang, `commands.${canonName}.info-desc`);
  const addDesc = l10n.s(lang, `commands.${canonName}.add-desc`);
  const removeDesc = l10n.s(lang, `commands.${canonName}.remove-desc`);
  const clearDesc = l10n.s(lang, `commands.${canonName}.clear-desc`);
  const roleDesc = l10n.s(lang, `commands.${canonName}.role-desc`);

  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(desc)
      .addSubcommand((c) => c.setName(infoLabel).setDescription(infoDesc))
      .addSubcommand((c) => c.setName(addLabel).setDescription(addDesc)
          .addRoleOption((option) => option
              .setName('role').setDescription(roleDesc).setRequired(true),
          ),
      )
      .addSubcommand((c) => c.setName(removeLabel).setDescription(removeDesc)
          .addRoleOption((option) => option
              .setName('role').setDescription(roleDesc).setRequired(true),
          ),
      )
      .addSubcommand((c) => c.setName(clearLabel).setDescription(clearDesc),
      );
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, guild, guildSettings, interaction} = context;
  const {l10n} = client;

  if (context.hasAdminPermission) {
    const hRoles = guildSettings['helper-roles'] || [];
    const subCommand = interaction.options.getSubcommand();
    let result;
    if (subCommand === infoLabel) {
      result = viewRoles(context);
    } else if (subCommand === clearLabel) {
      result = clearRoles(context);
    } else {
      const roleId = interaction.options.getRole('role').id;
      const roleTag = `<@&${roleId}>`;
      if (subCommand === addLabel) {
        if (hRoles.indexOf(roleId) === -1) {
          hRoles.push(roleId);
          guildSettings['helper-roles'] = hRoles;
          client.updateGuildSettings(guild, guildSettings);
          result = {
            response: l10n.t(lang, ADD_ONE, '{ROLE}', roleTag),
            success: true,
          };
        } else {
          result = {
            response: l10n.t(lang, ALREADY_A_HELP_ROLE, '{ROLE}', roleTag),
            success: false,
          };
        }
      } else if (subCommand === removeLabel) {
        const spiceAt = hRoles.indexOf(roleId);
        if (spiceAt !== -1) {
          hRoles.splice(spiceAt, 1);
          guildSettings['helper-roles'] = hRoles;
          client.updateGuildSettings(guild, guildSettings);
          result = {
            response: l10n.t(lang, REMOVE_ONE, '{ROLE}', roleTag),
            success: true,
          };
        } else {
          result = {
            response: l10n.t(lang, NOT_A_HELPER_ROLE, '{ROLE}', roleTag),
            success: false,
          };
        }
      }
    }
    interaction.reply({content: result.response, ephemeral: true});
    return result.success;
  }
  const noPermission = l10n.s(lang, 'messages.no-permission');
  interaction.reply({content: noPermission, ephemeral: true});
  return false;
}

/**
 * @param {CommandContext|IContext} context
 * @param {string[]} rolesToAdd - index to first item
 * @return {object}
 */
function addRoles(context, rolesToAdd) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;

  /** @type string[] */
  const hRoles = guildSettings['helper-roles'] || [];
  const addedRoleTags = [];

  rolesToAdd.forEach((id) => {
    const idx = hRoles.indexOf(id);
    if (idx === -1) { // not found
      hRoles.push(id);
      addedRoleTags.push(`<@&${id}>`);
    }
  });

  if (addedRoleTags.length) {
    let response;
    guildSettings['helper-roles'] = hRoles;
    client.updateGuildSettings(guild, guildSettings);
    if (addedRoleTags.length > 1) {
      response = l10n.t(
          lang, ADD_MANY, '{ROLES}', l10n.join(lang, addedRoleTags),
      );
    } else {
      response = l10n.t(lang, ADD_ONE, '{ROLE}', addedRoleTags[0]);
    }
    return {success: true, response: response};
  } else {
    return {success: false, response: l10n.s(lang, NONE_ADDED)};
  }
}

/**
 * @param {CommandContext|IContext} context
 * @param {string[]} rolesToRemove - index to first item
 * @return {object}
 */
function removeRoles(context, rolesToRemove) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;

  /** @type string[] */
  const helperRoles = guildSettings['helper-roles'] || [];
  const removedRoleTags = [];

  rolesToRemove.forEach((id) => {
    const idx = helperRoles.indexOf(id);
    if (idx !== -1) { // found
      helperRoles.splice(idx, 1);
      removedRoleTags.push(`<@&${id}>`);
    }
  });

  if (removedRoleTags.length) {
    let response;
    guildSettings['helper-roles'] = helperRoles;
    client.updateGuildSettings(guild, guildSettings);
    if (removedRoleTags.length > 1) {
      response = l10n.t(
          lang, REMOVE_MANY, '{ROLES}', l10n.join(lang, removedRoleTags),
      );
    } else {
      response = l10n.t(lang, REMOVE_ONE, '{ROLE}', removedRoleTags[0]);
    }
    return {success: true, response: response};
  } else {
    return {success: false, response: l10n.s(lang, NONE_REMOVED)};
  }
}

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
function clearRoles(context) {
  const {client, lang, guild, guildSettings} = context;
  const l10n = client.l10n;

  const hRoles = guildSettings['helper-roles'] || [];
  const hRolesTags = hRoles.map((el)=>`<@&${el}>`);

  if (hRoles.length) {
    let response;
    if (hRoles.length > 1) {
      response = l10n.t(
          lang, REMOVE_MANY, '{ROLES}', l10n.join(lang, hRolesTags),
      );
    } else {
      response = l10n.t(lang, REMOVE_ONE, '{ROLE}', hRolesTags[0]);
    }
    guildSettings['helper-roles'] = [];
    client.updateGuildSettings(guild, guildSettings);
    return {success: true, response: response};
  } else {
    return {success: false, response: l10n.s(lang, NONE_REMOVED)};
  }
}

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
function viewRoles(context) {
  const {client, lang, guildSettings} = context;
  const l10n = client.l10n;

  const hRoles = guildSettings['helper-roles'] || [];
  const hRolesTags = hRoles.map((el)=>`<@&${el}>`);

  let response = l10n.s(lang, SHOW_INFO);
  if (hRoles.length == 1) {
    response += l10n.t(lang, SHOW_ONE, '{ROLE}', hRolesTags[0]);
  } else if (hRoles.length > 1) {
    response += l10n.t(lang, SHOW_MANY, '{ROLES}', l10n.join(lang, hRolesTags));
  } else {
    response += l10n.s(lang, NO_HELPER_ROLE);
  }
  return {success: true, response: response};
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {guild, channel, message, args} = context;
  const ACTION = {INFO: 1, ADD: 2, REMOVE: 3, CLEAR: 4};

  let action = ACTION.INFO;
  if (args.length > 0) {
    const flag = args[0].toLowerCase();
    if (infoFlags.includes(flag)) action = ACTION.INFO;
    else if (addFlags.includes(flag)) action = ACTION.ADD;
    else if (removeFlags.includes(flag)) action = ACTION.REMOVE;
    else if (clearFlags.includes(flag)) action = ACTION.CLEAR;
  }

  // Get a list of unique role ids
  const parseRoleIds = () => {
    if (args.length == 1) return [];
    const roleIds = [];
    for (let idx = 1; idx < args.length; idx++) {
      const id = getRoleId(args[idx]);
      if ( (id) && (guild.roles.cache.get(id)) ) {
        if (roleIds.indexOf(id) === -1) roleIds.push(id);
      } else {
        break;
      }
    }
    return roleIds;
  };

  let result;
  switch (action) {
    case ACTION.ADD: result = addRoles(context, parseRoleIds()); break;
    case ACTION.REMOVE: result = removeRoles(context, parseRoleIds()); break;
    case ACTION.CLEAR: result = clearRoles(context); break;
    case ACTION.INFO: result = viewRoles(context);
  }
  channel.send({
    content: result.response, reply: {messageReference: message.id},
  });
  return result.success;
}
