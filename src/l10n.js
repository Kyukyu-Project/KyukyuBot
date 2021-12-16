/*
 * Localization helper class
 **/

import {Collection} from 'discord.js';
import {createFlattenedCollectionFromFiles} from '../utils/utils.js';

const REPLACEALL_SUPPORTED =
  (typeof String.prototype.replaceAll === 'function');

/** Localization class */
class L10N extends Collection {
  /**
   * Constructor
   * @param {null|Array} entries - Language
   * @param {string[]} filePaths -File paths (.json files)
   */
  constructor(entries) {
    super(entries);
    /**
     * Default (fallback) language
     * @type {string}
     */
    this.defaultLang = '';

    /**
     * Storage space for file paths of command files
     * @type {Collection}
     * @private
     */
    this.sources = new Collection();

    this.s = this.getTemplate; // function short-hand
  }

  /**
   * Load language files
   * @param {string} lang - Language
   * @param {string[]} filePaths -File paths (.json files)
   */
  loadLanguageFiles(lang, filePaths) {
    lang = String(lang).toLowerCase().trim();
    const data = createFlattenedCollectionFromFiles(filePaths);
    if (this.has(lang)) {
      const langCollection = this.get(lang).concat(data);
      const srcCollection = this.sources.get(lang).concat(filePaths);
      this.set(lang, langCollection);
      this.sources.set(lang, srcCollection);
    } else {
      this.set(lang, data);
      this.sources.set(lang, filePaths.slice());

      // If default language is not defined, then use the first
      // loaded language as the default language
      if (!this.defaultLang) this.defaultLang = lang;
    }
  }

  /**
   * Translate from a string template
   * @param {string} lang - language
   * @param {string} templateKey - Name of the string template
   * @return {string} string template
   */
  getTemplate(lang, templateKey) {
    const template =
      (this.get(lang)?.get(templateKey)) ||
      (this.get(this.defaultLang).get(templateKey)) ||
      '';
    return template;
  }

  /**
   * Get the canonical name from an alias
   * @param {string} lang - Language
   * @param {string} keyPath - Key path of the alias look-up array
   * @param {string} alias - Alias
   * @return {string}
   */
  getCanonicalName(lang, keyPath, alias) {
    alias = alias.toLowerCase();
    // keyPath = 'aliases.' + keyPath;
    let searchArray = this.get(lang)?.get(keyPath);
    if (searchArray) {
      const found = searchArray.find((el)=>el.includes(alias));
      if (found) return found[0];
    }
    if (lang == this.defaultLang) return '';
    searchArray = this.get(this.defaultLang)?.get(keyPath);
    if (searchArray) {
      const found = searchArray.find((el)=>el.includes(alias));
      if (found) return found[0];
    }
    return '';
  }

  /**
   * Translate from a string template
   * @param {string} lang - language
   * @param {string} templateKey - Name of the string template
   * @param {string[]} strings
   * @return {string} translated string
   */
  t(lang, templateKey, ...strings) {
    // try to get the string template
    const template = this.getTemplate(lang, templateKey);

    if (template == '') return '';

    let result = template;
    const args = [].slice.call(strings);
    if (REPLACEALL_SUPPORTED) {
      for (let i = 0; i < args.length; i=i+2) {
        result = result.replaceAll(args[i], args[i+1]);
      }
    } else {
      for (let i = 0; i < args.length; i=i+2) {
        result = result.replace(new RegExp(args[i], 'g'), args[i+1]);
      }
    }
    return result;
  }
}

export default L10N;
