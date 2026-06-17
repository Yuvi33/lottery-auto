const fs = require('fs');
const path = require('path');

function generateOldPage(dateStr, data) {
    return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lottery Sambad Result ${dateStr} - 1 PM, 6 PM, 8 PM</title>
<meta name="description" content="Lottery Sambad Result for ${dateStr}. Check 1 PM, 6 PM, and 8 PM winning numbers.">
<style>body{font-family:system-ui;background:#f9fafb;padding:20px;text-align:center}.box{background:#fff;max-width:400px;margin:20px auto;padding:20px;border-radius:10px}.num{font-size:36px;font-weight:900;color:#dc2626;margin:10px 0}.back{display:inline-block;margin-top:20px;color:#2563eb;text-decoration:none;font-weight:700}</style>
</head>
<body>
<h2>Lottery Sambad Result: ${dateStr}</h2>
<div class="box"><b>1 PM</b><div class="num">${data['1pm'].number}</div></div>
<div class="box"><b>6 PM</b><div class="num">${data['6pm'].number}</div></div>
<div class="box"><b>8 PM</b><div class="num">${data['8pm'].number}</div></div>
<a href="/" class="back">← Back to Today's Result</a>
</body>
</html>`;
}

const resultPath = path.join(__dirname, 'data', 'result.json');
const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
const yesterday = new Date(Date.now() - 86400000);
const yDate = `${String(yesterday.getDate()).padStart(2,'0')}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${yesterday.getFullYear()}`;

const oldDir = path.join(__dirname, 'old');
if (!fs.existsSync(oldDir)) fs.mkdirSync(oldDir);
fs.writeFileSync(path.join(oldDir, `${yDate}.html`), generateOldPage(yDate, resultData));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://yourdomain.com/</loc><changefreq>always</changefreq><priority>1.0</priority></url>
  <url><loc>https://yourdomain.com/old/${yDate}.html</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
</urlset>`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);

console.log(`SEO Generated: /old/${yDate}.html and sitemap.xml`);
