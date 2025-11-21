import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function ArcherScoreEntry() {
  const { roundId, participationId } = useParams();
  const navigate = useNavigate();

  const [archer, setArcher] = useState(null);
  const [round, setRound] = useState(null);
  const [ranges, setRanges] = useState([]);
  const [scoresObj, setScoresObj] = useState(null); // New structure: { roundID, ranges: [...] }
  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [currentEnd, setCurrentEnd] = useState(1);
  const [currentArrow, setCurrentArrow] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showRangeCompleteModal, setShowRangeCompleteModal] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [detecting, setDetecting] = useState(false);

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
      const archerID = localStorage.getItem("archerID");
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

      // Initialize new structure with ranges
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
              arrows: Array(arrowsPerEnd).fill(null),
              submitted: false,
              photo: null,
              photoPreview: null,
              scoresDetected: false,
            })),
          };
        }),
      };

      // Fetch submitted scores from backend
      try {
        const submittedData = await api.getArcherSubmittedScores(
          participationId,
          roundId
        );
        const submittedEnds = submittedData.submittedEnds || [];

        // Merge submitted scores into the structure
        submittedEnds.forEach((submittedEnd) => {
          // Find matching range by distance
          const rangeIndex = newScoresObj.ranges.findIndex(
            (r) => r.distance === submittedEnd.distance.toString()
          );

          if (rangeIndex !== -1) {
            const range = newScoresObj.ranges[rangeIndex];
            const endIndex = range.ends.findIndex(
              (e) => e.endOrder === submittedEnd.endOrder
            );

            if (endIndex !== -1) {
              // Update the end with submitted data
              range.ends[endIndex] = {
                endOrder: submittedEnd.endOrder,
                arrows: submittedEnd.arrows.map((arrow) => arrow.toString()),
                submitted: true,
              };
            }
          }
        });
      } catch (error) {
        console.error("Failed to fetch submitted scores:", error);
        // Continue with empty structure if fetch fails
      }

      // Try to load draft data from localStorage for unsubmitted ends
      const storageKey = `scores_round_${roundId}`;
      const savedData = localStorage.getItem(storageKey);

      let loadedScoresObj = newScoresObj;

      if (savedData) {
        try {
          const localData = JSON.parse(savedData);

          // Merge localStorage data for unsubmitted ends only
          localData.ranges.forEach((localRange, rangeIndex) => {
            if (newScoresObj.ranges[rangeIndex]) {
              localRange.ends.forEach((localEnd, endIndex) => {
                const currentEnd =
                  newScoresObj.ranges[rangeIndex].ends[endIndex];

                // Only use localStorage data if the end is NOT submitted in backend
                if (
                  currentEnd &&
                  !currentEnd.submitted &&
                  !localEnd.submitted
                ) {
                  currentEnd.arrows = localEnd.arrows;
                }
              });
            }
          });
        } catch (error) {
          console.error("Failed to parse localStorage data:", error);
        }
      }

      setScoresObj(loadedScoresObj);

      if (rangeList.length > 0 && loadedScoresObj) {
        // Find the first unsubmitted end across all ranges
        let targetRangeIndex = 0;
        let targetEndNum = 1;
        let found = false;

        for (let i = 0; i < loadedScoresObj.ranges.length; i++) {
          const rangeData = loadedScoresObj.ranges[i];

          for (let j = 0; j < rangeData.ends.length; j++) {
            const end = rangeData.ends[j];

            // Find first unsubmitted end
            if (!end.submitted) {
              targetRangeIndex = i;
              targetEndNum = end.endOrder;
              found = true;
              break;
            }
          }

          if (found) break;
        }

        setCurrentRangeIndex(targetRangeIndex);
        setCurrentEnd(targetEndNum);
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

  const handlePhotoUpload = (rangeIndex, endIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Update scores object with photo file and preview URL
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const end = updatedScores.ranges[rangeIndex].ends[endIndex];

    // Revoke previous preview URL if exists
    if (end.photoPreview) {
      URL.revokeObjectURL(end.photoPreview);
    }

    end.photo = file;
    end.photoPreview = URL.createObjectURL(file);
    end.scoresDetected = false;

    setScoresObj(updatedScores);
  };

  const removePhoto = (rangeIndex, endIndex) => {
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const end = updatedScores.ranges[rangeIndex].ends[endIndex];

    if (end.photoPreview) {
      URL.revokeObjectURL(end.photoPreview);
    }

    end.photo = null;
    end.photoPreview = null;
    end.scoresDetected = false;

    setScoresObj(updatedScores);
  };

  const handleDetectScores = async (rangeIndex, endIndex) => {
    const endData = scoresObj.ranges[rangeIndex].ends[endIndex];
    if (!endData.photo) return;

    setDetecting(true);

    try {
      const formData = new FormData();
      formData.append("file", endData.photo);

      const apiUrl = `http://localhost:8000/api/archer/1/detect`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Detection failed with status ${response.status}: ${errorText}`
        );
      }

      const detectedScores = await response.json();

      if (!Array.isArray(detectedScores)) {
        throw new Error("Backend did not return a valid list of scores.");
      }

      const receivedScores = detectedScores.slice(0, endData.arrows.length);

      // Update state with detected scores
      const updatedScores = JSON.parse(JSON.stringify(scoresObj));
      const updatedEnd = updatedScores.ranges[rangeIndex].ends[endIndex];

      updatedEnd.arrows = receivedScores;
      updatedEnd.scoresDetected = true;
      setScoresObj(updatedScores);

      // Save to localStorage
      const storageKey = `scores_round_${roundId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedScores));

      // Set focus to this end for review/editing
      setCurrentRangeIndex(rangeIndex);
      setCurrentEnd(updatedEnd.endOrder);
      setCurrentArrow(1);
    } catch (error) {
      console.error("Score detection failed:", error);
      alert(`Score detection failed: ${error.message || "Unknown error"}`);
    } finally {
      setDetecting(false);
    }
  };

  /* --- Score Entry and Submission Logic --- */

  const handleEnterScore = (score) => {
    if (!scoresObj || currentRangeIndex === null) return;

    const currentRangeData = scoresObj.ranges[currentRangeIndex];
    const currentEndData = currentRangeData.ends[currentEnd - 1];

    // Don't allow editing submitted ends
    if (currentEndData.submitted) {
      alert("This end has already been submitted and cannot be edited.");
      return;
    }

    // Clone the scores object (preserve photo File objects)
    const updatedScores = structuredClone
      ? structuredClone(scoresObj)
      : JSON.parse(JSON.stringify(scoresObj));
    const updatedRangeData = updatedScores.ranges[currentRangeIndex];
    const updatedEndData = updatedRangeData.ends[currentEnd - 1];

    // Update the arrow score
    updatedEndData.arrows[currentArrow - 1] = score;

    setScoresObj(updatedScores);

    // Save to localStorage
    const storageKey = `scores_round_${roundId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedScores));

    const currentRange = ranges[currentRangeIndex];
    const arrowsPerEnd = currentRange.rangeTotalArrowsPerEnd || 3;

    // Move to next arrow
    if (currentArrow < arrowsPerEnd) {
      setCurrentArrow((c) => c + 1);
    }
  };

  const handleCellClick = (rangeIndex, endNum, arrowIdx) => {
    const endData = scoresObj.ranges[rangeIndex].ends[endNum - 1];

    // Don't allow clicking on submitted ends (do nothing silently)
    if (endData.submitted) {
      return;
    }

    // Don't allow clicking on locked ends (do nothing silently)
    if (!isEndUnlocked(rangeIndex, endNum)) {
      return;
    }

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

    // Range is complete if all ends are submitted
    for (const end of rangeData.ends) {
      if (!end.submitted) {
        return false;
      }
    }
    return true;
  };

  const isEndComplete = (rangeIndex, endNum) => {
    if (!scoresObj) return false;
    const endData = scoresObj.ranges[rangeIndex]?.ends[endNum - 1];
    if (!endData) return false;

    // Check if all arrows are filled (allow 0, "M", but not null/undefined)
    for (const arrow of endData.arrows) {
      if (arrow === null || arrow === undefined) {
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

    // Validate all arrows are filled
    if (!isEndComplete(rangeIndex, endNum)) {
      alert("Please fill all arrows before submitting this end.");
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
      };

      console.log("Submitting end to backend:", requestBody);

      // Call API to submit end score
      const response = await api.submitEndScore(requestBody);

      if (response.recorded) {
        console.log("End score recorded successfully:", response);

        // Mark end as submitted
        const updatedScores = JSON.parse(JSON.stringify(scoresObj));
        updatedScores.ranges[rangeIndex].ends[endNum - 1].submitted = true;
        setScoresObj(updatedScores);

        // Save to localStorage
        const storageKey = `scores_round_${roundId}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedScores));

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
          // Move to next end
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
                    if (!isUnlocked) {
                      return; // Do nothing if locked
                    }
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
                {scoresObj.ranges[currentRangeIndex].ends.map(
                  (endData, endIndex) => {
                    const endNum = endData.endOrder;
                    const isSubmitted = endData.submitted;
                    const isUnlocked = isEndUnlocked(currentRangeIndex, endNum);
                    const isComplete = isEndComplete(currentRangeIndex, endNum);
                    const canSubmit = isComplete && !isSubmitted;
                    const hasPhoto = endData.photo !== null;
                    const isDetected = endData.scoresDetected;

                    return (
                      <div
                        key={endNum}
                        className={`flex flex-col gap-3 p-3 rounded-lg transition-all ${
                          isSubmitted
                            ? "bg-green-50 border-2 border-green-300"
                            : !isUnlocked
                            ? "bg-gray-100 opacity-60"
                            : "bg-white border-2 border-gray-200"
                        }`}
                      >
                        {/* Main Row: End Label + Arrows + Sum + Submit */}
                        <div className="flex items-center gap-4">
                          <div className="w-20 font-bold text-gray-700 flex items-center gap-2">
                            {isSubmitted && (
                              <span className="text-green-600 text-xl">✓</span>
                            )}
                            {!isUnlocked && !isSubmitted && (
                              <span className="text-gray-400 text-xl">🔒</span>
                            )}
                            End {endNum}
                          </div>
                          <div className="flex gap-2 flex-1">
                            {endData.arrows.map((val, arrowIndex) => {
                              const selected =
                                currentEnd === endNum &&
                                currentArrow === arrowIndex + 1 &&
                                !isSubmitted;
                              const canClick = isUnlocked && !isSubmitted;

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
                                    "w-14 h-14 border-2 rounded-lg flex items-center justify-center font-bold text-lg transition-all " +
                                    (selected
                                      ? "bg-blue-600 text-white border-blue-700 shadow-lg scale-110"
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
                          <div className="ml-4 text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-lg border-2 border-gray-200 min-w-20 text-center">
                            Sum: {getEndScore(currentRangeIndex, endNum)}
                          </div>
                          {canSubmit && (
                            <button
                              onClick={() =>
                                handleSubmitEnd(currentRangeIndex, endNum)
                              }
                              className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                            >
                              Submit End
                            </button>
                          )}
                          {isSubmitted && (
                            <div className="ml-2 text-green-600 font-semibold px-4 py-2">
                              Submitted
                            </div>
                          )}
                        </div>

                        {/* Photo Upload Row (Only show if not submitted) */}
                        {!isSubmitted && isUnlocked && (
                          <div className="flex items-center gap-3 pl-24">
                            {!hasPhoto ? (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handlePhotoUpload(
                                      currentRangeIndex,
                                      endIndex,
                                      e
                                    )
                                  }
                                  className="hidden"
                                />
                                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-semibold text-sm">
                                  <span>📷 Enter Score via Photo</span>
                                </div>
                              </label>
                            ) : (
                              <div className="flex items-center gap-3">
                                <img
                                  src={endData.photoPreview}
                                  alt={`End ${endNum}`}
                                  className="w-12 h-12 object-cover rounded-lg border-2 border-gray-300"
                                />
                                <button
                                  onClick={() =>
                                    removePhoto(currentRangeIndex, endIndex)
                                  }
                                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                >
                                  Remove
                                </button>
                                {!isDetected && (
                                  <button
                                    onClick={() =>
                                      handleDetectScores(
                                        currentRangeIndex,
                                        endIndex
                                      )
                                    }
                                    disabled={detecting}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md flex items-center gap-2 text-sm"
                                  >
                                    {detecting ? (
                                      <>
                                        <svg
                                          className="animate-spin h-4 w-4 text-white"
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
                                {isDetected && (
                                  <span className="text-green-600 font-semibold text-sm">
                                    ✓ Scores Detected
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
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
