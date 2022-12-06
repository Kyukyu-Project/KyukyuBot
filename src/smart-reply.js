/**
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 * @typedef {import('./typedef.js').CommandContext} CommandContext
 * @typedef {import('./typedef.js').GuildSettings} GuildSettings
 * @typedef {import('./typedef.js').ReplyContext} ReplyContext
 */

import {ComponentType, ChannelType, ButtonStyle} from 'discord.js';
import {l10n} from './l10n.js';


/**
 * Create response content
 * @param {string} locale - Content locale
 * @param {object} content - Content
 * @param {string} dbResKey - Resource key of content database
 * @param {boolean} useRelatedMenu - Use related menu?
 * @param {boolean} useDMButton - Use DM button?
 * @return {InteractionReplyOptions}
 */
function createContent(locale, content, dbResKey, useRelatedMenu, useDMButton) {
  /** @type {InteractionReplyOptions} */
  const replyOptions = {
    ephemeral: false,
    fetchReply: true,
    components: [],
  };
  if (content.embeds) replyOptions.embeds = content.embeds;
  if (content.text) replyOptions.content = content.text;

  if (useDMButton) {
    const buttonRow = {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          custom_id: 'dm',
          label: l10n.s(locale, 'smart-reply.dm-me'),
        },
      ],
    };

    replyOptions.components.push(buttonRow);
  }

  if (useRelatedMenu) {
    if (Array.isArray(content.related)) {
      const relatedOptions = [];

      content.related.forEach((related) => {
        let rLocale = locale;
        let rId = related;
        if (related.includes(':')) [rLocale, rId] = related.split(':');

        const rContentId = `${dbResKey}.content.${rId}`;

        const rContent = l10n.s(rLocale, rContentId);
        if (rContent) {
          relatedOptions.push(
              {label: rContent.title, value: `${rLocale}:${rId}`},
          );
        }
      });

      if (relatedOptions.length) {
        const menuRow = {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.StringSelect,
              custom_id: 'related',
              placeholder: l10n.s(locale, 'smart-reply.select-related-topic'),
              options: relatedOptions,
            },
          ],
        };

        replyOptions.components.unshift(menuRow);
      }
    }
  }

  return replyOptions;
}

/**
 * Create a smart (navigable) reply
 * @param {ReplyContext} replyContext - Reply context
 * @return {boolean} - `true` if command is executed successfully
 */
export async function smartReply(replyContext) {
  const {
    locale,
    interaction,
    dbResKey,
    taggedUserId,
    userId,
  } = replyContext;

  let tagline;
  let useRelatedMenu = false;
  let useDmButton = false;

  switch (interaction.channel.type) {
    case ChannelType.GuildText:
      useRelatedMenu = true;
      useDmButton = true;
      break;
    case ChannelType.DM:
      useRelatedMenu = true;
      useDmButton = false;
      break;
    default:
  }

  let responseContent = createContent(
      locale,
      replyContext.content,
      dbResKey,
      useRelatedMenu,
      useDmButton,
  );

  const copy = Object.assign({}, responseContent);

  if (useDmButton) {
    if ((taggedUserId) && (taggedUserId !== userId)) {
      tagline = l10n.t(
          locale, 'smart-reply.reply-message-tagged',
          '{USER ID}', replyContext.userId,
          '{TAGGED ID}', replyContext.taggedUserId,
      );
    } else {
      tagline = l10n.t(
          locale, 'smart-reply.reply-message',
          '{USER ID}', replyContext.userId,
      );
    }

    copy.content =
        (copy.content)?
        tagline + '\n\n' + responseContent.content:
        tagline;
  }

  const responseMessage = await interaction.reply(copy);

  const iRelatedCollector = responseMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 10 * 60 * 1000, // Disable after 10 minute
  });

  const iButtonCollector = responseMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 10 * 60 * 1000, // Disable after 10 minute
  });

  iRelatedCollector.on('collect', async (i) => {
    const related = i.values[0];
    const relatedContent = l10n
        .autocomplete
        .getContent(locale, related, dbResKey);

    if ((i.user.id !== userId) && (i.user.id !== taggedUserId)) {
      // This menu can only be used by the user who invoked the command
      // or the user tagged.
      i.reply({
        content: l10n.s(locale, 'smart-reply.no-menu-permission'),
        ephemeral: true,
      });
      return;
    }

    responseContent = createContent(
        locale,
        relatedContent,
        dbResKey,
        useRelatedMenu,
        useDmButton,
    );

    const copy = Object.assign({}, responseContent);

    if (useDmButton) {
      copy.content =
        (copy.content)?
        tagline + '\n\n' + responseContent.content:
        tagline;
    }

    // responseMessage.interaction.editReply(responseContent);
    responseMessage.edit(copy);
    i.deferUpdate();
  });

  iRelatedCollector.on('end', (c) => {
    responseContent.components.forEach((row) => {
      row.components.forEach((el)=> el.disabled = true);
    });

    responseMessage.edit(responseContent);
  });

  iButtonCollector.on('collect', async (i) => {
    /** Message copy */
    const copy = {};
    if (responseContent.content) copy.content = responseContent.content;
    if (responseContent.embeds) copy.embeds = responseContent.embeds;

    i.user
        .send(copy)
        .then(()=> {
          i.reply({
            content: l10n.s(locale, 'smart-reply.dm-sent'),
            ephemeral: true,
          });
        })
        .catch(()=> {
          i.reply({
            content: l10n.s(lang, 'smart-reply.dm-error'),
            ephemeral: true,
          });
        });
    return;
  });
}
