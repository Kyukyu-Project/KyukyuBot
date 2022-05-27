/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {formatNumber} from '../../utils/utils.js';

export const canonName = 'aow.exp';
export const name = 'exp';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optCurrentLabel  = 'current-points';
const optLevelLabel   = 'target-level';

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
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint = l10n.s(lang, 'commands.aow.wof.c-hint');

  const optCurrentHint = l10n.s(lang, `commands.${canonName}.opt-current-hint`);
  const optLevelHint = l10n.s(lang, `commands.${canonName}.opt-level-hint`);

  const slashCommand = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addNumberOption((option) => option
          .setName(optCurrentLabel)
          .setDescription(optCurrentHint)
          .setRequired(true)
          .setMinValue(EXP_POINTS[9]))
      .addNumberOption((option) => option
          .setName(optLevelLabel)
          .setDescription(optLevelHint)
          .setRequired(false)
          .setMinValue(10)
          .setMaxValue(EXP_POINTS.length));
  return slashCommand;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;
  const options = interaction.options;

  const currPoints = Math.floor(options.getNumber(optCurrentLabel));

  const maxLevel = EXP_POINTS.length;
  const maxPoints = EXP_POINTS[maxLevel-1];

  if (currPoints >= maxPoints) {
    interaction.reply(l10n.t(
        lang,
        `commands.${canonName}.response-target-reached`,
        '{NEXT LEVEL}', maxLevel,
    ));
    return true;
  }

  const currLevel = EXP_POINTS.findIndex((pt) => pt > currPoints);

  let targetLevel = Math.floor(options.getNumber(optLevelLabel)||0);
  if (targetLevel == 0) {
    targetLevel = currLevel + 1;
  } else if (targetLevel <= currLevel) {
    interaction.reply(l10n.t(
        lang,
        `commands.${canonName}.response-target-reached`,
        '{NEXT LEVEL}', targetLevel,
    ));
    return true;
  }

  const pointsToNextLevel = EXP_POINTS[targetLevel-1] - currPoints;
  const goldToNextLevel = pointsToNextLevel / 240;

  if (goldToNextLevel > 4) {
    const numberLocale = l10n.s(lang, 'number-locale');
    const goldFormatted = formatNumber(
        goldToNextLevel, numberLocale, {minimumFractionDigits: 1},
    );
    const expFormatted = formatNumber(
        currPoints, numberLocale, {maximumFractionDigits: 0},
    );
    interaction.reply(l10n.t(
        lang, `commands.${canonName}.response-next`,
        '{EXP POINT}', expFormatted,
        '{CURR LEVEL}', currLevel,
        '{NEXT LEVEL}', targetLevel,
        '{GOLD AMOUNT}', goldFormatted,
    ));
  } else {
    interaction.reply(l10n.t(
        lang, `commands.${canonName}.response-you-are-close`,
        '{CURR LEVEL}', currLevel,
        '{NEXT LEVEL}', targetLevel,
    ));
  }
  return true;
}
