import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build the where clause
    const where: any = {};
    if (status) where.status = status;
    if (isActive) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { barcodeValue: { contains: search } },
        { patient: { name: { contains: search } } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.cardInventory.count({ where });

    // Get paginated cards
    const cards = await prisma.cardInventory.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });

    // Format the response
    const formattedCards = cards.map(card => ({
      id: card.id,
      barcodeValue: card.barcodeValue,
      status: card.status,
      isActive: card.isActive,
      assignedAt: card.assignedAt,
      assignedTo: card.patient?.name || null,
      deactivatedAt: card.deactivatedAt,
      deactivationReason: card.deactivationReason,
    }));

    return NextResponse.json({
      cards: formattedCards,
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    });
  } catch (error) {
    console.error('Error fetching card inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 