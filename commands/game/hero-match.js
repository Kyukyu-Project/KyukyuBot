/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('discord.js').ButtonInteraction} ButtonInteraction
 */

import {ChannelType} from 'discord.js';
import {l10n} from '../../src/l10n.js';
import {waitAsync} from '../../src/utils.js';

export const commandName = 'hero-match';
export const cooldown  = 0;

/**
 * Client configuration
 * @typedef {Object} Card
 * @property {number} value - Value of the card
 * @property {boolean} picked - Has this card been picked?
 * @property {'C'|'A'|'W'} type -  Card type
 * @property {string} emoji - Emoji for the card
 */

const UnknownEmoji = '<:h_unknown:1045588307876261948>';

const Emojis = [
  UnknownEmoji,
  '<:h_aly:1045588494803795988>',
  '<:h_apollo:1045590915206610964>',
  '<:h_charon:1045588831811936277>',
  '<:h_chione:1045590302850830417>',
  '<:h_davison:1045588966239383653>',
  '<:h_dracula:1045591071335391244>',
  '<:h_drake:1045590639259168878>',
  '<:h_freyja:1045590523118882896>',
  '<:h_harrison:1045591005396746270>',
  '<:h_ivan:1045590742975913984>',
  '<:h_jinn:1045590826719391775>',
  '<:h_kraken:1045588595903303721>',
  '<:h_mephisto:1045588705106214953>',
  '<:h_seondoek:1045591115220389918>',
  '<:h_zeus:1045588366953029762>',
];

const sessions = new Set();

/**
 * Shuffle an array
 * Code copied from https://bost.ocks.org/mike/shuffle/
 * @param {Array} array
 * @return {Array}
 */
function shuffle(array) {
  const result = Array.from(array);
  let m = result.length;
  let t;
  let i;
  while (m) { // While there remain elements to shuffle…
    i = Math.floor(Math.random() * m--); // Pick a remaining element…
    t = result[m]; // And swap it with the current element.
    result[m] = result[i];
    result[i] = t;
  }
  return result;
}

/**
 * Generate a 5x5 multi-player board
 * @return {Array}
 */
function generateMPBoard() {
  // Make a list of random numbers 1...15
  // Choose the first 10 numbers and put them in pairs
  // Choose 11th to 15th numbers as wild cards

  /** Randomized card values (1...15) */
  const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

  // Shuffle all the values
  const cardValues = shuffle([]
      // Values that computer will pick
      .concat(values.slice( 0, 10).map((v) => ({value: v, type: 'C'})))
      // Corresponding matching values (answers)
      .concat(values.slice( 0, 10).map((v) => ({value: v, type: 'A'})))
      // Wild values (not in pairs)
      .concat(values.slice(10, 15).map((i) => ({value: i, type: 'W'}))),
  );

  // Index of cards that computer will pick
  const computerPicks = [];
  cardValues.forEach((card, idx) => {
    if (card.type == 'C') {
      computerPicks.push(idx);
    }
  });

  /** @type {Card[]} */
  const cards = cardValues.map((card) => /** @type {Card} **/ ({
    value: card.value,
    picked: false,
    type: card.type,
    emoji: Emojis[card.value],
  }));

  return {
    cards: cards,
    computerPicks: shuffle(computerPicks),
  };
}


/**
 * Generate a 4x4 single-player board
 * @return {Array}
 */
function generateSPBoard() {
  // Make a list of random numbers 1...15
  // Choose the first 8 numbers and put them in pairs

  /** Randomized card values (1...15) */
  const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      .slice(0, 8);

  // Shuffle all the values
  const cardValues = shuffle([]
      // Values that computer will pick
      .concat(values.map((v) => ({value: v, type: 'C'})))
      // Corresponding matching values (answers)
      .concat(values.map((v) => ({value: v, type: 'A'})))
  );

  // Index of cards that computer will pick
  const computerPicks = [];
  cardValues.forEach((card, idx) => {
    if (card.type == 'C') computerPicks.push(idx);
  });

  /** @type {Card[]} */
  const cards = cardValues.map((card) => /** @type {Card} **/ ({
    value: card.value,
    picked: false,
    type: card.type,
    emoji: Emojis[card.value],
  }));

  return {
    cards: cards,
    computerPicks: shuffle(computerPicks),
  };
}

