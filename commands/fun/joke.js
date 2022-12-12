/**
 * @typedef {import('../../src/typedef.js').CommandHandler} CommandHandler
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 */

import {l10n} from '../../src/l10n.js';
import {waitAsync} from '../../src/utils.js';

const commandName = 'joke';
const cooldown  = 30;

/**
 * Execute the command
 * @param {CommandContext} context - Interaction context
 * @return {boolean} - `true` if command is executed successfully
 */
async function execute(context) {
  const {locale, interaction} = context;

  const jokeBase = l10n.s(locale, 'joke.aow');
  const jokeIdx = Math.floor(Math.random() * jokeBase.length);
  const joke = jokeBase[jokeIdx];

  if (joke.question) {
    const Title = l10n.s(locale, 'cmd.joke.result.title');
    const Q = l10n.t(locale, 'cmd.joke.result.question',
        '{TEXT}', joke.question);
    const A = l10n.t(locale, 'cmd.joke.result.answer',
        '{TEXT}', joke.answer);
    const Credit = l10n.t(locale, 'cmd.joke.result.credit',
        '{NAME}', joke.credit);

    interaction
        .reply({
          embeds: [{
            title: Title,
            description: Q,
            footer: {text: Credit},
          }],
          fetchReply: true,
        })
        .then(() => waitAsync(5))
        .then(() => interaction
            .editReply({
              embeds: [{
                title: Title,
                description: Q + A,
                footer: {text: Credit},
              }],
              fetchReply: true,
            }));
  } else {
    const Title = l10n.s(locale, 'cmd.joke.result.title');
    const Credit = l10n.t(locale, 'cmd.joke.result.credit',
        '{NAME}', joke.credit);

    interaction
        .reply({
          embeds: [{
            title: Title,
            description: joke.joke,
            footer: {text: Credit},
          }],
        });
  }

  return true;
}

/** @type {CommandHandler} */
export const command = {
  name: commandName,
  cooldown: cooldown,
  execute: execute,
};
