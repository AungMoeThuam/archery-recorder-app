import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";

function LoginRecorder() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // API call to verify recorder credentials
      let data = await api.loginRecorder({
        email,
        password,
      });

      console.log("recorder login - ", data);

      // Store recorder info in localStorage
      localStorage.setItem("userType", "recorder");
      localStorage.setItem("recorderID", data.recorderID);
      localStorage.setItem(
        "recorderName",
        `${data.recorderFirstName} ${data.recorderLastName}`
      );

      // Redirect to recorder dashboard
      navigate("/recorder/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">📋</div>
          <h2 className="text-3xl font-bold text-gray-800">Recorder Login</h2>
          <p className="text-gray-600 mt-2">Verify and confirm archer scores</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="recorder@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login as Recorder"}
          </button>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-green-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-semibold mb-2">
            Demo Credentials:
          </p>
          <p className="text-xs text-gray-500">
            Create a test recorder in DB first
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginRecorder;
