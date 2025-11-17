import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// NOTE: Assuming api service is available as 'api' in the path '.../../services/api'
// If not, you may need to replace 'api.submitFinalEndScore' with a standard fetch.
// For this example, I will use a placeholder 'fetch' call directly.

// Renamed for clarity in functionality, but this replaces the content of PendingScores.jsx
function RecorderEndVerification() {
  const { roundId } = useParams(); // Using roundId to filter the data
  const navigate = useNavigate();

  const [pendingEnds, setPendingEnds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEndId, setEditingEndId] = useState(null); // Key: `${end.participationID}-${end.endOrder}`
  const [currentArrow, setCurrentArrow] = useState(null); // [participationID, endOrder, arrowIndex]

  // Options for editing the score
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
    // Check for recorder login (retained from original file's logic assumption)
    const recorderID = localStorage.getItem("recorderID");
    if (!recorderID) {
      navigate("/login/recorder");
      return;
    }

    fetchPendingEnds();
  }, [roundId, navigate]);

  // Helper to calculate end score (X/10 count as 10, M as 0)
  const getEndScore = (arrows) => {
    return arrows.reduce((sum, score) => {
      // The backend returns numbers (e.g., 0, 1, 5) but also potentially strings for 'X'
      // If the backend returns 'X', it should be converted to 10 for sum.
      const val =
        typeof score === "string" &&
        (score.toUpperCase() === "X" || score === "10")
          ? 10
          : typeof score === "string" && score.toUpperCase() === "M"
          ? 0
          : score;
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);
  };

  const fetchPendingEnds = async () => {
    try {
      setLoading(true);

      // Using the endpoint provided: http://localhost:4000/api/recorder/ends/pending
      // Assuming it needs roundID to filter correctly
      const response = await fetch(
        `http://localhost:4000/api/recorder/ends/pending?roundID=${roundId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pending ends.");
      }

      let endsData = await response.json();

      // Enhance data with a unique key and an editable copy of scores
      setPendingEnds(
        endsData.map((end) => ({
          ...end,
          key: `${end.participationID}-${end.endOrder}-${end.roundID}`,
          // Initialize an editable state for scores
          editableArrows: end.arrows.map((score) =>
            score === "X" ? 10 : score
          ), // Ensure X is treated as 10 for editing/math simplicity if the input is X
        }))
      );
    } catch (error) {
      console.error("Error fetching pending ends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrowEdit = (endKey, arrowIndex, newScore) => {
    setPendingEnds((prevEnds) =>
      prevEnds.map((end) => {
        if (end.key === endKey) {
          const newArrows = [...end.editableArrows];

          // Convert 'X'/'10' to number 10, 'M' to 0, or keep original score type
          // The Quick Entry options are strings. We should store them as numbers
          // for the final submission if the backend expects it.
          const scoreValue =
            newScore === "X"
              ? "X"
              : newScore === "10"
              ? 10
              : newScore === "M"
              ? 0
              : parseInt(newScore, 10);

          newArrows[arrowIndex] = scoreValue;

          return { ...end, editableArrows: newArrows };
        }
        return end;
      })
    );

    // Move focus to next arrow
    const currentEnd = pendingEnds.find((e) => e.key === endKey);
    if (currentEnd && arrowIndex < currentEnd.arrows.length - 1) {
      setCurrentArrow([
        currentEnd.participationID,
        currentEnd.endOrder,
        arrowIndex + 1,
      ]);
    } else {
      // Clear focus if last arrow
      setCurrentArrow(null);
    }
  };

  const handleCellClick = (end) => (arrowIndex) => {
    // Set current editing focus
    setCurrentArrow([end.participationID, end.endOrder, arrowIndex]);
    setEditingEndId(end.key);
  };

  const handleConfirmEnd = async (end) => {
    const confirmedData = {
      roundID: end.roundID,
      endOrder: end.endOrder,
      distance: end.distance,
      participationID: end.participationID,
      // Convert 10 back to 'X' for the highest score if that's the final submission format
      arrows: end.editableArrows.map((score) => (score === 10 ? "X" : score)),
      stagingStatus: "confirmed", // Assuming the action changes status to 'confirmed'
      // NOTE: You would need to add the recorderID and time here in a real submission.
    };

    try {
      // Placeholder for the final submission API call (assuming a PUT/POST to a final endpoint)
      // Example: await fetch(`/api/recorder/ends/confirm`, { method: 'POST', body: JSON.stringify(confirmedData) });

      // --- Simulation ---
      console.log("Submitting final score:", confirmedData);
      await new Promise((resolve) => setTimeout(resolve, 500));
      // --- End Simulation ---

      // Remove the confirmed end from the list
      setPendingEnds((prevEnds) => prevEnds.filter((e) => e.key !== end.key));

      // Clear focus
      if (editingEndId === end.key) {
        setEditingEndId(null);
        setCurrentArrow(null);
      }

      alert(
        `End ${end.endOrder} for Participant ID ${end.participationID} confirmed successfully!`
      );
    } catch (error) {
      console.error("Error confirming end score:", error);
      alert("Failed to confirm end score. Please try again.");
    }
  };

  // Group ends by participant for better UI
  const groupedEnds = pendingEnds.reduce((acc, end) => {
    const archerKey = end.participationID;
    if (!acc[archerKey]) {
      acc[archerKey] = {
        participationID: end.participationID,
        // Using participationID as placeholder for name
        archerName: `Participant ID: ${end.participationID}`,
        ends: [],
      };
    }
    acc[archerKey].ends.push(end);
    return acc;
  }, {});

  const archerGroups = Object.values(groupedEnds);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading Pending Scores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Pending End Score Verification
        </h1>

        {pendingEnds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-600">
            All ends are verified or no ends are currently pending for Round{" "}
            {roundId}.
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              ← Back
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {archerGroups.map((group) => (
              <div
                key={group.participationID}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">
                  {group.archerName}
                </h2>

                <div className="space-y-4">
                  {group.ends.map((end) => (
                    <div
                      key={end.key}
                      className={`p-4 border rounded-lg transition-all ${
                        editingEndId === end.key
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* End Info */}
                        <div className="flex-shrink-0 min-w-[150px]">
                          <div className="font-bold text-lg text-gray-800">
                            End {end.endOrder}
                          </div>
                          <div className="text-sm text-gray-500">
                            {end.distance}m
                          </div>
                        </div>

                        {/* Arrow Scores (Editable Grid) */}
                        <div className="flex flex-1 gap-2 overflow-x-auto">
                          {end.editableArrows.map((score, arrowIndex) => {
                            const isFocused =
                              currentArrow &&
                              currentArrow[0] === end.participationID &&
                              currentArrow[1] === end.endOrder &&
                              currentArrow[2] === arrowIndex;

                            return (
                              <button
                                key={arrowIndex}
                                onClick={() => handleCellClick(end)(arrowIndex)}
                                className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center font-bold text-base transition-all ${
                                  isFocused
                                    ? "bg-red-500 text-white border-red-600 shadow-lg scale-105"
                                    : score === 10
                                    ? "bg-yellow-100 text-gray-800 border-yellow-300 hover:border-blue-400"
                                    : score === 0
                                    ? "bg-gray-200 text-gray-800 border-gray-300 hover:border-blue-400"
                                    : "bg-white text-gray-800 border-gray-300 hover:border-blue-400"
                                }`}
                              >
                                {score === 10
                                  ? "10"
                                  : score === 0
                                  ? "M"
                                  : score}
                              </button>
                            );
                          })}
                        </div>

                        {/* End Score Sum and Confirm Button */}
                        <div className="flex-shrink-0 flex items-center gap-3 ml-auto">
                          <div className="text-lg font-bold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg min-w-20 text-center border">
                            Sum: {getEndScore(end.editableArrows)}
                          </div>
                          <button
                            onClick={() => handleConfirmEnd(end)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md min-w-32"
                          >
                            Confirm End
                          </button>
                        </div>
                      </div>

                      {/* Quick Entry Panel (if this end is focused) */}
                      {editingEndId === end.key && currentArrow && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <h3 className="font-bold text-md text-gray-800 mb-3">
                            Edit Arrow {currentArrow[2] + 1}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {arrowOptions.map((opt) => (
                              <button
                                key={opt}
                                onClick={() =>
                                  handleArrowEdit(end.key, currentArrow[2], opt)
                                }
                                className="px-4 py-2 text-md font-bold border-2 border-gray-300 rounded-lg bg-gray-50 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">
            📘 Verification Instructions
          </h4>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>
              • Click on any arrow score to bring up the Quick Entry panel and
              edit the value.
            </li>
            <li>
              • Use the Quick Entry panel to change the arrow score. The focused
              arrow is highlighted in red.
            </li>
            <li>
              • Once all scores for an end are accurate, click the **Confirm
              End** button to finalize and save the scores to the database.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RecorderEndVerification;
