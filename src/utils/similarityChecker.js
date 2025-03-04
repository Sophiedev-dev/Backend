
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const stringSimilarity = require('string-similarity');
const natural = require('natural');
const stopword = require('stopword');
const TfIdf = natural.TfIdf;
const db = require('../config/db');


function preprocessText(text) {
  // Nettoyer et normaliser le texte
  const cleanText = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s{2,}/g, ' ');
  
  // Tokenization et suppression des mots vides
  const words = cleanText.split(' ').filter(word => word.length > 2);
  const filteredWords = stopword.removeStopwords(words, stopword.fr);
  
  return filteredWords;
}

function calculateTFIDF(documents) {
  const tfidf = new TfIdf();
  
  // Ajouter tous les documents au calculateur TF-IDF
  documents.forEach(doc => {
    tfidf.addDocument(doc);
  });
  
  return tfidf;
}

// Mise à jour de la fonction getDetailedComparison
async function getDetailedComparison(sourceText, targetText) {
  try {
    if (!sourceText || !targetText) {
      throw new Error('Source or target text is missing');
    }

    // Diviser en paragraphes et filtrer les paragraphes trop courts
    const sourceParagraphs = sourceText.split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length >= 100);
    const targetParagraphs = targetText.split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length >= 100);

    if (sourceParagraphs.length === 0 || targetParagraphs.length === 0) {
      return {
        overallSimilarity: 0,
        detailedMatches: []
      };
    }

    const detailedMatches = [];
    let totalSimilarity = 0;
    let matchCount = 0;

    // Comparer chaque paragraphe
    for (const sourcePara of sourceParagraphs) {
      const sourceTokens = preprocessText(sourcePara);
      let bestMatch = {
        similarity: 0,
        targetPara: '',
        matchingPhrases: []
      };

      for (const targetPara of targetParagraphs) {
        const targetTokens = preprocessText(targetPara);
        
        // Calculer TF-IDF pour ce pair de paragraphes
        const tfidf = calculateTFIDF([sourceTokens, targetTokens]);
        let similarity = 0;
        
        // Calculer la similarité basée sur TF-IDF
        const sourceVector = {};
        const targetVector = {};
        
        sourceTokens.forEach(term => {
          sourceVector[term] = tfidf.tfidf(term, 0);
        });
        
        targetTokens.forEach(term => {
          targetVector[term] = tfidf.tfidf(term, 1);
        });

        // Calculer la similarité cosinus
        let dotProduct = 0;
        let normSource = 0;
        let normTarget = 0;

        Object.keys(sourceVector).forEach(term => {
          if (targetVector[term]) {
            dotProduct += sourceVector[term] * targetVector[term];
          }
          normSource += sourceVector[term] * sourceVector[term];
        });

        Object.keys(targetVector).forEach(term => {
          normTarget += targetVector[term] * targetVector[term];
        });

        similarity = dotProduct / (Math.sqrt(normSource) * Math.sqrt(normTarget));

        if (similarity > bestMatch.similarity && similarity > 0.3) {
          // Trouver les phrases exactement similaires
          const matchingPhrases = findMatchingPhrases(sourcePara, targetPara);
          
          if (matchingPhrases.length > 0) {
            bestMatch = {
              similarity: similarity,
              targetPara: targetPara,
              matchingPhrases
            };
          }
        }
      }

      if (bestMatch.similarity > 0.3) {
        detailedMatches.push({
          sourceText: sourcePara,
          targetText: bestMatch.targetPara,
          similarity: parseFloat((bestMatch.similarity * 100).toFixed(2)),
          matchingPhrases: bestMatch.matchingPhrases
        });
        totalSimilarity += bestMatch.similarity;
        matchCount++;
      }
    }

    const overallSimilarity = matchCount > 0 
      ? parseFloat((totalSimilarity / matchCount * 100).toFixed(2))
      : 0;

    return {
      overallSimilarity,
      detailedMatches: detailedMatches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
    };
  } catch (error) {
    console.error('Error in getDetailedComparison:', error);
    throw new Error('Failed to get detailed comparison: ' + error.message);
  }
}

function findMatchingPhrases(text1, text2) {
  const sentences1 = text1.match(/[^.!?]+[.!?]+/g) || [];
  const sentences2 = text2.match(/[^.!?]+[.!?]+/g) || [];
  const matchingPhrases = [];

  sentences1.forEach((sentence1, i) => {
    sentences2.forEach((sentence2, j) => {
      const tokens1 = preprocessText(sentence1);
      const tokens2 = preprocessText(sentence2);
      
      if (tokens1.length >= 5 && tokens2.length >= 5) {
        const tfidf = calculateTFIDF([tokens1, tokens2]);
        let similarity = 0;
        
        // Calculer similarité TF-IDF pour les phrases
        const vector1 = {};
        const vector2 = {};
        
        tokens1.forEach(term => {
          vector1[term] = tfidf.tfidf(term, 0);
        });
        
        tokens2.forEach(term => {
          vector2[term] = tfidf.tfidf(term, 1);
        });

        // Similarité cosinus pour les phrases
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

        similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

        if (similarity > 0.7) {
          matchingPhrases.push({
            sourceStart: i,
            targetStart: j,
            sourceText: sentence1.trim(),
            targetText: sentence2.trim(),
            similarity: parseFloat((similarity * 100).toFixed(2))
          });
        }
      }
    });
  });

  return matchingPhrases;
}


