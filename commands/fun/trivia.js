/**
 * @typedef {import('../../src/typedef.js').ControlPanelHandler} ControlPanelHandler
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').GuildSettings} GuildSettings
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('discord.js').SelectMenuComponentOptionData} SelectMenuComponentOptionData
 */

import {l10n} from '../../src/l10n.js';
import {servers} from '../../src/servers.js';
import {logger} from '../../src/logger.js';
import {waitAsync} from '../../src/utils.js';

import {ComponentType, ButtonStyle, ChannelType} from 'discord.js';

/* ********************************************************************* */
/* *************************** Main Command **************************** */
/* ********************************************************************* */

const commandName = 'trivia';
const cooldown  = 10;

const Emojis = [
  '\uD83C\uDDE6',
  '\uD83C\uDDE7',
  '\uD83C\uDDE8',
  '\uD83C\uDDE9',
  '\uD83C\uDDEA',
];
const ButtonA = {type: 2, style: 2, emoji: Emojis[0], custom_id: `trivia.0`};
const ButtonB = {type: 2, style: 2, emoji: Emojis[1], custom_id: `trivia.1`};
const ButtonC = {type: 2, style: 2, emoji: Emojis[2], custom_id: `trivia.2`};
const ButtonD = {type: 2, style: 2, emoji: Emojis[3], custom_id: `trivia.3`};
const ButtonE = {type: 2, style: 2, emoji: Emojis[4], custom_id: `trivia.4`};

const ActiveButtonSets = [
  undefined,
  [ButtonA, ButtonB],
  [ButtonA, ButtonB, ButtonC],
  [ButtonA, ButtonB, ButtonC, ButtonD],
  [ButtonA, ButtonB, ButtonC, ButtonD, ButtonE],
];

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
 * Randomly pick an item from an array
 * @param {String[]} array
 * @return {String}
 */
function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * @param {object} triviaData
 * @return {object}
 */
