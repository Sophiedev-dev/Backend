const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Définition des types pour les erreurs
type ErrorWithMessage = {
  message: string;
};

const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

async function uploadToS3(filePath: string, bucketName: string): Promise<void> {
  try {
    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `memoires/${fileName}`,
      Body: fileContent,
      ContentType: 'application/pdf'
    });

    await s3Client.send(command);
    console.log(`Fichier ${fileName} transféré avec succès`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erreur lors du transfert de ${filePath}:`, errorMessage);
  }
}

async function migrateFiles(): Promise<void> {
  const BUCKET_NAME = 'archivamemo';
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  try {
    const files = await fs.readdir(uploadsDir);
    
    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(uploadsDir, file);
        await uploadToS3(filePath, BUCKET_NAME);
      }
    }
    
    console.log('Migration terminée avec succès');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erreur lors de la migration:', errorMessage);
  }
}

migrateFiles();