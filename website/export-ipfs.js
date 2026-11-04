const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const apiDir = path.join(rootDir, 'app', 'api');
const outDir = path.join(rootDir, 'out');

// 1. Find dynamic route.ts files to temporarily rename
function findRouteFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findRouteFiles(fullPath, list);
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      list.push(fullPath);
    }
  }
  return list;
}

const routes = findRouteFiles(apiDir);
const renamed = [];

console.log(`[IPFS Export] Found ${routes.length} dynamic API route(s) to isolate during static export.`);

try {
  // Step 1: Temporarily rename dynamic API routes so Next.js static export succeeds
  for (const r of routes) {
    const bak = `${r}.bak`;
    fs.renameSync(r, bak);
    renamed.push({ original: r, bak });
    console.log(`  Renamed: ${path.relative(rootDir, r)} -> .bak`);
  }

  // Step 2: Run Next.js static build
  console.log('[IPFS Export] Running Next.js build with NEXT_PUBLIC_IPFS=true ...');
  execSync('node ./node_modules/next/dist/bin/next build --no-lint', {
    cwd: rootDir,
    env: { ...process.env, NEXT_PUBLIC_IPFS: 'true' },
    stdio: 'inherit',
  });
  console.log('[IPFS Export] Build completed successfully!');

  // Step 3: Post-process out/ to make all paths relative for IPFS gateways
  console.log('[IPFS Export] Post-processing HTML files in out/ for relative path resolution...');
  
  function getDepthPrefix(depth) {
    if (depth <= 0) return './';
    return '../'.repeat(depth);
  }

  // List of all internal pages in out
  const internalPages = [
    'explorer', 'mining', 'domains', 'wallet', 'api', 'whitepaper',
    'transparency', 'download', 'downloads', 'faq', 'faucet', 'network',
    'richlist', 'security', 'brand', 'legal', 'privacy', 'verify', 'you-need-to-know'
  ];

  function processHtmlFiles(dir, currentDepth = 0) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        processHtmlFiles(fullPath, currentDepth + 1);
      } else if (entry.name.endsWith('.html')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const prefix = getDepthPrefix(currentDepth);

        // Replace asset links
        content = content.replace(/href="\/_next\//g, `href="${prefix}_next/`);
        content = content.replace(/src="\/_next\//g, `src="${prefix}_next/`);
        
        // Replace static public asset links (images, icons)
        content = content.replace(/href="\/logo\.png"/g, `href="${prefix}logo.png"`);
        content = content.replace(/src="\/logo\.png"/g, `src="${prefix}logo.png"`);
        content = content.replace(/href="\/favicon\.png"/g, `href="${prefix}favicon.png"`);
        content = content.replace(/href="\/favicon\.ico"/g, `href="${prefix}favicon.ico"`);
        content = content.replace(/href="\/tarcoin-favicon/g, `href="${prefix}tarcoin-favicon`);
        content = content.replace(/src="\/tarcoin-logo/g, `src="${prefix}tarcoin-logo`);
        content = content.replace(/src="\/cryptojar_partnership\.png"/g, `src="${prefix}cryptojar_partnership.png"`);
        content = content.replace(/src="\/blockspot-icon\.png"/g, `src="${prefix}blockspot-icon.png"`);
        content = content.replace(/src="\/blockspot\.png"/g, `src="${prefix}blockspot.png"`);

        // Replace internal navigation links
        for (const p of internalPages) {
          const reg = new RegExp(`href="/${p}/"`, 'g');
          content = content.replace(reg, `href="${prefix}${p}/"`);
        }
        // Home link
        content = content.replace(/href="\/"/g, `href="${prefix}"`);

        // Replace Next.js internal script JSON paths
        content = content.replace(/\\"\/\_next\//g, `\\"${prefix}_next/`);
        content = content.replace(/"assetPrefix":""/g, `"assetPrefix":"${prefix === './' ? '.' : prefix.slice(0, -1)}"`);

        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }

  processHtmlFiles(outDir, 0);

  // Fix webpack publicPath in chunks
  const chunksDir = path.join(outDir, '_next', 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir);
    for (const file of chunkFiles) {
      if (file.startsWith('webpack-') && file.endsWith('.js')) {
        const fullPath = path.join(chunksDir, file);
        let code = fs.readFileSync(fullPath, 'utf8');
        if (code.includes('d.p="/_next/"')) {
          code = code.replace('d.p="/_next/"', 'd.p=""');
          fs.writeFileSync(fullPath, code, 'utf8');
          console.log(`  Patched webpack runtime: ${file}`);
        }
      }
    }
  }

  console.log('[IPFS Export] Successfully processed all static assets and internal routes for IPFS!');

} finally {
  // Always restore dynamic API routes
  if (renamed.length > 0) {
    console.log('[IPFS Export] Restoring dynamic API routes...');
    for (const item of renamed) {
      if (fs.existsSync(item.bak)) {
        fs.renameSync(item.bak, item.original);
        console.log(`  Restored: ${path.relative(rootDir, item.original)}`);
      }
    }
  }
}
