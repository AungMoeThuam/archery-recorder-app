import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../services/api";

function RoundRanking() {
  const [ranking, setRanking] = useState([]);
  const [roundInfo, setRoundInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eligibility, setEligibility] = useState(null);
  const navigate = useNavigate();
  const { competitionID, roundID } = useParams();
  const [currnetArcherID, setCurrentArcherID] = useState(null);

  console.log("Params:", { competitionID, roundID });
  useEffect(() => {
    const archerID = localStorage.getItem("archerID");
    if (!archerID) {
      navigate("/login/archer");
      return;
    }

    fetchRoundRanking();
  }, [competitionID, roundID, navigate]);

  const fetchRoundRanking = async () => {
    const archerID = localStorage.getItem("archerID");
    setCurrentArcherID(archerID);
    try {
      setLoading(true);

      // Fetch ranking data and eligibility in parallel
      const [data, eligibilityData] = await Promise.all([
        api.getRoundRanking(competitionID, roundID),
        api.checkEligibility(archerID, roundID)
      ]);

      console.log("API response:", data);
      console.log("Eligibility response:", eligibilityData);

      setRanking(data || []);
      setRoundInfo(data.roundInfo);
      setEligibility(eligibilityData);
      setError("");
    } catch (err) {
      console.error("Error fetching ranking:", err);
      setError(err.message || "Failed to fetch ranking data");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Check if current archer has a score in this round
  const currentArcherRow = ranking.find(
    (archer) => archer.archerID == currnetArcherID
  );
  const hasScore = currentArcherRow && currentArcherRow.totalScore != null;

  // Filter rankings by gender
  const femaleRanking = ranking.filter(
    (archer) => archer.gender?.toLowerCase() === "female"
  );
  const maleRanking = ranking.filter(
    (archer) => archer.gender?.toLowerCase() === "male"
  );

  // Helper function to render ranking table
  const renderRankingTable = (rankingData, title, genderColor) => {
    if (rankingData.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">No {title.toLowerCase()} archers</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${genderColor} border-b-2 border-gray-300`}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                Archer Name
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                Score
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                X
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                10s
              </th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((archer, index) => (
              <tr
                key={archer.archerID}
                className={`border-b ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {index === 0 && <span className="text-xl mr-2">🥇</span>}
                    {index === 1 && <span className="text-xl mr-2">🥈</span>}
                    {index === 2 && <span className="text-xl mr-2">🥉</span>}
                    {index >= 3 && (
                      <span className="font-bold text-gray-700 mr-2 w-6">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {archer.archerFirstName} {archer.archerLastName}
                  {archer.archerID == currnetArcherID && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {archer.totalScore}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {archer.totalX || 0}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {archer.totalTen || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/archer/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold text-gray-800">Round Ranking</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {roundInfo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {roundInfo.roundType}
            </h2>
            <div className="text-gray-600 space-y-1">
              <p>📅 {new Date(roundInfo.roundDate).toLocaleDateString()}</p>
              <p>🏛️ {roundInfo.competitionTitle}</p>
            </div>
          </div>
        )}

        {/* Rankings - Two Column Layout */}
        {ranking.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 text-lg">No ranking data available</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Female Rankings - Left Column */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-pink-50">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  👩 Female Rankings
                </h3>
                <p className="text-gray-600 mt-1">
                  {femaleRanking.length} archer
                  {femaleRanking.length !== 1 ? "s" : ""}
                </p>
              </div>
              {renderRankingTable(femaleRanking, "Female", "bg-pink-50")}
            </div>

            {/* Male Rankings - Right Column */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  👨 Male Rankings
                </h3>
                <p className="text-gray-600 mt-1">
                  {maleRanking.length} archer
                  {maleRanking.length !== 1 ? "s" : ""}
                </p>
              </div>
              {renderRankingTable(maleRanking, "Male", "bg-blue-50")}
            </div>
          </div>
        )}

        {/* Enter Score Buttons if eligible and no score for current archer */}
        {eligibility?.eligible && !hasScore && (
          <div className="mt-8 text-center">
            <div className="flex gap-4 justify-center">
              <Link
                to={`/archer/score-entry/${competitionID}/${roundID}`}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                <span>✏️</span>
                Enter Scores Manually
              </Link>
              <Link
                to={`/archer/score-entry-photo/${competitionID}/${roundID}`}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
              >
                <span>📸</span>
                Enter Scores with Photo
              </Link>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              You have not entered a score for this round yet.
            </div>
          </div>
        )}

        {/* Not Eligible Message */}
        {eligibility && !eligibility.eligible && (
          <div className="mt-8 text-center">
            <div className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-4 rounded-lg inline-block">
              You are not participating in this round.
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Link
            to="/archer/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RoundRanking;
