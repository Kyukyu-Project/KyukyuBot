/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('discord.js').Message} Message
 */

import {l10n} from '../src/l10n.js';

/**
 * Post a message with select menu for navigation
 * @param {IContext|CommandContext} context - command context
 * @param {string} content - text content
 * @param {object[]} embeds - the 'pages'
 * @param {number[]} users - Ids of users who can use the menu
 * @return {Message}
 */
export async function postNavigable(context, content, embeds, users) {
  const {lang, channel} = context;

  const tabOptions = embeds.map((mbd, idx) =>
        (mbd.description && mbd.description.length < 80)?
        ({
          label: mbd.title, value: idx.toString(), description: mbd.description,
        }):
        ({
          label: mbd.title, value: idx.toString(),
        }),
  );

  const components = [{
    type: 1,
    components: [{
      type: 3,
      custom_id: 'select',
      placeholder: l10n.s(lang, 'select-placeholder'),
      options: tabOptions,
    }],
  },
  {
    type: 1,
    components: [{
      type: 2 /* button */, style: 2 /* gray */,
      label: l10n.s(lang, 'dm-me'),
      custom_id: 'dm',
    }],
  }];

  let currentEmbed = embeds[0];

  const response = await channel.send({
    content: content,
    embeds: [currentEmbed],
    components: components,
  });

  const collector = response.createMessageComponentCollector({
    // componentType: 'SELECT_MENU',
    time: 10 * 60 * 1000,
    idle: 5 * 60 * 1000,
  });

  collector.on('collect',
      async (i) => {
        if ((i.customId) && (i.customId === 'dm')) {
          i.user.send({
            // content: content,
            embeds: [currentEmbed],
          });
          i.deferUpdate();
          return;
        }
        if (users.includes(i.user.id)) {
          currentEmbed = embeds[parseInt(i.values[0])];
          i.message.edit({
            content: content,
            embeds: [currentEmbed],
            components: components,
          });
          i.deferUpdate();
        } else {
          i.reply({
            content: l10n.s(lang, 'messages.no-interaction-permission'),
            ephemeral: true,
          });
        }
      },
  );

  collector.on('end', (collected) => {
    response.edit({
      content: content, embeds: [currentEmbed], components: [],
    });
  });

  return response;
}
