document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('domain-input').value.trim().toLowerCase();
  if (!input) return;

  const domain = input.endsWith('.tar') ? input : `${input}.tar`;
  chrome.tabs.create({ url: `http://${domain}` });
});
