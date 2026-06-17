const OCR_API_KEY = 'K86614421788957';
const fs = require('fs');
const path = require('path');

// BACK TO AUTOMATIC DATE!
function getTodayDate() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2,'0')}-${String(t.getMonth()+1).padStart(2,'0')}-${t.getFullYear()}`;
}

async function ocrPdf(pdfUrl) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64Pdf = Buffer.from(buffer).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append("base64Image", "data:application/pdf;base64," + base64Pdf);
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

function extractNumber(text) {
  if (!text) return "PENDING";
  // THE MAGIC FIX: Look for Number-Number-Letter Space Number-Number-Number-Number-Number (e.g., 53H 25510)
  const match = text.match(/(\d{2}[A-Za-z]\s+\d{5})/);
  if (match) {
    // Clean up any weird spaces and make it uppercase
    let num = match[1].replace(/\s+/g, ' ').toUpperCase();
    return num;
  }
  return "PENDING";
}

async function main() {
  const dateStr = getTodayDate();
  console.log("========================================");
  console.log("Fetching results for: " + dateStr);
  console.log("========================================");

  const formBody = new URLSearchParams();
  formBody.append('id', dateStr);

  const pageRes = await fetch('https://www.nagalandlotteries.com/getContent.php', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.nagalandlotteries.com/results.php',
      'Cookie': 'PHPSESSID=test123'
    },
    body: formBody.toString()
  });
  
  const html = await pageRes.text();
  
  const pdfRegex = /data-id="(.*?\.pdf)"/gi;
  let pdfFiles = [];
  let match;
  while ((match = pdfRegex.exec(html)) !== null) {
    pdfFiles.push(match[1]);
  }

  console.log("Found " + pdfFiles.length + " PDFs.");

  let num1pm = "PENDING", num6pm = "PENDING", num8pm = "PENDING";

  if (pdfFiles.length > 0) {
    console.log("Scanning 1st PDF...");
    num1pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[0]));
    console.log("1st PDF Number: " + num1pm);
  }
  if (pdfFiles.length > 1) {
    console.log("Scanning 2nd PDF...");
    num6pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[1]));
    console.log("2nd PDF Number: " + num6pm);
  }
  if (pdfFiles.length > 2) {
    console.log("Scanning 3rd PDF...");
    num8pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[2]));
    console.log("3rd PDF Number: " + num8pm);
  }

  const results = {
    "1pm": { "number": num1pm, "date": dateStr },
    "6pm": { "number": num6pm, "date": dateStr },
    "8pm": { "number": num8pm, "date": dateStr }
  };

  fs.writeFileSync(path.join(__dirname, 'data', 'result.json'), JSON.stringify(results, null, 2));
  console.log("========================================");
  console.log("SUCCESS! Saved to database.");
  console.log("========================================");
}

main();
