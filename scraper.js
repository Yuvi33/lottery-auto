const OCR_API_KEY = 'K86614421788957';
const fs = require('fs');
const path = require('path');

// STILL TESTING YESTERDAY TO PROVE IT WORKS
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
    
    // Send PDF to OCR
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
  const match = text.match(/1[sst]+\s*[Pp]rize\s*([A-Za-z0-9]\s?[A-Za-z0-9]\s?[A-Z0-9]\s?\d\s?\d\s?\d\s?\d\s?\d)/i);
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
      'Referer': 'https://www.nagalandlotteries.com/results.php'
    },
    body: formBody.toString()
  });
  
  const html = await pageRes.text();
  
  // FIND THE PDF FILENAMES (e.g., MN160626.PDF)
  const pdfRegex = /data-id="(.*?\.PDF)"/gi;
  let pdfFiles = [];
  let match;
  while ((match = pdfRegex.exec(html)) !== null) {
    pdfFiles.push(match[1]);
  }

  console.log("Found " + pdfFiles.length + " PDF files: " + JSON.stringify(pdfFiles));

  let num1pm = "PENDING", num6pm = "PENDING", num8pm = "PENDING";

  // Read the PDFs in order (1st is usually 1pm, 2nd is 6pm, 3rd is 8pm)
  if (pdfFiles.length > 0) {
    console.log("Reading 1 PM PDF...");
    num1pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[0]));
    console.log("1 PM Result: " + num1pm);
  }
  if (pdfFiles.length > 1) {
    console.log("Reading 6 PM PDF...");
    num6pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[1]));
    console.log("6 PM Result: " + num6pm);
  }
  if (pdfFiles.length > 2) {
    console.log("Reading 8 PM PDF...");
    num8pm = extractNumber(await ocrPdf('https://www.nagalandlotteries.com/old_results/' + pdfFiles[2]));
    console.log("8 PM Result: " + num8pm);
  }

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
