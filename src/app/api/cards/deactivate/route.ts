import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { generateUniqueId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { barcodeValue, reason } = await request.json();

    if (!barcodeValue || !reason) {
      return NextResponse.json(
        { error: 'Barcode value and reason are required' },
        { status: 400 }
      );
    }

    // Find the existing card
    const existingCard = await prisma.cardInventory.findUnique({
      where: { barcodeValue },
      include: { patient: true },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    if (!existingCard.isActive) {
      return NextResponse.json(
        { error: 'Card is already deactivated' },
        { status: 400 }
      );
    }

    // Generate new unique ID for the replacement card
    const newUniqueId = generateUniqueId();

    // Create new card
    const newCard = await prisma.cardInventory.create({
      data: {
        barcodeValue: newUniqueId,
        uniqueId: newUniqueId,
        isActive: true,
        status: 'assigned',
        patientId: existingCard.patientId,
        assignedAt: new Date(),
        assignedBy: user.id,
      },
    });

    // Deactivate old card
    await prisma.cardInventory.update({
      where: { id: existingCard.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: user.id,
        deactivationReason: reason,
      },
    });

    // Create audit log entries
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'card_deactivated',
          entityType: 'card',
          entityId: existingCard.id,
          userId: user.id,
          details: {
            reason,
            oldBarcode: existingCard.barcodeValue,
            newBarcode: newCard.barcodeValue,
          },
        },
        {
          action: 'card_assigned',
          entityType: 'card',
          entityId: newCard.id,
          userId: user.id,
          details: {
            patientId: existingCard.patientId,
            reason: 'replacement',
          },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      newCardBarcode: newCard.barcodeValue,
    });
  } catch (error) {
    console.error('Error deactivating card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 