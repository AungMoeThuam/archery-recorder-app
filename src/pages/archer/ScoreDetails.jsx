import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ArcherScoreDetails() {
  const { participationId } = useParams();
  const navigate = useNavigate();
  
  const [archer, setArcher] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [roundScores, setRoundScores] = useState([]);
  const [detailedArrows, setDetailedArrows] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const archerID = localStorage.getItem('archerID');
    const archerName = localStorage.getItem('archerName');
    
    if (!archerID) {
      navigate('/login/archer');
      return;
    }

    setArcher({ id: archerID, name: archerName });
    fetchScoreDetails();
  }, [navigate, participationId]);

  const fetchScoreDetails = async () => {
    try {
      const response = await fetch(`/api/archer/scores/${participationId}`);
      const data = await response.json();
      
      setCompetition(data.competition);
      setRoundScores(data.roundScores);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching score details:', error);
      setLoading(false);
    }
  };

  const fetchDetailedArrows = async (roundId) => {
    try {
      const response = await fetch(`/api/arrowStaging?participationID=${participationId}&roundID=${roundId}`);
      const data = await response.json();
      setDetailedArrows(data);
      setSelectedRound(roundId);
    } catch (error) {
      console.error('Error fetching detailed arrows:', error);
    }
  };

  const groupArrowsByEnd = (arrows) => {
    const ends = {};
    arrows.forEach(arrow => {
      if (!ends[arrow.endOrder]) {
        ends[arrow.endOrder] = [];
      }
      ends[arrow.endOrder].push(arrow);
    });
    return ends;
  };

  const getArrowValue = (score) => {
    if (score === 'X') return 10;
    if (score === 'M') return 0;
    return parseInt(score);
  };

  const getEndScore = (arrows) => {
    return arrows.reduce((sum, arrow) => sum + getArrowValue(arrow.arrowScore), 0);
  };

  const getEndXCount = (arrows) => {
    return arrows.filter(a => a.arrowScore === 'X').length;
  };

  const getEndTenCount = (arrows) => {
    return arrows.filter(a => a.arrowScore === '10' || a.arrowScore === 'X').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold text-gray-800">Score Details</h1>
          </div>
          <button
            onClick={() => navigate('/archer/dashboard')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Competition Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{competition?.title}</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-semibold text-gray-800">📍 {competition?.location}</p>
            </div>
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-semibold text-gray-800">
                📅 {new Date(competition?.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Archer</p>
              <p className="font-semibold text-gray-800">👤 {archer?.name}</p>
            </div>
          </div>
        </div>

        {/* Round Scores Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Round Scores</h3>
          
          <div className="space-y-4">
            {roundScores.map((round) => (
              <div
                key={round.roundScoreID}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{round.roundType}</h4>
                    <p className="text-gray-600">
                      {new Date(round.date).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      {round.stagingStatus === 'confirmed' ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          ✅ Verified by {round.recorderName}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          ⏳ Pending Verification
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {round.totalScore}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-yellow-600 font-semibold">
                        {round.totalX} X
                      </span>
                      <span className="text-green-600 font-semibold">
                        {round.totalTen} 10s
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => fetchDetailedArrows(round.roundID)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedRound === round.roundID ? 'Hide' : 'View'} Arrow Details
                </button>

                {/* Detailed Arrow Breakdown */}
                {selectedRound === round.roundID && detailedArrows.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <h5 className="font-bold text-gray-800 mb-4">Arrow-by-Arrow Breakdown</h5>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">End</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Arrows</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Score</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">X</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">10s</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupArrowsByEnd(detailedArrows)).map(([endNum, arrows]) => (
                            <tr key={endNum} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold">{endNum}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {arrows.sort((a, b) => a.arrowNumber - b.arrowNumber).map((arrow, idx) => (
                                    <span
                                      key={idx}
                                      className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm ${
                                        arrow.arrowScore === 'X'
                                          ? 'bg-yellow-200 text-yellow-800'
                                          : arrow.arrowScore === '10'
                                          ? 'bg-green-200 text-green-800'
                                          : arrow.arrowScore === 'M'
                                          ? 'bg-red-200 text-red-800'
                                          : 'bg-blue-200 text-blue-800'
                                      }`}
                                    >
                                      {arrow.arrowScore}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-lg">
                                {getEndScore(arrows)}
                              </td>
                              <td className="px-4 py-3 text-center text-yellow-600 font-semibold">
                                {getEndXCount(arrows)}
                              </td>
                              <td className="px-4 py-3 text-center text-green-600 font-semibold">
                                {getEndTenCount(arrows)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                          <tr>
                            <td className="px-4 py-3" colSpan="2">TOTAL</td>
                            <td className="px-4 py-3 text-center text-xl text-blue-600">
                              {round.totalScore}
                            </td>
                            <td className="px-4 py-3 text-center text-yellow-600">
                              {round.totalX}
                            </td>
                            <td className="px-4 py-3 text-center text-green-600">
                              {round.totalTen}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArcherScoreDetails;