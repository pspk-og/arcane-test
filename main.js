const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

// Import scraper modules
const scrapeAsura = require('./scrapers/asura');
const downloadColaManga = require('./scrapers/colamanga');
const scrapeErosScans = require('./scrapers/erosScans');
const downloadFromHentai2Read = require('./scrapers/hentai2read');
const downloadHitomi = require('./scrapers/hitomi');
const scrapeNhentai = require('./scrapers/nhentai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Default downloads directory
let downloadsDir = path.join(__dirname, 'downloads');
fs.ensureDir(downloadsDir);

// API Routes
app.post('/api/download', async (req, res) => {
  try {
    const { module, url, options = {} } = req.body;
    console.log(`Starting download with module: ${module}, URL: ${url}`);
    
    let result;
    
    switch (module) {
      case 'asura':
        result = await scrapeAsura({ url, title: options.title || 'asura_manga' });
        break;
        
      case 'colamanga':
        if (!options.startChapter || !options.endChapter) {
          throw new Error('ColamangaError: Start and end chapter numbers are required');
        }
        const baseUrl = url.replace(/\d+\.html$/, '');
        result = await downloadColaManga(
          baseUrl, 
          parseInt(options.startChapter), 
          parseInt(options.endChapter), 
          options.title || 'ColaManga'
        );
        break;
        
      case 'erosscans':
        result = await scrapeErosScans({ url, title: options.title || 'eros_manga' });
        break;
        
      case 'hentai2read':
        result = await downloadFromHentai2Read(url);
        break;
        
      case 'hitomi':
        result = await downloadHitomi({ url });
        break;
        
      case 'nhentai':
        result = await scrapeNhentai({ 
          url, 
          title: options.title || 'nhentai_manga',
          cookies: options.cookies || []
        });
        break;
        
      default:
        throw new Error(`Unknown module: ${module}`);
    }
    
    res.json({
      success: true,
      result,
      message: 'Download completed successfully'
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Download failed: ${error.message}`
    });
  }
});

app.get('/api/downloads', async (req, res) => {
  try {
    const files = await fs.readdir(downloadsDir);
    const folders = [];
    
    for (const file of files) {
      const filePath = path.join(downloadsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        folders.push({
          name: file,
          path: filePath,
          created: stat.birthtime
        });
      }
    }
    
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set download directory
app.post('/api/set-download-path', async (req, res) => {
  try {
    const { path: newPath } = req.body;
    if (!newPath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    // Ensure the directory exists
    await fs.ensureDir(newPath);
    downloadsDir = newPath;
    
    res.json({ success: true, path: downloadsDir });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current download directory
app.get('/api/download-path', (req, res) => {
  res.json({ path: downloadsDir });
});



// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Manga Reader & Downloader running on http://localhost:${PORT}`);
});
