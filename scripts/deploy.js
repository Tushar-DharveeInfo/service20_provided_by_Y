import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const artifactsDir = path.join(rootDir, 'artifacts');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const zipFileName = `n20a-dist-${timestamp}.zip`;
const zipFilePath = path.join(artifactsDir, zipFileName);

async function deploy() {
    try {
        // Check if dist folder exists
        if (!fs.existsSync(distDir)) {
            console.error('❌ Error: dist folder not found. Run "npm run build" first.');
            process.exit(1);
        }

        // Create artifacts folder if it doesn't exist
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
            console.log('✓ Created artifacts folder');
        }

        // Create zip file
        console.log('📦 Creating zip file...');

        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`✓ Zip file created: ${zipFileName}`);
            console.log(`✓ Total size: ${sizeInMB} MB`);
            console.log(`✓ Location: ${zipFilePath}`);
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(distDir, 'dist');
        await archive.finalize();

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

deploy();
