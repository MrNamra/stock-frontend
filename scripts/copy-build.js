const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.join(__dirname, '../build');
const targetDir = path.join(__dirname, '../../server/public');

console.log('🚀 Starting build deployment...');
console.log(`📁 Source: ${sourceDir}`);
console.log(`📁 Target: ${targetDir}`);

async function copyBuildFiles() {
  try {
    // Remove existing public folder
    if (fs.existsSync(targetDir)) {
      console.log('🗑️  Removing existing public folder...');
      await fs.remove(targetDir);
    }

    // Create public directory
    console.log('📁 Creating public directory...');
    await fs.ensureDir(targetDir);

    // Copy build files
    console.log('📋 Copying build files...');
    await fs.copy(sourceDir, targetDir);

    console.log('✅ Build files copied successfully!');
    console.log(`🌐 Frontend will be served from: ${targetDir}`);
    console.log('🔗 Access your app at: http://your-domain/');
    
    // Create a simple index redirect for SPA routing
    const indexPath = path.join(targetDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('📝 Frontend ready to serve from backend!');
    }

  } catch (error) {
    console.error('❌ Error copying build files:', error);
    process.exit(1);
  }
}

copyBuildFiles(); 