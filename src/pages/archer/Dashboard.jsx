import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../services/api";

function ArcherDashboard() {
  const [archer, setArcher] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const archerID = localStorage.getItem("archerID");
    const archerName = localStorage.getItem("archerName");

    if (!archerID) {
      navigate("/login/archer");
      return;
    }

    setArcher({ id: archerID, name: archerName });
    fetchCompetitions(archerID);
  }, [navigate]);

  const fetchCompetitions = async (archerID) => {
    try {
      const data = await api.getArcherCompetition(archerID);
      setCompetitions(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getStatusBadge = (status) => {
    const badges = {
      "In Progress": {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "⏳ Pending Verification",
      },
      Completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "✅ Finished",
      },
      Upcoming: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "📝 Not Started",
      },
    };
    const badge = badges[status] || badges["not_started"];
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
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
            <h1 className="text-2xl font-bold text-gray-800">Archer Portal</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {archer?.name}! 👋
          </h2>
          <p className="text-gray-600">
            View your competitions and manage your scores
          </p>
        </div>

        {/* Competitions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            My Competitions
          </h3>

          {competitions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏹</div>
              <p className="text-gray-600 text-lg">
                No competitions registered yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {competitions.map((comp) => (
                <div
                  key={comp.participationID}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">
                        {comp.competitionTitle}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 {comp.competitionLocation}</p>
                        <p>
                          📅{" "}
                          {new Date(
                            comp.competitionStartDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(comp.competitionStatus)}
                  </div>

                  {/* Rounds */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-700 mb-3 text-lg">
                      Rounds
                    </h5>
                    {comp.rounds && comp.rounds.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {comp.rounds.map((round) => (
                          <Link
                            key={round.roundID}
                            to={`/archer/round-ranking/${comp.competitionID}/${round.roundID}/${comp.participationID}`}
                            className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h6 className="font-bold text-gray-800 text-base">
                                  {round.roundType}
                                </h6>
                                <p className="text-sm text-gray-600 mt-1">
                                  📅{" "}
                                  {new Date(
                                    round.roundDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              {round.totalScore !== null && (
                                <div className="bg-blue-600 text-white rounded-lg px-3 py-2 text-center">
                                  <div className="text-2xl font-bold">
                                    {round.totalScore}
                                  </div>
                                  <div className="text-xs">Points</div>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 text-center text-sm text-blue-600 font-semibold hover:text-blue-700">
                              View Ranking →
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No rounds available
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap">
                    {comp.status === "not_started" && (
                      <>
                        <Link
                          to={`/archer/score-entry/${comp.competitionID}/${comp.rounds[0]?.roundID}`}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          <span>✏️</span>
                          Enter Scores Manually
                        </Link>
                        <Link
                          to={`/archer/score-entry-photo/${comp.competitionID}/${comp.rounds[0]?.roundID}`}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                        >
                          <span>📸</span>
                          Enter Scores with Photo
                        </Link>
                      </>
                    )}
                    {comp.status === "pending" && (
                      <button
                        disabled
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        Waiting for Verification
                      </button>
                    )}
                    {(comp.status === "confirmed" ||
                      comp.status === "pending") && (
                      <Link
                        to={`/archer/scores/${comp.participationID}`}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArcherDashboard;
