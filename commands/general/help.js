/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'general.help';
export const name = 'help';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 1;

const OWNER               = `commands.${canonName}.owner-commands`;
const ADMIN               = `commands.${canonName}.admin-commands`;
const GENERAL             = `commands.${canonName}.general-commands`;
const NO_INFO             = `commands.${canonName}.no-info`;

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang, guild} = context;
  const {l10n} = client;

  const desc = l10n.s(lang, `commands.${canonName}.desc`);
  const generalDesc = l10n.s(lang, `commands.${canonName}.general-hint`);
  const adminDesc = l10n.s(lang, `commands.${canonName}.admin-hint`);
  const ownerDesc = l10n.s(lang, `commands.${canonName}.owner-hint`);
  const commandDesc = l10n.s(lang, `commands.${canonName}.command-hint`);

  const generalChoices = [];
  const adminChoices = [];
  const ownerChoices = [];
  const ownerGuild = (guild.id == client.ownerGuildId);

  client.commands.forEach((cmd) => {
    const choice = [cmd.name, cmd.canonName];
    switch (cmd.commandPerm) {
      case COMMAND_PERM.GENERAL:
        generalChoices.push(choice);
        break;
      case COMMAND_PERM.ADMIN:
        adminChoices.push(choice);
        break;
      case COMMAND_PERM.OWNER:
        if (ownerGuild) ownerChoices.push(choice);
        break;
    }
  });

  const slashCommand = new SlashCommandBuilder()
      .setName(name)
      .setDescription(desc)
      .addSubcommand((command) => command
          .setName('general-command')
          .setDescription(generalDesc)
          .addStringOption((option) => option
              .setName('command-name')
              .setDescription(commandDesc)
              .setRequired(true)
              .addChoices(generalChoices),
          ),
      )
      .addSubcommand((command) => command
          .setName('admin-command')
          .setDescription(adminDesc)
          .addStringOption((option) => option
              .setName('command-name')
              .setDescription(commandDesc)
              .setRequired(true)
              .addChoices(adminChoices),
          ),
      );
  if (ownerGuild) {
    slashCommand.addSubcommand((command) => command
        .setName('owner-command')
        .setDescription(ownerDesc)
        .addStringOption((option) => option
            .setName('command-name')
            .setDescription(commandDesc)
            .setRequired(true)
            .addChoices(ownerChoices),
        ),
    );
  }
  return slashCommand;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, guildSettings, interaction} = context;
  const {l10n} = client;

  const subCommand = interaction.options.getSubcommand();
  if (
    ((subCommand === 'owner') && (!context.hasOwnerPermission)) ||
    ((subCommand === 'admin') && (!context.hasAdminPermission))
  ) {
    const noPermission = l10n.s(lang, 'messages.no-permission');
    interaction.reply({content: noPermission, ephemeral: true});
    return false;
  }

  const cmdCanonName = interaction.options.getString('command');
  const commandPrefix = guildSettings['command-prefix'];
  const helpTxt = l10n.getCommandHelp(lang, cmdCanonName);
  if (helpTxt) {
    interaction.reply(helpTxt.replaceAll('?', commandPrefix));
    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}

/**
 * List owner commands
 * @param {CommandContext} context
 * @return {boolean}
 */
function listOwner(context) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  if (!context.hasOwnerPermission) return false;

  const commandList = client.commands
      .filter((cmd)=>cmd.commandPerm==COMMAND_PERM.OWNER)
      .map((cmd)=>cmd.name)
      .join(l10n.s(lang, 'delimiter'));

  const response = l10n.t( lang, OWNER, '{COMMANDS}', commandList);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * List guild administrator commands
 * @param {CommandContext} context
 * @return {boolean}
 */
function listAdmin(context) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  if (!context.hasAdminPermission) return false;

  const commandList = client.commands
      .filter((cmd)=>cmd.commandPerm==COMMAND_PERM.ADMIN)
      .map((cmd)=>cmd.name)
      .join(l10n.s(lang, 'delimiter'));
  const response = l10n.t(lang, ADMIN, '{COMMANDS}', commandList);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * List general commands
 * @param {CommandContext} context
 * @return {boolean}
 */
function listGeneral(context) {
  const {client, lang, channel, message} = context;
  const l10n = client.l10n;

  const commandList = client.commands
      .filter((cmd)=>cmd.commandPerm==COMMAND_PERM.GENERAL)
      .map((cmd)=>cmd.name)
      .join(l10n.s(lang, 'delimiter'));
  const response = l10n.t(lang, GENERAL, '{COMMANDS}', commandList);

  channel.send({
    content: response, reply: {messageReference: message.id},
  });
  return true;
}

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, channel, message, lang, commandPrefix, args} = context;
  const l10n = client.l10n;

  if (args.length == 0) return listGeneral(context);

  const firstArg = args[0].toLowerCase();
  const ownerFlags = ['--owner', '-o', '--dev'];
  const adminFlags = ['--admin', '-a'];
  const generalFlags = ['--general', '-g'];

  if (ownerFlags.includes(firstArg)) return listOwner(context);
  if (adminFlags.includes(firstArg)) return listAdmin(context);
  if (generalFlags.includes(firstArg)) return listGeneral(context);

  const __cmdAlias =
    firstArg.startsWith(commandPrefix)?
    firstArg.slice(commandPrefix.length):
    firstArg;

  const __cmdCanonName =
    l10n.getCanonicalName(lang, 'aliases.commands', __cmdAlias);

  if (!__cmdCanonName) return false;

  const __cmd = client.commands.get(__cmdCanonName);

  switch (__cmd.commandPerm) {
    case COMMAND_PERM.OWNER:
      if (!context.hasOwnerPermission) return false;
      break;
    case COMMAND_PERM.ADMIN:
      if (!context.hasAdminPermission) return false;
      break;
  }

  const helpTxt = l10n.getCommandHelp(lang, __cmdCanonName);
  if (helpTxt) {
    channel.send({
      content: '```' + helpTxt.replaceAll('?', commandPrefix) + '```',
      reply: {messageReference: message.id},
    });
    return true;
  }

  return false;
}
