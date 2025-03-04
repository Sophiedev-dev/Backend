
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const stringSimilarity = require('string-similarity');
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
        similarity_warning_threshold: warningThreshold,
        similarity_danger_threshold: dangerThreshold
      };
    }
    
    const highestSimilarity = results[0].similarity;
    
    if (highestSimilarity >= dangerThreshold) {
      return {
        level: 'danger',
        message: 'High similarity detected. Significant modifications needed.',
        color: 'red',
        percentage: highestSimilarity,
        similarity_warning_threshold: warningThreshold,
        similarity_danger_threshold: dangerThreshold
      };
    } else if (highestSimilarity >= warningThreshold) {
      return {
        level: 'warning',
        message: 'Moderate similarity detected. Some modifications recommended.',
        color: 'orange',
        percentage: highestSimilarity,
        similarity_warning_threshold: warningThreshold,
        similarity_danger_threshold: dangerThreshold
      };
    } else {
      return {
        level: 'success',
        message: 'Low similarity detected. Acceptable level.',
        color: 'green',
        percentage: highestSimilarity,
        similarity_warning_threshold: warningThreshold,
        similarity_danger_threshold: dangerThreshold
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
