import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.cardTemplate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching card templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await request.json();

    // Validate template structure
    if (!template.name || !template.layout) {
      return NextResponse.json(
        { error: 'Invalid template structure' },
        { status: 400 }
      );
    }

    // Save template
    const savedTemplate = await prisma.cardTemplate.upsert({
      where: {
        id: template.id || '',
      },
      update: {
        name: template.name,
        layout: template.layout,
        updatedBy: user.id,
      },
      create: {
        name: template.name,
        layout: template.layout,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: template.id ? 'template_updated' : 'template_created',
        entityType: 'template',
        entityId: savedTemplate.id,
        userId: user.id,
        details: {
          templateName: template.name,
        },
      },
    });

    return NextResponse.json({ template: savedTemplate });
  } catch (error) {
    console.error('Error saving card template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 