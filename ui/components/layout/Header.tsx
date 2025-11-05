import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">Learning Cents</span>
          </Link>
          <nav>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Home
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
