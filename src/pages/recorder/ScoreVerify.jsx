import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function RecorderScoreVerify() {
  const { participationId, roundId } = useParams();
  const navigate = useNavigate();
  
  const [archer, setArcher] = useState(null);
  const [round, setRound] = useState(null);
  const [arrows, setArrows] = useState([]);
  const [editingEnd, setEditingEnd] = useState(null);
  const [editedArrows, setEditedArrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const arrowOptions = ['M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'X'];

  useEffect(() => {
    const recorderID = localStorage.getItem('recorderID');
    
    if (!recorderID) {
      navigate('/login/recorder');
      return;
    }

    fetchScoreData();
  }, [navigate, participationId, roundId]);

  const fetchScoreData = async () => {
    try {
      // Fetch archer and round details with arrows
      const response = await fetch(`/api/recorder/verify/${participationId}/${roundId}`);
      const data = await response.json();
      
      setArcher(data.archer);
      setRound(data.round);
      setArrows(data.arrows);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching score data:', error);
      setLoading(false);
    }
  };

  const groupArrowsByEnd = () => {
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

  const getEndScore = (endArrows) => {
    return endArrows.reduce((sum, arrow) => sum + getArrowValue(arrow.arrowScore), 0);
  };

  const getEndXCount = (endArrows) => {
    return endArrows.filter(a => a.arrowScore === 'X').length;
  };

  const getEndTenCount = (endArrows) => {
    return endArrows.filter(a => a.arrowScore === '10' || a.arrowScore === 'X').length;
  };

  const getTotalScore = () => {
    return arrows.reduce((sum, arrow) => sum + getArrowValue(arrow.arrowScore), 0);
  };

  const getTotalX = () => {
    return arrows.filter(a => a.arrowScore === 'X').length;
  };

  const getTotalTen = () => {
    return arrows.filter(a => a.arrowScore === '10' || a.arrowScore === 'X').length;
  };

  const handleEditEnd = (endNum, endArrows) => {
    setEditingEnd(endNum);
    setEditedArrows([...endArrows]);
  };

  const handleArrowChange = (index, newScore) => {
    const updated = [...editedArrows];
    updated[index] = { ...updated[index], arrowScore: newScore };
    setEditedArrows(updated);
  };

  const handleSaveEdit = () => {
    // Update main arrows array with edited arrows
    const updatedArrows = arrows.map(arrow => {
      const edited = editedArrows.find(
        ea => ea.arrowStagingID === arrow.arrowStagingID
      );
      return edited || arrow;
    });
    
    setArrows(updatedArrows);
    setEditingEnd(null);
    setEditedArrows([]);
  };

  const handleCancelEdit = () => {
    setEditingEnd(null);
    setEditedArrows([]);
  };

  const handleConfirmAll = async () => {
    if (!confirm('Are you sure you want to confirm all scores? This action cannot be undone.')) {
      return;
    }

    setConfirming(true);

    try {
      const recorderID = localStorage.getItem('recorderID');
      
      // Update all arrow staging records
      const updatePromises = arrows.map(arrow => {
        return fetch(`/api/arrowStaging/${arrow.arrowStagingID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stagingStatus: 'confirmed',
            recorderID: recorderID,
            arrowScore: arrow.arrowScore
          })
        });
      });

      await Promise.all(updatePromises);

      // Insert/Update roundScore
      const totalScore = getTotalScore();
      const totalX = getTotalX();
      const totalTen = getTotalTen();

      await fetch('/api/roundScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participationID: participationId,
          roundID: roundId,
          totalScore: totalScore,
          totalX: totalX,
          totalTen: totalTen,
          dateRecorded: new Date().toISOString()
        })
      });

      alert('Scores confirmed successfully!');
      navigate(`/recorder/pending/${round.competitionID}/${roundId}`);

    } catch (error) {
      console.error('Error confirming scores:', error);
      alert('Failed to confirm scores. Please try again.');
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject these scores? The archer will need to re-enter them.')) {
      return;
    }

    try {
      // Delete all arrow staging records for this participation/round
      await fetch(`/api/arrowStaging/reject`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participationID: participationId,
          roundID: roundId
        })
      });

      alert('Scores rejected. Archer will be notified to re-enter.');
      navigate(`/recorder/pending/${round.competitionID}/${roundId}`);

    } catch (error) {
      console.error('Error rejecting scores:', error);
      alert('Failed to reject scores. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const groupedEnds = groupArrowsByEnd();

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <h1 className="text-2xl font-bold text-gray-800">Verify & Confirm Scores</h1>
          </div>
          <button
            onClick={() => navigate(`/recorder/pending/${round.competitionID}/${roundId}`)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Pending
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Archer & Round Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {archer?.archerFirstName} {archer?.archerLastName}
              </h2>
              <div className="space-y-1 text-gray-600">
                <p>👤 {archer?.archerGender} • {archer?.archerNationality}</p>
                <p>📧 {archer?.archerEmail}</p>
                <p>📅 DOB: {new Date(archer?.archerDateOfBirth).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{round?.roundType}</h3>
              <div className="space-y-1 text-gray-600">
                <p>📍 Distance: {round?.distance}m</p>
                <p>📅 Date: {new Date(round?.date).toLocaleDateString()}</p>
                <p>🎯 Target: {round?.targetSize}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Score Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Score</p>
            <p className="text-5xl font-bold text-green-600">{getTotalScore()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total X</p>
            <p className="text-5xl font-bold text-yellow-600">{getTotalX()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total 10s</p>
            <p className="text-5xl font-bold text-blue-600">{getTotalTen()}</p>
          </div>
        </div>

        {/* Arrows by End */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Arrow-by-Arrow Review</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">End</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Arrows</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Score</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">X/10s</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedEnds).map(([endNum, endArrows]) => (
                  <tr key={endNum} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-bold text-lg">{endNum}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {endArrows.sort((a, b) => a.arrowNumber - b.arrowNumber).map((arrow, idx) => (
                          <span
                            key={idx}
                            className={`w-12 h-12 rounded flex items-center justify-center font-bold ${
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
                    <td className="px-4 py-4 text-center font-bold text-xl">
                      {getEndScore(endArrows)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-yellow-600 font-semibold">{getEndXCount(endArrows)} X</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="text-green-600 font-semibold">{getEndTenCount(endArrows)} 10s</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleEditEnd(endNum, endArrows)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold text-lg">
                <tr>
                  <td className="px-4 py-4" colSpan="2">TOTAL</td>
                  <td className="px-4 py-4 text-center text-2xl text-green-600">
                    {getTotalScore()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-yellow-600">{getTotalX()} X</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span className="text-green-600">{getTotalTen()} 10s</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleConfirmAll}
            disabled={confirming}
            className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {confirming ? 'Confirming...' : '✓ Confirm All Scores'}
          </button>
          <button
            onClick={handleReject}
            disabled={confirming}
            className="px-8 bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ✗ Reject Scores
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Edit End {editingEnd}
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {editedArrows.sort((a, b) => a.arrowNumber - b.arrowNumber).map((arrow, index) => (
                <div key={index}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Arrow {arrow.arrowNumber}
                  </label>
                  <select
                    value={arrow.arrowScore}
                    onChange={(e) => handleArrowChange(index, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold text-center"
                  >
                    {arrowOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-8 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecorderScoreVerify;