import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function ArcherScoreEntryPhoto() {
  const { roundId, participationId } = useParams();
  const navigate = useNavigate();

  const [archer, setArcher] = useState(null);
  const [round, setRound] = useState(null);
  const [ranges, setRanges] = useState([]);
  const [scoresObj, setScoresObj] = useState(null); // { roundID, ranges: [...] }
  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [currentEnd, setCurrentEnd] = useState(1); // Track current end for input focus
  const [currentArrow, setCurrentArrow] = useState(1); // Track current arrow for input focus
  const [loading, setLoading] = useState(true);
  const [notEligible, setNotEligible] = useState(false);
  const [showRangeCompleteModal, setShowRangeCompleteModal] = useState(false);
  const [detecting, setDetecting] = useState(false); // New state for detection loading

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

      // Check eligibility first
      const eligibilityData = await api.checkEligibility(
        participationId,
        roundId
      );

      if (!eligibilityData.eligible) {
        setNotEligible(true);
        setLoading(false);
        return;
      }

      const rangesData = await api.getRoundRanges(roundId);
      const rangeList = rangesData.ranges || [];
      setRanges(rangeList);

      // --- Custom Initialization Logic ---

      // Initialize new structure with photo field and arrows array
      const newScoresObj = {
        participationID: parseInt(participationId),
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
              photo: null, // Will store file object
              photoPreview: null, // For preview URL
              arrows: Array(arrowsPerEnd).fill(null),
              submitted: false,
              scoresDetected: false, // New flag
            })),
          };
        }),
      };

      setScoresObj(newScoresObj);

      if (rangeList.length > 0) {
        setCurrentRangeIndex(0);
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

  /* --- Photo Handling and Detection --- */

  const handlePhotoUpload = (endIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Update scores object with photo file and preview URL
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const end = updatedScores.ranges[currentRangeIndex].ends[endIndex];

    // Revoke previous preview URL if exists
    if (end.photoPreview) {
      URL.revokeObjectURL(end.photoPreview);
    }

    end.photo = file; // Store the file object itself
    end.photoPreview = URL.createObjectURL(file);
    end.scoresDetected = false; // Reset detection status
    end.arrows = Array(end.arrows.length).fill(null); // Clear previous scores

    setScoresObj(updatedScores);
  };

  const removePhoto = (endIndex) => {
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const end = updatedScores.ranges[currentRangeIndex].ends[endIndex];

    if (end.photoPreview) {
      URL.revokeObjectURL(end.photoPreview);
    }

    end.photo = null;
    end.photoPreview = null;
    end.scoresDetected = false;
    end.arrows = Array(end.arrows.length).fill(null);

    setScoresObj(updatedScores);
  };

  const handleDetectScores = async (endIndex) => {
    const endData = scoresObj.ranges[currentRangeIndex].ends[endIndex];
    if (!endData.photo) return;

    setDetecting(true);
    console.log("Sending photo to AI detection backend:", endData.photo);

    try {
      // --- Placeholder for actual API call ---
      // In a real app, you would send endData.photo to an endpoint:
      // const formData = new FormData();
      // formData.append('image', endData.photo);
      // const response = await api.detectScores(formData);

      // --- Simulation: Simulate API delay and response ---
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const simulatedScores = ["10", "X", "8", "5", "M", "9"].slice(
        0,
        endData.arrows.length
      );
      // --- End Simulation ---

      // Update state with detected scores
      const updatedScores = JSON.parse(JSON.stringify(scoresObj));
      const updatedEnd = updatedScores.ranges[currentRangeIndex].ends[endIndex];

      updatedEnd.arrows = simulatedScores;
      updatedEnd.scoresDetected = true;
      setScoresObj(updatedScores);

      // Set focus to this end for review/editing
      setCurrentRangeIndex(currentRangeIndex);
      setCurrentEnd(updatedEnd.endOrder);
      setCurrentArrow(1);
    } catch (error) {
      console.error("Score detection failed:", error);
      alert(`Score detection failed: ${error.message || "Unknown error"}`);
    } finally {
      setDetecting(false);
    }
  };

  /* --- Score Entry and Submission Logic (Adapted from ScoreEntry.jsx) --- */

  const handleEnterScore = (score) => {
    if (!scoresObj || currentRangeIndex === null) return;

    const currentRangeData = scoresObj.ranges[currentRangeIndex];
    const currentEndData = currentRangeData.ends[currentEnd - 1];

    if (currentEndData.submitted) {
      alert("This end has already been submitted and cannot be edited.");
      return;
    }

    if (!currentEndData.scoresDetected) {
      alert("Please upload photo and detect scores before editing.");
      return;
    }

    // Deep clone the scores object
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const updatedRangeData = updatedScores.ranges[currentRangeIndex];
    const updatedEndData = updatedRangeData.ends[currentEnd - 1];

    // Update the arrow score
    updatedEndData.arrows[currentArrow - 1] = score;

    setScoresObj(updatedScores);

    const currentRange = ranges[currentRangeIndex];
    const arrowsPerEnd = currentRange.rangeTotalArrowsPerEnd || 3;

    // Move to next arrow
    if (currentArrow < arrowsPerEnd) {
      setCurrentArrow((c) => c + 1);
    }
  };

  const handleCellClick = (rangeIndex, endNum, arrowIdx) => {
    const endData = scoresObj.ranges[rangeIndex].ends[endNum - 1];

    // Don't allow clicking on submitted ends
    if (endData.submitted) return;

    // Don't allow clicking on locked ends
    if (!isEndUnlocked(rangeIndex, endNum)) return;

    // Must have detected scores to click and edit
    if (!endData.scoresDetected) return;

    setCurrentRangeIndex(rangeIndex);
    setCurrentEnd(endNum);
    setCurrentArrow(arrowIdx + 1);
  };

  const isEndComplete = (rangeIndex, endNum) => {
    if (!scoresObj) return false;
    const endData = scoresObj.ranges[rangeIndex]?.ends[endNum - 1];
    if (!endData || !endData.scoresDetected) return false;

    // Check if all arrows are filled (even if they were auto-filled by detection)
    for (const arrow of endData.arrows) {
      if (arrow === null) {
        return false;
      }
    }
    return true;
  };

  const isEndUnlocked = (rangeIndex, endNum) => {
    if (!scoresObj) return false;

    // First end is always unlocked
    if (endNum === 1) return true;

    // Check if previous end is submitted
    const previousEnd = scoresObj.ranges[rangeIndex]?.ends[endNum - 2];
    return previousEnd?.submitted === true;
  };

  const handleSubmitEnd = async (rangeIndex, endNum) => {
    const endData = scoresObj.ranges[rangeIndex].ends[endNum - 1];

    // Validate all arrows are filled (and detection is done)
    if (!isEndComplete(rangeIndex, endNum)) {
      alert(
        "Please detect scores or fill all arrow values before submitting this end."
      );
      return;
    }

    try {
      // Prepare API request body
      const requestBody = {
        roundID: scoresObj.roundID,
        participationID: scoresObj.participationID,
        distance: scoresObj.ranges[rangeIndex].distance,
        target: scoresObj.ranges[rangeIndex].target,
        endOrder: endNum,
        arrows: endData.arrows,
        // The photo file itself is likely submitted with the scores in a real app,
        // but for this UI update, we only submit the scores to the standard endpoint
      };

      console.log("Submitting end score to backend:", requestBody);

      // Call API to submit end score
      // NOTE: Using the standard api.submitEndScore here.
      const response = await api.submitEndScore(requestBody);

      if (response.recorded) {
        console.log("End score recorded successfully:", response);

        // Mark end as submitted
        const updatedScores = JSON.parse(JSON.stringify(scoresObj));
        updatedScores.ranges[rangeIndex].ends[endNum - 1].submitted = true;
        setScoresObj(updatedScores);

        const currentRange = ranges[rangeIndex];
        const totalEnds = currentRange.rangeTotalEnds || 1;

        // Check if this was the last end of the range
        if (endNum === totalEnds) {
          // Check if range is now complete
          const allEndsSubmitted = updatedScores.ranges[rangeIndex].ends.every(
            (end) => end.submitted
          );

          if (allEndsSubmitted) {
            // Show modal for range completion
            setShowRangeCompleteModal(true);
          }
        } else {
          // Move to next end (and clear arrow focus)
          setCurrentEnd(endNum + 1);
          setCurrentArrow(1);
        }
      } else {
        alert("Failed to record end score. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting end score:", error);
      alert(`Failed to submit end score: ${error.message || "Unknown error"}`);
    }
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

    // Range is complete if all ends are submitted
    for (const end of rangeData.ends) {
      if (!end.submitted) {
        return false;
      }
    }
    return true;
  };

  const handleContinueToNextRange = () => {
    setShowRangeCompleteModal(false);

    // Move to next range if available
    if (currentRangeIndex < ranges.length - 1) {
      setCurrentRangeIndex(currentRangeIndex + 1);
      setCurrentEnd(1);
      setCurrentArrow(1);
    } else {
      // All ranges complete
      alert("All ranges completed! Round finished.");
      // TODO: Navigate to dashboard or summary page
    }
  };

  const handleStayOnRange = () => {
    setShowRangeCompleteModal(false);
  };

  /* --- Render Block --- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (notEligible) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Not Eligible
          </h2>
          <p className="text-gray-600 mb-6">
            You are not participating in this round.
          </p>
          <button
            onClick={() => navigate("/archer/dashboard")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>
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
            <span className="text-3xl">📸🎯</span>
            <h1 className="text-2xl font-bold text-gray-800">
              Score Entry - Photo Detection
            </h1>
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
            Upload Photo & Review Scores
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
              const isCompleted = isRangeComplete(index);

              // Range is unlocked if:
              // 1. It's the first range (index 0), OR
              // 2. All previous ranges are complete
              let isUnlocked = index === 0;
              if (index > 0) {
                isUnlocked = true;
                for (let i = 0; i < index; i++) {
                  if (!isRangeComplete(i)) {
                    isUnlocked = false;
                    break;
                  }
                }
              }

              return (
                <button
                  key={range.rangeID}
                  onClick={() => {
                    if (!isUnlocked) return;
                    setCurrentRangeIndex(index);

                    // Find first unsubmitted end in this range
                    let targetEndNum = 1;
                    const rangeData = scoresObj.ranges[index];
                    for (let j = 0; j < rangeData.ends.length; j++) {
                      if (!rangeData.ends[j].submitted) {
                        targetEndNum = rangeData.ends[j].endOrder;
                        break;
                      }
                    }

                    setCurrentEnd(targetEndNum);
                    setCurrentArrow(1);
                  }}
                  disabled={!isUnlocked}
                  className={
                    "flex-1 px-6 py-4 font-semibold transition-all " +
                    (isActive
                      ? "bg-blue-600 text-white border-b-4 border-blue-800"
                      : isCompleted
                      ? "bg-green-50 text-gray-700 hover:bg-green-100 border-b-2 border-green-300"
                      : isUnlocked
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-400 cursor-not-allowed opacity-50 bg-gray-100")
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    {!isUnlocked && <span className="text-xl">🔒</span>}
                    <span className="text-lg">{range.rangeDistance}</span>
                    {isCompleted && (
                      <span
                        className={isActive ? "text-white" : "text-green-600"}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1 opacity-90">
                    Score: {rangeStats.totalScore}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Range Details and Score Grid */}
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

            {/* Combined Photo Upload, Detection, and Score Grid */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                {scoresObj.ranges[currentRangeIndex].ends.map(
                  (endData, endIndex) => {
                    const endNum = endData.endOrder;
                    const isSubmitted = endData.submitted;
                    const isUnlocked = isEndUnlocked(currentRangeIndex, endNum);
                    const isDetected = endData.scoresDetected;
                    const isComplete = isEndComplete(currentRangeIndex, endNum);
                    const canSubmit = isComplete && !isSubmitted && isDetected;
                    const hasPhoto = endData.photo !== null;
                    const isCurrent =
                      currentEnd === endNum &&
                      currentRangeIndex === endIndex &&
                      // currentRangeIndex === index &&
                      !isSubmitted;

                    return (
                      <div
                        key={endNum}
                        className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-3 rounded-lg transition-all ${
                          isSubmitted
                            ? "bg-green-50 border-2 border-green-300"
                            : !isUnlocked
                            ? "bg-gray-100 opacity-60"
                            : isCurrent
                            ? "bg-blue-50 border-2 border-blue-300"
                            : "bg-white border-2 border-gray-200"
                        }`}
                      >
                        <div className="w-full md:w-20 font-bold text-gray-700 flex items-center gap-2 mb-2 md:mb-0">
                          {isSubmitted && (
                            <span className="text-green-600 text-xl">✓</span>
                          )}
                          {!isUnlocked && !isSubmitted && (
                            <span className="text-gray-400 text-xl">🔒</span>
                          )}
                          End {endNum}
                        </div>

                        {/* Photo/Detection Area */}
                        <div className="flex-1 flex items-center gap-4 w-full md:w-auto">
                          {hasPhoto && isUnlocked && !isSubmitted ? (
                            <>
                              {/* Photo Preview and Actions */}
                              <div className="flex items-center gap-4 min-w-48">
                                <img
                                  src={endData.photoPreview}
                                  alt={`End ${endNum}`}
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
                                />
                                <button
                                  onClick={() => removePhoto(endIndex)}
                                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                >
                                  (Remove)
                                </button>
                              </div>

                              {/* Detect Button */}
                              {!isDetected && (
                                <button
                                  onClick={() => handleDetectScores(endIndex)}
                                  disabled={detecting}
                                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md flex items-center justify-center min-w-32"
                                >
                                  {detecting ? (
                                    <>
                                      <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                      Detecting...
                                    </>
                                  ) : (
                                    "Detect Scores"
                                  )}
                                </button>
                              )}
                            </>
                          ) : isUnlocked && !isSubmitted ? (
                            // Upload Button
                            <label className="cursor-pointer flex-1 min-w-48">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(endIndex, e)}
                                className="hidden"
                              />
                              <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-semibold">
                                <span>📷 Upload Photo</span>
                              </div>
                            </label>
                          ) : (
                            <div className="flex-1 text-gray-500 italic min-w-48">
                              {isSubmitted ? "Photo Submitted" : "Locked"}
                            </div>
                          )}
                        </div>

                        {/* Score Cells (Visible only after detection or if submitted) */}
                        {(isDetected || isSubmitted) && (
                          <div className="flex gap-2 flex-1 items-center">
                            {endData.arrows.map((val, arrowIndex) => {
                              const selected =
                                currentEnd === endNum &&
                                currentArrow === arrowIndex + 1 &&
                                !isSubmitted;
                              const canClick =
                                isUnlocked && isDetected && !isSubmitted;

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
                                  disabled={!canClick}
                                  className={
                                    "w-12 h-12 border-2 rounded-lg flex items-center justify-center font-bold text-base transition-all " +
                                    (selected
                                      ? "bg-blue-600 text-white border-blue-700 shadow-lg scale-105"
                                      : isSubmitted
                                      ? "bg-green-100 text-gray-800 border-green-300 cursor-not-allowed"
                                      : !canClick
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
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
                        )}

                        {/* Score Sum and Submit Button */}
                        <div className="flex items-center gap-2 ml-auto">
                          {(isDetected || isSubmitted) && (
                            <div className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-lg border-2 border-gray-200 min-w-20 text-center">
                              Sum: {getEndScore(currentRangeIndex, endNum)}
                            </div>
                          )}
                          {canSubmit && (
                            <button
                              onClick={() =>
                                handleSubmitEnd(currentRangeIndex, endNum)
                              }
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md min-w-28"
                            >
                              Submit End
                            </button>
                          )}
                          {isSubmitted && (
                            <div className="text-green-600 font-semibold px-4 py-2 min-w-28 text-center">
                              Submitted
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Entry Card (For Editing Detected Scores) */}
        {scoresObj.ranges[currentRangeIndex].ends[currentEnd - 1]
          ?.scoresDetected &&
          !scoresObj.ranges[currentRangeIndex].ends[currentEnd - 1]
            ?.submitted && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">
                Quick Entry / Edit (End {currentEnd} - Arrow {currentArrow})
              </h3>
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
          )}

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
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
      </div>

      {/* Range Complete Modal */}
      {showRangeCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Range Complete!
              </h2>
              <p className="text-gray-600">
                You have completed all ends for{" "}
                {scoresObj.ranges[currentRangeIndex].distance}
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalScore}
                </div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStayOnRange}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Stay Here
              </button>
              <button
                onClick={handleContinueToNextRange}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Continue to Next Range →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
