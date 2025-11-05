import Card from '../components/ui/Card';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Learning Cents</h1>
      <p className="text-lg text-gray-600 mb-8">
        Personalized financial education based on your transaction data
      </p>
      <Card variant="highlighted">
        <p className="text-blue-800">
          Frontend setup complete. Assessment display and Plaid integration coming in Stories 9-11.
        </p>
      </Card>
    </div>
  );
}
