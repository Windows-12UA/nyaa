import AbstractSource from "./abstract.js";

export default class NyaaSource extends AbstractSource {
  constructor() {
    super();
    this.baseUrl = "https://nyaa.si";
  }

  async test() {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch (error) {
      console.error("Nyaa test failed:", error);
      return false;
    }
  }

  parseTorrent(element, query) {
    try {
      const titleMatch = element.match(/title=".+?">(.+?)<\/a>/);
      const urlMatch = element.match(/a href="(\/view\/\d+?)"/);
      const updateMatch = element.match(
        /data-timestamp.+?>(.+?)<\/td>[^;]+?(\d+)<\/td>[\s\S]+?>(\d+)/
      );
      const sizeMatch = element.match(
        /<td class="text-center">([\d.]+\s+[A-Za-z]+)<\/td>/
      );
      const downloadMatch = element.match(
        /<td class="text-center">(\d+)<\/td>[\s\S]+?<td class="text-center">\d+<\/td>[\s\S]+?<td class="text-center">\d+<\/td>/
      );

      if (!titleMatch || !urlMatch || !updateMatch) {
        return null;
      }

      const title = titleMatch[1];
      const seeders = parseInt(updateMatch[2]) || 0;
      const leechers = parseInt(updateMatch[3]) || 0;
      const viewUrl = urlMatch[1];

      let sizeInBytes = 0;
      if (sizeMatch) {
        const sizeStr = sizeMatch[1];
        const sizeNum = parseFloat(sizeStr);
        if (sizeStr.includes("GiB")) {
          sizeInBytes = sizeNum * 1024 * 1024 * 1024;
        } else if (sizeStr.includes("MiB")) {
          sizeInBytes = sizeNum * 1024 * 1024;
        } else if (sizeStr.includes("KiB")) {
          sizeInBytes = sizeNum * 1024;
        }
      }

      const accuracy = this.calculateAccuracy(title, query);

      return {
        title,
        viewUrl,
        seeders,
        leechers,
        downloads: downloadMatch ? parseInt(downloadMatch[1]) : 0,
        size: sizeInBytes,
        accuracy,
        date: new Date(updateMatch[1]),
      };
    } catch (error) {
      console.error("Error parsing torrent:", error);
      return null;
    }
  }

  calculateAccuracy(title, query) {
    const titleLower = title.toLowerCase();
    const matchedTitles = query.titles.filter((t) =>
      titleLower.includes(t.toLowerCase())
    );

    if (matchedTitles.length === 0) {
      return "low";
    }

    if (query.episode) {
      const episodePattern = new RegExp(
        `(?:e|episode|ep)\\s*0*${query.episode}(?!\\d)`,
        "i"
      );
      if (episodePattern.test(title)) {
        return "high";
      }
      return "medium";
    }

    return "medium";
  }

  async getTorrentDetails(viewUrl) {
    try {
      const response = await fetch(`${this.baseUrl}${viewUrl}`);
      const html = await response.text();

      const torrentMatch = html.match(/<a href="(.+?\.torrent)"/);
      const magnetMatch = html.match(
        /href="(magnet:\?xt=urn:btih:([a-fA-F0-9]+)[^"]*)"/
      );

      return {
        link: torrentMatch ? `${this.baseUrl}${torrentMatch[1]}` : "",
        magnet: magnetMatch ? magnetMatch[1] : "",
        hash: magnetMatch ? magnetMatch[2].toLowerCase() : "",
      };
    } catch (error) {
      console.error("Error getting torrent details:", error);
      return { link: "", magnet: "", hash: "" };
    }
  }

  async searchNyaa(searchQuery, filter = "1_2") {
    try {
      const url = `${this.baseUrl}/?f=0&c=${filter}&q=${encodeURIComponent(
        searchQuery
      )}&s=seeders&o=desc`;
      const response = await fetch(url);
      const html = await response.text();

      const matches = html.match(
        /<tr class="(?:default|success)"[\s\S]+?<\/tr>/g
      );
      return matches || [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  buildSearchQuery(query) {
    const searchTerms = [query.titles[0]];

    if (query.episode) {
      searchTerms.push(query.episode.toString().padStart(2, "0"));
    }

    if (query.resolution) {
      searchTerms.push(query.resolution + "p");
    }

    return searchTerms.join(" ");
  }

  async single(query, options = {}) {
    const searchQuery = this.buildSearchQuery(query);
    const elements = await this.searchNyaa(searchQuery, "1_2");

    const results = [];
    for (const element of elements.slice(0, 10)) {
      const parsed = this.parseTorrent(element, query);
      if (!parsed) {
        continue;
      }

      if (
        query.exclusions &&
        query.exclusions.some((ex) =>
          parsed.title.toLowerCase().includes(ex.toLowerCase())
        )
      ) {
        continue;
      }

      const details = await this.getTorrentDetails(parsed.viewUrl);

      results.push({
        title: parsed.title,
        link: details.magnet || details.link,
        seeders: parsed.seeders,
        leechers: parsed.leechers,
        downloads: parsed.downloads,
        accuracy: parsed.accuracy,
        hash: details.hash,
        size: parsed.size,
        date: parsed.date,
        type: "best",
      });
    }

    return results.sort((a, b) => b.seeders - a.seeders);
  }

  async batch(query, options = {}) {
    const searchQuery =
      query.titles[0] +
      (query.resolution ? ` ${query.resolution}p` : "") +
      " batch";
    const elements = await this.searchNyaa(searchQuery, "1_2");

    const results = [];
    for (const element of elements.slice(0, 10)) {
      const parsed = this.parseTorrent(element, query);
      if (!parsed) {
        continue;
      }

      const isBatch =
        parsed.title.toLowerCase().includes("batch") ||
        parsed.title.match(/\d+-\d+/);
      if (!isBatch) {
        continue;
      }

      if (
        query.exclusions &&
        query.exclusions.some((ex) =>
          parsed.title.toLowerCase().includes(ex.toLowerCase())
        )
      ) {
        continue;
      }

      const details = await this.getTorrentDetails(parsed.viewUrl);

      results.push({
        title: parsed.title,
        link: details.magnet || details.link,
        seeders: parsed.seeders,
        leechers: parsed.leechers,
        downloads: parsed.downloads,
        accuracy: parsed.accuracy,
        hash: details.hash,
        size: parsed.size,
        date: parsed.date,
        type: "batch",
      });
    }

    return results.sort((a, b) => b.seeders - a.seeders);
  }

  async movie(query, options = {}) {
    const searchQuery = this.buildSearchQuery(query) + " movie";
    const elements = await this.searchNyaa(searchQuery, "1_2");

    const results = [];
    for (const element of elements.slice(0, 10)) {
      const parsed = this.parseTorrent(element, query);
      if (!parsed) {
        continue;
      }

      if (
        query.exclusions &&
        query.exclusions.some((ex) =>
          parsed.title.toLowerCase().includes(ex.toLowerCase())
        )
      ) {
        continue;
      }

      const details = await this.getTorrentDetails(parsed.viewUrl);

      results.push({
        title: parsed.title,
        link: details.magnet || details.link,
        seeders: parsed.seeders,
        leechers: parsed.leechers,
        downloads: parsed.downloads,
        accuracy: parsed.accuracy,
        hash: details.hash,
        size: parsed.size,
        date: parsed.date,
        type: "best",
      });
    }

    return results.sort((a, b) => b.seeders - a.seeders);
  }
}
