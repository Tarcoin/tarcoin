import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Map of download IDs to their actual file locations
// Priority: 1. /public/downloads/  2. GitHub Releases redirect
const RELEASE_VERSION = 'v1.0.0';
const GITHUB_RELEASE_BASE = `https://github.com/Tarcoin/tarcoin/releases/download/${RELEASE_VERSION}`;

const FILE_MAP: Record<string, {
  filename: string;
  contentType: string;
  localPaths: string[];
  githubAsset: string;
}> = {
  // Linux full package: tarcoind + tarcoin-cli + tarcoin-qt (GUI wallet)
  'tarcoin-linux-full.tar.gz': {
    filename: 'tarcoin-linux-full.tar.gz',
    contentType: 'application/gzip',
    localPaths: [
      'public/downloads/tarcoin-linux-full.tar.gz',
    ],
    githubAsset: 'tarcoin-linux-full.tar.gz',
  },
  // Linux server-only package: tarcoind + tarcoin-cli (no GUI)
  'tarcoin-linux-daemon.tar.gz': {
    filename: 'tarcoin-linux-daemon.tar.gz',
    contentType: 'application/gzip',
    localPaths: [
      'public/downloads/tarcoin-linux-daemon.tar.gz',
    ],
    githubAsset: 'tarcoin-linux-daemon.tar.gz',
  },
  // Windows wallet (future release)
  'tarcoin-wallet-win64.zip': {
    filename: 'tarcoin-wallet-win64.zip',
    contentType: 'application/zip',
    localPaths: [
      'public/downloads/tarcoin-wallet-win64.zip',
    ],
    githubAsset: 'tarcoin-wallet-win64.zip',
  },
  // macOS wallet (future release)
  'tarcoin-wallet-macos.dmg': {
    filename: 'tarcoin-wallet-macos.dmg',
    contentType: 'application/octet-stream',
    localPaths: [
      'public/downloads/tarcoin-wallet-macos.dmg',
    ],
    githubAsset: 'tarcoin-wallet-macos.dmg',
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
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
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
    }
  }

  // Fallback: redirect to GitHub Releases
  const githubUrl = `${GITHUB_RELEASE_BASE}/${entry.githubAsset}`;
  return NextResponse.redirect(githubUrl, {
    status: 302,
    headers: {
      'X-Download-Source': 'github-releases',
    },
  });
}
