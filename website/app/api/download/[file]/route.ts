import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Map of download IDs to their actual file locations
// Priority: 1. /public/downloads/ or /public/  2. GitHub Releases redirect
const RELEASE_VERSION = 'v1.2.0';
const GITHUB_RELEASE_BASE = `https://github.com/Tarcoin/tarcoin/releases/download/${RELEASE_VERSION}`;

const FILE_MAP: Record<string, {
  filename: string;
  contentType: string;
  localPaths: string[];
  githubAsset?: string;
}> = {
  // Linux full package: tarcoind + tarcoin-cli + tarcoin-qt (GUI wallet)
  'tarcoin-linux-full.zip': {
    filename: 'tarcoin-linux-full.zip',
    contentType: 'application/zip',
    localPaths: [
      'public/downloads/tarcoin-linux-full.zip',
      'public/tarcoin-linux-full.zip',
    ],
    githubAsset: 'tarcoin-linux-full-v1.2.0.zip',
  },
  // Linux server-only package: tarcoind + tarcoin-cli (no GUI)
  'tarcoin-linux-daemon.zip': {
    filename: 'tarcoin-linux-daemon.zip',
    contentType: 'application/zip',
    localPaths: [
      'public/downloads/tarcoin-linux-daemon.zip',
      'public/tarcoin-linux-daemon.zip',
    ],
    githubAsset: 'tarcoin-linux-server-v1.2.0.zip',
  },
  // Windows wallet
  'tarcoin-wallet-win64.zip': {
    filename: 'tarcoin-wallet-win64.zip',
    contentType: 'application/zip',
    localPaths: [
      'public/downloads/tarcoin-wallet-win64.zip',
      'public/tarcoin-wallet-win64.zip',
    ],
    githubAsset: 'tarcoin-windows-wallet-v1.2.0.zip',
  },
  // macOS wallet
  'tarcoin-macos-app.zip': {
    filename: 'tarcoin-macos-app.zip',
    contentType: 'application/zip',
    localPaths: [
      'public/downloads/tarcoin-macos-app.zip',
      'public/tarcoin-macos-app.zip',
    ],
    githubAsset: 'tarcoin-macos-app.zip',
  },
  // Android mobile wallet (local file in /public/ or /public/downloads/)
  'tarcoin-wallet.apk': {
    filename: 'tarcoin-wallet.apk',
    contentType: 'application/vnd.android.package-archive',
    localPaths: [
      'public/tarcoin-wallet.apk',
      'public/downloads/tarcoin-wallet.apk',
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  const { file } = params;
  const entry = FILE_MAP[file];

  if (!entry) {
    return NextResponse.json({ error: 'Unknown download file' }, { status: 404 });
  }

  // Try local file paths first
  const projectRoot = process.cwd();
  for (const localPath of entry.localPaths) {
    const fullPath = path.resolve(projectRoot, localPath);
    // Security: ensure resolved path stays within projectRoot (prevent path traversal)
    if (!fullPath.startsWith(path.resolve(projectRoot))) continue;
    try {
      // Use open+read to avoid TOCTOU race condition (CodeQL #5)
      const fileBuffer = fs.readFileSync(fullPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': entry.contentType,
          'Content-Disposition': `attachment; filename="${entry.filename}"`,
          'Content-Length': String(fileBuffer.length),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // File does not exist or is not readable — try next path
      continue;
    }
  }

  // Fallback to GitHub if githubAsset exists
  if (entry.githubAsset) {
    const githubUrl = `${GITHUB_RELEASE_BASE}/${entry.githubAsset}`;
    return NextResponse.redirect(githubUrl, {
      status: 302,
      headers: {
        'X-Download-Source': 'github-releases',
      },
    });
  }

  return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
}
