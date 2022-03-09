/**
* @typedef {import('../../src/typedef.js').CommandContext} CommandContext
*/
import {COMMAND_PERM} from '../../src/typedef.js';

import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';

export const canonName = 'admin.app-command';
export const name = 'app-command';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.ADMIN;
export const cooldown = 0;

const DEPLOY_START       = `commands.${canonName}.deploy-start`;
const DEPLOY_SUCCESS     = `commands.${canonName}.deploy-success`;
const DEPLOY_ERROR       = `commands.${canonName}.deploy-error`;
const cmdUpdateFlags     = ['--update-command', '-uc', '--deploy'];
const permUpdateFlags    = ['--update-permission', '-up', '--perm'];

/**
  * @param {CommandContext|IContext} context
  * @return {boolean} - true if command is executed
  */
async function updatePermission(context) {
  const {client, guild, guildSettings} = context;

  const aRoles = guildSettings['admin-roles'] || [];
  const mRoles = guildSettings['mod-roles'] || [];

  const modPermissions = mRoles.map((roleId)=> {
    return {id: roleId, type: 'ROLE', permission: true};
  });

  const adminPermissions = aRoles.map((roleId)=> {
    return {id: roleId, type: 'ROLE', permission: true};
  }).concat(modPermissions);

  const ownerPermissions = [
    {id: client.ownerRoleId, type: 'ROLE', permission: true},
  ].concat(adminPermissions);

  await client.application?.fetch();

  const fullPermissions = [];

  await guild.commands.fetch().then((guildCommands)=>{
    guildCommands.forEach((appCmd) => {
      // console.log(appCommand.name);
      const cmd = client.commands.find((c) => c.name === appCmd.name);
      if (cmd) {
        if (cmd.commandPerm === COMMAND_PERM.OWNER) {
          fullPermissions.push({id: appCmd.id, permissions: ownerPermissions});
        } else if (cmd.commandPerm === COMMAND_PERM.ADMIN) {
          fullPermissions.push({id: appCmd.id, permissions: adminPermissions});
        } else if (cmd.commandPerm === COMMAND_PERM.MODERATOR) {
          fullPermissions.push({id: appCmd.id, permissions: modPermissions});
        }
      }
    });
  });

  await guild.commands.permissions
      .set({fullPermissions: fullPermissions})
      .then(console.log)
      .catch(console.error);

  return true;
}

/**
  * @param {CommandContext|IContext} context
  * @return {boolean} - true if command is executed
  */
async function deploy(context) {
  const {client, guild} = context;

  const clientId = client.application.id;
  const guildId = guild.id;

  const ownerGuild = (guildId === client.ownerGuildId);
  const commandFilter =
      (ownerGuild)?
      (c) => (c.getSlashData):
      (c) => (c.getSlashData) && (c.commandPerm !== COMMAND_PERM.OWNER);

  /** @type object[] */
  const pendingData = client.commands
      .filter(commandFilter)
      .map((c) => {
        const data = c.getSlashData(context);
        if (
          (c.commandPerm === COMMAND_PERM.ADMIN) ||
          (c.commandPerm === COMMAND_PERM.OWNER) ||
          (c.commandPerm === COMMAND_PERM.MODERATOR)
        ) {
          data['defaultPermission'] = false;
        }
        return data;
      });

  const rest = new REST({version: '9'}).setToken(client.token);

  rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      {body: pendingData},
  ).then(()=>updatePermission(context));

  return true;
}

/**
 * @param {CommandContext} context
 * @return {boolean} - true if command is executed
 */
export async function execute(context) {
  const {client, user, lang, channel, args} = context;
  const {l10n} = client;

  const firstArg = args[0].toLowerCase();

  if (cmdUpdateFlags.includes(firstArg)) {
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

  if (permUpdateFlags.includes(firstArg)) {
    return new Promise((resolve, reject) => {
      updatePermission(context).then(() => {
        channel.send('done!');
        resolve(true);
      }).catch((error) => {
        channel.send(error);
        reject(error);
      });
    });
  }
  return false;
}
