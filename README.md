# Hayase Nyaa Extension

Nyaa.si torrent source extension for [Hayase](https://github.com/Lazap-Development/Hayase) automation system.

## 🎯 Features

- Search torrents from Nyaa.si
- Support for single episodes, batches, and movies
- Filter by resolution (480p, 720p, 1080p, 2160p)
- Automatic seeder/leecher sorting
- Episode exclusion support

## 📦 Installation

Add to your Hayase configuration:

gh:Windows-12UA/nyaa

## 🚀 Usage

The extension will automatically search Nyaa.si when Hayase requests torrents for anime episodes.

### Supported Query Types

- **Single Episode**: Searches for individual episodes with episode number matching
- **Batch**: Searches for batch/season packs
- **Movie**: Searches for anime movies

### Accuracy Levels

- `high`: Title match + correct episode number
- `medium`: Title match
- `low`: Partial or no title match

## 🔧 Configuration

The extension uses the following Nyaa categories:

- `1_2`: Anime - English translated (default)

## 📝 Example

```javascript
// Hayase will automatically use this extension
// No manual configuration needed
```

## 📝 License

MIT License - feel free to modify and distribute

## 🤝 Contributing

Issues and pull requests welcome at [github.com/Windows-12UA/nyaa](https://github.com/Windows-12UA/nyaa)

## 🔗 Links

- [Nyaa.si](https://nyaa.si)
- [Hayase Project](https://github.com/Lazap-Development/Hayase)
- [Repository](https://github.com/Windows-12UA/nyaa)
