import type { Insight } from '../../types/assessment';
import EducationList from './EducationList';

interface InsightCardProps {
  insight: Insight;
  isPriority?: boolean;
}

/**
 * Convert URLs in text to clickable links
 * Sanitizes against XSS by only allowing http/https URLs
 */
function linkify(text: string): string {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlPattern, (url) => {
    // Remove trailing punctuation that's not part of the URL
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
    const punctuation = url.slice(cleanUrl.length);
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="underline hover:text-green-900 font-medium">${cleanUrl}</a>${punctuation}`;
  });
}

export default function InsightCard({ insight, isPriority = false }: InsightCardProps) {
  console.log('[InsightCard] Rendering:', {
    personaLabel: insight.personaLabel,
    hasPartnerOffer: !!insight.partnerOffer,
    partnerOffer: insight.partnerOffer,
  });

  return (
    <div
      className={`border rounded-lg p-6 ${
        isPriority ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      {isPriority && (
        <div className="text-xs font-semibold text-blue-600 uppercase mb-2">Priority Insight</div>
      )}

      <h2 className="text-2xl font-bold mb-4 text-gray-900">{insight.personaLabel}</h2>

      <div className="prose max-w-none mb-6">
        <p className="text-gray-700">{insight.renderedForUser}</p>
      </div>

      {/* Partner Offer (if available) */}
      {insight.partnerOffer && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-1">Recommended Offer</h3>
              <p
                className="text-sm text-green-800"
                dangerouslySetInnerHTML={{
                  __html: linkify(insight.partnerOffer.offerPitch),
                }}
              />
            </div>
          </div>
        </div>
      )}

      <EducationList items={insight.educationItems} />
    </div>
  );
}
