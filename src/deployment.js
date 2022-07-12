/*
 * Slash command deployment functions
 **/

import {Collection} from 'discord.js';
import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

import {COMMAND_PERM} from './typedef.js';

import {logger} from './logger.js';
import {servers} from './servers.js';
import {commands} from './commands.js';
import {client} from './client.js';

import {noop} from '../utils/utils.js';

/**
 * @typedef {import('./typedef.js').DeploymentContext} DeploymentContext
 */

/** Timers for updating slash command */
const deploymentTimers = new Collection();

/**
 * Clear timer that needs overriding
 * @param {Discord.Guild} guild - Guild
 */
function clearTimer(guild) {
  const guildId = guild.id;
  if (deploymentTimers.has(guildId)) {
    clearTimeout(deploymentTimers.get(guildId));
    deploymentTimers.delete(guildId);
  }
}

/**
 * Schedule slash command update for a server
 * @param {Discord.Guild} guild - Guild
 */
export function slowDeploy(guild) {
  const guildId = guild.id;
  clearTimer(guildId);

  const timerDelay = 3 * 60 * 1000; // 3 min delay
  const timer = setTimeout(fastDeploy, timerDelay, guild);

  deploymentTimers.set(guildId, timer);
  logger.writeLog(
      'client',
      `Command deployment for "${guild.name}" scheduled.`,
  );
}

/**
 * Update slash commands for a server immediately
 * @param {Discord.Guild} guild - Guild
 */
export async function fastDeploy(guild) {
  const guildId = guild.id;
  const guildSettings = servers.getSettings(guild);

  clearTimer(guildId);

  /** @type {DeploymentContext} */
  const deploymentCtx = {
    client: client,
    guild: guild,
    guildSettings: guildSettings,
    lang: guildSettings.lang,
  };

  const clientId = client.application.id;
  const ownerRoleId = client.ownerRoleId;

  const ownerGuild = (guildId === client.ownerGuildId);

  const guildRoles = await guild.roles.fetch();

  const rolePerm = (roleId) => ({
    id: roleId,
    type: 'ROLE',
    permission: true,
  });

  const modPermissions = (guildSettings['mod-roles'] || [])
      .filter((roleId) => guildRoles.has(roleId))
      .map(rolePerm);

  const adminPermissions =(guildSettings['admin-roles'] || [])
      .filter((roleId) => guildRoles.has(roleId))
      .map(rolePerm)
      .concat(modPermissions);

  const ownerPermissions =
      (ownerGuild && guildRoles.has(ownerRoleId))?
      [rolePerm(ownerRoleId)]:
      [];

  /** @type {string[]} owner commands */ const ownerCommands = [];
  /** @type {string[]} admin commands */ const adminCommands = [];
  /** @type {string[]} mod commands   */ const modCommands   = [];

  const commandFilter =
      (ownerGuild)?
      (c) => (c.getSlashData):
      (c) => (c.getSlashData) &&
             (c.commandPerm !== COMMAND_PERM.OWNER) &&
             ((!c.guilds) || (c.guilds.includes(guildId)));

  /** @type object[] */
  const pendingData = commands
      .filter(commandFilter)
      .map((c) => {
        try {
          const data = c.getSlashData(deploymentCtx);
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
        } catch (e) {
          console.error(e);
          throw new Error(`Error getting application data for "${c.name}"`);
        }
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
          fullPermissions.push({
            id: appCmd.id,
            permissions: ownerPermissions,
          });
        }
      } else if (adminCommands.includes(appCmd.name)) {
        if (adminPermissions.length) {
          fullPermissions.push({
            id: appCmd.id,
            permissions: adminPermissions,
          });
        }
      } else if (modCommands.includes(appCmd.name)) {
        if (modPermissions.length) {
          fullPermissions.push({
            id: appCmd.id,
            permissions: modPermissions,
          });
        }
      }
    });
  });

  guild.commands.permissions
      .set({fullPermissions: fullPermissions})
      .then(noop).catch(noop); // Silence 405 error

  logger.writeLog(
      'client',
      `Command deployment for "${guild.name}" executed.`,
  );
}
