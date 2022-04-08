/**
 * @typedef {import('../../src/typedef.js').CommandContext} CommandContext
 * @typedef {import('../../src/typedef.js').InteractionContext} IContext
 */
import {COMMAND_PERM} from '../../src/typedef.js';
import {SlashCommandBuilder} from '@discordjs/builders';
import heroBase from '../../data/heroes.js';

export const canonName = 'aow.hero-event';
export const name = 'hero-event';
export const requireArgs = true;
export const commandPerm = COMMAND_PERM.GENERAL;
export const cooldown = 5;

const scInfoLabel      = 'info';
const scListLabel      = 'list';
const scFindLabel      = 'find-legendary';
const scFind2Label     = 'find-epic';
const scDownloadLabel  = 'download';
const scAddWheelLabel  = 'add-wheel';
const scAddCMLabel     = 'add-cm';
const scRemoveLabel    = 'remove';
const optHeroLabel     = 'hero';

/**
 * @param {CommandContext} context
 * @return {object}
 */
export function getSlashData(context) {
  const {client, lang, guild} = context;
  const {l10n} = client;

  const findChoices =
    client.events.pastEventLegendaryHeroes
        .map((hero)=> [l10n.s(lang, `hero-display-names.${hero}`), hero])
        .sort((a, b) => a[0].localeCompare(b[0], lang));

  const find2Choices =
    client.events.pastEventEpicHeroes
        .map((hero)=> [l10n.s(lang, `hero-display-names.${hero}`), hero])
        .sort((a, b) => a[0].localeCompare(b[0], lang));

  const addChoices = heroBase
      .filter((data) =>
        data.rarity ==='legendary' &&
        (data.released === true || data.released === undefined) &&
        (data.exclusive === false || data.exclusive === undefined)
      )
      .map((data)=> [
        l10n.s(lang, `hero-display-names.${data.name}`),
        data.name,
      ])
      .sort((a, b) => a[0].localeCompare(b[0], lang));

  const addChoices2 = heroBase
      .filter((data) => data.rarity ==='epic')
      .map((data)=> [
        l10n.s(lang, `hero-display-names.${data.name}`),
        data.name,
      ])
      .sort((a, b) => a[0].localeCompare(b[0], lang));

  const cHint = l10n.s(lang, `commands.${canonName}.c-hint`);
  const scInfoHint = l10n.s(lang, `commands.${canonName}.sc-info-hint`);
  const scListHint = l10n.s(lang, `commands.${canonName}.sc-list-hint`);
  const scFindHint =
    l10n.s(lang, `commands.${canonName}.sc-find-legendary-hint`);
  const scFind2Hint =
    l10n.s(lang, `commands.${canonName}.sc-find-epic-hint`);
  const scDownloadHint = l10n.s(lang, `commands.${canonName}.sc-download-hint`);
  const scAddWheelHint = l10n.s(lang, `commands.${canonName}.sc-add-wheel-hint`);
  const scAddCMHint = l10n.s(lang, `commands.${canonName}.sc-add-cm-hint`);
  const scRemoveHint = l10n.s(lang, `commands.${canonName}.sc-remove-hint`);
  const optHeroHint  = l10n.s(lang, `commands.${canonName}.opt-hero-hint`);

  const ownerGuild = (guild.id == client.ownerGuildId);

  const slashCommand = new SlashCommandBuilder()
      .setName(name)
      .setDescription(cHint)
      .addSubcommand((command) => command
          .setName(scInfoLabel)
          .setDescription(scInfoHint),
      )
      .addSubcommand((command) => command
          .setName(scListLabel)
          .setDescription(scListHint),
      )
      .addSubcommand((command) => command
          .setName(scFindLabel)
          .setDescription(scFindHint)
          .addStringOption((option) => option
              .setName(optHeroLabel)
              .setDescription(optHeroHint)
              .setRequired(true)
              .addChoices(findChoices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scFind2Label)
          .setDescription(scFind2Hint)
          .addStringOption((option) => option
              .setName(optHeroLabel)
              .setDescription(optHeroHint)
              .setRequired(true)
              .addChoices(find2Choices),
          ),
      )
      .addSubcommand((command) => command
          .setName(scDownloadLabel)
          .setDescription(scDownloadHint),
      );

  if (ownerGuild) {
    slashCommand
        .addSubcommand((command) => command
            .setName(scAddCMLabel)
            .setDescription(scAddCMHint)
            .addStringOption((option) => option
                .setName('hero1')
                .setDescription('hero1')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero2')
                .setDescription('hero2')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero3')
                .setDescription('hero3')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero4')
                .setDescription('hero4')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero5')
                .setDescription('hero5')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero6')
                .setDescription('hero6')
                .setRequired(true)
                .addChoices(addChoices),
            ),
        )
        .addSubcommand((command) => command
            .setName(scAddWheelLabel)
            .setDescription(scAddWheelHint)
            .addStringOption((option) => option
                .setName('hero1')
                .setDescription('hero1')
                .setRequired(true)
                .addChoices(addChoices),
            )
            .addStringOption((option) => option
                .setName('hero2')
                .setDescription('hero2')
                .setRequired(true)
                .addChoices(addChoices2),
            ),
        )
        .addSubcommand((command) => command
            .setName(scRemoveLabel)
            .setDescription(scRemoveHint),
        );
  }

  return slashCommand;
}

/**
 * @param {IContext} context
 * @return {boolean} - true if command is executed
 */
export async function slashExecute(context) {
}
