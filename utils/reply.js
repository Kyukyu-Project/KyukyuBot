/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 * @typedef {import('../../src/typedef.js').ReplyContext} ReplyContext
 * @typedef {import('discord.js').Message} Message
 */

import {l10n} from '../src/l10n.js';

const collectorOption = {
  time: 10 * 60 * 1000,
  idle: 5 * 60 * 1000,
};

/**
 * Reply with text content
 * @param {ReplyContext} context - reply context
 * @return {Message} - the reply message
 */
async function replyText(context) {
  const {interaction, lang, text} = context;
  const {channel} = interaction;

  const userId = interaction.user.id;
  const taggedId = context['tagged-user-id'];

  let replyMessage;

  if (taggedId) {
    replyMessage = l10n.t(
        lang, 'messages.reply-message-tagged',
        '{USER ID}', userId,
        '{TAGGED ID}', taggedId);
  } else {
    replyMessage = l10n.t(
        lang, 'messages.reply-message',
        '{USER ID}', userId);
  }

  interaction.reply(replyMessage);

  const components = [{
    type: 1,
    components: [{
      type: 2 /* button */, style: 2 /* gray */,
      label: l10n.s(lang, 'messages.dm-me'),
      custom_id: 'dm',
    }],
  }];

  const response = await channel.send({
    content: text,
    components: components,
  });

  const collector = response.createMessageComponentCollector(collectorOption);

  collector.on('collect',
      async (i) => {
        if ((i.customId) && (i.customId === 'dm')) {
          i.user
              .send(text)
              .then(()=> {
                i.reply({
                  content: l10n.s(lang, 'messages.dm-sent'),
                  ephemeral: true,
                });
              })
              .catch(()=> {
                i.reply({
                  content: l10n.s(lang, 'messages.dm-error'),
                  ephemeral: true,
                });
              });
          return;
        }
      },
  );

  collector.on('end', (collected) => {
    response.edit({
      content: text, components: [],
    });
  });

  return response;
}

/**
 * Reply with embed content
 * @param {ReplyContext} context - reply context
 * @return {Message} - the reply message
 */
async function replyEmbed(context) {
  const {interaction, lang, embed} = context;
  const {channel} = interaction;

  const userId = interaction.user.id;
  const taggedId = context['tagged-user-id'];

  let replyMessage;

  if (taggedId) {
    replyMessage = l10n.t(
        lang, 'messages.reply-message-tagged',
        '{USER ID}', userId,
        '{TAGGED ID}', taggedId);
  } else {
    replyMessage = l10n.t(
        lang, 'messages.reply-message',
        '{USER ID}', userId);
  }

  interaction.reply(replyMessage);

  const components = [{
    type: 1,
    components: [{
      type: 2 /* button */, style: 2 /* gray */,
      label: l10n.s(lang, 'messages.dm-me'),
      custom_id: 'dm',
    }],
  }];

  const response = await channel.send({
    embeds: [embed],
    components: components,
  });

  const collector = response.createMessageComponentCollector(collectorOption);

  collector.on('collect',
      async (i) => {
        if ((i.customId) && (i.customId === 'dm')) {
          i.user
              .send({embeds: [embed]})
              .then(()=> {
                i.reply({
                  content: l10n.s(lang, 'messages.dm-sent'),
                  ephemeral: true,
                });
              })
              .catch(()=> {
                i.reply({
                  content: l10n.s(lang, 'messages.dm-error'),
                  ephemeral: true,
                });
              });
          return;
        }
      },
  );

  collector.on('end', (collected) => {
    response.edit({
      embeds: [embed], components: [],
    });
  });

  return response;
}

/**
 * Reply with paged embeds
 * @param {ReplyContext} context - reply context
 * @return {Message} - the reply message
 */
async function replyEmbeds(context) {
  const {interaction, lang, embeds} = context;
  const {channel} = interaction;

  const userId = interaction.user.id;
  const taggedId = context['tagged-user-id'];

  /** @type {string[]} - users who can interact with the reply message*/
  let users;

  let replyMessage;

  if (taggedId) {
    users = [userId, taggedId];
    replyMessage = l10n.t(
        lang, 'messages.reply-message-tagged',
        '{USER ID}', userId,
        '{TAGGED ID}', taggedId);
  } else {
    users = [userId];
    replyMessage = l10n.t(
        lang, 'messages.reply-message',
        '{USER ID}', userId);
  }

  interaction.reply(replyMessage);

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
      placeholder: l10n.s(lang, 'messages.select-placeholder'),
      options: tabOptions,
    }],
  },
  {
    type: 1,
    components: [{
      type: 2 /* button */, style: 2 /* gray */,
      label: l10n.s(lang, 'messages.dm-me'),
      custom_id: 'dm',
    }],
  }];

  let currentEmbed = embeds[0];

  const response = await channel.send({
    embeds: [currentEmbed],
    components: components,
  });

  const collector = response.createMessageComponentCollector(collectorOption);

  collector.on('collect',
      async (i) => {
        if ((i.customId) && (i.customId === 'dm')) {
          i.user
              .send({embeds: [currentEmbed]})
              .then(()=> {
                i.reply({
                  content: l10n.s(lang, 'messages.dm-sent'),
                  ephemeral: true,
                });
              })
              .catch(()=> {
                i.reply({
                  content: l10n.s(lang, 'messages.dm-error'),
                  ephemeral: true,
                });
              });
          return;
        }
        if (users.includes(i.user.id)) {
          currentEmbed = embeds[parseInt(i.values[0])];
          i.message.edit({
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
      embeds: [currentEmbed], components: [],
    });
  });

  return response;
}

/**
 * Reply to interaction
 * @param {ReplyContext} context - reply context
 * @return {Message} - the reply message
 */
export async function reply(context) {
  if (context.embeds) return replyEmbeds(context);
  if (context.embed) return replyEmbed(context);
  return replyText(context);
}
