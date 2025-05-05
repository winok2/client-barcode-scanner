import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    requireRole(user, 'CardAdmin');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const csvContent = await file.text();
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Generate batch number
    const batchNumber = `BATCH-${Date.now()}`;
    
    // Create batch record
    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        vendor: formData.get('vendor') as string,
        quantity: records.length,
        importDate: new Date(),
      }
    });

    // Create card inventory records
    const cards = await prisma.cardInventory.createMany({
      data: records.map((record: any) => ({
        barcodeValue: record.barcodeValue,
        uniqueId: record.uniqueId,
        batchNumber: batch.batchNumber,
        status: 'available',
        receivedDate: new Date(),
      }))
    });

    // Create audit log entries
    await prisma.auditLog.createMany({
      data: records.map((record: any) => ({
        barcodeValue: record.barcodeValue,
        action: 'imported',
        performedBy: user.id,
      }))
    });

    return NextResponse.json({
      success: true,
      batchNumber: batch.batchNumber,
      cardsImported: cards.count
    });

  } catch (error) {
    console.error('Error importing cards:', error);
    return NextResponse.json(
      { error: 'Failed to import cards' },
      { status: 500 }
    );
  }
} 