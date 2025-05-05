import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active and assigned cards
    const cards = await prisma.cardInventory.findMany({
      where: {
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
      orderBy: {
        assignedAt: 'desc',
      },
    });

    // Format the response
    const formattedCards = cards.map(card => ({
      id: card.id,
      barcodeValue: card.barcodeValue,
      patientName: card.patient?.name || 'Unknown',
      patientId: card.patient?.id || 'Unknown',
      issueDate: card.assignedAt,
      expiryDate: new Date(card.assignedAt!.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from issue
    }));

    return NextResponse.json({ cards: formattedCards });
  } catch (error) {
    console.error('Error fetching printable cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 