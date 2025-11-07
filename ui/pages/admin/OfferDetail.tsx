/**
 * Admin Offer Detail Page
 *
 * Displays full details of a single partner offer
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAccessToken } from '../../lib/auth';

interface PartnerOffer {
  id: string;
  offerName: string;
  offerPitch: string;
  targetedPersonas: string[];
  priorityPerPersona: Record<string, number>;
  eligibilityReqs: Record<string, unknown>;
  activeDateStart: string;
  activeDateEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOfferDetail() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<PartnerOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffer() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setError('Unauthorized');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/offers?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch offer');
        }

        const data = await response.json();
        setOffer(data.offer);
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Failed to load offer');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchOffer();
    }
  }, [id]);

  function isOfferActive(): boolean {
    if (!offer) return false;
    const now = new Date();
    const start = new Date(offer.activeDateStart);
    const end = offer.activeDateEnd ? new Date(offer.activeDateEnd) : null;
    return start <= now && (!end || end >= now);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">Loading offer...</div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-red-600">{error || 'Offer not found'}</div>
        <Link to="/admin/offers" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Offers
        </Link>
      </div>
    );
  }

  const active = isOfferActive();

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/admin/offers" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Offers
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{offer.offerName}</h1>
            {active ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">ID: {offer.id}</p>
        </div>

        {/* Offer Pitch */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Offer Pitch</h2>
          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{offer.offerPitch}</p>
        </div>

        {/* Targeted Personas */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Targeted Personas</h2>
          <div className="flex flex-wrap gap-2">
            {offer.targetedPersonas.map((persona) => (
              <span
                key={persona}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {persona}
              </span>
            ))}
          </div>
        </div>

        {/* Priority Per Persona */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">
            Priority Per Persona
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-semibold text-gray-700">Persona</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Priority</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(offer.priorityPerPersona).map(([persona, priority]) => (
                  <tr key={persona} className="border-b border-gray-100">
                    <td className="py-2">{persona}</td>
                    <td className="py-2">
                      {priority}{' '}
                      <span className="text-gray-500 text-xs">
                        ({priority === 1 ? 'highest' : 'lower'})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Eligibility Requirements */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">
            Eligibility Requirements
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {Object.keys(offer.eligibilityReqs).length === 0 ? (
              <p className="text-sm text-gray-600">No specific requirements</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {Object.entries(offer.eligibilityReqs).map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <dt className="font-semibold text-gray-700 w-48">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
                    </dt>
                    <dd className="text-gray-900">{JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Active Dates */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Active Dates</h2>
          <div className="text-sm text-gray-900">
            <p>
              <span className="font-medium">Start:</span>{' '}
              {new Date(offer.activeDateStart).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <span className="font-medium">End:</span>{' '}
              {offer.activeDateEnd
                ? new Date(offer.activeDateEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'No end date'}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <span className="font-medium">Created:</span>{' '}
              {new Date(offer.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Last Updated:</span>{' '}
              {new Date(offer.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* CLI Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Edit This Offer</h3>
          <p className="text-xs text-blue-800 mb-2">Use the CLI to update or delete this offer:</p>
          <code className="block text-xs bg-white px-2 py-1 rounded mb-1">
            npm run offers:update {offer.id} &lt;file.json&gt; --confirm
          </code>
          <code className="block text-xs bg-white px-2 py-1 rounded">
            npm run offers:delete {offer.id} --confirm
          </code>
        </div>
      </div>
    </div>
  );
}
