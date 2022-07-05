/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */

import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';

export const canonName = 'aow.arena-point';
export const name = 'arena-point';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optCurrentLabel  = 'current-points';

/**
 * Point bracket
 * @typedef {Object} Bracket
 * @property {number} floor - lower end of opponent point
 * @property {number} ceiling - higher end of opponent point
 * @property {number} gain - point gain on win
 * @property {number} loss - point loss on loss
 */

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);

  const optCurrentHint = l10n.s(lang, `commands.${canonName}.opt-current-hint`);

  const slashCommand = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addNumberOption((option) => option
          .setName(optCurrentLabel)
          .setDescription(optCurrentHint)
          .setRequired(true)
          .setMinValue(2500)
          .setMaxValue(9000));
  return slashCommand;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  const options = interaction.options;
  const currPoints = Math.floor(options.getNumber(optCurrentLabel));

  const brackets = getBrackets(currPoints);

  const heading = l10n.t(
      lang,
      `commands.${canonName}.response-heading`,
      '{YOUR POINTS}',
      currPoints);

  const th = l10n.s(lang, `commands.${canonName}.response-table-heading`);
  const tr = l10n.s(lang, `commands.${canonName}.response-table-row`);
  const sep = l10n.s(lang, `commands.${canonName}.response-table-separator`);

  const lines = [heading, '```', th, sep];

  for (let i=0; i < brackets.length; i++) {
    const thisBracket = brackets[i];
    const thisRow = l10n.r(
        tr,
        '{FLOOR}', thisBracket.floor,
        '{CEILING}', thisBracket.ceiling,
        '{GAIN}', ('+' + thisBracket.gain).padStart(3, ' '),
        '{LOSS}', String(thisBracket.loss).padStart(3, ' '));
    if ((i > 0) && (brackets[i-1]).gain !== thisBracket.gain) {
      lines.push(sep);
    }
    lines.push(thisRow);
  };

  lines.push('```');

  interaction.reply(lines.join('\n'));
  return true;
}

/**
 * @param {number} currPoints - current point
 * @return {Bracket[]}
 */
function getBrackets(currPoints) {
  /**
   * @param {number} you - your points
   * @param {number} opp - opponent's points
   * @return {Bracket}
   */
  function estimate(you, opp) {
    const E1 = 1 / ( 1 + Math.pow(10, (you - opp)/1000));
    const gain = Math.round(32 * E1);

    const E2 = 1 / ( 1 + Math.pow(10, (opp - you)/1000));
    const loss = -Math.floor(16 * E2);
    return {
      gain: gain,
      loss: loss,
    };
  }

  /**
   * Get next bracket (hit up)
   * @param {Bracket} curr - current bracket
   * @return {Bracket}
   */
  function getNextBracket(curr) {
    let ceiling = curr.ceiling + 1;
    let newEstimate = estimate(currPoints, ceiling);
    const gain = newEstimate.gain;
    const loss = newEstimate.loss;

    do {
      ceiling++;
      newEstimate = estimate(currPoints, ceiling);
    } while ((newEstimate.gain == gain) && (newEstimate.loss == loss));

    return {
      floor: curr.ceiling + 1,
      ceiling: ceiling -1,
      gain: gain,
      loss: loss,
    };
  }

  /**
   * Get previous bracket (hit down)
   * @param {Bracket} curr - current bracket
   * @return {Bracket}
   */
  function getPrevBracket(curr) {
    let floor = curr.floor - 1;
    let newEstimate = estimate(currPoints, floor);
    const gain = newEstimate.gain;
    const loss = newEstimate.loss;

    do {
      floor--;
      newEstimate = estimate(currPoints, floor);
    } while ((newEstimate.gain == gain) && (newEstimate.loss == loss));

    return {
      floor: floor + 1,
      ceiling: curr.floor - 1,
      gain: gain,
      loss: loss,
    };
  }

  let floor = currPoints;
  let ceiling = currPoints;

  let newEstimate;
  do {
    ceiling++;
    newEstimate = estimate(currPoints, ceiling);
  } while ((newEstimate.gain == 16) && (newEstimate.loss == -8));

  do {
    floor--;
    newEstimate = estimate(currPoints, floor);
  } while ((newEstimate.gain == 16) && (newEstimate.loss == -8));

  const centerBracket = {
    floor: floor+1,
    ceiling: ceiling -1,
    gain: 16,
    loss: -8,
  };

  let results = [centerBracket];

  for (let i = 0; i < 6; i++) {
    results.unshift(getNextBracket(results[0]));
  }
  for (let i = 0; i < 6; i++) {
    results = results.concat(getPrevBracket(results[results.length-1]));
  }

  return results;
}