/**
 * Play the game (multi-player version)
 * @param {CommandContext} context - Interaction context
 */
async function playMP(context) {
  const {locale, channel, interaction} = context;
  let roundNumber = -1;
  let collectingAnswer = false;
  // const maxRound = 10;

  const board = generateMPBoard();

  const currentRoundWinners = new Set();
  const currentRoundLosers = new Set();
  const scores = new Map();

  let computerPickIdx;
  let answerIdx;

  /** @type {string} */
  const resAlreadyAnswered =
      l10n.s(locale, 'cmd.hero-match.mp.already-answered');

  /** @type {string} */
  const resCorrect = l10n.s(locale, 'cmd.hero-match.mp.correct');

  /** @type {string} */
  const resIncorrect = l10n.s(locale, 'cmd.hero-match.mp.incorrect');

  // Blue: Front (1)
  // Gray: Back (2)
  // Green: Front (active) (3)

  const allButtonsFacedDown = board.cards.map((card, idx) => ({
    type: 2, // Button
    style: 2, // Gray
    custom_id: 'h-m.btn.' + idx,
    emoji: UnknownEmoji,
  }));

  const allButtonsFacedUp = board.cards.map((card, idx) => ({
    type: 2, // Button
    style: 1, // Blue,
    custom_id: 'h-m.btn.' + idx,
    emoji: card.emoji,
  }));

  /** Show welcome message */
  async function welcome() {
    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.mp.title'),
        description: l10n.s(locale, 'cmd.hero-match.mp.welcome'),
      }],
      components: [
        {type: 1, components: allButtonsFacedDown.slice(0, 5)},
        {type: 1, components: allButtonsFacedDown.slice(5, 10)},
        {type: 1, components: allButtonsFacedDown.slice(10, 15)},
        {type: 1, components: allButtonsFacedDown.slice(15, 20)},
        {type: 1, components: allButtonsFacedDown.slice(20, 25)},
      ],
      fetchReply: true,
    };
    return interaction.reply(gameContent);
  }

  /** Show all the cards */
  async function showCards() {
    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.mp.title'),
        description: l10n.s(locale, 'cmd.hero-match.mp.memorize-now'),
      }],
      components: [
        {type: 1, components: allButtonsFacedUp.slice(0, 5)},
        {type: 1, components: allButtonsFacedUp.slice(5, 10)},
        {type: 1, components: allButtonsFacedUp.slice(10, 15)},
        {type: 1, components: allButtonsFacedUp.slice(15, 20)},
        {type: 1, components: allButtonsFacedUp.slice(20, 25)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  /** Hide all the cards */
  async function hideCards() {
    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.mp.title'),
        description: l10n.s(locale, 'cmd.hero-match.mp.get-ready'),
      }],
      components: [
        {type: 1, components: allButtonsFacedDown.slice(0, 5)},
        {type: 1, components: allButtonsFacedDown.slice(5, 10)},
        {type: 1, components: allButtonsFacedDown.slice(10, 15)},
        {type: 1, components: allButtonsFacedDown.slice(15, 20)},
        {type: 1, components: allButtonsFacedDown.slice(20, 25)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  /**
   * Play a round
   * @param {number} n - Round number;
   */
  async function playRound(n) {
    collectingAnswer = true;
    roundNumber = n - 1;

    computerPickIdx = board.computerPicks[roundNumber];
    const computerPickCard = board.cards[computerPickIdx];
    const computerPickValue = computerPickCard.value;

    const buttons = board.cards.map((card, idx) => {
      if (idx === computerPickIdx) {
        return {
          type: 2, // Button
          style: 3, // Green,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
        };
      } else if (card.picked) {
        return {
          type: 2, // Button
          style: 1, // Blue,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
          disabled: true,
        };
      } else {
        if (card.value === computerPickValue) {
          answerIdx = idx;
        }
        return {
          type: 2, // Button
          style: 2, // Gray,
          custom_id: 'h-m.btn.' + idx,
          emoji: UnknownEmoji,
        };
      }
    });

    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.mp.title'),
        description: l10n.t(
            locale, 'cmd.hero-match.mp.your-turn',
            '{ROUND}', n,
            '{COMPUTER PICK}', computerPickCard.emoji,
        ),
      }],
      components: [
        {type: 1, components: buttons.slice(0, 5)},
        {type: 1, components: buttons.slice(5, 10)},
        {type: 1, components: buttons.slice(10, 15)},
        {type: 1, components: buttons.slice(15, 20)},
        {type: 1, components: buttons.slice(20, 25)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  /**
   * Collect answers
   * @param {ButtonInteraction} i
   */
  async function collectAnswers(i) {
    if (!collectingAnswer) return;

    const buttonId = i.customId;
    const userId = i.user.id;
    const userAnswer = parseInt(buttonId.slice('h-m.btn.'.length));

    const pickedCard = board.cards[userAnswer].emoji;

    if (answerIdx === computerPickIdx) return;

    if (answerIdx === userAnswer) {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundWinners.add(userId);
        i.reply({
          content: resCorrect.replace('{CARD}', pickedCard),
          ephemeral: true,
        });
      } else {
        i.reply({content: resAlreadyAnswered, ephemeral: true});
      }
    } else {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundLosers.add(userId);
        i
            .reply({
              content: resIncorrect.replace('{CARD}', pickedCard),
              ephemeral: true,
            })
            .then(() => waitAsync(10))
            .then(() => i.editReply({
              content: resIncorrect.replace('{CARD}', UnknownEmoji),
              ephemeral: true,
            }));
      } else {
        i.reply({content: resAlreadyAnswered, ephemeral: true});
      }
    }
  }

  /**
   * Tally the answers
   */
  async function tallyRound() {
    collectingAnswer = false;

    currentRoundWinners.forEach((userId) => {
      scores.set(userId, (scores.get(userId)||0) + 1);
    });

    currentRoundWinners.clear();
    currentRoundLosers.clear();
    board.cards[computerPickIdx].picked = true;
    board.cards[answerIdx].picked = true;

    const buttons = board.cards.map((card, idx) => {
      if ((idx === computerPickIdx) || (idx === answerIdx)) {
        return {
          type: 2, // Button
          style: 3, // Green,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
        };
      } else if (card.picked) {
        return {
          type: 2, // Button
          style: 1, // Blue,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
          disabled: true,
        };
      } else {
        return {
          type: 2, // Button
          style: 2, // Gray,
          custom_id: 'h-m.btn.' + idx,
          emoji: UnknownEmoji,
        };
      }
    });

    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.mp.title'),
        description: l10n.t(
            locale, 'cmd.hero-match.mp.times-up',
            '{ROUND}', (roundNumber + 1)),
      }],
      components: [
        {type: 1, components: buttons.slice(0, 5)},
        {type: 1, components: buttons.slice(5, 10)},
        {type: 1, components: buttons.slice(10, 15)},
        {type: 1, components: buttons.slice(15, 20)},
        {type: 1, components: buttons.slice(20, 25)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  const WAIT_THINKING = 10;

  welcome()
      .then(async (message) => {
        message
            .createMessageComponentCollector()
            .on('collect', collectAnswers);
        return waitAsync(10);
      })
      .then(() => showCards())
      .then(() => waitAsync(15))

      .then(() => hideCards())
      .then(() => waitAsync(5))

      .then(() => playRound(1))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())

      .then(() => playRound(2))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(3))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(4))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(5))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(6))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(7))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(8))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(9))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(10))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => {
        sessions.delete(context.guild.id);

        const finalScoreLine = l10n.s(
            locale, 'cmd.hero-match.mp.final-scoring-line',
        );

        const result = Array
            .from(scores, ([k, v]) => ({userId: k, score: v}))
            .sort((a, b) => {
              if (a.score > b.score) return -1;
              if (a.score < b.score) return 1;
              return 0;
            })
            .slice(0, 5)
            .map((w) => l10n.r(
                finalScoreLine, '{USER ID}', w.userId, '{SCORE}', w.score),
            );

        result.unshift(l10n.s(locale, 'cmd.hero-match.mp.final-scoring'));
        channel.send(result.join('\n'));
      });
  return true;
}

