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
 * @property {object} [score] - Matching score
 */

/** Autocomplete helper class */
export class Autocomplete {
  /**
   * Constructor
   * @param {L10N} l10n - Parent localization helper
   */
  constructor(l10n) {
    this.l10n = l10n;
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
    const data = this.l10n.data;

    query = n(query);

    /**
     * Suggest content by matching keywords
     * @param {string} locale - Locale
     * @return {SearchMatch[]} - Matching content
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
          /** Total number of keyword hit possible */
          const kwTotal = keywordSets.length;

          /** Keyword hits */
          const kwHit = keywordSets.reduce(
              (hitCount, set) => (
                (set.findIndex((kw) => query.includes(n(kw))) !== -1)?
                (hitCount+1):
                (hitCount)
              ),
              0,
          );

          if (
            (kwHit > 0) &&
            (matches.findIndex((m) => m.id === entry.id) === -1)
          ) {
            matches.push({
              id: entry.id,
              title: entry.title,
              // content: content.content,
              locale: locale,
              score: {score: (kwHit / kwTotal), total: kwTotal},
            });
          }

          if (kwHit > 0) {
            const prevIdx = matches.findIndex(
                (prevMatch) => prevMatch.id === entry.id,
            );

            const newMatch = {
              id: entry.id,
              title: entry.title,
              locale: locale,
              score: {score: (kwHit / kwTotal), total: kwTotal},
            };

            if (prevIdx === -1) {
              matches.push(newMatch);
            } else {
              const prevMatch = matches[prevIdx];
              if (prevMatch.score.score < newMatch.score.score) {
                matches[prevIdx] = newMatch;
              }
            }
          }
        }
      });

      return matches;
    }

    /**
     * Suggest content by matching keywords
     * @param {string} locale - Locale
     * @return {SearchMatch[]} - Matching content
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
        if ((entry.matches) && (Array.isArray(entry.matches))) {
          const matched =
              (entry.matches.findIndex((m) => m.includes(query)) !== -1);

          if (
            (matched) &&
            (matches.findIndex((m) => m.id === entry.id) === -1)
          ) {
            matches.push({
              id: entry.id,
              title: entry.title,
              locale: locale,
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
      if (a.score.score > b.score.score) return -1;

      if (a.score.score < b.score.score) return 1;

      // b.score.score === a.score.score
      if (a.score.total > b.score.total) return -1;

      if (a.score.total < b.score.total) return 1;

      if (a.locale === locale) return -1;

      return 1;
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
      return results.slice(0, resultLimit);
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
   * @param {string} dbResKey - Resource key of content database
   * @param {'keywords'|'part-of'} [matchType] - How content are matched
   * @return {object|SearchMatch[]} - Matched content
   */
  getContent(locale, query, dbResKey, matchType = 'keywords') {
    const l10n = this.l10n;

    if (query) {
      let contentLocale = locale;
      let contentId = query;

      if (query.includes(':')) [contentLocale, contentId] = query.split(':');

      let content = l10n.s(contentLocale, `${dbResKey}.content.${contentId}`);

      if (content) return content;

      const suggestions =
          this.suggestContent(locale, query, dbResKey, matchType);

      if (suggestions.length) {
        const {score, id} = suggestions[0];

        if (matchType === 'keywords') {
          if (score.score >= 0.5) {
            content = l10n.s(locale, `${dbResKey}.content.${id}`);
          }
        } else {
          content = l10n.s(locale, `${dbResKey}.content.${id}`);
        }

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
}
