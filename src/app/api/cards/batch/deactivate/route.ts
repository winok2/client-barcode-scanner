import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface RequestBody {
  cardIds: string[];
  reason: string;
}

interface Card {
  id: string;
  barcodeValue: string;
  patientId: string | null;
}

interface ReplacementCard {
  id: string;
  originalId: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardIds, reason } = await request.json() as RequestBody;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'No cards selected for deactivation' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Deactivation reason is required' },
        { status: 400 }
      );
    }

    // Get the selected cards
    const cards = await prisma.cardInventory.findMany({
      where: {
        id: { in: cardIds },
        isActive: true,
      },
    });

    if (cards.length !== cardIds.length) {
      return NextResponse.json(
        { error: 'Some selected cards are not available for deactivation' },
        { status: 400 }
      );
    }

    // Generate unique IDs for replacement cards
    const replacementCardIds = cards.map((card: Card, index: number) => ({
      id: `REPL-${card.id}-${index}`,
      originalId: card.id,
    }));

    // Update the original cards to inactive
    await prisma.cardInventory.updateMany({
      where: {
        id: { in: cardIds },
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason,
      },
    });

    // Create replacement cards
    await prisma.cardInventory.createMany({
      data: replacementCardIds.map(({ id, originalId }: ReplacementCard) => ({
        id,
        barcodeValue: `REPL-${cards.find((c: Card) => c.id === originalId)?.barcodeValue}`,
        status: 'active',
        isActive: true,
        patientId: cards.find((c: Card) => c.id === originalId)?.patientId,
      })),
    });

    // Create audit log entries for deactivated cards
    await prisma.auditLog.createMany({
      data: cards.map((card: Card) => ({
        action: 'card_deactivated',
        entityType: 'card',
        entityId: card.id,
        userId: user.id,
        details: {
          reason,
          replacementCardId: replacementCardIds.find((r: ReplacementCard) => r.originalId === card.id)?.id,
        },
      })),
    });

    // Create audit log entries for replacement cards
    await prisma.auditLog.createMany({
      data: replacementCardIds.map(({ id, originalId }: ReplacementCard) => ({
        action: 'card_created',
        entityType: 'card',
        entityId: id,
        userId: user.id,
        details: {
          originalCardId: originalId,
          reason: `Replacement for deactivated card: ${reason}`,
        },
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 