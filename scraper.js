const OCR_API_KEY = 'K86614421788957';
const fs = require('fs');
const path = require('path');

function getTodayDate() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2,'0')}-${String(t.getMonth()+1).padStart(2,'0')}-${t.getFullYear()}`;
}

// This function reads an image URL and extracts text
async function ocrImage(imageUrl) {
  try {
    console.log("Downloading image: " + imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Send to OCR API
    const formData = new URLSearchParams();
    formData.append("base64Image", "data:image/jpeg;base64," + base64);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: 'POST',
      headers: { 'apikey': OCR_API_KEY },
      body: formData
    });
    
    const data = await ocrRes.json();
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      return data.ParsedResults[0].ParsedText;
    }
  } catch (e) {
    console.error("OCR failed:", e.message);
  }
  return null;
}

// This function finds the winning number in the text
function extractNumber(text) {
  if (!text) return "PENDING";
  const match = text.match(/1[sst]+\s*[Pp]rize\s*([A-Za-z0-9]\s?[A-Za-z0-9]\s?[A-Z0-9]\s?\d\s?\d\s?\d\s?\d\s?\d)/i);
  if (match) {
    let num = match[1].replace(/\s+/g, '').toUpperCase();
    return num.substring(0,3) + " " + num.substring(3);
  }
  return "PENDING";
}

async function main() {
  const dateStr = getTodayDate();
  console.log("========================================");
  console.log("Fetching secret page for: " + dateStr);
  console.log("========================================");

  // 1. Knock on the secret door (getContent.php)
  const formBody = new URLSearchParams();
  formBody.append('id', dateStr);

  const pageRes = await fetch('https://www.nagalandlotteries.com/getContent.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString()
  });
  
  const html = await pageRes.text();
  
  // 2. Find all images hidden inside the HTML response
  const imgRegex = /src=["'](.*?\.(?:jpg|jpeg|png))["']/gi;
  let images = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    let url = match[1];
    // Fix relative URLs (e.g., /images/pic.jpg -> https://www.../images/pic.jpg)
    if (!url.startsWith('http')) {
      url = 'https://www.nagalandlotteries.com/' + url.replace(/^\//, '');
    }
    images.push(url);
  }

  console.log("Found " + images.length + " result images.");

  // 3. Read the images using OCR
  // Usually: Image 0 = 1PM, Image 1 = 6PM, Image 2 = 8PM
  let num1pm = "PENDING", num6pm = "PENDING", num8pm = "PENDING";

  if (images.length > 0) {
    console.log("Reading 1 PM image...");
    num1pm = extractNumber(await ocrImage(images[0]));
    console.log("1 PM Result: " + num1pm);
  }
  if (images.length > 1) {
    console.log("Reading 6 PM image...");
    num6pm = extractNumber(await ocrImage(images[1]));
    console.log("6 PM Result: " + num6pm);
  }
  if (images.length > 2) {
    console.log("Reading 8 PM image...");
    num8pm = extractNumber(await ocrImage(images[2]));
    console.log("8 PM Result: " + num8pm);
  }

  // 4. Save to database
  const results = {
    "1pm": { "number": num1pm, "date": dateStr },
    "6pm": { "number": num6pm, "date": dateStr },
    "8pm": { "number": num8pm, "date": dateStr }
  };

  fs.writeFileSync(path.join(__dirname, 'data', 'result.json'), JSON.stringify(results, null, 2));
  console.log("========================================");
  console.log("Saved to result.json!");
  console.log("========================================");
}

main();
