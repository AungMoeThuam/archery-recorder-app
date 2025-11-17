import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function ArcherScoreEntryPhoto() {
  const { competitionId, roundId } = useParams();
  const navigate = useNavigate();

  const [archer, setArcher] = useState(null);
  const [round, setRound] = useState(null);
  const [ranges, setRanges] = useState([]);
  const [scoresObj, setScoresObj] = useState(null); // { roundID, ranges: [...] }
  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notEligible, setNotEligible] = useState(false);

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
      const eligibilityData = await api.checkEligibility(archerID, roundId);

      if (!eligibilityData.eligible) {
        setNotEligible(true);
        setLoading(false);
        return;
      }

      const rangesData = await api.getRoundRanges(roundId);
      const rangeList = rangesData.ranges || [];
      setRanges(rangeList);

      // Initialize new structure with photo field
      const newScoresObj = {
        roundID: parseInt(roundId),
        ranges: rangeList.map((range) => {
          const totalEnds = range.rangeTotalEnds || 1;

          return {
            distance: range.rangeDistance,
            target: range.rangeTargetSize,
            rangeID: range.rangeID,
            ends: Array.from({ length: totalEnds }, (_, i) => ({
              endOrder: i + 1,
              photo: null, // Will store photo data or file
              photoPreview: null, // For preview URL
            })),
          };
        }),
      };

      setScoresObj(newScoresObj);

      if (rangeList.length > 0) {
        setCurrentRangeIndex(0);
      }
    } catch (err) {
      console.error("Failed to load round/ranges", err);
    } finally {
      setLoading(false);
    }
  }

  const handlePhotoUpload = (endIndex, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Create preview URL
    const previewURL = URL.createObjectURL(file);

    // Update scores object
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    updatedScores.ranges[currentRangeIndex].ends[endIndex].photo = file.name;
    updatedScores.ranges[currentRangeIndex].ends[endIndex].photoPreview =
      previewURL;

    setScoresObj(updatedScores);

    // Check if range is complete
    setTimeout(() => {
      const complete = isRangeComplete(currentRangeIndex);
      if (complete) {
        console.log(
          `Range at ${updatedScores.ranges[currentRangeIndex].distance}m completed:`,
          {
            rangeData: updatedScores.ranges[currentRangeIndex],
          }
        );
      }
    }, 100);
  };

  const removePhoto = (endIndex) => {
    const updatedScores = JSON.parse(JSON.stringify(scoresObj));
    const end = updatedScores.ranges[currentRangeIndex].ends[endIndex];

    // Revoke preview URL to free memory
    if (end.photoPreview) {
      URL.revokeObjectURL(end.photoPreview);
    }

    end.photo = null;
    end.photoPreview = null;

    setScoresObj(updatedScores);
  };

  const isRangeComplete = (rangeIndex) => {
    if (!scoresObj) return false;
    const rangeData = scoresObj.ranges[rangeIndex];
    if (!rangeData) return false;

    for (const end of rangeData.ends) {
      if (!end.photo) {
        return false; // Found an end without photo
      }
    }
    return true; // All ends have photos
  };

  const handleSubmit = async () => {
    // Placeholder: persist photos to backend
    console.log("Submitting all photos:", scoresObj);
    alert("Photos logged to console. Integration pending.");
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
  const uploadedCount = scoresObj.ranges[currentRangeIndex].ends.filter(
    (end) => end.photo
  ).length;
  const totalEnds = currentRange.rangeTotalEnds || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📸</span>
            <h1 className="text-2xl font-bold text-gray-800">
              Score Entry - Photo Upload
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
            Upload End Photos
          </h2>
          <p className="text-gray-600">
            Round: {round?.roundName || round?.id}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            📌 Upload one photo per end showing all arrows
          </p>
        </div>

        {/* Tabs Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="flex border-b bg-gray-50">
            {ranges.map((range, index) => {
              const isActive = currentRangeIndex === index;
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
                    {scoresObj.ranges[index].ends.filter((e) => e.photo).length}{" "}
                    / {range.rangeTotalEnds} photos
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

            {/* Photo Upload Grid */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                {scoresObj.ranges[currentRangeIndex].ends.map(
                  (endData, endIndex) => {
                    const endNum = endData.endOrder;
                    return (
                      <div
                        key={endNum}
                        className="flex items-center gap-4 bg-white p-4 rounded-lg border-2 border-gray-200"
                      >
                        <div className="w-20 font-bold text-gray-700">
                          End {endNum}
                        </div>

                        {!endData.photo ? (
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(endIndex, e)}
                              className="hidden"
                            />
                            <div className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                              <span className="text-3xl">📷</span>
                              <div>
                                <div className="font-semibold text-blue-700">
                                  Upload Photo
                                </div>
                                <div className="text-sm text-blue-600">
                                  Click to select image
                                </div>
                              </div>
                            </div>
                          </label>
                        ) : (
                          <div className="flex-1 flex items-center gap-4">
                            {/* Photo Preview */}
                            <div className="relative">
                              <img
                                src={endData.photoPreview}
                                alt={`End ${endNum}`}
                                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                              />
                            </div>

                            {/* Photo Info */}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                Photo uploaded
                              </div>
                              <div className="text-sm text-gray-600">
                                {endData.photo}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handlePhotoUpload(endIndex, e)
                                  }
                                  className="hidden"
                                />
                                Change
                              </label>
                              <button
                                onClick={() => removePhoto(endIndex)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                              >
                                Remove
                              </button>
                            </div>
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

        {/* Stats and Actions Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                Upload Progress
              </h3>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadedCount} / {totalEnds}
                  </div>
                  <div className="text-gray-600">Photos Uploaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((uploadedCount / totalEnds) * 100)}%
                  </div>
                  <div className="text-gray-600">Complete</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isRangeComplete(currentRangeIndex)}
              className={
                "px-6 py-3 rounded-lg font-semibold shadow-md transition-colors " +
                (isRangeComplete(currentRangeIndex)
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed")
              }
            >
              Submit All Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
