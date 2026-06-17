const OCR_API_KEY = 'K86614421788957';
const fs = require('fs');
const path = require('path');

// STILL TESTING YESTERDAY
const dateStr = '16-06-2026'; 

async function ocrPdf(pdfUrl) {
  try {
    console.log("Downloading PDF: " + pdfUrl);
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.log("PDF not found at: " + pdfUrl);
      return null;
    }
    
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
    
    // X-RAY VISION: Print exactly what the OCR API said
    console.log("--- X-RAY VISION (OCR Response) ---");
    console.log(JSON.stringify(data).substring(0, 1200));
    console.log("--- END X-RAY VISION ---");

    if (data.ParsedResults && data.ParsedResults.length > 0) {
      return data.ParsedResults[0].ParsedText;
    } else {
      console.log("OCR Failed to parse text.");
    }
  } catch (e) {
    console.error("OCR Network Error:", e.message);
  }
  return null;
}

function extractNumber(text) {
  if (!text) return "PENDING";
  // Super loose regex to catch the number no matter what words are around it
  const match = text.match(/([A-Za-z]\s?[A-Za-z]\s?[A-Z0-9]\s?\d\s?\d\s?\d\s?\d\s?\d)/i);
  if (match) {
    let num = match[1].replace(/\s+/g, '').toUpperCase();
    return num.substring(0,3) + " " + num.substring(3);
  }
  return "PENDING";
}

async function main() {
  console.log("========================================");
  console.log("Fetching secret page for: " + dateStr);
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

  console.log("Found " + pdfFiles.length + " PDF files.");

  let num1pm = "PENDING", num6pm = "PENDING", num8pm = "PENDING";

  if (pdfFiles.length > 0) {
    console.log("Reading 1 PM PDF...");
    num1pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[0]));
    console.log(">>> 1 PM RESULT IS: " + num1pm);
  }
  if (pdfFiles.length > 1) {
    console.log("Reading 6 PM PDF...");
    num6pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[1]));
    console.log(">>> 6 PM RESULT IS: " + num6pm);
  }

  const results = {
    "1pm": { "number": num1pm, "date": dateStr },
    "6pm": { "number": num6pm, "date": dateStr },
    "8pm": { "number": "PENDING", "date": dateStr }
  };

  fs.writeFileSync(path.join(__dirname, 'data', 'result.json'), JSON.stringify(results, null, 2));
  console.log("========================================");
  console.log("Saved to result.json!");
  console.log("========================================");
}

main();
