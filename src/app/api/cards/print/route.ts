import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RequestBody {
  cardIds: string[];
}

interface Card {
  id: string;
  barcodeValue: string;
  patientId: string | null;
  assignedAt: Date | null;
  patient?: {
    name: string;
    id: string;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardIds } = await request.json() as RequestBody;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'No cards selected for printing' },
        { status: 400 }
      );
    }

    // Get the selected cards
    const cards = await prisma.cardInventory.findMany({
      where: {
        id: { in: cardIds },
        isActive: true,
        status: 'assigned',
      },
      include: {
        patient: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (cards.length !== cardIds.length) {
      return NextResponse.json(
        { error: 'Some selected cards are not available for printing' },
        { status: 400 }
      );
    }

    // Format cards for printing
    const cardsToPrint = cards.map((card: Card) => ({
      barcodeValue: card.barcodeValue,
      patientName: card.patient?.name || 'Unknown',
      patientId: card.patient?.id || 'Unknown',
      issueDate: card.assignedAt,
      expiryDate: new Date(card.assignedAt!.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from issue
    }));

    // TODO: Implement actual printing logic here
    // This would involve:
    // 1. Generating PDF with card layouts
    // 2. Sending to printer
    // 3. Handling printer errors
    // For now, we'll just log the print job
    console.log('Print job:', {
      cards: cardsToPrint,
      printedBy: user.id,
      timestamp: new Date(),
    });

    // Create audit log entries
    await prisma.auditLog.createMany({
      data: cards.map((card: Card) => ({
        action: 'card_printed',
        entityType: 'card',
        entityId: card.id,
        userId: user.id,
        details: {
          patientId: card.patientId,
        },
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error printing cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 