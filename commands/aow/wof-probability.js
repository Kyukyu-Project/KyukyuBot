/* eslint-disable max-len */
/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').CommandActionResult} ActionResult
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';
import {formatNumber} from '../../utils/utils.js';

import {Statistics} from 'statistics.js';

const stats = new Statistics({});

export const canonName = 'aow.wof';
export const name = 'wof';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const cgLegendaryLabel = 'legendary';
const cgEpicLabel      = 'epic';
const cgVoucherLabel   = 'voucher';

const scModeLabel      = 'mode';
const scExactLabel     = 'exact';
const scAtLeastLabel   = 'at-least';
const scRangeLabel     = 'between';

const optExactLabel    = 'exactly';
const optMinLabel      = 'min';
const optMaxLabel      = 'max';
const optSpinCountLabel= 'spin-count';

/**
 * Binomial distribution function
 * @param {number} n number of tries
 * @param {number} p probability
 * @param {number} k number of occurrences
 * @return {number} probability
 */
function bin(n, p, k) {
  return stats.binomialProbabilityMass(k, n, p);
}

/**
 * @param {number} n number of tries
 * @param {number} pA probability of A
 * @param {number} kA number of occurrences of A
 * @param {number} pB probability of B
 * @param {number} kB number of occurrences of B
 * @return {number} probability
 */
function bin2(n, pA, kA, pB, kB) {
  const rA = bin(n, pA, kA);
  const rB = bin(n-kA, pB/(1-pA), kB);
  // console.log(`n: ${n}, pA: ${pA}, kA: ${kA}, pB: ${pB}, kB: ${kB}`);
  // console.log(`rA: ${rA}`);
  // console.log(`rB: ${rB}`);
  return rA * rB;
}

/**
 * Get possible combinations of q1 and q2 that gives resultQty
 * @param {number} resultQty
 * @param {number} q1 probability of item 1
 * @param {number} q2 number of occurrences of 1
 * @return {Array.<Array.<number>>}
 */
function getCombination(resultQty, q1, q2) {
  const r = [];
  if (q1 < q2) {
    let n1 = Math.floor(resultQty / q1);
    let n2 = 0;
    while (n1 >= 0) {
      n2 = (resultQty - (n1 * q1)) / q2;
      if (Number.isInteger(n2)) {
        r.push([n1, n2]);
      }
      n1--;
    }
  } else {
    let n2 = Math.floor(resultQty / q2);
    let n1 = 0;
    while (n2 >= 0) {
      n1 = (resultQty - (n2 * q2)) / q1;
      if (Number.isInteger(n1)) {
        r.push([n1, n2]);
      }
      n2--;
    }
  }
  return r;
}

/**
 * @param {number} N total number of tries
 * @param {number} K total occurrences
 * @param {number} probA probability of A
 * @param {number} qtyA unit quantity of A
 * @param {number} probB probability of item B
 * @param {number} qtyB unit quantity of B
 * @return {number} probability
 */
function getProbability(N, K, probA, qtyA, probB, qtyB) {
  let prob = 0;
  if (qtyB == qtyA) {
    prob = bin(N, probA, K);
  } else {
    const combinations = getCombination(K, qtyA, qtyB);
    for (let i=0; i<combinations.length; i++) {
      const kA = combinations[i][0];
      const kB = combinations[i][1];
      prob += prob = bin2(N, probA, kA, probB, kB);
    }
  }
  return prob;
}

