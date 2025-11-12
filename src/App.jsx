import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginArcher from './pages/LoginArcher';
import LoginRecorder from './pages/LoginRecorder';

// Archer pages
import ArcherDashboard from './pages/archer/Dashboard';
import ArcherScoreEntry from './pages/archer/ScoreEntry';
import ArcherScoreDetails from './pages/archer/ScoreDetails';

// Recorder pages
import RecorderDashboard from './pages/recorder/Dashboard';
import RecorderPendingScores from './pages/recorder/PendingScores';
import RecorderScoreVerify from './pages/recorder/ScoreVerify';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login/archer" element={<LoginArcher />} />
        <Route path="/login/recorder" element={<LoginRecorder />} />

        {/* Archer Routes */}
        <Route path="/archer/dashboard" element={<ArcherDashboard />} />
        <Route path="/archer/score-entry/:competitionId/:roundId" element={<ArcherScoreEntry />} />
        <Route path="/archer/scores/:participationId" element={<ArcherScoreDetails />} />

        {/* Recorder Routes */}
        <Route path="/recorder/dashboard" element={<RecorderDashboard />} />
        <Route path="/recorder/pending/:competitionId/:roundId" element={<RecorderPendingScores />} />
        <Route path="/recorder/verify/:participationId/:roundId" element={<RecorderScoreVerify />} />
      </Routes>
    </Router>
  );
}

export default App;

