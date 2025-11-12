import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ArcherScoreEntry() {
  const { competitionId, roundId } = useParams();
  const navigate = useNavigate();
  
  const [archer, setArcher] = useState(null);
  const [round, setRound] = useState(null);
  const [currentEnd, setCurrentEnd] = useState(1);
  const [currentArrow, setCurrentArrow] = useState(1);
  const [arrows, setArrows] = useState([]);
  const [currentEndArrows, setCurrentEndArrows] = useState([]);
  const [arrowScore, setArrowScore] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [totalX, setTotalX] = useState(0);
  const [totalTen, setTotalTen] = useState(0);
  const [loading, setLoading] = useState(true);

  const arrowOptions = ['M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'X'];
  const arrowsPerEnd = 6;
  const totalEnds = 12; // Can be dynamic based on round type

  useEffect(() => {
    const archerID = localStorage.getItem('archerID');
    const archerName = localStorage.getItem('archerName');
    
    if (!archerID) {
      navigate('/login/archer');
      return;
    }

    setArcher({ id: archerID, name: archerName });
    fetchRoundDetails();
  }, [navigate]);

  const fetchRoundDetails = async () => {
    try {
      const response = await fetch(`/api/round/${roundId}`);
      const data = await response.json();
      setRound(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching round:', error);
      setLoading(false);
    }
  };

  const getArrowValue = (arrow) => {
    if (arrow === 'X') return 10;
    if (arrow === 'M') return 0;
    return parseInt(arrow);
  };

  const handleAddArrow = () => {
    if (!arrowScore) return;

    const newArrow = {
      score: arrowScore,
      arrowNumber: currentArrow,
      endNumber: currentEnd
    };

    setCurrentEndArrows([...currentEndArrows, newArrow]);
    
    // Update running totals
    const value = getArrowValue(arrowScore);
    setTotalScore(totalScore + value);
    if (arrowScore === 'X') {
      setTotalX(totalX + 1);
      setTotalTen(totalTen + 1);
    } else if (arrowScore === '10') {
      setTotalTen(totalTen + 1);
    }

    // Check if end is complete
    if (currentArrow === arrowsPerEnd) {
      // End complete, ready to submit
    } else {
      setCurrentArrow(currentArrow + 1);
    }

    setArrowScore('');
  };

  const handleSubmitEnd = async () => {
    if (currentEndArrows.length !== arrowsPerEnd) {
      alert(`Please enter all ${arrowsPerEnd} arrows for this end`);
      return;
    }

    try {
      const archerID = localStorage.getItem('archerID');
      
      // Get participationID
      const participationResponse = await fetch(
        `/api/participation?archerID=${archerID}&competitionID=${competitionId}`
      );
      const participationData = await participationResponse.json();
      const participationID = participationData.participationID;

      // Submit arrows to arrowStaging
      const promises = currentEndArrows.map((arrow, index) => {
        return fetch('/api/arrowStaging', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundID: roundId,
            participationID: participationID,
            recorderID: null, // Self-entry
            distance: round.distance,
            endOrder: currentEnd,
            arrowScore: arrow.score,
            stagingStatus: 'pending',
            isX: arrow.score === 'X' ? 1 : 0,
            date: new Date().toISOString()
          })
        });
      });

      await Promise.all(promises);

      // Add to main arrows array
      setArrows([...arrows, ...currentEndArrows]);
      
      // Reset for next end
      setCurrentEndArrows([]);
      setCurrentArrow(1);

      // Check if all ends complete
      if (currentEnd === totalEnds) {
        alert('All ends submitted! Waiting for recorder verification.');
        navigate('/archer/dashboard');
      } else {
        setCurrentEnd(currentEnd + 1);
        alert(`End ${currentEnd} submitted successfully!`);
      }

    } catch (error) {
      console.error('Error submitting end:', error);
      alert('Failed to submit end. Please try again.');
    }
  };

  const handleRemoveLastArrow = () => {
    if (currentEndArrows.length === 0) return;

    const lastArrow = currentEndArrows[currentEndArrows.length - 1];
    const value = getArrowValue(lastArrow.score);
    
    // Update totals
    setTotalScore(totalScore - value);
    if (lastArrow.score === 'X') {
      setTotalX(totalX - 1);
      setTotalTen(totalTen - 1);
    } else if (lastArrow.score === '10') {
      setTotalTen(totalTen - 1);
    }

    // Remove arrow
    setCurrentEndArrows(currentEndArrows.slice(0, -1));
    setCurrentArrow(currentArrow - 1);
  };

  const getEndScore = () => {
    return currentEndArrows.reduce((sum, arrow) => sum + getArrowValue(arrow.score), 0);
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
            <h1 className="text-2xl font-bold text-gray-800">Score Entry</h1>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Archer & Round Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Archer</p>
              <p className="text-xl font-bold text-gray-800">{archer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Round Type</p>
              <p className="text-xl font-bold text-gray-800">{round?.roundType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="text-xl font-bold text-gray-800">{round?.distance}m</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-xl font-bold text-gray-800">
                {new Date(round?.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              End {currentEnd} of {totalEnds}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${((currentEnd - 1) / totalEnds) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Score</p>
            <p className="text-4xl font-bold text-blue-600">{totalScore}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total X</p>
            <p className="text-4xl font-bold text-yellow-600">{totalX}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total 10s</p>
            <p className="text-4xl font-bold text-green-600">{totalTen}</p>
          </div>
        </div>

        {/* Current End Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Current End (End {currentEnd})
          </h3>
          
          <div className="flex gap-2 mb-4">
            {[...Array(arrowsPerEnd)].map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-16 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                  currentEndArrows[index]
                    ? currentEndArrows[index].score === 'X'
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                      : currentEndArrows[index].score === '10'
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : currentEndArrows[index].score === 'M'
                      ? 'bg-red-100 border-red-400 text-red-800'
                      : 'bg-blue-100 border-blue-400 text-blue-800'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {currentEndArrows[index]?.score || '—'}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Arrows: {currentEndArrows.length}/{arrowsPerEnd}</span>
            <span className="font-bold text-lg text-gray-800">
              End Score: {getEndScore()}
            </span>
          </div>
        </div>

        {/* Arrow Entry */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Enter Arrow #{currentArrow}
          </h3>

          <div className="grid grid-cols-6 gap-2 mb-6">
            {arrowOptions.map((option) => (
              <button
                key={option}
                onClick={() => setArrowScore(option)}
                className={`py-4 rounded-lg font-bold text-xl transition-all ${
                  arrowScore === option
                    ? option === 'X'
                      ? 'bg-yellow-500 text-white'
                      : option === '10'
                      ? 'bg-green-500 text-white'
                      : option === 'M'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddArrow}
              disabled={!arrowScore || currentEndArrows.length >= arrowsPerEnd}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Arrow
            </button>
            <button
              onClick={handleRemoveLastArrow}
              disabled={currentEndArrows.length === 0}
              className="px-6 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Remove Last
            </button>
          </div>

          {currentEndArrows.length === arrowsPerEnd && (
            <button
              onClick={handleSubmitEnd}
              className="w-full mt-4 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
            >
              Submit End {currentEnd} ✓
            </button>
          )}
        </div>

        {/* Completed Ends */}
        {arrows.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Completed Ends</h3>
            <div className="space-y-3">
              {Array.from({ length: currentEnd - 1 }, (_, i) => i + 1).map((endNum) => {
                const endArrows = arrows.filter(a => a.endNumber === endNum);
                const endScore = endArrows.reduce((sum, a) => sum + getArrowValue(a.score), 0);
                return (
                  <div key={endNum} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">End {endNum}</span>
                      <div className="flex gap-2">
                        {endArrows.map((arrow, idx) => (
                          <span
                            key={idx}
                            className={`w-10 h-10 rounded flex items-center justify-center font-bold ${
                              arrow.score === 'X'
                                ? 'bg-yellow-200 text-yellow-800'
                                : arrow.score === '10'
                                ? 'bg-green-200 text-green-800'
                                : arrow.score === 'M'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-blue-200 text-blue-800'
                            }`}
                          >
                            {arrow.score}
                          </span>
                        ))}
                      </div>
                      <span className="font-bold text-lg">{endScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArcherScoreEntry;