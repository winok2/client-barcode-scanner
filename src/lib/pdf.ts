import puppeteer from 'puppeteer';
import { generateBarcode } from './barcode';

export async function generatePDFsZip(cardIds: string[]): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set the page size to CR80 card size with bleed
  await page.setViewport({
    width: 324, // 3.375in * 96dpi
    height: 204, // 2.125in * 96dpi
    deviceScaleFactor: 2 // For better quality
  });

  const pdfBuffers = await Promise.all(
    cardIds.map(async (cardId) => {
      const barcodeDataUrl = generateBarcode(cardId);
      
      // Create HTML for the card
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page {
                size: 3.375in 2.125in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0.125in;
              }
              .card {
                width: 3.125in;
                height: 1.875in;
                border: 1px solid #000;
                position: relative;
              }
              .barcode {
                position: absolute;
                bottom: 0.125in;
                left: 50%;
                transform: translateX(-50%);
              }
            </style>
          </head>
          <body>
            <div class="card">
              <img class="barcode" src="${barcodeDataUrl}" alt="Barcode" />
            </div>
          </body>
        </html>
      `;

      await page.setContent(html);
      return await page.pdf({
        width: '3.375in',
        height: '2.125in',
        printBackground: true
      });
    })
  );

  await browser.close();

  // TODO: Create ZIP file with all PDFs
  // For now, return the first PDF
  return pdfBuffers[0];
} 