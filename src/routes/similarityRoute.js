const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');

// Recherche Google Scholar (scraping)
async function searchScholar(query) {
  try {
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    // Extraire les liens des résultats
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http') && !href.includes('google')) {
        links.push(href);
      }
    });
    return links.slice(0, 5);
  } catch (err) {
    console.error('Erreur Google Scholar:', err);
    return [];
  }
}

// Recherche Semantic Scholar (scraping)
async function searchSemanticScholar(query) {
  // ... (inchangé)
}

// Recherche CORE (scraping)
async function searchCore(query) {
  try {
    const url = `https://core.ac.uk/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = [];
    $('a[data-testid="search-result-title-link"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) links.push('https://core.ac.uk' + href);
    });
    return links.slice(0, 5);
  } catch (err) {
    console.error('Erreur CORE:', err);
    return [];
  }
}

// Recherche arXiv (scraping)
async function searchArxiv(query) {
  try {
    const url = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all&source=header`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = [];
    $('li.arxiv-result .list-title a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) links.push(href);
    });
    return links.slice(0, 5);
  } catch (err) {
    console.error('Erreur arXiv:', err);
    return [];
  }
}

// Recherche HAL (scraping)
async function searchHAL(query) {
  try {
    const url = `https://hal.science/search/index/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = [];
    $('a.result-title').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) links.push(href);
      else if (href) links.push('https://hal.science' + href);
    });
    return links.slice(0, 5);
  } catch (err) {
    console.error('Erreur HAL:', err);
    return [];
  }
}

async function searchSemanticScholar(query) {
  try {
    const url = `https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = [];
    $('a[data-selenium-selector="title-link"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) links.push('https://www.semanticscholar.org' + href);
    });
    return links.slice(0, 5);
  } catch (err) {
    console.error('Erreur Semantic Scholar:', err);
    return [];
  }
}

async function fetchAndExtractText(url) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    const $ = cheerio.load(html);
    // Prends tout le texte visible du <body>
    return $('body').text().replace(/\s+/g, ' ').trim();
  } catch (e) {
    return '';
  }
}

router.post('/web', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, message: 'Texte requis' });
  }

  // Utilise le titre ou la première ligne comme requête courte pour la recherche
  let query = text.split('\n')[0].slice(0, 120);
  if (!query || query.length < 8) {
    const sentences = text.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean);
    if (sentences.length > 0) {
      query = sentences[0].slice(0, 120);
    }
  }

  // Fonction pour extraire les mots-clés les plus fréquents (hors stopwords)
  function extractKeywords(txt, n = 5) {
    const stopwords = ["le","la","les","de","des","du","un","une","et","en","dans","pour","par","avec","sur","au","aux","est","à","the","of","in","to","a","an","on","for","by","from","with","as","that","this","it","are","was","be","at","or","not","but","if","so","can","will","would","should","could","has","have","had","do","does","did","their","them","they","we","you","your","our","us","he","she","his","her","him","its","which","who","what","when","where","how","why","all","any","each","other","some","such","no","nor","too","very","one","two","first","second","third"];
    const words = txt.toLowerCase().replace(/[^a-zA-Z0-9éèêàùçâîïôûüœ\s]/g, '').split(/\s+/);
    const freq = {};
    for (const w of words) {
      if (!stopwords.includes(w) && w.length > 2) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }
    return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,n).map(([w])=>w);
  }

  // Tentative 1 : recherche avec le titre
  let searchAttempts = [query];
  // Tentative 2 : mots-clés principaux
  const keywords = extractKeywords(text, 5);
  if (keywords.length > 0) searchAttempts.push(keywords.join(' '));
  // Tentative 3 : mot-clé le plus fréquent
  if (keywords.length > 0) searchAttempts.push(keywords[0]);

  let allLinks = [];
  for (const attempt of searchAttempts) {
    const shortQuery = attempt.split(' ').slice(0, 10).join(' ');
    const sources = [
      await searchSemanticScholar(shortQuery),
      await searchCore(shortQuery),
      await searchArxiv(shortQuery)
    ];
    for (const arr of sources) {
      if (Array.isArray(arr)) allLinks = allLinks.concat(arr);
    }
    allLinks = [...new Set(allLinks)];
    if (allLinks.length > 0) break; // On sort dès qu'on a au moins un résultat
  }
  allLinks = allLinks.slice(0, 10);

  // Scrape chaque lien, extrait le titre et calcule la similarité avec tout le texte du mémoire
  const results = [];
  for (const link of allLinks) {
    try {
      // Timeout de 7 secondes pour chaque fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
      clearTimeout(timeout);
      const html = await response.text();
      const $ = cheerio.load(html);
      // Extraction robuste du titre
      let pageTitle = $('meta[property="og:title"]').attr('content') || $('title').first().text().trim();
      if (!pageTitle || pageTitle.length < 5) {
        pageTitle = $('h1').first().text().trim();
      }
      // Extraction du texte principal (500 premiers caractères, sans répétition d'espaces)
      let extText = $('body').text().replace(/\s+/g, ' ').trim();
      extText = extText.replace(/\s{2,}/g, ' ');
      let excerpt = extText.slice(0, 250);
      // Calcul de la similarité texte global (info)
      let similarity = stringSimilarity.compareTwoStrings(text, extText);
      // Calcul de la similarité de titre
      const titleSimilarity = stringSimilarity.compareTwoStrings(query.toLowerCase(), pageTitle.toLowerCase());
      if (titleSimilarity > 0.7) {
        similarity = Math.max(similarity, titleSimilarity);
      }
      // Nettoyage du titre si trop technique ou vide
      if (!pageTitle || pageTitle.length < 5 || pageTitle.match(/arxiv|core|semantic/i)) {
        pageTitle = excerpt.slice(0, 60) + (excerpt.length > 60 ? '...' : '');
      }
      // Arrondi du pourcentage
      const similarityPercent = Math.round(similarity * 1000) / 10;
      results.push({ link, title: pageTitle, similarity, similarityPercent, excerpt });
    } catch (err) {
      console.error('Erreur fetch/extract sur', link, err);
    }
  }

  // Retourne jusqu'à 10 résultats réels, sans filtrer sur la similarité
  res.json({ success: true, results: results.slice(0, 10) });
});

module.exports = router;