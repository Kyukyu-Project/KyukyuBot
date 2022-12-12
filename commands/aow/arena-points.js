/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';

const commandName = 'arena-points';
const cooldown  = 5;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {interaction, locale} = context;
  const {options} = interaction;

  const currScore = options.getInteger('current');
  const brackets = getBrackets(currScore);

  const top = l10n.t(
      locale, 'cmd.arena-points.current-result',
      '{YOUR SCORE}', currScore);
  const row = l10n.s(locale, 'cmd.arena-points.current-result.row');
  const sep = l10n.s(locale, 'cmd.arena-points.current-result.separator');

  const lines = [top, sep];

  for (let i=0; i < brackets.length; i++) {
    const thisBracket = brackets[i];
    const thisRow = l10n.r(
        row,
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
 * @param {number} currScore - current point
 * @return {Bracket[]}
 */
function getBrackets(currScore) {
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
    let newEstimate = estimate(currScore, ceiling);
    const gain = newEstimate.gain;
    const loss = newEstimate.loss;

    do {
      ceiling++;
      newEstimate = estimate(currScore, ceiling);
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
    let newEstimate = estimate(currScore, floor);
    const gain = newEstimate.gain;
    const loss = newEstimate.loss;

    do {
      floor--;
      newEstimate = estimate(currScore, floor);
    } while ((newEstimate.gain == gain) && (newEstimate.loss == loss));

    return {
      floor: floor + 1,
      ceiling: curr.floor - 1,
      gain: gain,
      loss: loss,
    };
  }

  let floor = currScore;
  let ceiling = currScore;

  let newEstimate;
  do {
    ceiling++;
    newEstimate = estimate(currScore, ceiling);
  } while ((newEstimate.gain == 16) && (newEstimate.loss == -8));

  do {
    floor--;
    newEstimate = estimate(currScore, floor);
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

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