/**
 * Play the game (single-player version)
 * @param {CommandContext} context - Interaction context
 */
 async function playSP(context) {
  const {locale, channel, interaction} = context;
  let roundNumber = -1;
  let collectingAnswer = false;
  // const maxRound = 10;

  const board = generateMPBoard();

  const currentRoundResult = undefined;
  const scores = 0;

  let computerPickIdx;
  let answerIdx;

  /** @type {string} */
  const resAlreadyAnswered =
      l10n.s(locale, 'cmd.hero-match.sp.already-answered');

  /** @type {string} */
  const resCorrect = l10n.s(locale, 'cmd.hero-match.sp.correct');

  /** @type {string} */
  const resIncorrect = l10n.s(locale, 'cmd.hero-match.sp.incorrect');

  // Blue: Front (1)
  // Gray: Back (2)
  // Green: Front (active) (3)

  const allButtonsFacedDown = board.cards.map((card, idx) => ({
    type: 2, // Button
    style: 2, // Gray
    custom_id: 'h-m.btn.' + idx,
    emoji: UnknownEmoji,
  }));

  const allButtonsFacedUp = board.cards.map((card, idx) => ({
    type: 2, // Button
    style: 1, // Blue,
    custom_id: 'h-m.btn.' + idx,
    emoji: card.emoji,
  }));

  /** Show welcome message */
  async function welcome() {
    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.sp.title'),
        description: l10n.s(locale, 'cmd.hero-match.sp.welcome'),
      }],
      components: [
        {type: 1, components: allButtonsFacedDown.slice(0, 4)},
        {type: 1, components: allButtonsFacedDown.slice(4, 8)},
        {type: 1, components: allButtonsFacedDown.slice(8, 12)},
        {type: 1, components: allButtonsFacedDown.slice(12, 16)},
      ],
      fetchReply: true,
    };
    return interaction.reply(gameContent);
  }

  /** Show all the cards */
  async function showCards() {
    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.sp.title'),
        description: l10n.s(locale, 'cmd.hero-match.sp.memorize-now'),
      }],
      components: [
        {type: 1, components: allButtonsFacedUp.slice(0, 4)},
        {type: 1, components: allButtonsFacedUp.slice(4, 8)},
        {type: 1, components: allButtonsFacedUp.slice(8, 12)},
        {type: 1, components: allButtonsFacedUp.slice(12, 16)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  /** Hide all the cards */
  async function hideCards() {
    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.sp.title'),
        description: l10n.s(locale, 'cmd.hero-match.sp.get-ready'),
      }],
      components: [
        {type: 1, components: allButtonsFacedDown.slice(0, 4)},
        {type: 1, components: allButtonsFacedDown.slice(4, 8)},
        {type: 1, components: allButtonsFacedDown.slice(8, 12)},
        {type: 1, components: allButtonsFacedDown.slice(12, 16)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  /**
   * Play a round
   * @param {number} n - Round number;
   */
  async function playRound(n) {
    collectingAnswer = true;
    roundNumber = n - 1;

    computerPickIdx = board.computerPicks[roundNumber];
    const computerPickCard = board.cards[computerPickIdx];
    const computerPickValue = computerPickCard.value;

    const buttons = board.cards.map((card, idx) => {
      if (idx === computerPickIdx) {
        return {
          type: 2, // Button
          style: 3, // Green,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
        };
      } else if (card.picked) {
        return {
          type: 2, // Button
          style: 1, // Blue,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
          disabled: true,
        };
      } else {
        if (card.value === computerPickValue) {
          answerIdx = idx;
        }
        return {
          type: 2, // Button
          style: 2, // Gray,
          custom_id: 'h-m.btn.' + idx,
          emoji: UnknownEmoji,
        };
      }
    });

    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.sp.title'),
        description: l10n.t(
            locale, 'cmd.hero-match.sp.your-turn',
            '{ROUND}', n,
            '{COMPUTER PICK}', computerPickCard.emoji,
        ),
      }],
      components: [
        {type: 1, components: buttons.slice(0, 4)},
        {type: 1, components: buttons.slice(4, 8)},
        {type: 1, components: buttons.slice(8, 12)},
        {type: 1, components: buttons.slice(12, 16)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  /**
   * Collect answers
   * @param {ButtonInteraction} i
   */
  async function collectAnswers(i) {
    if (!collectingAnswer) return;

    const buttonId = i.customId;
    const userId = i.user.id;
    const userAnswer = parseInt(buttonId.slice('h-m.btn.'.length));

    const pickedCard = board.cards[userAnswer].emoji;

    if (answerIdx === computerPickIdx) return;

    if (answerIdx === userAnswer) {
      if (currentRoundResult !== undefined) {
        currentRoundResult = true;
        i.reply({
          content: resCorrect.replace('{CARD}', pickedCard),
          ephemeral: true,
        });
      } else {
        i.reply({content: resAlreadyAnswered, ephemeral: true});
      }
    } else {
      if (currentRoundResult !== undefined) {
        currentRoundResult = false;
        i
            .reply({
              content: resIncorrect.replace('{CARD}', pickedCard),
              ephemeral: true,
            })
            .then(() => waitAsync(10))
            .then(() => i.editReply({
              content: resIncorrect.replace('{CARD}', UnknownEmoji),
              ephemeral: true,
            }));
      } else {
        i.reply({content: resAlreadyAnswered, ephemeral: true});
      }
    }
  }

  /**
   * Tally the answers
   */
  async function tallyRound() {
    collectingAnswer = false;

    if (currentRoundResult) scores++;

    currentRoundResult = undefined;
    board.cards[computerPickIdx].picked = true;
    board.cards[answerIdx].picked = true;

    const buttons = board.cards.map((card, idx) => {
      if ((idx === computerPickIdx) || (idx === answerIdx)) {
        return {
          type: 2, // Button
          style: 3, // Green,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
        };
      } else if (card.picked) {
        return {
          type: 2, // Button
          style: 1, // Blue,
          custom_id: 'h-m.btn.' + idx,
          emoji: card.emoji,
          disabled: true,
        };
      } else {
        return {
          type: 2, // Button
          style: 2, // Gray,
          custom_id: 'h-m.btn.' + idx,
          emoji: UnknownEmoji,
        };
      }
    });

    const gameContent = {
      embeds: [{
        title: l10n.s(locale, 'cmd.hero-match.sp.title'),
        description: l10n.t(
            locale, 'cmd.hero-match.sp.times-up',
            '{ROUND}', (roundNumber + 1)),
      }],
      components: [
        {type: 1, components: buttons.slice(0, 4)},
        {type: 1, components: buttons.slice(4, 8)},
        {type: 1, components: buttons.slice(8, 12)},
        {type: 1, components: buttons.slice(12, 16)},
      ],
      fetchReply: true,
    };
    return interaction.editReply(gameContent);
  }

  const WAIT_THINKING = 10;

  welcome()
      .then(async (message) => {
        message
            .createMessageComponentCollector()
            .on('collect', collectAnswers);
        return waitAsync(10);
      })
      .then(() => showCards())
      .then(() => waitAsync(10))

      .then(() => hideCards())
      .then(() => waitAsync(5))

      .then(() => playRound(1))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())

      .then(() => playRound(2))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(3))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(4))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(5))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(6))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(7))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => playRound(8))
      .then(() => waitAsync(WAIT_THINKING))
      .then(() => tallyRound())
      .then(() => waitAsync(3))

      .then(() => {
        sessions.delete(context.user.id);
        channel.send(l10n.t(
          locale, 'cmd.hero-match.sp.final-scoring',
          '{SCORE}', scores,
        ));
      });
  return true;
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function execute(context) {
  const {locale, guild, channel, interaction, user} = context;
  if (channel.type === ChannelType.GuildText) {
    if (sessions.has(guild.id)) {
      interaction.reply(l10n.s(locale, 'cmd.hero-match.session-in-progress'));
      return;
    } else {
      sessions.add(guild.id);
      playMP(context);
    }
  } else if (channel.type === ChannelType.DM) {
    if (sessions.has(user.id)) {
      interaction.reply(l10n.s(locale, 'cmd.hero-match.session-in-progress'));
      return;
    } else {
      sessions.add(user.id);
      playSP(context);
    }
  }
  return true;
}

