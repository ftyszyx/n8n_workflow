import {execSync} from 'child_process';
import {cpSync, existsSync, mkdirSync, readdirSync} from 'fs';
import {homedir, platform} from 'os';
import {join} from 'path';

import {BrowserType} from '../playwright/config';

declare const require: any;
declare const module: any;

function getPlaywrightCachePath(): string {
  const os = platform();

  if (os === 'win32') {
    return join(
        process.env.USERPROFILE || '', 'AppData', 'Local', 'ms-playwright');
  } else if (os === 'darwin') {
    // macOS uses Library/Caches instead of .cache
    return join(homedir(), 'Library', 'Caches', 'ms-playwright');
  } else {
    // Linux and other Unix-like systems
    return join(homedir(), '.cache', 'ms-playwright');
  }
}

function checkAndInstallLinuxDependencies(): boolean {
  const os = platform();

  // Only run on Linux
  if (os !== 'linux') {
    return true;
  }

  console.log('\n🐧 Linux detected - checking system dependencies...');

  try {
    // Check if we have sudo access
    const hasRoot = process.getuid && process.getuid() === 0;

    if (!hasRoot) {
      console.log(
          '⚠️  Not running as root. Attempting to install dependencies with sudo...');
    }

    // Try to use Playwright's built-in dependency installer
    console.log('Installing Playwright system dependencies...');

    try {
      execSync(
          'npx playwright install-deps chromium',
          {stdio: 'inherit', encoding: 'utf-8'});
      console.log('✅ System dependencies installed successfully!');
      return true;
    } catch (error) {
      console.warn('⚠️  Automatic dependency installation failed.');
      console.log('\n📋 Please install the following dependencies manually:');
      console.log('sudo apt-get update && sudo apt-get install -y \\');
      console.log('    libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \\');
      console.log('    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \\');
      console.log('    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \\');
      console.log('    libasound2 libatspi2.0-0 libnspr4 libnss3 \\');
      console.log('    libxshmfence1 libglib2.0-0 fonts-liberation');
      console.log('\nOr run: npx playwright install-deps chromium\n');

      // Don't fail the installation, just warn
      return false;
    }
  } catch (error) {
    console.error('Error checking Linux dependencies:', error);
    return false;
  }
}

function verifyLinuxDependencies(): void {
  const os = platform();

  if (os !== 'linux') {
    return;
  }

  console.log('\n🔍 Verifying Linux dependencies...');

  const requiredLibs = [
    'libatk-1.0.so.0', 'libatk-bridge-2.0.so.0', 'libcups.so.2', 'libnss3.so',
    'libgbm.so.1'
  ];

  const missingLibs: string[] = [];

  for (const lib of requiredLibs) {
    try {
      // Try to locate the library
      execSync(`ldconfig -p | grep ${lib}`, {stdio: 'pipe', encoding: 'utf-8'});
    } catch (error) {
      missingLibs.push(lib);
    }
  }

  if (missingLibs.length > 0) {
    console.log('⚠️  Missing system libraries detected:');
    missingLibs.forEach(lib => console.log(`   - ${lib}`));
    console.log('\n⚠️  Chromium may fail to launch. Run the following command:');
    console.log('   npx playwright install-deps chromium\n');
  } else {
    console.log('✅ All required system libraries found!');
  }
}

export async function setupBrowsers() {
  try {
    // 1. First log the environment
    console.log('Current working directory:', process.cwd());
    console.log('Operating System:', platform());
    console.log('Node version:', process.version);

    // 2. Check and install Linux dependencies if needed
    if (platform() === 'linux') {
      checkAndInstallLinuxDependencies();
    }

    // 3. Determine paths
    const sourcePath = getPlaywrightCachePath();
    const browsersPath = join(__dirname, '..', 'browsers');

    console.log('\nPaths:');
    console.log('Source path:', sourcePath);
    console.log('Destination path:', browsersPath);

    // 4. Check if source exists
    if (!existsSync(sourcePath)) {
      console.log(
          '\nSource path does not exist. Installing Playwright browsers...');
      execSync('npx --yes playwright install', {stdio: 'inherit'});

      // Verify installation succeeded
      if (!existsSync(sourcePath)) {
        throw new Error(`Failed to install browsers. Expected path ${
            sourcePath} does not exist after installation.`);
      }
    }

    // 5. Ensure destination directory exists (do NOT wipe on every startup)
    if (!existsSync(browsersPath)) {
      console.log('Creating browsers directory...');
      mkdirSync(browsersPath, {recursive: true});
    }

    // 6. Fast path: if all browsers already exist in destination, skip
    // everything
    const installedFiles =
        existsSync(browsersPath) ? readdirSync(browsersPath) : [];
    const needTypes: BrowserType[] = ['chromium', 'firefox', 'webkit'];
    const missingTypes =
        needTypes.filter(t => !installedFiles.some(f => f.startsWith(`${t}-`)));
    if (missingTypes.length === 0) {
      console.log('\nInstalled browsers:', installedFiles);
      console.log('\n✅ Browser setup completed successfully!');
      return;
    }

    // 7. Copy missing browsers from Playwright cache (ms-playwright) into
    // destination
    console.log('\nCopying missing browser files...');
    const sourceFiles = readdirSync(sourcePath);
    for (const browserType of missingTypes) {
      const srcDir = sourceFiles.find(f => f.startsWith(`${browserType}-`));
      if (!srcDir) continue;
      const sourceFull = join(sourcePath, srcDir);
      const destFull = join(browsersPath, srcDir);
      if (!existsSync(destFull)) {
        console.log(`Copying ${srcDir}...`);
        cpSync(sourceFull, destFull, {recursive: true});
      }
    }

    // 8. Verify again; if still missing, install missing into destination (skip
    // GC so it won't delete others)
    console.log('\nVerifying installation...');
    const installedFilesAfterCopy = readdirSync(browsersPath);
    console.log('Installed browsers:', installedFilesAfterCopy);
    const stillMissing = needTypes.filter(
        t => !installedFilesAfterCopy.some(f => f.startsWith(`${t}-`)));
    for (const browserType of stillMissing) {
      console.log(`\nBrowser ${browserType} not found, installing...`);
      await installBrowser(browserType);
    }

    // 10. Final verification for Linux
    if (platform() === 'linux') {
      verifyLinuxDependencies();
    }

    console.log('\n✅ Browser setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during browser setup:', error);
    process.exit(1);
  }
}

export async function installBrowser(browserType: BrowserType) {
  try {
    console.log(`Installing ${browserType}...`);
    const browsersPath = join(__dirname, '..', 'browsers');

    // Set the browsers path for Playwright
    const env = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      PLAYWRIGHT_SKIP_BROWSER_GC: '1',
    };

    execSync(
        `npx --yes playwright install ${browserType}`, {stdio: 'inherit', env});
  } catch (error) {
    console.error(`Failed to install ${browserType}:`, error);
  }
}

// Run the setup only when executed as a script (NOT when imported by the node
// at n8n startup)
if (typeof require !== 'undefined' && require.main === module) {
  console.log('Starting browser setup...\n');
  setupBrowsers().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}