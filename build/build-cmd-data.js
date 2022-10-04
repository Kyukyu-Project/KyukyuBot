/*
 * Command data builder functions
 **/

import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';

import {
  resolvePermissionsBitField,
  getModuleDirectory,
  resolvePath,
  joinPath,
  findFiles,
  saveJson,
  readTJson,
} from '../src/utils.js';

import {l10n} from '../src/l10n.js';

const moduleDir = getModuleDirectory(import.meta);
const importDir = resolvePath(moduleDir, './cmd-data/');
const exportDir = resolvePath(moduleDir, './../resources/');
const exportFilePath = joinPath(exportDir, 'command-data.json');

const l10nCache = new Map();

/**
 * Get localization
 * @param {string} key - Localization key
 * @return {string|object}
 */
function getLocalization(key) {
  if (!l10nCache.has(key)) {
    const localizations = l10n.getLocalizations(key);
    l10nCache.set(key, localizations);
    return localizations;
  }
  return l10nCache.get(key);
}

const ChannelTypeMap = {
  'Group DM': ChannelType.GroupDM,
  'DM': ChannelType.DM,
  'Guild Text': ChannelType.GuildText,
  'Guild Voice': ChannelType.GuildVoice,
  'Guild Category': ChannelType.GuildCategory,
  'Guild News': ChannelType.GuildNews,
  'Guild News Thread': ChannelType.GuildNewsThread,
  'Guild Directory': ChannelType.GuildDirectory,
  'Guild Forum': ChannelType.GuildForum,
  'Guild Public Thread': ChannelType.GuildPublicThread,
  'Guild Private Thread': ChannelType.GuildPrivateThread,
  'Guild Stage Voice': ChannelType.GuildStageVoice,
};

const AppCommandOptionTypeMap = {
  'CommandType.Message': ApplicationCommandType.Message,
  'CommandType.User': ApplicationCommandType.User,
  'CommandOptionType.SubcommandGroup':
    ApplicationCommandOptionType.SubcommandGroup,
  'CommandOptionType.Subcommand':
    ApplicationCommandOptionType.Subcommand,
  'CommandOptionType.String': ApplicationCommandOptionType.String,
  'CommandOptionType.Integer': ApplicationCommandOptionType.Integer,
  'CommandOptionType.Number': ApplicationCommandOptionType.Number,
  'CommandOptionType.Boolean': ApplicationCommandOptionType.Boolean,
  'CommandOptionType.User': ApplicationCommandOptionType.User,
  'CommandOptionType.Channel': ApplicationCommandOptionType.Channel,
  'CommandOptionType.Role': ApplicationCommandOptionType.Role,
  'CommandOptionType.Attachment': ApplicationCommandOptionType.Attachment,
};

const PermissionFlagMap = {
  'CreateInstantInvite': PermissionFlagsBits.CreateInstantInvite,
  'KickMembers': PermissionFlagsBits.KickMembers,
  'BanMembers': PermissionFlagsBits.BanMembers,
  'Administrator': PermissionFlagsBits.Administrator,
  'ManageChannels': PermissionFlagsBits.ManageChannels,
  'ManageGuild': PermissionFlagsBits.ManageGuild,
  'AddReactions': PermissionFlagsBits.AddReactions,
  'ViewAuditLog': PermissionFlagsBits.ViewAuditLog,
  'PrioritySpeaker': PermissionFlagsBits.PrioritySpeaker,
  'Stream': PermissionFlagsBits.Stream,
  'ViewChannel': PermissionFlagsBits.ViewChannel,
  'SendMessages': PermissionFlagsBits.SendMessages,
  'SendTTSMessages': PermissionFlagsBits.SendTTSMessages,
  'ManageMessages': PermissionFlagsBits.ManageMessages,
  'EmbedLinks': PermissionFlagsBits.EmbedLinks,
  'AttachFiles': PermissionFlagsBits.AttachFiles,
  'ReadMessageHistory': PermissionFlagsBits.ReadMessageHistory,
  'MentionEveryone': PermissionFlagsBits.MentionEveryone,
  'UseExternalEmojis': PermissionFlagsBits.UseExternalEmojis,
  'ViewGuildInsights': PermissionFlagsBits.ViewGuildInsights,
  'Connect': PermissionFlagsBits.Connect,
  'Speak': PermissionFlagsBits.Speak,
  'MuteMembers': PermissionFlagsBits.MuteMembers,
  'DeafenMembers': PermissionFlagsBits.DeafenMembers,
  'MoveMembers': PermissionFlagsBits.MoveMembers,
  'UseVAD': PermissionFlagsBits.UseVAD,
  'ChangeNickname': PermissionFlagsBits.ChangeNickname,
  'ManageNicknames': PermissionFlagsBits.ManageNicknames,
  'ManageRoles': PermissionFlagsBits.ManageRoles,
  'ManageWebhooks': PermissionFlagsBits.ManageWebhooks,
  'ManageEmojisAndStickers': PermissionFlagsBits.ManageEmojisAndStickers,
  'UseApplicationCommands': PermissionFlagsBits.UseApplicationCommands,
  'RequestToSpeak': PermissionFlagsBits.RequestToSpeak,
  'ManageEvents': PermissionFlagsBits.ManageEvents,
  'ManageThreads': PermissionFlagsBits.ManageThreads,
  'CreatePublicThreads': PermissionFlagsBits.CreatePublicThreads,
  'CreatePrivateThreads': PermissionFlagsBits.CreatePrivateThreads,
  'UseExternalStickers': PermissionFlagsBits.UseExternalStickers,
  'SendMessagesInThreads': PermissionFlagsBits.SendMessagesInThreads,
  'UseEmbeddedActivities': PermissionFlagsBits.UseEmbeddedActivities,
  'ModerateMembers': PermissionFlagsBits.ModerateMembers,
};

