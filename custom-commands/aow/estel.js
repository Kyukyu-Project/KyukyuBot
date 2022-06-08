/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'fun.estel';
export const name = 'estel';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 10;
export const guilds = ['658594298983350293'];

/**
 * @param {string} hexColor
 * @return {object}
 */
function color(hexColor) {
  const hex = hexColor.substring(1);
  /* Get the RGB values to calculate the Hue. */
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  /* Getting the Max and Min values for Chroma. */
  const max = Math.max.apply(Math, [r, g, b]);
  const min = Math.min.apply(Math, [r, g, b]);

  /* Variables for HSV value of hex color. */
  const chr = max - min;
  let hue = 0;
  const val = max;
  let sat = 0;

  if (val > 0) {
    /* Calculate Saturation only if Value isn't 0. */
    sat = chr / val;
    if (sat > 0) {
      if (r == max) {
        hue = 60 * (((g - min) - (b - min)) / chr);
        if (hue < 0) {
          hue += 360;
        }
      } else if (g == max) {
        hue = 120 + 60 * (((b - min) - (r - min)) / chr);
      } else if (b == max) {
        hue = 240 + 60 * (((r - min) - (g - min)) / chr);
      }
    }
  }

  return {
    chroma: chr,
    hue: hue,
    sat: sat,
    val: val,
    luma: 0.3 * r + 0.59 * g + 0.11 * b,
    red: parseInt(hex.substring(0, 2), 16),
    green: parseInt(hex.substring(2, 4), 16),
    blue: parseInt(hex.substring(4, 6), 16),
    hexColor: hexColor,
  };
};

/**
 * @param {CommandContext|IContext} context
 * @return {ContextMenuCommandBuilder}
 */
export function getSlashData(context) {
  const cHint = 'create a colorful message of role tags';
  return new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {guild, channel, interaction} = context;

  const CLAN_ROLES =
      guild.roles.cache
          .filter((role) =>
            (role.name.length < 15) &&
            (role.mentionable) &&
            (!role.name.startsWith('@')),
          )
          .map((role) => (
            {
              name: role.name,
              id: role.id,
              color: color(role.hexColor),
            }
          ))
          .filter((clanRole) => (
            clanRole.color.sat > 0.15 // filter out gray/black
          ))
          .sort((a, b) => (a.color.hue > b.color.hue)?1:-1);

  const W = Math.floor(CLAN_ROLES.length / 10);

  const CLAN_GROUPS = [];

  for (let r = 0; r < 11; r++) {
    CLAN_GROUPS.push(CLAN_ROLES.slice(r * W, r * W + W));
  }

  CLAN_GROUPS.push(CLAN_ROLES.slice(11 * W));

  CLAN_GROUPS.forEach((row) => {
    row.sort((a, b) => a.color.luma - b.color.luma);
  });

  const mentions = CLAN_GROUPS
      .map((row) => (row.map((r) => `<@&${r.id}>`).join(' ')));

  const publicMessage = (
    context.hasOwnerPermission ||
    context.hasAdminPermission ||
    context.userIsMod);

  if (publicMessage) {
    interaction.reply({
      content: 'there you go',
      ephemeral: true,
    });
    channel.send(mentions.join('\n'));
  } else {
    interaction.reply({
      content: mentions.join('\n'),
      ephemeral: true,
    });
  }

  return true;
}