/**
 * @param {CommandContext|IContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, 'commands.aow.wof.c-hint');

  const optExactHint = l10n.s(lang, 'commands.aow.wof.opt-exact-hint');
  const optMinHint = l10n.s(lang, 'commands.aow.wof.opt-min-hint');
  const optMaxHint = l10n.s(lang, 'commands.aow.wof.opt-max-hint');
  const optSpinCountHint = l10n.s(lang, 'commands.aow.wof.opt-spin-count-hint');

  const getExactOption = (option) => option
      .setName(optExactLabel)
      .setDescription(optExactHint)
      .setRequired(true)
      .setMinValue(1);

  const getMinOption = (option) => option
      .setName(optMinLabel)
      .setDescription(optMinHint)
      .setRequired(true)
      .setMinValue(1);

  const getMaxOption = (option) => option
      .setName(optMaxLabel)
      .setDescription(optMaxHint)
      .setRequired(true)
      .setMinValue(2);

  const getSpinCountOption = (option) => option
      .setName(optSpinCountLabel)
      .setDescription(optSpinCountHint)
      .setRequired(true)
      .setMinValue(20)
      .setMaxValue(1400);

  // For calculating voucher probability
  // Set max spin count to 800
  const getSpinCountOption2 = (option) => option
      .setName(optSpinCountLabel)
      .setDescription(optSpinCountHint)
      .setRequired(true)
      .setMinValue(20)
      .setMaxValue(800);

  const slashCommand = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommandGroup((command) => command
          .setName(cgLegendaryLabel)
          .setDescription(l10n.s(lang, 'commands.aow.wof.cg-legendary-hint'))
          .addSubcommand((command) => command
              .setName(scModeLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-legendary-mode-hint'))
              .addNumberOption(getSpinCountOption),
          )
          .addSubcommand((command) => command
              .setName(scExactLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-legendary-exact-hint'))
              .addNumberOption(getExactOption)
              .addNumberOption(getSpinCountOption),
          )
          .addSubcommand((command) => command
              .setName(scAtLeastLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-legendary-at-least-hint'))
              .addNumberOption(getMinOption)
              .addNumberOption(getSpinCountOption),
          )
          .addSubcommand((command) => command
              .setName(scRangeLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-legendary-range-hint'))
              .addNumberOption(getMinOption)
              .addNumberOption(getMaxOption)
              .addNumberOption(getSpinCountOption),
          ),
      )
      .addSubcommandGroup((command) => command
          .setName(cgEpicLabel)
          .setDescription(l10n.s(lang, 'commands.aow.wof.cg-epic-hint'))
          .addSubcommand((command) => command
              .setName(scModeLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-epic-mode-hint'))
              .addNumberOption(getSpinCountOption),
          )
          .addSubcommand((command) => command
              .setName(scExactLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-epic-exact-hint'))
              .addNumberOption(getExactOption)
              .addNumberOption(getSpinCountOption),
          )
          .addSubcommand((command) => command
              .setName(scAtLeastLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-epic-at-least-hint'))
              .addNumberOption(getMinOption)
              .addNumberOption(getSpinCountOption),
          )
          .addSubcommand((command) => command
              .setName(scRangeLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-epic-range-hint'))
              .addNumberOption(getMinOption)
              .addNumberOption(getMaxOption)
              .addNumberOption(getSpinCountOption),
          ),
      )
      .addSubcommandGroup((command) => command
          .setName(cgVoucherLabel)
          .setDescription(l10n.s(lang, 'commands.aow.wof.cg-voucher-hint'))
          .addSubcommand((command) => command
              .setName(scModeLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-voucher-mode-hint'))
              .addNumberOption(getSpinCountOption2),
          )
          .addSubcommand((command) => command
              .setName(scExactLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-voucher-exact-hint'))
              .addNumberOption(getExactOption)
              .addNumberOption(getSpinCountOption2),
          )
          .addSubcommand((command) => command
              .setName(scAtLeastLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-voucher-at-least-hint'))
              .addNumberOption(getMinOption)
              .addNumberOption(getSpinCountOption2),
          )
          .addSubcommand((command) => command
              .setName(scRangeLabel)
              .setDescription(l10n.s(lang, 'commands.aow.wof.sc-voucher-range-hint'))
              .addNumberOption(getMinOption)
              .addNumberOption(getMaxOption)
              .addNumberOption(getSpinCountOption2),
          ),
      );
  return slashCommand;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  const options = interaction.options;
  const subcommandGroup = options.getSubcommandGroup();
  const subCommand = options.getSubcommand();
  const numberLocale = l10n.s(lang, 'number-locale');

  let qty1 = 0;
  let prob1 = 0;
  let qty2 = 0;
  let prob2 = 0;
  /** template string for mode */ let modeTemplate;
  /** template string for exact */ let exactTemplate;
  /** template string for at least */ let atLeastTemplate;
  /** template string for range */ let rangTemplate;

  let xValue = 0;
  let yValue = 0;
  let probValue = 0;

  switch (subcommandGroup) {
    case cgVoucherLabel:
      qty1 = 1;
      prob1 = 0.19; // probability of 1× voucher
      qty2 = 3;
      prob2 = 0.06; // probability of 3× vouchers
      modeTemplate = 'voucher-prob-mode';
      exactTemplate = 'voucher-prob-exact';
      atLeastTemplate = 'voucher-prob-at-least';
      rangTemplate = 'voucher-prob-range';
      break;
    case cgEpicLabel:
      qty1 = qty2 = 1;
      prob1 = prob2 = 0.03; // probability of 1× shard
      modeTemplate = 'epic-prob-mode';
      exactTemplate = 'epic-prob-exact';
      atLeastTemplate = 'epic-prob-at-least';
      rangTemplate = 'epic-prob-range';
      break;
    case cgLegendaryLabel:
    default:
      qty1 = 1;
      prob1 = 0.016; // probability of 1× shard
      qty2 = 2;
      prob2 = 0.004; // probability of 2× shards
      modeTemplate = 'legendary-prob-mode';
      exactTemplate = 'legendary-prob-exact';
      atLeastTemplate = 'legendary-prob-at-least';
      rangTemplate = 'legendary-prob-range';
  }

  const spinCount = Math.floor(options.getNumber(optSpinCountLabel));

  switch (subCommand) {
    case scModeLabel:
      const modeResult = calculateMode(spinCount, prob1, qty1, prob2, qty2);
      xValue = formatNumber(modeResult.mode, numberLocale);
      probValue = formatNumber(
          modeResult.probability * 100,
          numberLocale,
          {minimumFractionDigits: 2},
      );
      interaction.reply(
          l10n.t(
              lang,
              `commands.aow.wof.${modeTemplate}`,
              '{SPIN_COUNT}', spinCount,
              '{X}', xValue,
              '{PROB}', probValue,
          ),
      );
      return true;
    case scExactLabel:
      const exact = Math.floor(options.getNumber(optExactLabel));
      if (exact > spinCount * 0.8) {
        interaction.reply({
          content: l10n.s(lang, 'commands.aow.wof.error'),
          ephemeral: true,
        });
        return false;
      }
      const exactProb =
        getProbability(spinCount, exact, prob1, qty1, prob2, qty2);

      xValue = formatNumber(exact, numberLocale);
      probValue = formatNumber(
          exactProb * 100,
          numberLocale,
          {minimumFractionDigits: 2},
      );

      interaction.reply(l10n.t(
          lang, `commands.aow.wof.${exactTemplate}`,
          '{SPIN_COUNT}', spinCount, '{X}', xValue, '{PROB}', probValue,
      ));
      return true;
    case scAtLeastLabel:
      const atLeast = Math.floor(options.getNumber(optMinLabel));
      if (atLeast > spinCount * 0.8) {
        interaction.reply({
          content: l10n.s(lang, 'commands.aow.wof.error'),
          ephemeral: true,
        });
        return false;
      }
      const atLeastProbability =
        calculateAtLeast(spinCount, atLeast, prob1, qty1, prob2, qty2);

      xValue = formatNumber(atLeast, numberLocale);
      probValue = formatNumber(
          atLeastProbability * 100,
          numberLocale,
          {minimumFractionDigits: 2},
      );

      interaction.reply(l10n.t(
          lang, `commands.aow.wof.${atLeastTemplate}`,
          '{SPIN_COUNT}', spinCount, '{X}', xValue, '{PROB}', probValue,
      ));
      return true;
    case scRangeLabel:
      let min = Math.floor(options.getNumber(optMinLabel));
      let max = Math.floor(options.getNumber(optMaxLabel));
      if (min > max) {
        const temp = min;
        min = max;
        max = temp;
      }

      if (max > spinCount * 0.8) {
        interaction.reply({
          content: l10n.s(lang, 'commands.aow.wof.error'),
          ephemeral: true,
        });
        return false;
      }
      const rangProbability =
        calculateRange(spinCount, min, max, prob1, qty1, prob2, qty2);

      xValue = formatNumber(min, numberLocale);
      yValue = formatNumber(max, numberLocale);
      probValue = formatNumber(
          rangProbability * 100,
          numberLocale,
          {minimumFractionDigits: 2},
      );

      interaction.reply(l10n.t(
          lang,
          `commands.aow.wof.${rangTemplate}`,
          '{SPIN_COUNT}', spinCount,
          '{X}', xValue, '{Y}', yValue,
          '{PROB}', probValue,
      ));
      return true;
  }

  return true;
}