function prepareQuiz(triviaData) {
  const choices = triviaData['choices'];
  let randomizedChoices;
  let correctAnswer = triviaData['correct-answer'];

  if (triviaData['order'] === 'fixed') {
    randomizedChoices = choices;
  } else {
    randomizedChoices = shuffle(choices);
    correctAnswer = randomizedChoices.indexOf(choices[correctAnswer]);
  }

  const quiz = {
    question: triviaData['question'],
    correctAnswer: correctAnswer,
    choices: randomizedChoices.map((ans, idx) => `${Emojis[idx]} ${ans}`),
  };

  if (triviaData['answer-note']) {
    quiz['answer-note'] = triviaData['answer-note'];
  }
  return quiz;
}

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {locale, channel, interaction} = context;
  const {options} = interaction;

  const triviaTitle = l10n.s(locale, 'cmd.trivia.trivia-title');
  const questionLabel = l10n.s(locale, 'cmd.trivia.question-label');
  const choicesLabel = l10n.s(locale, 'cmd.trivia.choices-label');
  const answerLabel = l10n.s(locale, 'cmd.trivia.answer-label');
  const noteLabel = l10n.s(locale, 'cmd.trivia.note-label');
  const tallyMessage = l10n.s(locale, 'cmd.trivia.tally-message');
  const finalScore = l10n.s(locale, 'cmd.trivia.final-scoring');
  const finalScoreLine = l10n.s(locale, 'cmd.trivia.final-scoring-line');
  const resCorrect = l10n.s(locale, 'cmd.trivia.response-correct');
  const resIncorrect = l10n.s(locale, 'cmd.trivia.response-incorrect');
  const resAlreadyAnswered = l10n.s(
      locale,
      'cmd.trivia.response-already-answered',
  );

  const subjectId = options.getString('subject');
  const subjectTitle = l10n
      .s(locale, 'trivia.library')
      .find((el) => el.id === subjectId)
      .title;

  const triviaBase = l10n.s(locale, 'trivia.' + subjectId);

  let roundCount = options?.getInteger('rounds') || 10;
  roundCount = Math.floor(Math.min(roundCount, triviaBase.length * 0.3));

  const openingGif = l10n.s(locale, 'cmd.trivia.opening-gif');
  const openingMsg = l10n.t(
      locale, 'cmd.trivia.opening-message',
      '{SUBJECT}', subjectTitle,
  );

  /** List of trivia quizzes (not randomized) */
  const picked = new Set();
  for (let i = 0; i < roundCount; i++) {
    let pick = Math.floor(Math.random() * triviaBase.length);
    while (picked.has(pick)) {
      pick = Math.floor(Math.random() * triviaBase.length);
    }
    picked.add(pick);
  }

  /** List of trivia quizzes (randomized) */
  const quizzes = Array.from(picked).map((pick) => (
    prepareQuiz(triviaBase[pick])
  ));

  let rIndex = 0;
  let correctAnswer;
  let quizMessage;
  const currentRoundWinners = new Set();
  const currentRoundLosers = new Set();
  const scores = new Map();

  const collectQuizAnswers = async (i) => {
    const buttonId = i.customId;
    const userId = i.user.id;
    const userAnswer = parseInt(buttonId.slice('trivia.'.length));

    if (correctAnswer === userAnswer) {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundWinners.add(userId);
        i.reply({content: randomPick(resCorrect), ephemeral: true});
      } else {
        i.reply({content: randomPick(resAlreadyAnswered), ephemeral: true});
      }
    } else {
      if (!currentRoundLosers.has(userId) && !currentRoundWinners.has(userId)) {
        currentRoundLosers.add(userId);
        i.reply({content: randomPick(resIncorrect), ephemeral: true});
      } else {
        i.reply({content: randomPick(resAlreadyAnswered), ephemeral: true});
      }
    }
  };

  const tallyQuizAnswers = () => {
    const winnerCount = currentRoundWinners.size;
    const allCount = winnerCount + currentRoundLosers.size;
    const quiz = quizzes[rIndex];
    const quizEmbed = {
      title: l10n.r(triviaTitle, '{NUMBER}', rIndex + 1, '{COUNT}', roundCount),
      fields: [
        {name: questionLabel, value: quiz.question},
        {name: answerLabel, value: quiz.choices[correctAnswer]},
      ],
      footer: {
        text: l10n.r(
            tallyMessage,
            '{CORRECT}', winnerCount,
            '{TOTAL}', allCount),
      },
    };
    if (quiz['answer-note']) {
      quizEmbed.fields.push(
          {name: noteLabel, value: quiz['answer-note']},
      );
    }

    const quizContent = {embeds: [quizEmbed], components: []};

    quizMessage.edit(quizContent);

    currentRoundWinners.forEach((userId) => {
      scores.set(userId, (scores.get(userId)||0) + 1);
    });

    rIndex++;
    if (rIndex < roundCount) {
      currentRoundWinners.clear();
      currentRoundLosers.clear();
      postNextQuiz();
    } else {
      const winners = Array
          .from(scores, ([k, v]) => ({userId: k, score: v}))
          .sort((a, b) => {
            if (a.score > b.score) return -1;
            if (a.score < b.score) return 1;
            return 0;
          }).
          slice(0, 5);
      channel.send(
          finalScore +
          winners
              .map((w) => l10n.r(
                  finalScoreLine,
                  '{USER ID}', w.userId,
                  '{SCORE}', w.score))
              .join('\n'),
      );
    }
  };

  const postNextQuiz = async () => {
    const quiz = quizzes[rIndex];
    const quizEmbed = {
      title: l10n.r(triviaTitle, '{NUMBER}', rIndex + 1, '{COUNT}', roundCount),
      fields: [
        {name: questionLabel, value: quiz.question},
        {name: choicesLabel, value: quiz.choices.join('\n')},
      ],
    };
    correctAnswer = quiz.correctAnswer;

    const quizContent = {
      embeds: [quizEmbed],
      components: [{
        type: 1,
        components: ActiveButtonSets[quiz.choices.length-1],
      }],
    };

    quizMessage = await channel.send(quizContent);

    const quizCollector = quizMessage
        .createMessageComponentCollector({time: 1 * 30 * 1000});

    quizCollector.on('collect', collectQuizAnswers);
    quizCollector.on('end', tallyQuizAnswers);
  };

  await interaction.reply(openingGif);
  await waitAsync(1);
  await channel.send(openingMsg);
  await waitAsync(10);
  postNextQuiz(0);
  return true;
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};

