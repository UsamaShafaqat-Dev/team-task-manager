import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TaskModal from "../components/TaskModal";
import api from "../api/axios";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false); // Team Modal State
  const [newTeamName, setNewTeamName] = useState(""); // Team Name Input State
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [teamsRes, tasksRes] = await Promise.all([
          api.get("/teams"),
          api.get("/tasks"),
        ]);

        setTeams(teamsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error("Unauthorized access! Please login first.");
          navigate("/login");
        } else {
          toast.error("Failed to load dashboard data");
        }
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Naya Custom Modal Submit Logic
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error("Team name is required!");
      return;
    }

    try {
      await api.post("/teams", { name: newTeamName });
      toast.success("Team created successfully! 🚀");

      const res = await api.get("/teams");
      setTeams(res.data);

      setIsTeamModalOpen(false); // Modal band karo
      setNewTeamName(""); // Input clear karo
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create team");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden md:block">
        <h1 className="text-2xl font-black text-blue-600 mb-10">TaskMaster</h1>
        <nav className="space-y-3">
          <a
            href="#"
            className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-bold transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            My Teams
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            All Tasks
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800">Dashboard</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
            >
              + Create Task
            </button>
            <Link
              to="/login"
              className="bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-bold hover:bg-red-100 transition-colors"
            >
              Logout
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Your Teams</h3>
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                + New Team
              </button>
            </div>
            <div className="space-y-3">
              {teams.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-2 text-center">
                  No teams yet. Create one!
                </p>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <h4 className="font-bold text-gray-700">{team.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(team.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Tasks</h3>
              <input
                type="text"
                placeholder="Search tasks..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-gray-200 rounded-xl">
                  No tasks assigned. You're all caught up!
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-bold text-gray-800">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description
                          ? task.description.substring(0, 50) + "..."
                          : "No description"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${task.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {task.status || "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Task Modal */}
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* New Team Custom Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-extrabold text-gray-800">
                Create Team
              </h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTeamSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="e.g., Backend Devs"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
