import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function RecorderPendingScores() {
  const { competitionId, roundId } = useParams();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState(null);
  const [round, setRound] = useState(null);
  const [pendingArchers, setPendingArchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recorderID = localStorage.getItem('recorderID');
    
    if (!recorderID) {
      navigate('/login/recorder');
      return;
    }

    fetchPendingScores();
  }, [navigate, competitionId, roundId]);

  const fetchPendingScores = async () => {
    try {
      // Fetch competition details
      const compResponse = await fetch(`/api/competition/${competitionId}`);
      const compData = await compResponse.json();
      setCompetition(compData);

      // Fetch round details
      const roundResponse = await fetch(`/api/round/${roundId}`);
      const roundData = await roundResponse.json();
      setRound(roundData);

      // Fetch pending archers for this round
      const pendingResponse = await fetch(`/api/recorder/pending/${roundId}`);
      const pendingData = await pendingResponse.json();
      setPendingArchers(pendingData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending scores:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'complete') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
          ✓ Ready to Verify
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
          ⏳ In Progress
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <h1 className="text-2xl font-bold text-gray-800">Pending Scores</h1>
          </div>
          <button
            onClick={() => navigate('/recorder/dashboard')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Competition & Round Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{competition?.title}</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-semibold text-gray-800">📍 {competition?.location}</p>
            </div>
            <div>
              <p className="text-gray-600">Round Type</p>
              <p className="font-semibold text-gray-800">🎯 {round?.roundType}</p>
            </div>
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-semibold text-gray-800">
                📅 {new Date(round?.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Archers Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Archers with Pending Scores</h3>
            <span className="text-sm text-gray-600">
              {pendingArchers.filter(a => a.status === 'complete').length} ready to verify
            </span>
          </div>

          {pendingArchers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg">No pending scores for this round</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Archer Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Ends Completed</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingArchers.map((archer) => (
                    <tr key={archer.participationID} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {archer.archerFirstName} {archer.archerLastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {archer.archerGender} • {archer.archerNationality}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {archer.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-semibold">
                          {archer.endsCompleted}/{archer.totalEnds || 12}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(archer.endsCompleted / (archer.totalEnds || 12)) * 100}%`
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(archer.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {archer.status === 'complete' ? (
                          <Link
                            to={`/recorder/verify/${archer.participationID}/${roundId}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-block"
                          >
                            Verify Scores
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                          >
                            Not Ready
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-6 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">📘 Next Steps</h4>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Click "Verify Scores" for archers who have completed all ends</li>
            <li>• Review each arrow and make adjustments if necessary</li>
            <li>• Confirm the scores to finalize and save to the database</li>
            <li>• Archers will be able to see their verified scores immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RecorderPendingScores;