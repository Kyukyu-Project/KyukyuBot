/** Localization helper */

import {readFile} from 'fs';

import {resolve} from 'path';
import {fileURLToPath} from 'url';

import {objectToMap} from './utils.js';
import {clientConfig} from './app-config.js';
import {Autocomplete} from './autocomplete.js';

const thisFilePath = fileURLToPath(import.meta.url);
const resourceFilePath = resolve(
    thisFilePath,
    './../../resources/localization.json',
);

/** Localization helper class */
export class L10N {
  /** Constructor */
  constructor() {
    /**
     * Default (fallback) locale
     * @type {string}
     */
    this.defaultLocale = clientConfig['default-locale'];

    /**
     * List of locales
     * @type {string[]}
     */
    this.locales = [];

    /**
     * Resource data
     * @type {Map<string, String|Array<String|Object>|Object}
     */
    this.data = new Map();

    /**
     * Resource version
     * @type {string}
     */
    this.version = '';

    this.s = this.getResource; // function short-hand

    /**
     * Autocomplete helper
     * @type {Autocomplete}
     */
    this.autocomplete = new Autocomplete(this);
  }

  /**
   * Load locale resources
   */
  async load() {
    return new Promise((resolve, reject) => {
      readFile(resourceFilePath, 'utf8', (readErr, data) => {
        if (readErr) {
          reject(readErr);
        } else {
          try {
            const parsedData = JSON.parse(data);
            const locales = parsedData.locales;
            this.locales = locales;
            this.version = parsedData.version;
            locales.forEach((locale) => {
              const localeData = objectToMap(parsedData[locale]);
              this.data.set(locale, localeData);
            });
            resolve(true);
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });
  }

  /**
   * Reload locale resources
   */
  async reload() {
    this.clear();
    return this.load();
  }

  /**
   * Get all available localizations
   * @param {string} resourceKey - Resource key
   * @return {Object}
   */
  getLocalizations(resourceKey) {
    const result = {};
    let count = 0;
    this.data.forEach((data, locale) => {
      if (data.has(resourceKey)) {
        result[locale] = data.get(resourceKey);
        count++;
      }
    });
    if (count > 0) return result;
    else return ({'en-US': `<${resourceKey}>`});
  }

  /**
   * Get content of a resource key
   * @param {string} locale - Locale
   * @param {string} resourceKey - Resource key
   * @return {string|Object|Array|undefined} Resource content
   */
  getResource(locale, resourceKey) {
    const template =
      (this.data.get(locale)?.get(resourceKey)) ||
      (this.data.get(this.defaultLocale).get(resourceKey)) ||
      undefined;
    return template;
  }

  /**
   * Get a string template and replace placeholder strings
   * @param {string} locale - Locale
   * @param {string} resourceKey - Resource key of the string template
   * @param {(string|number)[]} strings - Array of place-holder and replacer
   * @return {string} Resultant string
   */
  t(locale, resourceKey, ...strings) {
    /** string template   */
    let template;

    if (this.data.get(locale)?.has(resourceKey)) {
      template = this.data.get(locale).get(resourceKey);
    } else {
      locale = this.defaultLocale;
      if (this.data.get(locale).has(resourceKey)) {
        template = this.data.get(locale).get(resourceKey);
      } else {
        return '';
      }
    }

    let result = template;
    const args = [].slice.call(strings);
    for (let i = 0; i < args.length; i=i+2) {
      const placeHolder = args[i];
      let replacer = args[i+1];
      if (typeof replacer === 'number') {
        replacer = replacer.toLocaleString(locale);
      }
      result = result.replaceAll(placeHolder, replacer);
    }
    return result;
  }

  /**
   * Replace placeholder strings in a string template
   * @param {string} template - String template
   * @param {string[]} strings - Array of place-holder and replacer
   * @return {string} Resultant string
   */
  r(template, ...strings) {
    let result = template;
    const args = [].slice.call(strings);
    for (let i = 0; i < args.length; i=i+2) {
      result = result.replaceAll(args[i], args[i+1]);
    }
    return result;
  }

  /**
   * Make a list
   * @example
   * // returns 'apple, banana, and orange'
   * l10n.join('en-US', ['apple', 'banana', 'orange']);
   * @param {string} locale - Locale
   * @param {string[]} list - List of terms
   * @param {string[]} [maxLength] - Maximum number of items
   * @return {string} List of strings separated by delimiters
   */
  makeList(locale, list, maxLength) {
    const len = list.length;
    if (len === 0) return '';
    if (len === 1) return list[0];
    switch (locale) {
      case 'de':
      case 'de-DE':
        if (len === 2) {
          return `${list[0]} und ${list[1]}`;
        } else if (len === 3) {
          return `${list[0]}, ${list[1]} und ${list[2]}`;
        } else if ((typeof maxLength === 'number') && (len > maxLength)) {
          return list.slice(0, maxLength).join(', ') + ' usw';
        } else {
          const list2 = [...list];
          const lastItem = list2.pop();
          return list2.join(', ') + ' und ' + lastItem;
        }
      case 'zh-TW':
        if (len === 2) {
          return `${list[0]}和${list[1]}`;
        } else if (len === 3) {
          return `${list[0]}、${list[1]}和${list[2]}`;
        } else if ((typeof maxLength === 'number') && (len > maxLength)) {
          return list.slice(0, maxLength).join('、') + '……等';
        } else {
          const list2 = [...list];
          const lastItem = list2.pop();
          return list2.join('、') + '和' + lastItem;
        }
      case 'jp':
      case 'jp-JP':
        if (len === 2) {
          // 'リンゴとバナナ'
          return `${list[0]}と${list[1]}`;
        } else if (len === 3) {
          // 'リンゴとバナナとチェリー'
          return `${list[0]}と${list[1]}と${list[2]}`; // Oxford comma
        } else if ((typeof maxLength === 'number') && (len > maxLength)) {
          // 'リンゴ、バナナ、チェリー、ナツメヤシなど'
          return list.slice(0, maxLength).join('、') + 'など';
        } else {
          // 'リンゴ、バナナ、チェリー、ナツメヤシ、イチジク、グァバ、ハニーデュー'
          return list.join('、');
        }
      case 'en-US':
      default:
        if (len === 2) {
          // 'apple and banana'
          return `${list[0]} and ${list[1]}`;
        } else if (len === 3) {
          // 'apple, banana, and cherry'
          return `${list[0]}, ${list[1]}, and ${list[2]}`; // Oxford comma
        } else if ((typeof maxLength === 'number') && (len > maxLength)) {
          // 'apple, banana, cherry, date, etc'
          return list.slice(0, maxLength).join(',') + ', etc';
        } else {
          // 'apple, banana, cherry, date, fig, guava, and honeydew'
          const list2 = [...list];
          const lastItem = list2.pop();
          return list2.join(', ') + ', and ' + lastItem; // Oxford comma
        }
    }
  }

  /**
   * Format number
   * @param {string} locale - 'SI' or Locale
   * @param {number} value
   * @param {Object|undefined} options - formatting options
   * @return {string}
   */
  formatNumber(locale, value, options) {
    const numberLocale = this.getResource(locale, 'number-locale');

    options = Object.assign({minimumFractionDigits: 0}, options);

    if (numberLocale === 'SI') {
      const decimals = options.minimumFractionDigits;

      const str = value.toFixed(decimals).split('.');
      if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1\u2009');
      }
      if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1\u2009');
      }

      if (decimals > 0) return str.join('.');
      else return str[0];
    }

    return new Intl.NumberFormat(numberLocale, options).format(value);
  }

  /**
   * Convert date to ISO or locale format
   * @param {string} locale - 'ISO' or locale
   * @param {Date} d - date
   * @return {string}
   */
  formatDate(locale, d) {
    const dataLocale = this.getResource(locale, 'date-locale');
    if (dataLocale === 'ISO') return d.toISOString().split('T')[0];
    return d.toLocaleString(dataLocale, {dateStyle: 'medium', timeZone: 'UTC'});
  }

  /**
   * Get hero by display name
   * @example
   *  l10n.findHeroByDisplayName('de', 'en-US:dracula');
   * @example
   *  l10n.findHeroByDisplayName('fr', 'Drake');
   * @param {string} locale - Locale
   * @param {string} query - Query string
   * @return {string[]|undefined} - [heroName, heroDisplayName]
   */
  findHeroByDisplayName(locale, query) {
    const heroNames = this.getResource(locale, 'hero-names');
    if (typeof query === 'string') {
      if (query.includes(':')) {
        // Query is from autocomplete
        // Format: <locale>:<internal name>
        const v = query.split(':')[1];
        const h = heroNames.find((el) => el[0] === v);
        if (h) return h;
      } else {
        const v = query.trim().normalize();
        // search hero display name
        const h = heroNames.find((el) => el[1].normalize() === v);
        if (h) return h;
      }
    }
    return undefined;
  }

  /**
   * Get hero by internal hero name
   * @param {string} locale - Locale
   * @param {string} query - Query string
   * @return {string[]|undefined} - [heroName, heroDisplayName]
   */
  findHeroByName(locale, query) {
    const heroNames = this.getResource(locale, 'hero-names');
    if (typeof query === 'string') {
      const v = query.trim();
      const h = heroNames.find((el) => el[0] === v);
      if (h) return h;
    }
    return undefined;
  }
}

/** Localization helper */
export const l10n = new L10N();
