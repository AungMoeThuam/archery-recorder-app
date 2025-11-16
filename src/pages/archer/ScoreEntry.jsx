import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function ArcherScoreEntry() {
  const { competitionId, roundId } = useParams();
  const navigate = useNavigate();

  const [archer, setArcher] = useState(null);
  const [round, setRound] = useState(null);
  const [ranges, setRanges] = useState([]);
  const [scoresObj, setScoresObj] = useState(null); // New structure: { roundID, ranges: [...] }
  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [currentEnd, setCurrentEnd] = useState(1);
  const [currentArrow, setCurrentArrow] = useState(1);
  const [loading, setLoading] = useState(true);

  const arrowOptions = [
    "M",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "X",
  ];

  useEffect(() => {
    const archerID = localStorage.getItem("archerID");
    const archerName = localStorage.getItem("archerName");
    if (!archerID) {
      navigate("/login/archer");
      return;
    }
    setArcher({ id: archerID, name: archerName });
    fetchRoundDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  async function fetchRoundDetails() {
    try {
      setLoading(true);
      // const roundResp = await fetch(`/api/round/${roundId}`);
      // if (roundResp.ok) {
      //   const roundData = await roundResp.json();
      //   setRound(roundData);
      // }

      const rangesData = await api.getRoundRanges(roundId);
      const rangeList = rangesData.ranges || [];
      setRanges(rangeList);

      // Try to load existing data from localStorage
      const storageKey = `scores_round_${roundId}`;
      const savedData = localStorage.getItem(storageKey);

      let loadedScoresObj;

      if (savedData) {
        // Load from localStorage if exists
        loadedScoresObj = JSON.parse(savedData);
        setScoresObj(loadedScoresObj);
      } else {
        // Initialize new structure
        const newScoresObj = {
          roundID: parseInt(roundId),
          ranges: rangeList.map((range) => {
            const arrowsPerEnd = range.rangeTotalArrowsPerEnd || 3;
            const totalEnds = range.rangeTotalEnds || 1;

            return {
              distance: range.rangeDistance,
              target: range.rangeTargetSize,
              rangeID: range.rangeID,
              ends: Array.from({ length: totalEnds }, (_, i) => ({
                endOrder: i + 1,
                arrows: Array(arrowsPerEnd).fill(null),
              })),
            };
          }),
        };

        loadedScoresObj = newScoresObj;
        setScoresObj(newScoresObj);
      }

      if (rangeList.length > 0 && loadedScoresObj) {
        // Find the first incomplete range
        let firstIncompleteIndex = 0;
        for (let i = 0; i < loadedScoresObj.ranges.length; i++) {
          const rangeData = loadedScoresObj.ranges[i];
          let hasEmptyArrow = false;

          for (const end of rangeData.ends) {
            for (const arrow of end.arrows) {
              if (arrow === null || arrow === undefined) {
                hasEmptyArrow = true;
                break;
              }
            }
            if (hasEmptyArrow) break;
          }

          if (hasEmptyArrow) {
            firstIncompleteIndex = i;
            break;
          }
        }

        setCurrentRangeIndex(firstIncompleteIndex);
        setCurrentEnd(1);
        setCurrentArrow(1);
      }
    } catch (err) {
      console.error("Failed to load round/ranges", err);
    } finally {
      setLoading(false);
    }
  }

  const getArrowValue = (arrow) => {
    if (arrow === "X") return 10;
    if (arrow === "M") return 0;
    const n = parseInt(arrow, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const handleEnterScore = (score) => {
    if (!scoresObj || currentRangeIndex === null) return;

    // Deep clone the scores object
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const currentRangeData = updatedScores.ranges[currentRangeIndex];
    const currentEndData = currentRangeData.ends[currentEnd - 1];

    // Update the arrow score
    currentEndData.arrows[currentArrow - 1] = score;

    setScoresObj(updatedScores);

    // Save to localStorage
    const storageKey = `scores_round_${roundId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedScores));

    const currentRange = ranges[currentRangeIndex];
    const arrowsPerEnd = currentRange.rangeTotalArrowsPerEnd || 3;
    const totalEnds = currentRange.rangeTotalEnds || 1;

    // Check if this was the last arrow
    const isLastArrow =
      currentArrow === arrowsPerEnd && currentEnd === totalEnds;

    if (currentArrow < arrowsPerEnd) {
      setCurrentArrow((c) => c + 1);
    } else if (currentEnd < totalEnds) {
      setCurrentEnd((e) => e + 1);
      setCurrentArrow(1);
    }

    // If this was the last arrow, check if range is complete and log it
    if (isLastArrow) {
      // Use setTimeout to ensure state is updated
      setTimeout(() => {
        const complete = isRangeComplete(currentRangeIndex);
        if (complete) {
          const stats = getRangeStats(currentRangeIndex);
          console.log(`Range at ${currentRangeData.distance}m completed:`, {
            rangeData: updatedScores.ranges[currentRangeIndex],
            stats: stats,
          });
        }
      }, 100);
    }
  };

  const handleCellClick = (rangeIndex, endNum, arrowIdx) => {
    setCurrentRangeIndex(rangeIndex);
    setCurrentEnd(endNum);
    setCurrentArrow(arrowIdx + 1);
  };

  const getEndScore = (rangeIndex, endNum) => {
    if (!scoresObj) return 0;
    const arrows = scoresObj.ranges[rangeIndex]?.ends[endNum - 1]?.arrows || [];
    return arrows.reduce((s, a) => s + getArrowValue(a), 0);
  };

  const getRangeStats = (rangeIndex) => {
    if (!scoresObj)
      return { totalScore: 0, totalX: 0, totalTen: 0, totalNine: 0 };

    const rangeData = scoresObj.ranges[rangeIndex];
    if (!rangeData)
      return { totalScore: 0, totalX: 0, totalTen: 0, totalNine: 0 };

    let totalScore = 0,
      totalX = 0,
      totalTen = 0,
      totalNine = 0;

    rangeData.ends.forEach((end) => {
      end.arrows.forEach((val) => {
        if (!val) return;
        const v = getArrowValue(val);
        totalScore += v;
        if (val === "X") {
          totalX++;
          totalTen++;
        } else if (val === "10") {
          totalTen++;
        } else if (val === "9") {
          totalNine++;
        }
      });
    });

    return { totalScore, totalX, totalTen, totalNine };
  };

  const isRangeComplete = (rangeIndex) => {
    if (!scoresObj) return false;
    const rangeData = scoresObj.ranges[rangeIndex];
    if (!rangeData) return false;

    for (const end of rangeData.ends) {
      for (const arrow of end.arrows) {
        if (!arrow) {
          return false; // Found an empty arrow
        }
      }
    }
    return true; // All arrows filled
  };

  const handleSubmit = async () => {
    // Placeholder: persist staged arrows to backend (arrowStaging) per ERD.
    // Currently just logs the staged data.
    console.log("Submitting all staged arrows:", scoresObj);

    // Clear localStorage after successful submission
    const storageKey = `scores_round_${roundId}`;
    localStorage.removeItem(storageKey);

    alert("Staged arrows logged to console. Integration pending.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!scoresObj || ranges.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">
          No ranges configured for this round.
        </div>
      </div>
    );
  }

  const currentRange = ranges[currentRangeIndex] || {};
  const stats = getRangeStats(currentRangeIndex);

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
            onClick={() => navigate(-1)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Round Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Enter Your Scores
          </h2>
          <p className="text-gray-600">
            Round: {round?.roundName || round?.id}
          </p>
        </div>

        {/* Tabs Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="flex border-b bg-gray-50">
            {ranges.map((range, index) => {
              const isActive = currentRangeIndex === index;
              const rangeStats = getRangeStats(index);
              const isCurrentComplete = isRangeComplete(currentRangeIndex);
              const canSwitch = isActive || isCurrentComplete;
              const isCompleted = isRangeComplete(index);

              return (
                <button
                  key={range.rangeID}
                  onClick={() => {
                    if (!canSwitch) {
                      alert(
                        "Please complete the current range before switching!"
                      );
                      return;
                    }
                    setCurrentRangeIndex(index);
                    setCurrentEnd(1);
                    setCurrentArrow(1);
                  }}
                  disabled={!canSwitch}
                  className={
                    "flex-1 px-6 py-4 font-semibold transition-all " +
                    (isActive
                      ? "bg-blue-600 text-white border-b-4 border-blue-800"
                      : canSwitch
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-400 cursor-not-allowed opacity-50")
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{range.rangeDistance}m</span>
                    {isCompleted && (
                      <span className="text-green-500 text-xl">✓</span>
                    )}
                  </div>
                  <div className="text-sm mt-1 opacity-90">
                    Score: {rangeStats.totalScore}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Range Details */}
          <div className="p-6">
            <div className="mb-6">
              <div className="font-bold text-xl text-gray-800 mb-2">
                Range {currentRange.rangeID} — {currentRange.rangeDistance}m
              </div>
              <div className="text-sm text-gray-600 flex gap-4">
                <span>🎯 Target: {currentRange.rangeTargetSize}</span>
                <span>📊 Ends: {currentRange.rangeTotalEnds}</span>
                <span>
                  🏹 Arrows/End: {currentRange.rangeTotalArrowsPerEnd}
                </span>
              </div>
            </div>

            {/* Score Grid */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                {scoresObj.ranges[currentRangeIndex].ends.map((endData) => {
                  const endNum = endData.endOrder;
                  return (
                    <div key={endNum} className="flex items-center gap-4">
                      <div className="w-20 font-bold text-gray-700">
                        End {endNum}
                      </div>
                      <div className="flex gap-2 flex-1">
                        {endData.arrows.map((val, arrowIndex) => {
                          const selected =
                            currentEnd === endNum &&
                            currentArrow === arrowIndex + 1;
                          return (
                            <button
                              key={arrowIndex}
                              onClick={() =>
                                handleCellClick(
                                  currentRangeIndex,
                                  endNum,
                                  arrowIndex
                                )
                              }
                              className={
                                "w-14 h-14 border-2 rounded-lg flex items-center justify-center font-bold text-lg transition-all " +
                                (selected
                                  ? "bg-blue-600 text-white border-blue-700 shadow-lg scale-110"
                                  : val
                                  ? "bg-white text-gray-800 border-gray-300 hover:border-blue-400"
                                  : "bg-white text-gray-400 border-gray-200 hover:border-blue-300")
                              }
                            >
                              {val || "-"}
                            </button>
                          );
                        })}
                      </div>
                      <div className="ml-4 text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-lg border-2 border-gray-200 min-w-20 text-center">
                        Sum: {getEndScore(currentRangeIndex, endNum)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Entry Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Quick Entry</h3>
          <div className="flex flex-wrap gap-3">
            {arrowOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => handleEnterScore(opt)}
                className="px-6 py-3 text-lg font-bold border-2 border-gray-300 rounded-lg bg-linear-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Stats and Actions Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                Active Range Totals
              </h3>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalScore}
                  </div>
                  <div className="text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.totalX}
                  </div>
                  <div className="text-gray-600">X</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalTen}
                  </div>
                  <div className="text-gray-600">Ten</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalNine}
                  </div>
                  <div className="text-gray-600">9s</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
            >
              Submit All Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
