import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function ArcherDashboard() {
  const [archer, setArcher] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const archerID = localStorage.getItem('archerID');
    const archerName = localStorage.getItem('archerName');
    
    if (!archerID) {
      navigate('/login/archer');
      return;
    }

    setArcher({ id: archerID, name: archerName });
    fetchCompetitions(archerID);
  }, [navigate]);

  const fetchCompetitions = async (archerID) => {
    try {
      const response = await fetch(`/api/archer/${archerID}/competitions`);
      const data = await response.json();
      setCompetitions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending Verification' },
      'confirmed': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Verified' },
      'not_started': { bg: 'bg-gray-100', text: 'text-gray-800', label: '📝 Not Started' }
    };
    const badge = badges[status] || badges['not_started'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold text-gray-800">Archer Portal</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {archer?.name}! 👋
          </h2>
          <p className="text-gray-600">
            View your competitions and manage your scores
          </p>
        </div>

        {/* Competitions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">My Competitions</h3>

          {competitions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏹</div>
              <p className="text-gray-600 text-lg">No competitions registered yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {competitions.map((comp) => (
                <div
                  key={comp.participationID}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">
                        {comp.competitionTitle}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 {comp.competitionLocation}</p>
                        <p>📅 {new Date(comp.competitionStartDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {getStatusBadge(comp.status)}
                  </div>

                  {/* Rounds */}
                  <div className="space-y-2 mb-4">
                    <h5 className="font-semibold text-gray-700">Rounds:</h5>
                    {comp.rounds && comp.rounds.map((round) => (
                      <div key={round.roundID} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{round.roundType}</span>
                            <span className="text-gray-600 ml-2">
                              • {new Date(round.date).toLocaleDateString()}
                            </span>
                          </div>
                          {round.totalScore !== null ? (
                            <div className="text-right">
                              <div className="font-bold text-blue-600 text-lg">
                                {round.totalScore}
                              </div>
                              <div className="text-xs text-gray-600">
                                {round.totalX} X • {round.totalTen} 10s
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No score yet</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {comp.status === 'not_started' && (
                      <Link
                        to={`/archer/score-entry/${comp.competitionID}/${comp.rounds[0]?.roundID}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enter Scores
                      </Link>
                    )}
                    {comp.status === 'pending' && (
                      <button
                        disabled
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        Waiting for Verification
                      </button>
                    )}
                    {(comp.status === 'confirmed' || comp.status === 'pending') && (
                      <Link
                        to={`/archer/scores/${comp.participationID}`}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArcherDashboard;