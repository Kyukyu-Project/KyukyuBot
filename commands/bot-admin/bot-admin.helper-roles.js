/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {
  PermissionFlagsBits,
  ComponentType,
} from 'discord.js';

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';

const requiredAppPermissions =
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.ManageRoles;

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
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {guild, guildSettings, interaction} = context;
  const {locale, appPermissions, user} = interaction;

  if (!appPermissions.has(requiredAppPermissions)) {
    const err = l10n.s(locale, 'messages.command-error.no-app-permission');
    interaction.reply(err);
    throw new Error(`Bot does not have the required permissions.`);
  }

  await interaction.deferReply();

  /** @type {string} - Ids of current helper roles */
  const currRoleIds =  [...new Set(getSetting(guildSettings))];

  /** @type {string[]} - Ids of valid helper roles */
  const validRoleIds = [];

  /** List of menu items */
  const validRoleOptions = [];

  if (currRoleIds.length) {
    await guild.roles.fetch(); // Refresh role cache

    // Remove invalid roles from server settings
    currRoleIds.forEach((id) => {
      const role = guild.roles.cache.get(id);
      if (role) {
        validRoleOptions.push({label: role.name, value: id});
        validRoleIds.push(id);
      }
    });

    if (currRoleIds.length !== validRoleIds.length) {
      servers.updateSettings(guild, settingKey, validRoleIds);
    }
  }

  const addRoleRow = {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.RoleSelect,
        custom_id: 'add-helper-role',
        placeholder: l10n.s(locale, `${localeKeyPrefix}.add-placeholder`),
      },
    ],
  };

  const removeRoleRow = {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: 'remove-helper-role',
        placeholder: l10n.s(locale, `${localeKeyPrefix}.remove-placeholder`),
        options: validRoleOptions,
      },
    ],
  };

  const responseContent = {
    content: l10n.t(locale, `${localeKeyPrefix}.info`),
    components:
        (validRoleOptions.length)?
        [addRoleRow, removeRoleRow]:
        [addRoleRow],
    ephemeral: false,
    fetchReply: true,
  };

  const responseMessage = await interaction.editReply(responseContent);

  const iActionCollector = responseMessage.createMessageComponentCollector({
    filter: (i) => (i.user.id === user.id),
    time: 5 * 60 * 1000, // Disable after 5 minute
  });

  iActionCollector.on('collect', async (i) => {
    const roleId = i.values[0];

    if (i.customId === 'add-helper-role') {
      if (validRoleIds.includes(roleId)) {
        i.deferUpdate();
        responseContent.content += '\n' + l10n.t(
            locale, `${localeKeyPrefix}.add-error`, '{ROLE ID}', roleId,
        );
        interaction.editReply(responseContent);
      } else {
        const selectedRole = guild.roles.cache.get(roleId);
        validRoleIds.push(roleId);
        validRoleOptions.push({label: selectedRole.name, value: roleId});
        servers.updateSettings(guild, settingKey, validRoleIds);
        i.deferUpdate();
        responseContent.content += '\n' + l10n.t(
            locale, `${localeKeyPrefix}.add-result`, '{ROLE ID}', roleId,
        );
        responseContent.components =
            (validRoleOptions.length)?
            [addRoleRow, removeRoleRow]:
            [addRoleRow];
        interaction.editReply(responseContent);
      }
    } else if (i.customId === 'remove-helper-role') {
      const roleIdx = validRoleIds.indexOf(roleId);
      if (roleIdx !== -1) {
        validRoleIds.splice(roleIdx, 1);
        validRoleOptions.splice(roleIdx, 1);
        servers.updateSettings(guild, settingKey, validRoleIds);
        i.deferUpdate();
        responseContent.content += '\n' + l10n.t(
            locale, `${localeKeyPrefix}.remove-result`, '{ROLE ID}', roleId,
        );
        responseContent.components =
            (validRoleOptions.length)?
            [addRoleRow, removeRoleRow]:
            [addRoleRow];
        interaction.editReply(responseContent);
      } else {
        i.deferUpdate();
        responseContent.content += '\n' + l10n.t(
            locale, `${localeKeyPrefix}.remove-error`, '{ROLE ID}', roleId,
        );
        interaction.editReply(responseContent);
      }
    }
  });

  iActionCollector.on('end', (c) => {
    addRoleRow.components[0].disabled = true;
    removeRoleRow.components[0].disabled = true;
    interaction.editReply(responseContent);
  });

  return true;
}
