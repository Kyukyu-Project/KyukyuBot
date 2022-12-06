/**
 * @typedef {import('../../src/typedef.js').ControlPanelHandler} ControlPanelHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('discord.js').SelectMenuComponentOptionData} SelectMenuComponentOptionData
 */
import {PermissionFlagsBits, ComponentType, ButtonStyle} from 'discord.js';

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';

const controlPanelName = 'helper-roles';

// Component ids
const CompRemoveButton = 'helper-roles.remove';
const CompRemoveSelect = 'helper-roles.remove.select';
const CompAddButton = 'helper-roles.add';
const CompAddSelect = 'helper-roles.add.select';
const CompBackButton = 'helper-roles.back';
const CompTop = 'top';

/**
 * Get ids of current helper roles
 * @param {CommandContext} context - Interaction context
 * @return {string[]}
 */
function getCurrentHelperRoles(context) {
  const {guild, guildSettings} = context;

  /** Ids of current helper roles */
  const currRoleIds = guildSettings['helper-roles'];

  if (Array.isArray(currRoleIds) && (currRoleIds.length > 0)) {
    /** @type {string[]} - Ids of valid helper roles */
    const validRoleIds = [...new Set(currRoleIds)]
        .filter((id) => guild.roles.cache.has(id));

    if (currRoleIds.length !== validRoleIds.length) {
      context.guildSettings =
          servers.updateSettings(guild, 'helper-roles', validRoleIds);
    }

    return validRoleIds;
  }

  return [];
}

/**
 * Get error page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getErrorPage(context) {
  const {locale} = context;

  return {
    embeds: [{
      title: l10n.s(locale, 'cp.helper-roles.title'),
      description: l10n.s(locale, 'messages.command-error.no-app-permission'),
    }],
    components: [{
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          custom_id: CompTop,
          label: l10n.s(locale, 'cmd.bot-admin.top'),
        },
      ],
    }],
  };
}

/**
 * Get 'remove role' page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getRemovePage(context) {
  const {locale, guild} = context;

  /** Ids of current helper roles */
  const currRoleIds = getCurrentHelperRoles(context);

  const placeholder =
      l10n.s(locale, 'cp.helper-roles.remove.menu-placeholder');

  const menuOptions =
      currRoleIds.map((id) => ({
        label: guild.roles.cache.get(id).name||'????',
        value: id,
      }));

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.helper-roles.remove.title'),
      description: l10n.s(locale, 'cp.helper-roles.remove.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: CompRemoveSelect,
            placeholder: placeholder,
            disabled: (currRoleIds.length === 0)?true:false,
            options: (currRoleIds.length === 0)?
                [{label: placeholder, value: 0}]:menuOptions,
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompBackButton,
            label: l10n.s(locale, 'cmd.bot-admin.back'),
          },
        ],
      },
    ],
  };

  return pageContent;
}

/**
 * Get 'add role' page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getAddPage(context) {
  const {locale} = context;

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.helper-roles.add.title'),
      description: l10n.s(locale, 'cp.helper-roles.add.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.RoleSelect,
            custom_id: CompAddSelect,
            placeholder: l10n.s(locale, 'cp.helper-roles.add.menu-placeholder'),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompBackButton,
            label: l10n.s(locale, 'cmd.bot-admin.back'),
          },
        ],
      },
    ],
  };

  return pageContent;
}

/**
 * Get main page
 * @param {CommandContext} context - Interaction context
 * @param {string|undefined} status - Status message
 * @return {InteractionReplyOptions}
 */
