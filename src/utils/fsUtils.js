/**
 * Utility functions related to file system
 */

import {fileURLToPath} from 'url';

import path from 'path';
export const joinPath = path.join;
export const resolvePath = path.resolve;
export const getFileExtension = path.extname;

import fs from 'fs';
export const readDirectory = fs.readdirSync;
export const fileExists = fs.existsSync;

/**
 * Delete all content of a directory
 * @param {string|URL} filePath - File path of the target directory
 */
export function clearDirectory(filePath) {
  readDirectory(filePath).forEach((f) => fs.rmSync(joinPath(filePath, f)));
}

/**
 * Recursively make a directory
 * @param {string|URL} filePath - File path of the target directory
 */
export function makeDirectory(filePath) {
  fs.mkdirSync(filePath, {recursive: true});
}


/**
 * Check if a file path describes a file system directory
 * @param {string|URL} filePath - File path
 * @return {boolean}
 */
export function isDirectory(filePath) {
  return fs.statSync(filePath).isDirectory();
}

/**
 * Check if a file path describes a regular file
 * @param {string|URL} filePath - File path
 * @return {boolean}
 */
export function isFile(filePath) {
  return fs.statSync(filePath).isFile();
}

/**
* Get file paths of files of certain file extensions in a directory
* @example
* // returns all .json files in the directory and its sub-directories
* findFiles(filePath, ['.json'], 1);
* @param {string} filePath - File path of the directory to search
* @param {string[]} extensions - File extensions to match
* @param {number} maxDepth - (Integer) How deep into the sub-directories
* @return {string[]} - List of file paths
*/
export function findFiles(filePath, extensions, maxDepth) {
  maxDepth = Number.isInteger(maxDepth)?maxDepth:0;
  const results = [];

  /**
   * Walk through sub-directories for matching files
   * @param {string} filePath - File path of the current directory
   * @param {number} currDepth - Current depth
   */
  function __traverse(filePath, currDepth) {
    fs.readdirSync(filePath).forEach((fileName) => {
      const childPath = joinPath(filePath, fileName);
      if (isFile(childPath)) {
        const ext = getFileExtension(childPath);
        if (extensions.includes(ext)) results.push(childPath);
      } else if (isDirectory(childPath)) {
        if (currDepth < maxDepth) __traverse(childPath, currDepth + 1);
      }
    });
  }

  __traverse(filePath, 0);
  return results;
}

/**
 * Get the directory path of a module
 * @example
 * // return directory of the module
 * getModuleDirectory(import.meta);
 * @param {Object} meta - Meta object of the module
 * @return {string} - Directory path
 */
export function getModuleDirectory(meta) {
  // "file:///C:/Users/John/my-project/my-module.js"
  const moduleURL = meta.url;

  // "C:\\Users\\John\\my-project\\my-module.js"
  const modulePath = fileURLToPath(moduleURL);

  // "C:\\Users\\John\\my-project\\"
  return resolvePath(modulePath, './../');
}