/**
 * Get similarity status based on highest similarity percentage
 * @param {Array} results - Comparison results
 * @returns {Promise<Object>} - Status object with level and message
 */

async function getSimilarityStatus(results) {
 if (results.length === 0) {
   return { 
     level: 'success', 
     message: 'No significant similarities found',
     color: 'green',
     percentage: 0
   };
 }
 
 // Récupérer les seuils configurés
 let warningThreshold = 0;
 let dangerThreshold = 0;
 
 try {
  const [thresholds] = await db.promise().query(
    "SELECT setting_value FROM app_settings WHERE setting_key IN ('similarity_warning_threshold', 'similarity_danger_threshold')"
  );
  
  if (thresholds.length > 0) {
    warningThreshold = parseInt(thresholds.find(t => t.setting_key === 'similarity_warning_threshold')?.setting_value) || 0;
    dangerThreshold = parseInt(thresholds.find(t => t.setting_key === 'similarity_danger_threshold')?.setting_value) || 0;
  }
} catch (error) {
  console.error('Error fetching similarity thresholds:', error);
  throw new Error('Failed to fetch similarity thresholds');
}
 
 const highestSimilarity = results[0].similarity;
 
 if (highestSimilarity >= dangerThreshold) {
   return {
     level: 'danger',
     message: 'High similarity detected. Significant modifications needed.',
     color: 'red',
     percentage: highestSimilarity
   };
 } else if (highestSimilarity >= warningThreshold) {
   return {
     level: 'warning',
     message: 'Moderate similarity detected. Some modifications recommended.',
     color: 'orange',
     percentage: highestSimilarity
   };
 } else {
   return {
     level: 'success',
     message: 'Low similarity detected. Acceptable level.',
     color: 'green',
     percentage: highestSimilarity
   };
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

async function getDetailedComparison(sourceText, targetText) {
  try {
    if (!sourceText || !targetText) {
      throw new Error('Source or target text is missing');
    }

    // Split texts into paragraphs and filter out empty ones
    const sourceParagraphs = sourceText.split(/\n\n+/).filter(p => p.trim().length >= 50);
    const targetParagraphs = targetText.split(/\n\n+/).filter(p => p.trim().length >= 50);

    if (sourceParagraphs.length === 0 || targetParagraphs.length === 0) {
      return {
        overallSimilarity: 0,
        detailedMatches: []
      };
    }

    const detailedMatches = [];
    let totalSimilarity = 0;
    let matchCount = 0;

    // Compare each paragraph
    for (const sourcePara of sourceParagraphs) {
      const sourceWords = sourcePara.toLowerCase().split(/\s+/);
      
      for (const targetPara of targetParagraphs) {
        const targetWords = targetPara.toLowerCase().split(/\s+/);
        const similarity = stringSimilarity.compareTwoStrings(sourcePara, targetPara);

        if (similarity >= 0.3) { // Only include significant matches
          // Find exact matching phrases
          const matchingPhrases = [];
          for (let i = 0; i < sourceWords.length - 4; i++) {
            for (let j = 0; j < targetWords.length - 4; j++) {
              let matchLength = 0;
              while (
                i + matchLength < sourceWords.length &&
                j + matchLength < targetWords.length &&
                sourceWords[i + matchLength] === targetWords[j + matchLength]
              ) {
                matchLength++;
              }

              if (matchLength >= 5) { // At least 5 consecutive words match
                matchingPhrases.push({
                  sourceStart: i,
                  targetStart: j,
                  length: matchLength,
                  text: sourceWords.slice(i, i + matchLength).join(' ')
                });
                i += matchLength - 1;
                break;
              }
            }
          }

          if (matchingPhrases.length > 0) {
            detailedMatches.push({
              sourceText: sourcePara,
              targetText: targetPara,
              similarity: parseFloat((similarity * 100).toFixed(2)),
              matchingPhrases
            });
            totalSimilarity += similarity;
            matchCount++;
            break; // Move to next source paragraph once we find a good match
          }
        }
      }
    }

    // Calculate overall similarity
    const overallSimilarity = matchCount > 0 
      ? parseFloat((totalSimilarity / matchCount * 100).toFixed(2))
      : 0;

    // Return top 5 matches with highest similarity
    return {
      overallSimilarity,
      detailedMatches: detailedMatches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
    };
  } catch (error) {
    console.error('Error in getDetailedComparison:', error);
    throw new Error('Failed to get detailed comparison: ' + error.message);
  }
}

/**
 * Get similarity status based on highest similarity percentage
 * @param {Array} results - Comparison results
 * @returns {Object} - Status object with level and message
 */
function getSimilarityStatus(results) {
  if (results.length === 0) {
    return { 
      level: 'success', 
      message: 'No significant similarities found',
      color: 'green',
      percentage: 0
    };
  }
  
  const highestSimilarity = results[0].similarity;
  
  if (highestSimilarity >= 70) {
    return {
      level: 'danger',
      message: 'High similarity detected. Significant modifications needed.',
      color: 'red',
      percentage: highestSimilarity
    };
  } else if (highestSimilarity >= 50) {
    return {
      level: 'warning',
      message: 'Moderate similarity detected. Some modifications recommended.',
      color: 'orange',
      percentage: highestSimilarity
    };
  } else {
    return {
      level: 'success',
      message: 'Low similarity detected. Acceptable level.',
      color: 'green',
      percentage: highestSimilarity
    };
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
