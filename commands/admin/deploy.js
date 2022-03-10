/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_PERM} from '../../src/typedef.js';

import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

export const canonName = 'admin.slash-deploy';
export const name = 'slash-deploy';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const DEPLOY_START       = `commands.${canonName}.deploy-start`;
const DEPLOY_SUCCESS     = `commands.${canonName}.deploy-success`;
const DEPLOY_ERROR       = `commands.${canonName}.deploy-error`;
/**
  * @param {CommandContext|IContext} context
  * @return {boolean} - true if command is executed
  */
async function deploy(context) {
  const {client, guild, guildSettings} = context;

  const clientId = client.application.id;
  const guildId = guild.id;
  const ownerRoleId = client.ownerRoleId;

  const ownerGuild = (guildId === client.ownerGuildId);

  await guild.roles.fetch();

  const rolePerm = (roleId) => {
    return {id: roleId, type: 'ROLE', permission: true};
  };

  const modPermissions = (guildSettings['mod-roles'] || [])
      .filter((roleId) => guild.roles.cache.has(roleId))
      .map(rolePerm);

  const adminPermissions =(guildSettings['admin-roles'] || [])
      .filter((roleId) => guild.roles.cache.has(roleId))
      .map(rolePerm)
      .concat(modPermissions);

  const ownerPermissions =
      (ownerGuild && guild.roles.cache.has(ownerRoleId))?
      [rolePerm(ownerRoleId)].concat(adminPermissions):
      [];

  /** @type {string[]} owner commands */ const ownerCommands = [];
  /** @type {string[]} admin commands */ const adminCommands = [];
  /** @type {string[]} mod commands   */ const modCommands   = [];

  const commandFilter =
      (ownerGuild)?
      (c) => (c.getSlashData):
      (c) => (c.getSlashData) && (c.commandPerm !== COMMAND_PERM.OWNER);

  /** @type object[] */
  const pendingData = client.commands
      .filter(commandFilter)
      .map((c) => {
        const data = c.getSlashData(context);
        switch (c.commandPerm) {
          case COMMAND_PERM.OWNER:
            // Enable the app command for everyone if no owner role is set
            data['defaultPermission'] = (ownerPermissions.length == 0);
            ownerCommands.push(c.name);
            break;
          case COMMAND_PERM.ADMIN:
            // Enable the app command for everyone if no admin role is set
            data['defaultPermission'] = (adminPermissions.length == 0);
            adminCommands.push(c.name);
            break;
          case COMMAND_PERM.MODERATOR:
            data['defaultPermission'] = false;
            modCommands.push(c.name);
            break;
          default:
            data['defaultPermission'] = true;
        }
        return data;
      });

  const rest = new REST({version: '9'}).setToken(client.token);

  await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      {body: pendingData},
  );

  // Update permissions

  await client.application?.fetch();

  const fullPermissions = [];

  await guild.commands.fetch().then((guildCommands)=>{
    guildCommands.forEach((appCmd) => {
      if (ownerCommands.includes(appCmd.name)) {
        if (ownerPermissions.length) {
          fullPermissions.push({id: appCmd.id, permissions: ownerPermissions});
        }
      } else if (adminCommands.includes(appCmd.name)) {
        if (adminPermissions.length) {
          fullPermissions.push({id: appCmd.id, permissions: adminPermissions});
        }
      } else if (modCommands.includes(appCmd.name)) {
        if (modPermissions.length) {
          fullPermissions.push({id: appCmd.id, permissions: modPermissions});
        }
      }
    });
  });

  await guild.commands.permissions.set({fullPermissions: fullPermissions});

  return true;
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, user, lang, channel} = context;
  const {l10n} = client;

  const userTag = `<@${user.id}>`;

  channel.send(l10n.t(lang, DEPLOY_START, '{USER TAG}', userTag));

  return new Promise((resolve, reject) => {
    deploy(context).then(() => {
      channel.send(l10n.t(lang, DEPLOY_SUCCESS, '{USER TAG}', userTag));
      resolve(true);
    }).catch((error) => {
      channel.send(l10n.t(lang, DEPLOY_ERROR, '{USER TAG}', userTag));
      reject(error);
    });
  });
}
