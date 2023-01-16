/*
 * Wrapper for RNG functions
 **/

/**
 * Shuffle an array
 * Code copied from https://bost.ocks.org/mike/shuffle/
 * @param {Array} array
 * @return {Array}
 */
export function shuffle(array) {
  const result = Array.from(array);
  let m = result.length;
  let t;
  let i;
  while (m) { // While there remain elements to shuffle…
    i = Math.floor(Math.random() * m--); // Pick a remaining element…
    t = result[m]; // And swap it with the current element.
    result[m] = result[i];
    result[i] = t;
  }
  return result;
}

/**
 * Randomly pick an item from an array
 * @param {String[]} array
 * @return {String}
 */
export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}
