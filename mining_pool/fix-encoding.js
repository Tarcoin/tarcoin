const fs = require('fs');
let content = fs.readFileSync('src/pool.js', 'utf8');
content = content.replace(/ÃƒÂ°Ã…Â¸Ã…Â½Ã¢â‚¬Â°/g, '🎉');
content = content.replace(/ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â°/g, '💰');
content = content.replace(/ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¸/g, '💸');
content = content.replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â /g, '- ');
content = content.replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, '-');
content = content.replace(/ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢/g, '->');
fs.writeFileSync('src/pool.js', content, 'utf8');