/* ********************************************************************* */
/* *************************** Control Panel *************************** */
/* ********************************************************************* */

const controlPanelName = 'trivia';

// Component ids
const CompUnsetBroadcastChannelButton = 'trivia.unset-broadcast-channel';
const CompUnsetGameChannelButton = 'trivia.unset-game-channel';
const CompSetBroadcastChannelButton = 'trivia.set-broadcast-channel';
const CompSetBroadcastChannelSelect = 'trivia.set-broadcast-channel.select';
const CompSetGameChannelButton = 'trivia.set-game-channel';
const CompSetGameChannelSelect = 'trivia.set-game-channel.select';
const CompBackButton = 'trivia.back';
const CompTop = 'top';

/**
 * Get 'set broadcast channel' page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getSetBroadcastChannelPage(context) {
  const {locale} = context;

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.trivia.set-broadcast-channel.title'),
      description: l10n.s(locale, 'cp.trivia.set-broadcast-channel.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.ChannelSelect,
            custom_id: CompSetBroadcastChannelSelect,
            channel_types: [ChannelType.GuildText],
            placeholder: l10n.s(
                locale,
                'cp.trivia.set-broadcast-channel.menu-placeholder',
            ),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompBackButton,
            label: l10n.s(locale, 'cmd.bot-admin.back'),
          },
        ],
      },
    ],
  };

  return pageContent;
}

/**
 * Get 'set game channel' page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getSetGameChannelPage(context) {
  const {locale} = context;

  const pageContent = {
    embeds: [{
      title: l10n.s(locale, 'cp.trivia.set-game-channel.title'),
      description: l10n.s(locale, 'cp.trivia.set-game-channel.desc'),
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.ChannelSelect,
            custom_id: CompSetGameChannelSelect,
            channel_types: [ChannelType.GuildText],
            placeholder: l10n.s(
                locale,
                'cp.trivia.set-game-channel.menu-placeholder',
            ),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompBackButton,
            label: l10n.s(locale, 'cmd.bot-admin.back'),
          },
        ],
      },
    ],
  };

  return pageContent;
}

/**
 * Get main page
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getMainPage(context) {
  const {locale, guildSettings} = context;

  const broadcastChannelId = guildSettings['trivia-broadcast-channel'];
  const gameChannelId = guildSettings['trivia-game-channel'];

  const pageTitle = l10n.s(locale, 'cp.trivia.main.title');
  const pageDesc = l10n.s(locale, 'cp.trivia.main.desc');

  const listBroadcastChannel = broadcastChannelId?
      l10n.t(
          locale, 'cp.trivia.main.list-broadcast-channel',
          '{CHANNEL ID}', broadcastChannelId,
      ):
      l10n.s(locale, 'cp.trivia.main.list-broadcast-channel-none');

  const listGameChannel = gameChannelId?
      l10n.t(
          locale, 'cp.trivia.main.list-game-channel',
          '{CHANNEL ID}', gameChannelId,
      ):
      l10n.s(locale, 'cp.trivia.main.list-game-channel-none');

  return {
    embeds: [{
      title: pageTitle,
      description: pageDesc +
          '\n\n' + listBroadcastChannel +
          '\n\n' + listGameChannel,
    }],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompSetBroadcastChannelButton,
            label: l10n.s(
                locale,
                'cp.trivia.set-broadcast-channel.button-label',
            ),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompUnsetBroadcastChannelButton,
            label: l10n.s(
                locale,
                'cp.trivia.unset-broadcast-channel.button-label',
            ),
            disabled: (!broadcastChannelId),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompSetGameChannelButton,
            label: l10n.s(
                locale,
                'cp.trivia.set-game-channel.button-label',
            ),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: CompUnsetGameChannelButton,
            label: l10n.s(
                locale,
                'cp.trivia.unset-game-channel.button-label',
            ),
            disabled: (!gameChannelId),
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            custom_id: CompTop,
            label: l10n.s(locale, 'cmd.bot-admin.top'),
          },
        ],
      },
    ],
  };
}

/**
 * Unset broadcast
 * @param {CommandContext} context - Originating interaction context
 * @return {InteractionReplyOptions}
 **/
