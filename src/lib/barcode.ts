import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

export function generateBarcode(value: string): string {
  const canvas = createCanvas(200, 100);
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true
  });
  return canvas.toDataURL('image/png');
} 