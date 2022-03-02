/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';

export const canonName = 'general.avatar';
export const name = 'avatar';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 3;

import {getUserId} from '../../utils/utils.js';

const EMBED_TITLE          = `commands.${canonName}.embed-title`;
const USER_FLAGS           = `commands.${canonName}.flags.user`;
const DISPLAY_FLAGS        = `commands.${canonName}.flags.display`;

/**
 * @param {CommandContext} context
 * @param {string|null} userMention
 * @return {GuildMember}
 */
function getMember(context, userMention) {
  const {guild, user} = context;
  const userId = getUserId(userMention);
  if (userId) {
    const member = guild.members.cache.get(userId);
    if (member) return member;
  }
  return guild.members.cache.get(user.id);
}

/**
 * @param {CommandContext} context
 * @return {Promise<Discord.Message>}
 */
export async function execute(context) {
  const {client, guild, channel, lang, args, user} = context;
  const l10n = client.l10n;

  /** @type {string} */
  let avatarUrl;

  /** @type {GuildMember} */
  let member;

  if (args.length > 0) {
    const firstArg = args[0].toLowerCase();
    const userFlags = l10n.s(lang, USER_FLAGS);
    const displayFlags = l10n.s(lang, DISPLAY_FLAGS);

    if (displayFlags.includes(firstArg)) {
      member = getMember(context, args[1] || '');
      avatarUrl = member.displayAvatarURL();
    } else if (userFlags.includes(firstArg)) {
      member = getMember(context, args[1] || '');
      avatarUrl = member.user.avatarURL();
    } else {
      member = getMember(context, '');
      avatarUrl = member.displayAvatarURL();
    }
  } else {
    member = guild.members.cache.get(user.id);
    avatarUrl = member.displayAvatarURL();
  }

  channel.send({
    'embeds': [{
      'title': l10n.t(
          lang, EMBED_TITLE, '{USER NAME}', member.displayName),
      'image': {'url': avatarUrl},
    }],
  });

  return true;
}
