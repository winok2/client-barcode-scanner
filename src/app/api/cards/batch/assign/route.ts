import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RequestBody {
  cardIds: string[];
  patientId: string;
}

interface Card {
  id: string;
  barcodeValue: string;
  patientId: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardIds, patientId } = await request.json() as RequestBody;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'No cards selected for assignment' },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get the selected cards
    const cards = await prisma.cardInventory.findMany({
      where: {
        id: { in: cardIds },
        isActive: true,
        status: 'unassigned',
      },
    });

    if (cards.length !== cardIds.length) {
      return NextResponse.json(
        { error: 'Some selected cards are not available for assignment' },
        { status: 400 }
      );
    }

    // Update the cards
    await prisma.cardInventory.updateMany({
      where: {
        id: { in: cardIds },
      },
      data: {
        status: 'assigned',
        patientId,
        assignedAt: new Date(),
        assignedBy: user.id,
      },
    });

    // Create audit log entries
    await prisma.auditLog.createMany({
      data: cards.map((card: Card) => ({
        action: 'card_assigned',
        entityType: 'card',
        entityId: card.id,
        userId: user.id,
        details: {
          patientId,
        },
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 