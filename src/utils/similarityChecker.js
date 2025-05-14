
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const stringSimilarity = require('string-similarity');
const natural = require('natural');
const db = require('../config/db');
const { S3 } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialiser le client S3
const s3 = new S3({
  region: 'eu-north-1', // Spécifier explicitement la région
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Fonction pour télécharger un fichier depuis S3
async function downloadFromS3(bucketName, key) {
  try {
    // Normaliser la clé S3
    const normalizedKey = key
      .replace(/\\/g, '/') // Remplacer les backslashes par des forward slashes
      .replace(/\/+/g, '/') // Remplacer les doubles slashes par un seul
      .replace(/^\//, '') // Supprimer le slash initial s'il existe
      .trim();

    console.log('Tentative de téléchargement depuis S3:', {
      bucket: bucketName,
      originalKey: key,
      normalizedKey: normalizedKey
    });

    const response = await s3.getObject({
      Bucket: bucketName,
      Key: normalizedKey
    });
    
    if (!response.Body) {
      throw new Error('Réponse S3 invalide - pas de contenu');
    }

    return await response.Body.transformToByteArray();
  } catch (error) {
    console.error('Erreur détaillée lors du téléchargement depuis S3:', {
      error: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw new Error(`Impossible de télécharger le fichier depuis S3: ${error.message}`);
  }
}

async function compareWithExistingMemoires(text, threshold = 0.5) {
  try {
    const bucketName = 'archivamemo'; // Définir la variable au début de la fonction
    
    const [memoires] = await db.promise().query(`
      SELECT m.id_memoire, m.libelle, m.file_path,
             cr.results_json as previous_comparison
      FROM memoire m
      LEFT JOIN comparison_results cr ON m.id_memoire = cr.memoire_id
      WHERE m.status = 'validated'
    `);

    const results = [];
    
    for (const memoire of memoires) {
      try {
        const fileName = path.basename(memoire.file_path);
        const s3Key = `memoires/${fileName}`;

        console.log(`Tentative de téléchargement depuis S3:`, {
          bucket: bucketName,
          key: s3Key,
          region: process.env.AWS_REGION
        });

        // Télécharger le fichier depuis S3
        const fileBuffer = await downloadFromS3(bucketName, s3Key);
        
        // Extraire le texte du PDF
        const memoireText = await extractTextFromPDF(fileBuffer);
        
        if (!memoireText) {
          console.warn(`Pas de texte extrait pour le mémoire ${memoire.id_memoire}`);
          continue;
        }

        // Calculer la similarité avec TF-IDF
        const tfidf = new natural.TfIdf();
        const sourceTokens = text.toLowerCase().split(/\s+/);
        const targetTokens = memoireText.toLowerCase().split(/\s+/);
        
        tfidf.addDocument(sourceTokens);
        tfidf.addDocument(targetTokens);
        
        const similarity = calculateCosineSimilarity(tfidf, sourceTokens, targetTokens);
        
        if (similarity >= threshold) {
          results.push({
            id_memoire: memoire.id_memoire,
            libelle: memoire.libelle,
            similarity: parseFloat((similarity * 100).toFixed(2))
          });
        }
      } catch (error) {
        console.error(`Erreur lors du traitement du mémoire ${memoire.id_memoire}:`, error);
        continue;
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Erreur lors de la comparaison:', error);
    throw error;
  }
}

// Fonction helper pour calculer la similarité cosinus
function calculateCosineSimilarity(tfidf, sourceTokens, targetTokens) {
  const sourceVector = {};
  const targetVector = {};
  
  // Create TF-IDF vectors (tokens are already lowercase from previous processing)
  sourceTokens.forEach(token => {
    sourceVector[token] = tfidf.tfidf(token, 0);
  });
  
  targetTokens.forEach(token => {
    targetVector[token] = tfidf.tfidf(token, 1);
  });
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let sourceNorm = 0;
  let targetNorm = 0;
  
  Object.keys(sourceVector).forEach(token => {
    if (targetVector[token]) {
      dotProduct += sourceVector[token] * targetVector[token];
    }
    sourceNorm += sourceVector[token] * sourceVector[token];
  });
  
  Object.keys(targetVector).forEach(token => {
    targetNorm += targetVector[token] * targetVector[token];
  });
  
  // Calculate final similarity
  const denominator = Math.sqrt(sourceNorm) * Math.sqrt(targetNorm);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

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
// async function extractTextFromPDF(pdfPath) {
//   try {
//     const dataBuffer = fs.readFileSync(pdfPath);
//     const data = await pdf(dataBuffer);
//     return data.text;
//   } catch (error) {
//     console.error('Error extracting text from PDF:', error);
//     throw new Error(' to extract text from PDF');
//   }
// }

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error('Erreur lors de l\'extraction du texte : ' + err.message);
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
      SELECT m.id_memoire, m.libelle, m.file_path,
             cr.results_json as previous_comparison
      FROM memoire m
      LEFT JOIN comparison_results cr ON m.id_memoire = cr.memoire_id
      WHERE m.status = 'validated'
    `);

    const results = [];
    
    for (const memoire of memoires) {
      try {
        // Construct S3 key from file path
        const s3Key = `memoires/${memoire.file_path.split('/').pop()}`; // Extract filename
        const bucketName = 'archivamemo'; // Définir la variable au début de la fonction

        console.log(`Attempting to download from S3 for ${memoire.id_memoire}:`, {
          bucket: bucketName,
          key: s3Key
        });

        // Télécharger le fichier depuis S3
        const fileBuffer = await downloadFromS3(bucketName, s3Key);
        
        // Extraire le texte du PDF
        const memoireText = await extractTextFromPDF(fileBuffer);
        
        if (!memoireText) {
          console.warn(`Pas de texte extrait pour le mémoire ${memoire.id_memoire}`);
          continue;
        }

        // Calculer la similarité avec TF-IDF
        const tfidf = new natural.TfIdf();
        const sourceTokens = text.toLowerCase().split(/\s+/);
        const targetTokens = memoireText.toLowerCase().split(/\s+/);
        
        tfidf.addDocument(sourceTokens);
        tfidf.addDocument(targetTokens);
        
        const similarity = calculateCosineSimilarity(tfidf, sourceTokens, targetTokens);
        
        if (similarity >= threshold) {
          results.push({
            id_memoire: memoire.id_memoire,
            libelle: memoire.libelle,
            similarity: parseFloat((similarity * 100).toFixed(2))
          });
        }
      } catch (error) {
        console.error(`Error processing memoire ${memoire.id_memoire}:`, error);
        continue;
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error during comparison:', error);
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
// function calculateCosineSimilarity(text1, text2) {
//   const tfidf = new natural.TfIdf();
  
//   const words1 = text1.toLowerCase().split(/\s+/);
//   const words2 = text2.toLowerCase().split(/\s+/);
  
//   tfidf.addDocument(words1);
//   tfidf.addDocument(words2);
  
//   const vector1 = {};
//   const vector2 = {};
  
//   tfidf.listTerms(0).forEach(item => {
//     vector1[item.term] = item.tfidf;
//   });
  
//   tfidf.listTerms(1).forEach(item => {
//     vector2[item.term] = item.tfidf;
//   });
  
//   let dotProduct = 0;
//   let norm1 = 0;
//   let norm2 = 0;
  
//   Object.keys(vector1).forEach(term => {
//     if (vector2[term]) {
//       dotProduct += vector1[term] * vector2[term];
//     }
//     norm1 += vector1[term] * vector1[term];
//   });
  
//   Object.keys(vector2).forEach(term => {
//     norm2 += vector2[term] * vector2[term];
//   });
  
//   return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
// }

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