function unsetBroadcastChannel(context) {
  const {guild, user} = context;

  context.guildSettings = servers
      .updateSettings(guild, 'trivia-broadcast-channel', undefined);

  logger.writeLog(
      `${guild.id}.log`,
      `${user.tag} unset trivia broadcast channel`,
  );

  return getMainPage(context);
}


/**
 * Unset broadcast
 * @param {CommandContext} context - Originating interaction context
 * @return {InteractionReplyOptions}
 **/
function unsetGameChannel(context) {
  const {guild, user} = context;

  context.guildSettings = servers
      .updateSettings(guild, 'trivia-game-channel', undefined);

  logger.writeLog(
      `${guild.id}.log`,
      `${user.tag} unset trivia game channel`,
  );

  return getMainPage(context);
}

/**
 * Set broadcast channel
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function setBroadcastChannel(context, i) {
  const {guild, user} = context;
  const channelId = i.values[0];

  console.log('setting broadcast channel');

  context.guildSettings = servers
      .updateSettings(guild, 'trivia-broadcast-channel', channelId);

  logger.writeLog(
      `${guild.id}.log`,
      `${user.tag} set trivia broadcast channel to <#${channelId}>`,
  );

  return getMainPage(context);
}

/**
 * Set game channel
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function setGameChannel(context, i) {
  const {guild, user} = context;
  const channelId = i.values[0];

  console.log('setting game channel');

  context.guildSettings = servers
      .updateSettings(guild, 'trivia-game-channel', channelId);

  logger.writeLog(
      `${guild.id}.log`,
      `${user.tag} set trivia game channel to <#${channelId}>`,
  );

  return getMainPage(context);
}

/**
 * Handle component interaction
 * @param {CommandContext} context - Originating interaction context
 * @param {MessageComponentInteraction} i - Message component interaction
 * @return {InteractionReplyOptions}
 **/
function handleInteraction(context, i) {
  /** @type {string} */
  const customId = i.customId;

  if (!customId.startsWith('trivia')) return undefined;

  switch (customId) {
    case CompBackButton:
      context.responseContent = getMainPage(context);
      return true;
    case CompSetBroadcastChannelButton:
      context.responseContent = getSetBroadcastChannelPage(context);
      return true;
    case CompSetGameChannelButton:
      context.responseContent = getSetGameChannelPage(context);
      return true;
    case CompSetBroadcastChannelSelect:
      context.responseContent = setBroadcastChannel(context, i);
      return true;
    case CompSetGameChannelSelect:
      context.responseContent = setGameChannel(context, i);
      return true;
    case CompUnsetBroadcastChannelButton:
      context.responseContent = unsetBroadcastChannel(context);
      return true;
    case CompUnsetGameChannelButton:
      context.responseContent = unsetGameChannel(context);
      return true;
    default: return false;
  }
}

/**
 * Main panel page getter
 * @param {CommandContext} context - Interaction context
 * @return {InteractionReplyOptions}
 */
function getContent(context) {
  return getMainPage(context);
}

/**
 * Top nav-menu item getter
 * @param {CommandContext} context - Interaction context
 * @return {SelectMenuComponentOptionData}
 **/
function getNavMenuItem(context) {
  const {locale} = context;
  return {
    label: l10n.s(locale, 'cp.trivia.name'),
    description: l10n.s(locale, 'cp.trivia.desc'),
    value: controlPanelName,
  };
}

/** @type {ControlPanelHandler} */
export const controlPanel = {
  name: controlPanelName,
  super: false,
  getNavMenuItem: getNavMenuItem,
  getContent: getContent,
  handleInteraction: handleInteraction,
};
