const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Auth endpoints
  loginArcher: (credentials) =>
    fetch(`${API_BASE_URL}/api/archer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  loginRecorder: (credentials) =>
    fetch(`${API_BASE_URL}/api/recorder/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  logout: () =>
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    }).then(handleResponse),

  // Archer endpoints
  getArchers: () => fetch(`${API_BASE_URL}/archers`).then(handleResponse),

  getArcher: (id) =>
    fetch(`${API_BASE_URL}/archers/${id}`).then(handleResponse),

  getArcherCompetition: (archerID) =>
    fetch(`${API_BASE_URL}/api/archer/${archerID}/competitions`).then(
      handleResponse
    ),

  // Score endpoints
  // getScores: () => fetch(`${API_BASE_URL}/scores`).then(handleResponse),

  // getScoreDetails: (id) =>
  //   fetch(`${API_BASE_URL}/scores/${id}`).then(handleResponse),

  // submitScore: (scoreData) =>
  //   fetch(`${API_BASE_URL}/scores`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(scoreData),
  //   }).then(handleResponse),

  // Competition endpoints
  getCompetitions: () =>
    fetch(`${API_BASE_URL}/api/competitions`).then(handleResponse),

  getCompetitionRounds: (competitionID) =>
    fetch(`${API_BASE_URL}/api/competition/${competitionID}/rounds`).then(
      handleResponse
    ),

  getRoundRanking: (competitionID, roundID) =>
    fetch(
      `${API_BASE_URL}/api/competition/${competitionID}/round/${roundID}/ranking`
    ).then(handleResponse),

  getRoundRanges: (roundID) =>
    fetch(`${API_BASE_URL}/api/round/${roundID}/ranges`).then(handleResponse),

  checkEligibility: (participationID, roundID) =>
    fetch(
      `${API_BASE_URL}/api/archer/round/eligibility?participationID=${participationID}&roundID=${roundID}`
    ).then(handleResponse),

  submitEndScore: (endScoreData) =>
    fetch(`${API_BASE_URL}/api/archer/round/endscore-staging`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(endScoreData),
    }).then(handleResponse),

  // Recorder endpoints
  getPendingScores: () =>
    fetch(`${API_BASE_URL}/scores/pending`).then(handleResponse),

  verifyScore: (id, verificationData) =>
    fetch(`${API_BASE_URL}/scores/${id}/verify`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verificationData),
    }).then(handleResponse),

  confirmEndScore: (endScoreData) =>
    fetch(`${API_BASE_URL}/api/recorder/round/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(endScoreData),
    }).then(handleResponse),
};

export const API_ENDPOINTS = {
  AUTH: {
    ARCHER_LOGIN: "/api/archer/login",
    RECORDER_LOGIN: "/api/recorder/login",
    LOGOUT: "/auth/logout",
  },
  ARCHERS: {
    LIST: "/archers",
    DETAIL: "/archers/:id",
    COMPETITIONS: "/api/archer/:archerID/competitions",
  },
  SCORES: {
    LIST: "/scores",
    DETAIL: "/scores/:id",
    PENDING: "/scores/pending",
    CREATE: "/scores",
    VERIFY: "/scores/:id/verify",
  },
};
