import { POST } from '@/app/api/cards/import/route'
import { prisma } from '@/lib/prisma'

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    batch: {
      create: jest.fn(),
    },
    cardInventory: {
      createMany: jest.fn(),
    },
    auditLog: {
      createMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn().mockResolvedValue({
    id: 'user-123',
    role: 'CardAdmin',
  }),
  requireRole: jest.fn(),
}))

describe('POST /api/cards/import', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should import cards from CSV and create batch', async () => {
    // Mock request
    const formData = new FormData()
    formData.append('file', new File(['barcodeValue,uniqueId\n123,456'], 'cards.csv'))
    formData.append('vendor', 'Test Vendor')

    const request = {
      formData: () => Promise.resolve(formData),
    } as any

    // Mock Prisma responses
    const mockBatch = { batchNumber: 'BATCH-123' }
    const mockCards = { count: 1 }
    const mockAuditLog = { count: 1 }

    ;(prisma.batch.create as jest.Mock).mockResolvedValue(mockBatch)
    ;(prisma.cardInventory.createMany as jest.Mock).mockResolvedValue(mockCards)
    ;(prisma.auditLog.createMany as jest.Mock).mockResolvedValue(mockAuditLog)

    // Call the route handler
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.batchNumber).toBe('BATCH-123')
    expect(data.cardsImported).toBe(1)

    // Verify Prisma calls
    expect(prisma.batch.create).toHaveBeenCalled()
    expect(prisma.cardInventory.createMany).toHaveBeenCalled()
    expect(prisma.auditLog.createMany).toHaveBeenCalled()
  })

  it('should handle missing file', async () => {
    const formData = new FormData()
    formData.append('vendor', 'Test Vendor')

    const request = {
      formData: () => Promise.resolve(formData),
    } as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
  })
}) 