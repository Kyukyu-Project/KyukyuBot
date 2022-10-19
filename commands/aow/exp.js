/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {ChannelType} from 'discord.js';
import {l10n} from '../../src/l10n.js';

export const commandName = 'exp';
export const cooldown  = 20;

const EXP_POINTS = [
  0, 50, 150, 350, 750, 1550,
  2550, 3750, 5150, 6750, 8550,
  10550, 12750, 15150, 17750, 20550, 23550,
  26750, 30150, 33750, 37550, 41550, 45950, 50750,
  55950, 61550, 67550, 73950, 80750, 87950, 95550,
  103550, 111950, 120750, 129950, 139550, 149550,
  160050, 171050, 182550, 194550, 207050, 220050,
  233550, 247550, 262050, 277050, 292550, 308550,
  325050, 342050, 359550, 377550, 396050, 415050,
  434550, 454550, 475550, 497550, 520550, 544550,
  569550, 595550, 622550, 650550, 679550, 709550,
  740550, 772550, 805550, 839550, 874550, 910550,
  947550, 985550,
  1024550, 1064550, 1106550, 1150550, 1196550,
  1244550, 1294550, 1346550, 1400550, 1456550,
  1514550, 1574550, 1636550, 1700550, 1766550,
  1834560, 1904550, 1976550, 2050550, 2126550,
  2204550, 2284550, 2366550, 2450550, 2536550];

/**
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {
    channel,
    interaction,
    locale,
    guildSettings,
    userIsAdmin,
    userIsHelper,
  } = context;
  const options = interaction.options;

  if (
    (channel.type === ChannelType.GuildText) &&
    (!userIsHelper) && (!userIsAdmin)
  ) {
    const botChannelId = guildSettings['bot-channel'];
    if (botChannelId) {
      if (botChannelId !== channel.id) {
        interaction.reply({
          content: l10n.t(
              locale, 'cmd.exp.result.bot-channel-only',
              '{CHANNEL}', `<#${botChannelId}>`),
          ephemeral: true,
        });
        return false;
      }
    } else {
      interaction.reply({
        content: l10n.s(locale, 'cmd.exp.result.dm-only'),
        ephemeral: true,
      });
      return false;
    }
  }

  const currPoints = Math.floor(options.getInteger('exp-points'));

  const maxLevel = EXP_POINTS.length;
  const maxPoints = EXP_POINTS[maxLevel-1];

  if (currPoints >= maxPoints) {
    interaction.reply(l10n.t(
        locale, 'cmd.exp.result.target-reached',
        '{NEXT LEVEL}', maxLevel,
    ));
    return true;
  }

  const currLevel = EXP_POINTS.findIndex((pt) => pt > currPoints);

  let targetLevel = Math.floor(options.getInteger('level')||0);
  if (targetLevel == 0) {
    targetLevel = currLevel + 1;
  } else if (targetLevel <= currLevel) {
    interaction.reply(l10n.t(
        locale, 'cmd.exp.result.target-reached',
        '{NEXT LEVEL}', targetLevel,
    ));
    return true;
  }

  const pointsToNextLevel = EXP_POINTS[targetLevel-1] - currPoints;
  const goldToNextLevel = pointsToNextLevel / 240;

  if (goldToNextLevel > 4) {
    const goldFormatted = l10n.formatNumber(
        locale, goldToNextLevel, {minimumFractionDigits: 1},
    );

    const expFormatted = l10n.formatNumber(
        locale, currPoints, {maximumFractionDigits: 0},
    );

    interaction.reply(l10n.t(
        locale, 'cmd.exp.result.next',
        '{EXP POINT}', expFormatted,
        '{GOLD AMOUNT}', goldFormatted,
        '{CURR LEVEL}', currLevel,
        '{NEXT LEVEL}', targetLevel,
    ));
  } else {
    interaction.reply(l10n.t(
        locale, 'cmd.exp.result.you-are-close',
        '{CURR LEVEL}', currLevel,
        '{NEXT LEVEL}', targetLevel,
    ));
  }
  return true;
}