/**
 * Transform JSON value
 * @param {string} key - Key
 * @param {string} value - Value
 * @return {string|number|array|undefined}
 */
function transformKV(key, value) {
  switch (key) {
    case 'name':
    case 'description':
      if (
        (typeof value === 'string') &&
        (value.startsWith('%%')) &&
        (value.endsWith('%%'))
      ) {
        return getLocalization(value.slice(2, -2))['en-US'];
      }
    case 'name_localizations':
    case 'description_localizations':
      if (
        (typeof value === 'string') &&
        (value.startsWith('%%')) &&
        (value.endsWith('%%'))
      ) {
        return getLocalization(value.slice(2, -2));
      }
    case 'type': return AppCommandOptionTypeMap[value];
    case 'channel_types': return value.map((type) => ChannelTypeMap[type]);
    case 'default_member_permissions':
      return resolvePermissionsBitField(
          value.reduce(
              (all, current) => PermissionFlagMap[current] | all,
              BigInt(0),
          ),
      );
  }
  return value;
}

/**
 * Build command data file
 */
export async function buildCommandData() {
  /** Full file paths of command data files */
  // const commandDataFiles = findFiles(importDir, ['.js'], 3);
  const commandDataFiles = findFiles(importDir, ['.json'], 3);

  const allCommandData = new Map();
  const globalCommandData = [];
  const ownerCommandData = [];
  allCommandData.set('global', globalCommandData);
  allCommandData.set('owner', ownerCommandData);

  /** A set of all global command names */
  const allCommandNames = new Set();

  console.log('Importing command data...');

  for (let i = 0; i < commandDataFiles.length; i++) {
    const fPath = commandDataFiles[i];
    try {
      // const {default: cmd} = await import(pathToFileURL(fPath).href);
      const cmd = readTJson(fPath, transformKV);
      if (cmd.commandData) {
        if (allCommandNames.has(cmd.commandName)) {
          console.error(`Command name collision: ${cmd.commandName}`);
        } else {
          allCommandNames.add(cmd.commandName);
          if (cmd.global) {
            globalCommandData.push(cmd.commandData);
            console.log(`Command data imported: global/${cmd.commandName}`);
          } else if (cmd.ownerOnly) {
            ownerCommandData.push(cmd.commandData);
            console.log(`Command data imported: owner/${cmd.commandName}`);
          } else if (Array.isArray(cmd.servers)) {
            cmd.servers.forEach((serverId) => {
              if (allCommandData.has(serverId)) {
                allCommandData.get(serverId).push(cmd.commandData);
              } else {
                allCommandData.set(serverId, [cmd.commandData]);
              }
            });
          } else {
            console.error(`Command with unknown scope: ${cmd.commandName}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading command module from ${fPath}`, error.stack);
    }
  }

  saveJson(allCommandData, exportFilePath);
  console.log('Command data file (command-data.json) built');
}
