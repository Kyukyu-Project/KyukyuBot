/** Autocomplete helper */

/**
 * @typedef {import('./l10n.js').L10N} L10N
 */

/**
 * Convert a string to normalized, lower-case form
 * @param {string} str - String
 * @return {string} - Converted string
 */
function n(str) {
  return str.trim().normalize().toLowerCase();
}

/**
 * A result from autocomplete suggestions
 * @typedef {Object} SearchMatch
 * @property {string} id - Id of the matched item
 * @property {string} title - Title of the matched item
 * @property {Object} content - Content of the matched item
 * @property {string} [locale] - Locale of the matched item
 * @property {number} [score] - Matching score
 */

/** Autocomplete helper class */
export class Autocomplete {
  /**
   * Constructor
   * @param {L10N} l10n - Parent localization helper
   */
  constructor(l10n) {
    this.l10n = l10n;
    this.data = l10n.data;
  }

  /**
   * Autocomplete (suggest as you type)
   * @param {string} locale - Locale
   * @param {string} query - Query string (user input)
   * @param {string} resourceKey - Resource key of content database
   * @param {'keywords'|'part-of'} [matchType] - How content are matched
   * @return {SearchMatch[]} - Matched content
   */
  suggestContent(locale, query, resourceKey, matchType = 'keywords') {
    const resultLimit = 25;
    const defaultLocale = this.l10n.defaultLocale;
    const data = this.data;

    query = n(query);

    /**
     * Suggest content by matching keywords
     * @param {string} locale - Locale
     * @return {AutocompleteMatch[]} - Matching content
     */
    function suggestByKeywordMatching(locale) {
      /** @type {Object[]} */
      const searchDb = data?.get(locale)?.get(resourceKey + '.search');

      if (!searchDb) return [];
      if (!Array.isArray(searchDb)) return [];

      /** @type {SearchMatch[]} */
      const matches = [];

      searchDb.forEach((entry) => {
        /** @type {string[]} - Keywords */
        const keywordSets = entry['keyword-sets'];
        if ((keywordSets) && (Array.isArray(keywordSets))) {
          /** Number of keywords contained in the query string */
          const score = keywordSets.reduce(
              (matchCount, set) => (
                (set.findIndex((kw) => query.includes(n(kw))) !== -1)?
                (matchCount+1):
                (matchCount)
              ),
              0,
          );

          if (
            (score > 0) &&
            (matches.findIndex((m) => m.id === entry.id) === -1)
          ) {
            matches.push({
              id: entry.id,
              title: entry.title,
              // content: content.content,
              locale: locale,
              score: score,
            });
          }
        }
      });

      return matches;
    }

    /**
     * Suggest content by matching keywords
     * @param {string} locale - Locale
     * @return {AutocompleteMatch[]} - Matching content
     */
    function suggestByPartialMatching(locale) {
      /** @type {Object[]} */
      const searchDb = data?.get(locale)?.get(resourceKey + '.search');

      if (!searchDb) return [];
      if (!Array.isArray(searchDb)) return [];

      /** @type {SearchMatch[]} */
      const matches = [];

      searchDb.forEach((entry) => {
        /** @type {string[]} - Keywords */
        const matches = entry.matches;
        if ((matches) && (Array.isArray(matches))) {
          const score =
              (entry.matches.findIndex((m) => m.includes(query)) !== -1);

          if (
            (score) &&
            (matches.findIndex((m) => m.id === entry.id) === -1)
          ) {
            matches.push({
              id: entry.id,
              title: entry.title,
              content: entry.content,
              locale: locale,
              score: score,
            });
          }
        }
      });

      return matches;
    }

    /**
     * Get the relative order of two matched items within the results
     * @param {SearchMatch} a - Item A
     * @param {SearchMatch} b - Item B
     * @return {number} - Negative if A is before B
     */
    function sortByScore(a, b) {
      if (b.score === a.score) {
        if (a.locale === locale) return -1;
        else return 1;
      }
      if (a.score > b.score) return -1;
      else return 1;
    }

    if (matchType === 'part-of') {
      const results = suggestByPartialMatching(locale);

      // Extending search results
      if ((locale !== defaultLocale) && (results.length < resultLimit)) {
        const xResults = suggestByPartialMatching(defaultLocale);
        xResults.forEach((x) => {
          if (results.findIndex((r) => (r.id === x.id)) === -1) {
            results.push(x);
          }
        });
      }
      return results.sort(sortByScore).slice(0, resultLimit);
    } else {
      const results = suggestByKeywordMatching(locale);

      // Extending search results
      if ((locale !== defaultLocale) && (results.length < resultLimit)) {
        const xResults = suggestByKeywordMatching(defaultLocale);
        xResults.forEach((x) => {
          if (results.findIndex((r) => (r.id === x.id)) === -1) {
            results.push(x);
          }
        });
      }
      return results.sort(sortByScore).slice(0, resultLimit);
    }
  }

  /**
   * Get content
   * @param {string} locale - Locale
   * @param {string} query - Query string (user input)
   * @param {string} resourceKey - Resource key of content database
   * @param {'keywords'|'part-of'} [matchType] - How content are matched
   * @return {object|SearchMatch[]} - Matched content
   */
  getContent(locale, query, resourceKey, matchType = 'keywords') {
    const l10n = this.l10n;

    if (query) {
      let contentLocale = locale;
      let contentId = query;

      if (query.includes(':')) [contentLocale, contentId] = query.split(':');

      let content = l10n.s(
          contentLocale, `${resourceKey}.content.${contentId}`,
      );

      if (content) return content;

      const suggestions =
          this.suggestContent(locale, query, resourceKey, matchType);

      if (suggestions.length) {
        content = l10n.s(locale, `${resourceKey}.content.${suggestions[0].id}`);
        if (content) return content;
      }
    }
    return undefined;
  }

  /**
   * Get default suggestions
   * @param {string} locale - Locale
   * @param {string} resourceKey - Resource key of content database
   * @param {string[]} defaultList - Default list
   * @return {SearchMatch[]|undefined}
   */
  getDefaultSuggestions(locale, resourceKey, defaultList) {
    if (Array.isArray(defaultList)) {
      const l10n = this.l10n;
      const suggestions = [];
      defaultList.forEach((id) => {
        const content = l10n.s(locale, resourceKey + '.content.' + id);
        if (content) {
          suggestions.push({
            id: id,
            title: content.title,
            locale: locale,
          });
        }
      });
      if (suggestions.length) return suggestions;
    }
    return [];
  }

  /**
   * Get hero by hero's display name
   * @example
   *  l10n.findHeroByDisplayName('de', 'en-US:dracula');
   * @example
   *  l10n.findHeroByDisplayName('fr', 'Drake');
   * @param {string} locale - Locale
   * @param {string} query - Query string
   * @return {string[]|undefined} - [heroName, heroDisplayName]
   */
  findHeroByDisplayName(locale, query) {
    const l10n = this.l10n;

    const heroNames = l10n.s(locale, 'hero-names');
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
