import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface Card {
  barcodeValue: string;
  uniqueId: string;
  status: string;
  assignedToPatientId: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { barcodeValue, patientId } = await request.json();

    if (!barcodeValue || !patientId) {
      return NextResponse.json(
        { error: 'Barcode value and Patient ID are required' },
        { status: 400 }
      );
    }

    // Get the card
    const card = await prisma.cardInventory.findUnique({
      where: { barcodeValue },
    }) as Card | null;

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    if (card.status === 'inactive') {
      return NextResponse.json(
        { error: 'Card is inactive' },
        { status: 400 }
      );
    }

    // Update the card
    await prisma.cardInventory.update({
      where: { barcodeValue },
      data: {
        status: 'assigned',
        assignedToPatientId: patientId,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        barcodeValue: card.barcodeValue,
        action: 'assigned',
        performedBy: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 