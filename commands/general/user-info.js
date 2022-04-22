/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import Discord from 'discord.js';
import {COMMAND_PERM} from '../../src/typedef.js';
import {ContextMenuCommandBuilder} from '@discordjs/builders';
import {formatDate} from '../../utils/utils.js';

export const canonName = 'general.user-info';
export const name = 'user-info';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 10;

import {getUserId} from '../../utils/utils.js';

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  return new ContextMenuCommandBuilder().setName(name).setType(2);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, guild, lang, interaction} = context;
  const {l10n} = client;
  const {targetId} = interaction;

  const member = guild.members.cache.get(targetId);
  const user = member.user;

  const thumbnail =
      member.displayAvatarURL({size: 64, format: 'png', dynamic: true});

  const response =
    l10n.t(lang, `commands.${canonName}.response`, '{USER ID}', targetId);

  const embed = {
    'thumbnail': {'url': thumbnail},
    'fields': [
      {
        'name': l10n.s(lang, `commands.${canonName}.tag-label`),
        'value': Discord.Util.escapeMarkdown(user.tag),
        'inline': true,
      },
      {
        'name': l10n.s(lang, `commands.${canonName}.id-label`),
        'value': targetId,
        'inline': true,
      },
    ],
  };

  if (member.nickname) {
    embed.fields.push({
      'name': l10n.s(lang, `commands.${canonName}.nickname-label`),
      'value': Discord.Util.escapeMarkdown(member.nickname),
      'inline': true,
    });
  }

  // filter out @everyone
  const roles = member.roles.cache
      .filter((r) => r.id !== guild.id)
      .map((r) => `<@&${r.id}>`);

  if (roles.length) {
    let roleList = l10n.join(lang, roles.slice(0, 25));

    if (roles.length > 25) roleList += l10n.s(lang, 'ellipsis');

    embed.fields.push({
      'name': l10n.s(lang, `commands.${canonName}.roles-label`),
      'value': roleList,
    });
  }

  const dateLocale = l10n.s(lang, 'date-locale');
  embed.fields.push({
    'name': l10n.s(lang, `commands.${canonName}.creation-date-label`),
    'value': formatDate(user.createdAt, dateLocale),
    'inline': true,
  });

  embed.fields.push({
    'name': l10n.s(lang, `commands.${canonName}.join-date-label`),
    'value': formatDate(member.joinedAt, dateLocale),
    'inline': true,
  });

  interaction.reply({
    'content': response,
    'embeds': [embed],
  });

  return true;
}

/**
 * @param {CommandContext} context
 * @param {string|null} userMention
 * @return {GuildMember}
 */
export function getMember(context, userMention) {
  const {guild, user} = context;
  const userId = getUserId(userMention);
  if (userId) {
    const member = guild.members.cache.get(userId);
    if (member) return member;
  }
  return guild.members.cache.get(user.id);
}
