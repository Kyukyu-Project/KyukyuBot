/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';
import {postNavigable} from '../../utils/navigable.js';

export const canonName = 'aow.info';
export const name = 'info';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optSubjectLabel  = 'subject';
const optTagLabel      = 'tag-user';
const optMessageLabel  = 'tag-message';

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const optSubjectHint = l10n.s(lang, `commands.${canonName}.opt-subject-hint`);
  const optTagHint = l10n.s(lang, `commands.${canonName}.opt-tag-hint`);
  const optMessageHint = l10n.s(lang, `commands.${canonName}.opt-message-hint`);

  const directory = new Map();

  l10n.s(lang, 'aow.info.categories').forEach((category) => {
    directory.set(
        category.name,
        {description: category.description, subjects: new Set()},
    );
  });

  l10n.s(lang, 'aow.info').forEach((info) => {
    if (directory.has(info.category)) {
      directory.get(info.category).subjects.add(info.name);
    };
  });

  const data = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint);

  for (const [key, value] of directory) {
    data.addSubcommand((c) => c
        .setName(key)
        .setDescription(value.description)
        .addStringOption((option) => option
            .setName(optSubjectLabel)
            .setDescription(optSubjectHint)
            .setRequired(true)
            .addChoices(
                Array
                    .from(value.subjects)
                    .sort((a, b) => a[0].localeCompare(b[0], lang))
                    .map((subject) => [subject, subject]),
            ),
        )
        .addUserOption((option) => option
            .setName(optTagLabel)
            .setDescription(optTagHint)
            .setRequired(false),
        )
        .addStringOption((option) => option
            .setName(optMessageLabel)
            .setDescription(optMessageHint)
            .setRequired(false),
        ));
  }

  return data;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {lang, interaction} = context;

  const subject = interaction.options.getString(optSubjectLabel);
  const info = l10n.s(lang, 'aow.info')?.find((el) => el.name === subject);

  if (info) {
    const userId = interaction.user.id;
    const taggedId = interaction.options.getUser(optTagLabel)?.id || null;
    const users = taggedId?[userId, taggedId]:[userId];

    const message = interaction.options.getString(optMessageLabel) || null;

    let content = l10n.t(
        lang, 'messages.use-command',
        '{PREFIX}', '/',
        '{COMMAND}', name,
        '{USER ID}', userId);

    if (taggedId) {
      if (message) {
        content += '\n' + l10n.t(
            lang, 'messages.tag-user-with-message',
            '{USER ID}', userId,
            '{TAGGED ID}', taggedId,
            '{MESSAGE}', message);
      } else {
        content += '\n' + l10n.t(
            lang, 'messages.tag-user',
            '{USER ID}', userId,
            '{TAGGED ID}', taggedId);
      }
    }

    if (info.embeds) { // tabbed
      postNavigable(context, content, info.embeds, users);

      interaction.reply({
        content: l10n.s(lang, 'messages.info-sent'),
        ephemeral: true,
      });
    } else { // non-tabbed
      // cannot send Embed using interaction.reply due to Discord API bug #2612
      interaction.channel.send({
        content: content,
        embeds: [info.embed],
      }).then((response) => {
        interaction.reply({
          content: l10n.s(lang, 'messages.info-sent'),
          ephemeral: true,
        });
      });
    }

    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}
