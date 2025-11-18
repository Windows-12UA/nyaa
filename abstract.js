/**
 * @typedef {import('./').TorrentSource} TorrentSource
 */

/**
 * @implements {TorrentSource}
 */
export default class AbstractSource {
  /**
   * Gets results for single episode
   * @type {import('./').SearchFunction}
   */
  single(options) {
    throw new Error("Source does not implement single");
  }

  /**
   * Gets results for batch of episodes
   * @type {import('./').SearchFunction}
   */
  batch(options) {
    throw new Error("Source does not implement batch");
  }

  /**
   * Gets results for a movie
   * @type {import('./').SearchFunction}
   */
  movie(options) {
    throw new Error("Source does not implement movie");
  }

  /**
   * Tests connection to source
   * @type {()=>Promise<boolean>}
   */
  test() {
    throw new Error("Source does not implement test");
  }
}