function getMainPage(context, status) {
  const {locale} = context;

  /** Ids of current helper roles */
  const currRoleIds = getCurrentHelperRoles(context);

  const pageTitle = l10n.s(locale, 'cp.helper-roles.main.title');
  const pageDesc = l10n.s(locale, 'cp.helper-roles.main.desc');

  if (!status) {
    if (currRoleIds.length) {
      const roleTags = currRoleIds.map((id) => `<@&${id}>`);
      status = l10n.t(
          locale, 'cp.helper-roles.main.list',
          '{ROLES}', l10n.makeList(locale, roleTags, 10),
      );
    } else {
      status = l10n.s(locale, 'cp.helper-roles.main.list-none');
    }
  }

  return {
    embeds: [{
      title: pageTitle,
      description: pageDesc + '\n\n' + status,
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompTop,
            label: l10n.s(locale, 'cmd.bot-admin.top'),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompAddButton,
            label: l10n.s(locale, 'cp.helper-roles.add.button-label'),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompRemoveButton,
            label: l10n.s(locale, 'cp.helper-roles.remove.button-label'),
            disabled: (currRoleIds.length === 0),
          },
        ],
      },
    ],
  };
}


/**
 * Remove a role
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function removeRole(context, i) {
  const {locale, guild} = context;
  const value = i.values[0];

  /** Ids of current helper roles */
  const currRoleIds = getCurrentHelperRoles(context);

  /** Action result message */
  let status = '';

  const roleIdx = currRoleIds.indexOf(value);
  if (roleIdx !== -1) {
    currRoleIds.splice(roleIdx, 1);
    context.guildSettings =
        servers.updateSettings(guild, 'helper-roles', currRoleIds);
    status = l10n.t(
        locale, 'cp.helper-roles.remove.success',
        '{ROLE ID}', value,
    );
  } else {
    status = l10n.t(
        locale, 'cp.helper-roles.remove.error.not-a-role',
        '{ROLE ID}', value,
    );
  }

  return getMainPage(context, status);
}

/**
 * Add a role
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function addRole(context, i) {
  const {locale, guild} = context;
  const value = i.values[0];

  /** Ids of current helper roles */
  const currRoleIds = getCurrentHelperRoles(context);

  /** Action result message  */
  let status = '';

  if (!currRoleIds.includes(value)) {
    const selectedRole = guild.roles.cache.get(value);
    currRoleIds.push(selectedRole.id);
    context.guildSettings =
        servers.updateSettings(guild, 'helper-roles', currRoleIds);
    status = l10n.t(
        locale, 'cp.helper-roles.add.success',
        '{ROLE ID}', value,
    );
  } else {
    status = l10n.t(
        locale, 'cp.helper-roles.add.error.already-a-role',
        '{ROLE ID}', value,
    );
  }

  return getMainPage(context, status);
}

/**
 * Handle component interaction
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function handleInteraction(context, i) {
  /** @type {string} */
  const customId = i.customId;

  if (!customId.startsWith('helper-roles')) return undefined;

  switch (customId) {
    case CompBackButton:
      context.responseContent = getMainPage(context, undefined);
      return true;
    case CompAddButton:
      context.responseContent = getAddPage(context);
      return true;
    case CompAddSelect:
      context.responseContent = addRole(context, i);
      return true;
    case CompRemoveButton:
      context.responseContent = getRemovePage(context);
      return true;
    case CompRemoveSelect:
      context.responseContent = removeRole(context, i);
      return true;
    default: return false;
  }
}

/**
 * Main panel page getter
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getContent(context) {
  const {interaction} = context;
  const {appPermissions} = interaction;

  // ManageRoles is required for guild.roles.fetch() to work
  if (!appPermissions.has(PermissionFlagsBits.ManageRoles)) {
    return getErrorPage(context);
  }

  return getMainPage(context, undefined);
}

/**
 * Top nav-menu item getter
 * @param {CommandContext} context - Interaction context
 * @return {SelectMenuComponentOptionData}
 **/
function getNavMenuItem(context) {
  const {locale} = context;
  return {
    label: l10n.s(locale, 'cp.helper-roles.name'),
    description: l10n.s(locale, 'cp.helper-roles.desc'),
    value: controlPanelName,
  };
}

/** @type {ControlPanelHandler} */
export const controlPanel = {
  name: controlPanelName,
  super: false,
  getNavMenuItem: getNavMenuItem,
  getContent: getContent,
  handleInteraction: handleInteraction,
};
