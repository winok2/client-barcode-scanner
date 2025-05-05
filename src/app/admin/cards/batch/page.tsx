'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Card {
  id: string;
  barcodeValue: string;
  status: string;
  isActive: boolean;
  patient?: {
    name: string;
    id: string;
  } | null;
}

type OperationType = 'assign' | 'deactivate' | 'print';

interface AssignRequestBody {
  cardIds: string[];
  patientId: string;
}

interface DeactivateRequestBody {
  cardIds: string[];
  reason: string;
}

interface PrintRequestBody {
  cardIds: string[];
}

export default function BatchOperationsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [operation, setOperation] = useState<OperationType>('assign');
  const [patientId, setPatientId] = useState('');
  const [deactivationReason, setDeactivationReason] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards/inventory');
      if (!response.ok) throw new Error('Failed to fetch cards');
      const data = await response.json();
      setCards(data.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      let body: AssignRequestBody | DeactivateRequestBody | PrintRequestBody;

      switch (operation) {
        case 'assign':
          endpoint = '/api/cards/batch/assign';
          body = { cardIds: selectedCards, patientId };
          break;
        case 'deactivate':
          endpoint = '/api/cards/batch/deactivate';
          body = { cardIds: selectedCards, reason: deactivationReason };
          break;
        case 'print':
          endpoint = '/api/cards/print';
          body = { cardIds: selectedCards };
          break;
        default:
          throw new Error('Invalid operation');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Operation failed');
      }

      router.push('/admin/cards/inventory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Batch Operations</h1>
      
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block mb-2">Operation:</label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as OperationType)}
          className="w-full p-2 border rounded"
        >
          <option value="assign">Assign Cards</option>
          <option value="deactivate">Deactivate Cards</option>
          <option value="print">Print Cards</option>
        </select>
      </div>

      {operation === 'assign' && (
        <div className="mb-6">
          <label className="block mb-2">Patient ID:</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter patient ID"
          />
        </div>
      )}

      {operation === 'deactivate' && (
        <div className="mb-6">
          <label className="block mb-2">Deactivation Reason:</label>
          <input
            type="text"
            value={deactivationReason}
            onChange={(e) => setDeactivationReason(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter reason for deactivation"
          />
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Select</th>
                <th className="p-2 border">Barcode</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Patient</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="p-2 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes(card.id)}
                      onChange={() => handleCardSelect(card.id)}
                    />
                  </td>
                  <td className="p-2 border">{card.barcodeValue}</td>
                  <td className="p-2 border">{card.status}</td>
                  <td className="p-2 border">
                    {card.patient?.name || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selectedCards.length === 0}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Submit'}
      </button>
    </div>
  );
} 