const fs = require('fs');
const path = require('path');

// Read the fresh data just saved by the scraper
const resultPath = path.join(__dirname, 'data', 'result.json');
const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

// Use the date from the JSON file
const dateStr = resultData['1pm'].date;

function generateOldPage(dateStr, data) {
    return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lottery Sambad Result ${dateStr} - 1 PM, 6 PM, 8 PM</title>
<meta name="description" content="Lottery Sambad Result for ${dateStr}. Check 1 PM, 6 PM, and 8 PM winning numbers.">
<link rel="canonical" href="https://yourdomain.com/old/${dateStr}.html">
<style>body{font-family:system-ui;background:#f9fafb;padding:20px;text-align:center}.box{background:#fff;max-width:400px;margin:20px auto;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}.num{font-size:36px;font-weight:900;color:#15181d;margin:10px 0}.pending{color:#9ca3af;font-size:20px}.back{display:inline-block;margin-top:30px;color:#2563eb;text-decoration:none;font-weight:700;background:#fff;padding:10px 20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}</style>
</head>
<body>
<h2>Lottery Sambad Result: ${dateStr}</h2>
<div class="box"><b>1 PM</b><div class="num ${data['1pm'].number === 'PENDING' ? 'pending' : ''}">${data['1pm'].number}</div></div>
<div class="box"><b>6 PM</b><div class="num ${data['6pm'].number === 'PENDING' ? 'pending' : ''}">${data['6pm'].number}</div></div>
<div class="box"><b>8 PM</b><div class="num ${data['8pm'].number === 'PENDING' ? 'pending' : ''}">${data['8pm'].number}</div></div>
<a href="/" class="back">← Back to Today's Result</a>
</body>
</html>`;
}

// Create the 'old' folder if it doesn't exist
const oldDir = path.join(__dirname, 'old');
if (!fs.existsSync(oldDir)) fs.mkdirSync(oldDir);

// Save TODAY's page (it will overwrite itself as 6pm and 8pm results come in)
fs.writeFileSync(path.join(oldDir, `${dateStr}.html`), generateOldPage(dateStr, resultData));

console.log(`SEO Updated: /old/${dateStr}.html`);
