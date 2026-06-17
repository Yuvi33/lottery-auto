const OCR_API_KEY = 'PASTE_IT_HERE';
const fs = require('fs');
const path = require('path');
function getTodayDate() {
  const t = new Date();
  return `${String(t.getDate()).padStart(2,'0')}-${String(t.getMonth()+1).padStart(2,'0')}-${t.getFullYear()}`;
}
function getUrlDate(d) {
  const p = d.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}
async function scrapeSlot(slot) {
  const dateStr = getTodayDate();
  const urlDate = getUrlDate(dateStr);
  const pdfUrl = `http://www.nagalandlotteries.com/wp-content/uploads/${urlDate}/draw-${slot}-${dateStr}.pdf`;
  console.log(`[${slot}] Checking: ${pdfUrl}`);
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) return { number: "PENDING", date: dateStr };
    const arrayBuffer = await response.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString('base64');
    const formData = new URLSearchParams();
    formData.append("base64Image", "data:application/pdf;base64," + base64Pdf);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");
    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: 'POST',
      headers: { 'apikey': OCR_API_KEY },
      body: formData
    });
    const ocrData = await ocrResponse.json();
    if (ocrData.IsErroredOnProcessing) return { number: "PENDING", date: dateStr };
    const text = ocrData.ParsedResults[0].ParsedText;
    const match = text.match(/1[sst]+\s*[Pp]rize\s*([A-Za-z]\s?[A-Za-z]\s?\d{4,5})/i);
    if (match) {
      let num = match[1].replace(/\s+/g, '').toUpperCase();
      num = num.substring(0,3) + " " + num.substring(3);
      console.log(`[${slot}] WINNER: ${num}`);
      return { number: num, date: dateStr };
    }
    return { number: "PENDING", date: dateStr };
  } catch (e) {
    console.error(e);
    return { number: "PENDING", date: dateStr };
  }
}
async function main() {
  const results = {
    "1pm": await scrapeSlot("1pm"),
    "6pm": await scrapeSlot("6pm"),
    "8pm": await scrapeSlot("8pm")
  };
  fs.writeFileSync(path.join(__dirname, 'data', 'result.json'), JSON.stringify(results, null, 2));
  console.log("Done:", JSON.stringify(results));
}
main();
