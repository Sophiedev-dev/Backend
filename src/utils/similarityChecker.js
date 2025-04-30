
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const stringSimilarity = require('string-similarity');
const natural = require('natural');
const db = require('../config/db');

/**
 * Get similarity status based on highest similarity percentage
 * @param {Array} results - Comparison results
 * @returns {Promise<Object>} - Status object with level and message
 */

// Update the getSimilarityStatus function
async function getSimilarityStatus(results) {
  try {
    // Get thresholds from database with correct setting_key names
    const [thresholds] = await db.promise().query(
      "SELECT  setting_value FROM app_settings WHERE setting_key IN ('similarity_warning_threshold', 'similarity_danger_threshold')"
    );

    if (!thresholds || thresholds.length < 2) {
      throw new Error('Similarity thresholds not configured in database');
    }

    const warningThreshold = parseInt(thresholds.find(t => t.setting_key === 'similarity_warning_threshold')?.setting_value);
    const dangerThreshold = parseInt(thresholds.find(t => t.setting_key === 'similarity_danger_threshold')?.setting_value);

    if (results.length === 0) {
      return { 
        level: 'success', 
        message: 'No significant similarities found',
        color: 'green',
        percentage: 0,
        warningThreshold,
        dangerThreshold
      };
    }
    
    const highestSimilarity = results[0].similarity;
    
    if (highestSimilarity >= dangerThreshold) {
      return {
        level: 'danger',
        message: 'High similarity detected. Significant modifications needed.',
        color: 'red',
        percentage: highestSimilarity,
        warningThreshold,
        dangerThreshold
      };
    } else if (highestSimilarity >= warningThreshold) {
      return {
        level: 'warning',
        message: 'Moderate similarity detected. Some modifications recommended.',
        color: 'orange',
        percentage: highestSimilarity,
        warningThreshold,
        dangerThreshold
      };
    } else {
      return {
        level: 'success',
        message: 'Low similarity detected. Acceptable level.',
        color: 'green',
        percentage: highestSimilarity,
        warningThreshold,
        dangerThreshold
      };
    }
  } catch (error) {
    console.error('Error getting thresholds:', error);
    throw new Error('Cannot perform similarity check: Thresholds not properly configured');
  }
}

/**
 * Extract text from a PDF file
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(' to extract text from PDF');
  }
}

/**
 * Compare text with existing mémoires
 * @param {string} text - Text to compare
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<Array>} - Array of similar mémoires with similarity scores
 */
async function compareWithExistingMemoires(text, threshold = 0.5) {
  try {
    // Get all validated mémoires
    const [memoires] = await db.promise().query(`
      SELECT id_memoire, libelle, file_path 
      FROM memoire 
      WHERE status = 'validated' AND file_path IS NOT NULL
    `);

    const results = [];
    
    // Compare with each mémoire
    for (const memoire of memoires) {
      try {
        if (!fs.existsSync(memoire.file_path)) {
          console.warn(`File not found: ${memoire.file_path}`);
          continue;
        }
        
        const memoireText = await extractTextFromPDF(memoire.file_path);
        const similarity = stringSimilarity.compareTwoStrings(text, memoireText);
        
        if (similarity >= threshold) {
          results.push({
            id_memoire: memoire.id_memoire,
            libelle: memoire.libelle,
            similarity: parseFloat((similarity * 100).toFixed(2)) // Convert to percentage
          });
        }
      } catch (error) {
        console.error(`Error processing mémoire ${memoire.id_memoire}:`, error);
        continue; // Skip this mémoire but continue with others
      }
    }
    
    // Sort by similarity (highest first)
    return results.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error comparing with existing mémoires:', error);
    throw new Error('Failed to compare with existing mémoires');
  }
}

/**
 * Save comparison results to database
 * @param {number} memoireId - ID of the mémoire
 * @param {Array} results - Comparison results
 * @returns {Promise<number>} - ID of the saved results
 */
async function saveComparisonResults(memoireId, results) {
  try {
    const [result] = await db.promise().query(
      'INSERT INTO comparison_results (memoire_id, results_json) VALUES (?, ?)',
      [memoireId, JSON.stringify(results)]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error saving comparison results:', error);
    throw new Error('Failed to save comparison results');
  }
}

// Ajouter ces nouvelles fonctions de traitement du texte
const preprocessText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitIntoParagraphs = (text) => {
  return text.split(/\n\s*\n/)
    .filter(para => para.trim().length > 50)
    .map(para => preprocessText(para));
};

// Modifier la fonction getDetailedComparison existante
async function getDetailedComparison(sourceText, targetText) {
  try {
    if (!sourceText || !targetText) {
      throw new Error('Source or target text is missing');
    }

    const sourceParagraphs = splitIntoParagraphs(sourceText);
    const targetParagraphs = splitIntoParagraphs(targetText);

    if (sourceParagraphs.length === 0 || targetParagraphs.length === 0) {
      return {
        overallSimilarity: 0,
        detailedMatches: []
      };
    }

    const detailedMatches = [];
    let totalSimilarity = 0;
    let matchCount = 0;

  // Réduire le seuil de similarité et améliorer la détection
    const similarityThreshold = 0.2; // Réduire de 0.3 à 0.2 pour capturer plus de correspondances

    for (let i = 0; i < sourceParagraphs.length; i++) {
      const sourcePara = sourceParagraphs[i];
      
      for (let j = 0; j < targetParagraphs.length; j++) {
        const targetPara = targetParagraphs[j];
        
        // Utiliser TF-IDF pour une meilleure comparaison
        const tfidf = new natural.TfIdf();
        tfidf.addDocument(sourcePara);
        tfidf.addDocument(targetPara);
        
        // Calculer la similarité avec string-similarity et TF-IDF
        const stringSim = stringSimilarity.compareTwoStrings(sourcePara, targetPara);
        const similarity = Math.max(stringSim, calculateCosineSimilarity(sourcePara, targetPara));

        if (similarity >= similarityThreshold) {
          const sourceWords = sourcePara.split(/\s+/);
          const targetWords = targetPara.split(/\s+/);
          const matchingPhrases = findMatchingPhrases(sourceWords, targetWords);

          detailedMatches.push({
            sourceText: sourcePara,
            targetText: targetPara,
            similarity: parseFloat((similarity * 100).toFixed(2)),
            sourcePage: Math.floor(i / 2) + 1,
            targetPage: Math.floor(j / 2) + 1,
            matchingPhrases
          });
          totalSimilarity += similarity;
          matchCount++;
        }
      }
    }

    const overallSimilarity = matchCount > 0 
      ? parseFloat((totalSimilarity / matchCount * 100).toFixed(2))
      : 0;

    // Retourner plus de matches pour avoir plus de résultats
    return {
      overallSimilarity,
      detailedMatches: detailedMatches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10) // Augmenter de 5 à 10 le nombre de matches retournés
    };
  } catch (error) {
    console.error('Error in getDetailedComparison:', error);
    throw new Error('Failed to get detailed comparison: ' + error.message);
  }
}

