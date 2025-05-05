import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const searchParams = req.nextUrl.searchParams;
    const barcodeValue = searchParams.get('barcode');

    if (!barcodeValue) {
      return NextResponse.json(
        { error: 'Barcode value is required' },
        { status: 400 }
      );
    }

    // Find the card in inventory
    const card = await prisma.cardInventory.findUnique({
      where: { barcodeValue },
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

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

    if (card.status !== 'assigned') {
      return NextResponse.json(
        { error: 'Card is not assigned to a patient' },
        { status: 400 }
      );
    }

    // Decrypt the uniqueId to get patient information
    const patientId = decrypt(card.uniqueId);

    // TODO: Replace with actual patient data fetch from your patient registry
    // This is a mock response
    const patientData = {
      id: patientId,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      gender: 'Male',
      phone: '+1 234-567-8900',
      email: 'john.doe@example.com',
      address: '123 Main St, City, State 12345',
      photo: '/images/placeholder.jpg'
    };

    // Log the lookup in audit log
    await prisma.auditLog.create({
      data: {
        barcodeValue: card.barcodeValue,
        action: 'lookup',
        performedBy: user.id
      }
    });

    return NextResponse.json(patientData);
  } catch (error) {
    console.error('Error looking up patient:', error);
    return NextResponse.json(
      { error: 'Failed to lookup patient' },
      { status: 500 }
    );
  }
} 