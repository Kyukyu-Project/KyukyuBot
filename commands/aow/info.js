/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

import {l10n} from '../../src/l10n.js';
import {reply} from '../../utils/reply.js';

export const canonName = 'aow.info';
export const name = 'info';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optSubjectLabel  = 'subject';
const optTagLabel      = 'tag-user';

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {lang} = context;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const optSubjectHint = l10n.s(lang, `commands.${canonName}.opt-subject-hint`);
  const optTagHint = l10n.s(lang, `commands.${canonName}.opt-tag-hint`);

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
                ...Array
                    .from(value.subjects)
                    .sort((a, b) => a[0].localeCompare(b[0], lang))
                    .map((subject) => ({name: subject, value: subject})),
            ),
        )
        .addUserOption((option) => option
            .setName(optTagLabel)
            .setDescription(optTagHint)
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
    const taggedId = interaction.options.getUser(optTagLabel)?.id || null;

    if (info.embeds) { // tabbed
      reply({
        'interaction': interaction,
        'lang': lang,
        'embeds': info.embeds,
        'tagged-user-id': taggedId,
      });
    } else { // non-tabbed
      reply({
        'interaction': interaction,
        'lang': lang,
        'embed': info.embed,
        'tagged-user-id': taggedId,
      });
    }
    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}
