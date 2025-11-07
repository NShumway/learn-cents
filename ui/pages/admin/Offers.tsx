/**
 * Admin Offers List Page
 *
 * Displays all partner offers with summaries
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAccessToken } from '../../lib/auth';

interface PartnerOffer {
  id: string;
  offerName: string;
  offerPitch: string;
  targetedPersonas: string[];
  priorityPerPersona: Record<string, number>;
  activeDateStart: string;
  activeDateEnd: string | null;
  createdAt: string;
}

export default function AdminOffers() {
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Unauthorized');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/offers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch offers');
        }

        const data = await response.json();
        setOffers(data.offers || []);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  function isOfferActive(offer: PartnerOffer): boolean {
    const now = new Date();
    const start = new Date(offer.activeDateStart);
    const end = offer.activeDateEnd ? new Date(offer.activeDateEnd) : null;

    return start <= now && (!end || end >= now);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="animate-pulse">Loading offers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex gap-4 mb-6">
          <Link
            to="/admin"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Users
          </Link>
          <Link
            to="/admin/offers"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Partner Offers
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Partner Offers</h1>
            <p className="text-gray-600">Manage partner offer catalog</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Use CLI to create/edit offers:</p>
            <code className="block mt-1 bg-gray-100 px-2 py-1 rounded text-xs">
              npm run offers:create &lt;file&gt; --confirm
            </code>
          </div>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No partner offers found</p>
          <p className="text-sm text-gray-500">
            Create offers using: <code>npm run offers:create &lt;file&gt; --confirm</code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const active = isOfferActive(offer);
            return (
              <Link
                key={offer.id}
                to={`/admin/offers/${offer.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{offer.offerName}</h2>
                    {active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">ID: {offer.id.substring(0, 8)}...</span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{offer.offerPitch}</p>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Personas:</span>{' '}
                    {offer.targetedPersonas.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Active:</span>{' '}
                    {new Date(offer.activeDateStart).toLocaleDateString()} -{' '}
                    {offer.activeDateEnd
                      ? new Date(offer.activeDateEnd).toLocaleDateString()
                      : 'No end date'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
