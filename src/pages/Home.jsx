import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          🏹 Archery Recorder System
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Professional scoring and verification platform
        </p>
        
        <div className="flex gap-6 justify-center">
          {/* Archer Login Card */}
          <Link to="/login/archer">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer w-64">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Archer</h2>
              <p className="text-gray-600 mb-4">
                Enter your scores and view results
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Login as Archer
              </button>
            </div>
          </Link>

          {/* Recorder Login Card */}
          <Link to="/login/recorder">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer w-64">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Recorder</h2>
              <p className="text-gray-600 mb-4">
                Verify and confirm archer scores
              </p>
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Login as Recorder
              </button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;