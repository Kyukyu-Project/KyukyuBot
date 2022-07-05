/*
 * Command helper class
 **/

import {resolve} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';

import {Collection} from 'discord.js';
import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

import {COMMAND_PERM} from './typedef.js';

import {logger} from './logger.js';

import {getFilesFromDir} from '../utils/utils.js';

/** File path of this module */
const filePath = resolve(fileURLToPath(import.meta.url), './../');

const commandPath = resolve(filePath, './../commands/');
const customCommandPath = resolve(filePath, './../custom-commands/');

/**
 * @typedef {import('./client.js').default} Client
 * @typedef {import('./typedef.js').Command} Command
 * @typedef {import('./typedef.js').DeploymentContext} DeploymentContext
 */

/** Command helper class */
class CommandManager extends Collection {
  /** Constructor */
  constructor() {
    super();

    /**
     * Bot client
     * @type {Client}
     */
    this.client = undefined;

    /**
     * Storage space for file paths of command files
     * @type {Collection}
     * @private
     */
    this.sources = new Collection();

    /**
     * Timers for updating slash command
     * @type {Collection}
     * @private
     */
    this.deploymentTimers = new Collection();

    this.loadCommandFiles(getFilesFromDir(commandPath, ['.js'], 3));
    this.loadCommandFiles(getFilesFromDir(customCommandPath, ['.js'], 3));
  }

  /**
   * Load command files
   * @param {string[]} filePaths -File paths (.js files)
   */
  loadCommandFiles(filePaths) {
    filePaths.forEach(async (path) => {
      try {
        const href = pathToFileURL(path).href;
        /** @type {Command} */
        const cmd = await import(href);
        if (this.has(cmd.canonName)) {
          logger.writeLog(
              'error',
              {summary: `Command name collision: ${cmd.canonName}`},
          );
        } else {
          this.set(cmd.canonName, cmd);
          this.sources.set(cmd.canonName, href);
        }
      } catch (error) {
        logger.writeLog(
            'error',
            {
              summary: `Error loading command module from ${path}`,
              details: error.stack,
            },
        );
      }
    });
  }

  /**
   * @param {string} cmdCanonName - canonical command name
   */
  async reloadCommand(cmdCanonName) {
    const oldPath = this.sources.get(cmdCanonName);
    const timeStamp = (new Date()).getTime();

    return import(`${oldPath}?update=${timeStamp}`)
        .then((newCmd) => {
          this.set(cmdCanonName, newCmd);
        });
  }

  /**
  * Schedule slash command update for a guild
  * @param {Discord.Guild} guild - Guild
  */
  async slowDeploy(guild) {
    const guildId = guild.id;

    const Timers = this.deploymentTimers;
    if (Timers.has(guildId)) {
      clearTimeout(Timers.get(guildId));
      Timers.delete(guildId);
    }

    const timerDelay = 3 * 60 * 1000; // 3 min delay

    const timerFn = (function(guild) {
      this.fastDeploy(guild);
    }).bind(this);

    const timer = setTimeout(timerFn, timerDelay, guild);
    Timers.set(guildId, timer);
  }

  /**
  * Update slash commands for a guild immediately
  * @param {Discord.Guild} guild - Guild
  */
  async fastDeploy(guild) {
    const client = this.client;
    const guildId = guild.id;
    const guildSettings = client.getGuildSettings(guild);

    const Timers = this.deploymentTimers;
    if (Timers.has(guildId)) {
      clearTimeout(Timers.get(guildId));
      Timers.delete(guildId);
    }

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
    const pendingData = client.commands
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
        .then(()=>{}).catch(()=>{}); // Silence 405 error
  }
}

export const commands = new CommandManager();
