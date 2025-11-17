import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../services/api";

function RecorderDashboard() {
  const [recorder, setRecorder] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const recorderID = localStorage.getItem("recorderID");
    const recorderName = localStorage.getItem("recorderName");

    if (!recorderID) {
      navigate("/login/recorder");
      return;
    }

    setRecorder({ id: recorderID, name: recorderName });
    fetchCompetitions();
  }, [navigate]);

  const fetchCompetitions = async () => {
    try {
      const data = await api.getCompetitions();
      setCompetitions(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      setLoading(false);
    }
  };

  const handleCompetitionChange = async (competitionId) => {
    setSelectedCompetition(competitionId);
    setSelectedRound("");

    if (!competitionId) {
      setRounds([]);
      return;
    }

    try {
      const data = await api.getCompetitionRounds(competitionId);
      setRounds(data);
    } catch (error) {
      console.error("Error fetching rounds:", error);
    }
  };

  const handleProceed = () => {
    if (selectedCompetition && selectedRound) {
      navigate(`/recorder/pending/${selectedCompetition}/${selectedRound}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <h1 className="text-2xl font-bold text-gray-800">
              Recorder Portal
            </h1>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {recorder?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Select a competition and round to verify archer scores
          </p>
        </div>

        {/* Selection Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Select Competition & Round
          </h3>

          {/* Step 1: Select Competition */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">
              Step 1: Select Competition
            </label>
            <select
              value={selectedCompetition}
              onChange={(e) => handleCompetitionChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            >
              <option value="">-- Choose a competition --</option>
              {competitions.map((comp) => (
                <option key={comp.competitionID} value={comp.competitionID}>
                  {comp.competitionTitle} -{" "}
                  {new Date(comp.competitionStartDate).toLocaleDateString()} -{" "}
                  {comp.competitionCity}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Round */}
          {selectedCompetition && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">
                Step 2: Select Round
              </label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                disabled={rounds.length === 0}
              >
                <option value="">-- Choose a round --</option>
                {rounds.map((round) => (
                  <option key={round.roundID} value={round.roundID}>
                    {round.roundType} -{" "}
                    {new Date(round.roundDate).toLocaleDateString()}
                  </option>
                ))}
              </select>

              {rounds.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No rounds available for this competition
                </p>
              )}
            </div>
          )}

          {/* Proceed Button */}
          {selectedCompetition && selectedRound && (
            <button
              onClick={handleProceed}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
            >
              View Pending Scores →
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-6 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">📘 Instructions</h4>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>1. Select the competition you want to verify scores for</li>
            <li>2. Choose the specific round</li>
            <li>3. View all archers with pending scores</li>
            <li>4. Verify and adjust scores as needed</li>
            <li>5. Confirm to finalize the scores</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RecorderDashboard;
