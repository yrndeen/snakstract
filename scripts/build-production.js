const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Starting production build...');

// Check if .env.production exists
const envPath = path.join(__dirname, '../frontend/.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production file not found!');
  console.log('📝 Please create .env.production file with your production settings.');
  console.log('💡 You can copy env.production.example and update the values.');
  process.exit(1);
}

// Change to frontend directory
process.chdir(path.join(__dirname, '../frontend'));

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the project
  console.log('🔨 Building for production...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build was successful
  const distPath = path.join(__dirname, '../frontend/dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - dist folder not created');
  }

  console.log('✅ Production build completed successfully!');
  console.log('📁 Build output:', distPath);
  
  // Show build size
  const buildSize = getFolderSize(distPath);
  console.log(`📊 Build size: ${(buildSize / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n🚀 Ready for deployment!');
  console.log('📝 Next steps:');
  console.log('1. Upload the dist/ folder to your hosting provider');
  console.log('2. Configure your domain and SSL');
  console.log('3. Deploy your game server');
  console.log('4. Test the complete system');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

function getFolderSize(folderPath) {
  let size = 0;
  const files = fs.readdirSync(folderPath);
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getFolderSize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
} 
 