/**
 * @param {number} N - total number of tries
 * @param {number} probA - probability of A
 * @param {number} qtyA - unit quantity of A
 * @param {number} probB - probability of item B
 * @param {number} qtyB - unit quantity of B
 * @return {object} probability
 */
function calculateMode(N, probA, qtyA, probB, qtyB) {
  let resultQty = 0;
  let prevProbability;
  let thisProbability = 0;

  // calculate probabilities starting from 0 until the result starts to drop
  do {
    prevProbability = thisProbability;
    resultQty++;
    thisProbability = getProbability(N, resultQty, probA, qtyA, probB, qtyB);
    // console.log(`${resultQty}: ${thisProbability}`);
  } while (thisProbability > prevProbability);

  // the quantity before the drop is the peak
  --resultQty;

  return {
    mode: resultQty-1,
    probability: prevProbability,
  };
}

/**
 * @param {number} N - total number of tries
 * @param {number} minQty - minimum quantity
 * @param {number} probA - probability of A
 * @param {number} qtyA - unit quantity of A
 * @param {number} probB - probability of item B
 * @param {number} qtyB - unit quantity of B
 * @return {number} probability
 */
function calculateAtLeast(N, minQty, probA, qtyA, probB, qtyB) {
  let probabilityAtMost = 0;
  for (let resultQty = 0; resultQty < minQty; resultQty++) {
    probabilityAtMost += getProbability(N, resultQty, probA, qtyA, probB, qtyB);
  }
  return 1 - probabilityAtMost;
}

/**
 * @param {number} N - total number of tries
 * @param {number} minQty - minimum quantity
 * @param {number} maxQty - max quantity
 * @param {number} probA - probability of A
 * @param {number} qtyA - unit quantity of A
 * @param {number} probB - probability of item B
 * @param {number} qtyB - unit quantity of B
 * @return {number} probability
 */
function calculateRange(N, minQty, maxQty, probA, qtyA, probB, qtyB) {
  let probability = 0;
  for (let resultQty = minQty; resultQty <= maxQty; resultQty++) {
    probability += getProbability(N, resultQty, probA, qtyA, probB, qtyB);
  }
  return probability;
}
