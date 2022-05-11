/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';

export const canonName = 'aow.info';
export const name = 'info';
export const requireArgs = false;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const optSubjectLabel  = 'subject';

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang} = context;
  const {l10n} = client;

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const optSubjectHint = l10n.s(lang, `commands.${canonName}.opt-subject-hint`);

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
        ));
  }

  return data;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
  const {client, lang, interaction} = context;
  const {l10n} = client;

  const subject = interaction.options.getString('subject');
  const info = l10n.s(lang, 'aow.info')?.find((el) => el.name === subject);

  if (info) {
    const embeds = info.embed?[info.embed]:info.embeds;

    // cannot send Embed using interaction.reply due to Discord API bug #2612
    interaction.channel.send({
      content: l10n.t(
          lang, 'messages.use-command',
          '{PREFIX}', '/',
          '{COMMAND}', name,
          '{USER ID}', interaction.user.id),
      embeds: embeds,
    });
    interaction.reply({
      content: l10n.s(lang, 'messages.info-sent'),
      ephemeral: true,
    });
    return true;
  } else {
    interaction.reply({content: l10n.s(lang, NO_INFO), ephemeral: true});
    return false;
  }
}
