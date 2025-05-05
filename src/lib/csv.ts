import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export function parseCSV(csvContent: string): any[] {
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
}

export function stringifyCSV(data: any[]): string {
  return stringify(data, {
    header: true
  });
} 