// Ajouter cette fonction helper pour le calcul de similarité cosinus
function calculateCosineSimilarity(text1, text2) {
  const tfidf = new natural.TfIdf();
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  tfidf.addDocument(words1);
  tfidf.addDocument(words2);
  
  const vector1 = {};
  const vector2 = {};
  
  tfidf.listTerms(0).forEach(item => {
    vector1[item.term] = item.tfidf;
  });
  
  tfidf.listTerms(1).forEach(item => {
    vector2[item.term] = item.tfidf;
  });
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  Object.keys(vector1).forEach(term => {
    if (vector2[term]) {
      dotProduct += vector1[term] * vector2[term];
    }
    norm1 += vector1[term] * vector1[term];
  });
  
  Object.keys(vector2).forEach(term => {
    norm2 += vector2[term] * vector2[term];
  });
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
}

// Ajouter cette nouvelle fonction helper
function findMatchingPhrases(sourceWords, targetWords) {
  const matchingPhrases = [];
  const minPhraseLength = 5;

  for (let i = 0; i < sourceWords.length - minPhraseLength + 1; i++) {
    for (let j = 0; j < targetWords.length - minPhraseLength + 1; j++) {
      let matchLength = 0;
      while (
        i + matchLength < sourceWords.length &&
        j + matchLength < targetWords.length &&
        sourceWords[i + matchLength] === targetWords[j + matchLength]
      ) {
        matchLength++;
      }

      if (matchLength >= minPhraseLength) {
        matchingPhrases.push({
          text: sourceWords.slice(i, i + matchLength).join(' '),
          sourceIndex: i,
          targetIndex: j
        });
        i += matchLength - 1;
        break;
      }
    }
  }

  return matchingPhrases;
}

/**
 * Get similarity status based on highest similarity percentage
 * @param {Array} results - Comparison results
 * @returns {Object} - Status object with level and message
 */
async function getSimilarityStatus(results) {
  try {
    // Get thresholds from database with correct setting_key names
    const [thresholds] = await db.promise().query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('similarity_warning_threshold', 'similarity_danger_threshold')"
    );

    if (!thresholds || thresholds.length < 2) {
      throw new Error('Similarity thresholds not configured in database');
    }

    const warningThreshold = parseInt(thresholds.find(t => t.setting_key === 'similarity_warning_threshold')?.setting_value);
    const dangerThreshold = parseInt(thresholds.find(t => t.setting_key === 'similarity_danger_threshold')?.setting_value);

    if (results.length === 0) {
      return { 
        level: 'success', 
        message: 'No significant similarities found',
        color: 'green',
        percentage: 0,
        warningThreshold,
        dangerThreshold
      };
    }
    
    const highestSimilarity = results[0].similarity;
    
    if (highestSimilarity >= dangerThreshold) {
      return {
        level: 'danger',
        message: 'High similarity detected. Significant modifications needed.',
        color: 'red',
        percentage: highestSimilarity,
        warningThreshold,
        dangerThreshold
      };
    } else if (highestSimilarity >= warningThreshold) {
      return {
        level: 'warning',
        message: 'Moderate similarity detected. Some modifications recommended.',
        color: 'orange',
        percentage: highestSimilarity,
        warningThreshold,
        dangerThreshold
      };
    } else {
      return {
        level: 'success',
        message: 'Low similarity detected. Acceptable level.',
        color: 'green',
        percentage: highestSimilarity,
        warningThreshold,
        dangerThreshold
      };
    }
  } catch (error) {
    console.error('Error getting thresholds:', error);
    throw new Error('Cannot perform similarity check: Thresholds not properly configured');
  }
}

/**
 * Get comparison results for a mémoire
 * @param {number} memoireId - ID of the mémoire
 * @returns {Promise<Object>} - Comparison results
 */
async function getComparisonResults(memoireId) {
  try {
    const [results] = await db.promise().query(
      'SELECT results_json FROM comparison_results WHERE memoire_id = ? ORDER BY created_at DESC LIMIT 1',
      [memoireId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    return JSON.parse(results[0].results_json);
  } catch (error) {
    console.error('Error getting comparison results:', error);
    throw new Error('Failed to get comparison results');
  }
}

module.exports = {
  extractTextFromPDF,
  compareWithExistingMemoires,
  saveComparisonResults,
  getSimilarityStatus,
  getComparisonResults,
  getDetailedComparison 
};
