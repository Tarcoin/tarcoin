/**
 * Tarcoin Name Service (TNS) Background Service Worker
 * Intercepts .tar domain navigation in Chrome & Brave and resolves on-chain IPFS sites.
 */

const RESOLVER_ENDPOINTS = [
  'https://tarcoin.org/api/tns/resolve',
  'https://pool.tarcoin.org/api/tns/resolve',
];
const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

// Protocol Genesis & Official Ecosystem routes
const PROTOCOL_ROUTES = {
  'tarcoin.tar': { ipfsCid: 'bafybeicwjnjylokyieqkyiksuqorop6emgouvtapma7ygo4ntfkzl2cfxi' },
  'explorer.tarcoin.tar': { redirectUrl: 'https://explorer.tarcoin.org' },
  'explorer.tar': { redirectUrl: 'https://explorer.tarcoin.org' },
  'pool.tarcoin.tar': { redirectUrl: 'https://pool.tarcoin.org' },
  'pool.tar': { redirectUrl: 'https://pool.tarcoin.org' },
  'wallet.tarcoin.tar': { redirectUrl: 'https://my-wallet.tarcoin.org' },
  'wallet.tar': { redirectUrl: 'https://my-wallet.tarcoin.org' },
  'api.tarcoin.tar': { redirectUrl: 'https://api.tarcoin.org/api/docs' },
  'api.tar': { redirectUrl: 'https://api.tarcoin.org/api/docs' },
};

// Helper to extract .tar domain from various navigation patterns
function extractTarDomain(urlStr) {
  try {
    const url = new URL(urlStr);

    // 1. Direct navigation: http://tarcoin.tar or https://something.tar
    const hostname = url.hostname.toLowerCase();
    if (hostname.endsWith('.tar')) {
      return hostname;
    }

    // 2. Search engine interception (when browser searches for xyz.tar)
    const searchEngines = ['google.', 'bing.', 'duckduckgo.', 'search.brave.com', 'yahoo.'];
    const isSearch = searchEngines.some(se => url.hostname.includes(se));
    if (isSearch) {
      const q = url.searchParams.get('q') || url.searchParams.get('p') || '';
      const cleanQ = q.trim().toLowerCase();
      if (/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.tar$/.test(cleanQ)) {
        return cleanQ;
      }
    }
  } catch (e) {
    // Not a valid URL
  }
  return null;
}

// Safely query resolver endpoints with fallback
async function resolveTnsDomain(domain) {
  const safeDomain = encodeURIComponent(domain);
  for (const endpoint of RESOLVER_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/${safeDomain}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;

      const data = await response.json();
      if (data && typeof data === 'object') {
        return data;
      }
    } catch (e) {
      // Continue to next resolver endpoint on failure
    }
  }
  return null;
}

// Intercept navigation before it fails with standard DNS error
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle top-level frame navigation
  if (details.frameId !== 0) return;

  const domain = extractTarDomain(details.url);
  if (!domain) return;

  try {
    const data = await resolveTnsDomain(domain);

    const protoRoute = PROTOCOL_ROUTES[domain];
    const ipfsCid = (data && data.ipfsCid) || protoRoute?.ipfsCid;

    if (ipfsCid) {
      // Domain has a decentralized IPFS website
      const targetUrl = `${IPFS_GATEWAY}/${ipfsCid}/`;
      chrome.tabs.update(details.tabId, { url: targetUrl });
      return;
    }

    if (protoRoute && protoRoute.redirectUrl) {
      chrome.tabs.update(details.tabId, { url: protoRoute.redirectUrl });
      return;
    }

    if (data && data.success && (data.targetAddress || data.owner)) {
      // Domain is a verified wallet address without a website
      const addr = data.targetAddress || data.owner;
      const walletViewerUrl = chrome.runtime.getURL(
        `wallet.html?name=${encodeURIComponent(domain)}&addr=${encodeURIComponent(addr)}`
      );
      chrome.tabs.update(details.tabId, { url: walletViewerUrl });
      return;
    }

    // Domain not registered yet or unresolved -> show 1-click register landing
    const notFoundUrl = chrome.runtime.getURL(`notfound.html?name=${encodeURIComponent(domain)}`);
    chrome.tabs.update(details.tabId, { url: notFoundUrl });
  } catch (err) {
    console.warn('[TNS Extension] Fallback redirect on error:', err);
    const notFoundUrl = chrome.runtime.getURL(`notfound.html?name=${encodeURIComponent(domain)}`);
    chrome.tabs.update(details.tabId, { url: notFoundUrl });
  }
});
