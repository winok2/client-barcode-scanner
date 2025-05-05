import { NextRequest } from 'next/server';
import { prisma } from './prisma';

export interface User {
  id: string;
  role: string;
}

export async function getUserFromRequest(request: NextRequest) {
  // TODO: Implement proper authentication
  // For now, return a mock user
  return {
    id: '1',
    name: 'Admin User',
    role: 'admin',
  };
}

export function requireRole(user: User, requiredRole: string) {
  if (user.role !== requiredRole) {
    throw new Error(`User must have role ${requiredRole}`);
  }
} 