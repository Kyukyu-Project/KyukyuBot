/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {PermissionFlagsBits} from 'discord.js';

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';

const requiredAppPermissions = PermissionFlagsBits.SendMessages;
const settingKey = 'helper-roles';
const localeKeyPrefix = 'cmd.bot-admin.helper-roles';

/**
 * Get guild setting
 * @param {GuildSettings} settings - Guild settings
 * @return {(string[]|undefined)} - Guild setting (`undefined` if it is empty)
 **/
function getSetting(settings) {
  const currSetting = settings[settingKey];
  if (Array.isArray(currSetting) && (currSetting.length > 0)) {
    return currSetting;
  } else {
    return undefined;
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 **/
function add(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale, options} = interaction;

  const currRoles = getSetting(guildSettings) || [];

  const rolesToAdd = [...new Set([
    options.getRole('role1').id,
    options.getRole('role2')?.id || undefined,
    options.getRole('role3')?.id || undefined,
    options.getRole('role4')?.id || undefined,
    options.getRole('role5')?.id || undefined,
  ])]
      .filter((role) => ((role !== undefined) && (!currRoles.includes(role))));

  if (rolesToAdd.length === 1) {
    servers.updateSettings(guild, settingKey, currRoles.concat(rolesToAdd));
    return ({
      success: true,
      response: l10n.t(
          locale, `${localeKeyPrefix}.add-result-one`,
          '{ROLE}', `<@&${rolesToAdd[0]}>`,
      ),
    });
  } else if (rolesToAdd.length) {
    servers.updateSettings(guild, settingKey, currRoles.concat(rolesToAdd));
    const addedRoleTags = rolesToAdd.map((roleId)=>`<@&${roleId}>`);
    const addedRoleTagList = l10n.makeList(locale, addedRoleTags);
    return ({
      success: true,
      response: l10n.t(
          locale, `${localeKeyPrefix}.add-result-many`,
          '{ROLES}', addedRoleTagList,
      ),
    });
  } else {
    return ({
      success: false,
      response: l10n.s(locale, `${localeKeyPrefix}.add-error`),
    });
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function clear(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale} = interaction;

  const currRoles = getSetting(guildSettings);

  if (currRoles) {
    servers.updateSettings(guild, settingKey, []);
    return ({
      success: true,
      response: l10n.s(locale, `${localeKeyPrefix}.clear-result`),
    });
  } else {
    return ({
      success: false,
      response: l10n.s(locale, `${localeKeyPrefix}.clear-error`),
    });
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function remove(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale, options} = interaction;

  const currRoles = getSetting(guildSettings);

  if (currRoles) {
    const roleToRemove = options.getString('role');
    const roleIdx = currRoles.indexOf(roleToRemove);
    if (roleIdx > -1) {
      currRoles.splice(roleIdx, 1);
      servers.updateSettings(guild, settingKey, currRoles);
      return ({
        success: true,
        response: l10n.t(
            locale, `${localeKeyPrefix}.remove-result`,
            '{ROLE}', `<@&${roleToRemove}>`,
        ),
      });
      // 'messages.command-error.no-app-permission'
    }
  }
}

/**
 * @param {CommandContext} context - Interaction context
 * @return {ActionResult}
 */
function info(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale, appPermissions} = interaction;

  const currRoles = getSetting(guildSettings);
  if (currRoles) {
    // Remove invalid roles from server settings
    if (appPermissions.has(PermissionFlagsBits.ManageRoles)) {
      const validRoles = currRoles.filter((id) => guild.roles.cache.get(id));
      if (validRoles.length) {
        if (currRoles.length !== validRoles.length) {
          servers.updateSettings(guild, settingKey, validRoles);
          currRoles = validRoles;
        }
      } else {
        currRoles = undefined;
      }
    }
  }

  if (currRoles) {
    const currRoleTags = currRoles.map((roleId)=>`<@&${roleId}>`);
    const currRoleTagList = l10n.makeList(locale, currRoleTags);
    return ({
      success: true,
      response: l10n.t(
          locale, `${localeKeyPrefix}.info-result`,
          '{ROLES}', currRoleTagList,
      ),
    });
  } else {
    return ({
      success: true,
      response: l10n.s(locale, `${localeKeyPrefix}.info-result-none`),
    });
  }
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {interaction} = context;
  const {locale, appPermissions, options} = interaction;

  if (!appPermissions.has(requiredAppPermissions)) {
    interaction.reply(
        l10n.s(locale, 'messages.command-error.no-app-permission'),
    );
    return false;
  }

  const subCommand = options.getSubcommand();
  let actionResult;
  switch (subCommand) {
    case 'add': actionResult = add(context); break;
    case 'remove': actionResult = remove(context); break;
    case 'clear': actionResult = clear(context); break;
    case 'info':
    default: actionResult = info(context);
  }

  interaction.reply({
    content: actionResult.response,
    ephemeral: true,
  });

  return actionResult.success;
}

/**
 * Run autocomplete
 * @param {CommandContext} context - Interaction context
 */
export function autocomplete(context) {
  const {guild, guildSettings, interaction} = context;
  const {options} = interaction;
  const typed = options.getFocused(true).value;

  const currRoles = getSetting(guildSettings);
  if (currRoles) {
    const roleList = [];
    currRoles.forEach((id)=> {
      const role = guild.roles.cache.get(id);
      if (role && role.name.includes(typed)) {
        roleList.push({name: role.name, value: id});
      }
    });

    interaction.respond(roleList);
  } else {
    interaction.respond([]);
  }
}

