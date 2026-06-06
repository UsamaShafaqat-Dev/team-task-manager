import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TaskModal from "../components/TaskModal";
import api from "../api/axios";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // NAYI STATE: Edit Team Modal ke liye
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");

  const [newTeamName, setNewTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("all");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingTask, setEditingTask] = useState(null);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [teamsRes, tasksRes] = await Promise.all([
        api.get("/teams"),
        api.get("/tasks"),
      ]);

      const teamsWithMembers = await Promise.all(
        teamsRes.data.map(async (team) => {
          try {
            const membersRes = await api.get(`/teams/${team.id}/members`);
            return { ...team, members: membersRes.data };
          } catch (err) {
            return { ...team, members: [] };
          }
        }),
      );

      setTeams(teamsWithMembers);
      setTasks(tasksRes.data);

      const today = new Date().toISOString().split("T")[0];
      const pendingDueTasks = tasksRes.data.filter(
        (t) =>
          t.status !== "Completed" &&
          t.due_date &&
          t.due_date.split("T")[0] === today,
      );

      if (pendingDueTasks.length > 0) {
        toast(
          `Reminder: You have ${pendingDueTasks.length} task(s) due today! ⏰`,
          { id: "due-reminder", duration: 5000, icon: "📅" },
        );
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Unauthorized access! Please login first.", {
          id: "unauth-toast",
        });
        navigate("/login");
      } else {
        toast.error("Failed to load dashboard data", { id: "fetch-toast" });
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // FAST UPDATE: Create Team
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error("Team name is required!");
      return;
    }

    try {
      const res = await api.post("/teams", { name: newTeamName });
      toast.success("Team created successfully! 🚀");
      // UI ko fauran update karein bina reload ke
      setTeams([...teams, { ...res.data.team, members: [] }]);
      setIsTeamModalOpen(false);
      setNewTeamName("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create team");
    }
  };

  // NAYA FUNCTION: Manage/Edit Team
  const openEditTeamModal = (team) => {
    setTeamToEdit(team);
    setEditTeamName(team.name);
    setIsEditTeamModalOpen(true);
  };

  const handleEditTeamSubmit = async (e) => {
    e.preventDefault();
    if (!editTeamName.trim()) return;

    try {
      const res = await api.put(`/teams/${teamToEdit.id}`, {
        name: editTeamName,
      });
      toast.success("Team updated successfully! ✨");
      // UI ko fauran update karein
      setTeams(
        teams.map((t) =>
          t.id === teamToEdit.id ? { ...t, name: editTeamName } : t,
        ),
      );
      setIsEditTeamModalOpen(false);
      setTeamToEdit(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update team");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Logged out successfully 👋");
      navigate("/login");
    } catch (err) {
      toast.error("Failed! Please restart backend server");
    }
  };

  // FAST UPDATE: Delete Task
  const executeDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      toast.success("Task deleted successfully! 🗑️");
      // UI ko fauran update karein
      setTasks(tasks.filter((task) => task.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  // FAST UPDATE: Delete Team
  const executeDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await api.delete(`/teams/${teamToDelete.id}`);
      toast.success("Team deleted successfully! 🗑️");
      // UI ko fauran update karein
      setTeams(teams.filter((t) => t.id !== teamToDelete.id));
      setTeamToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete team");
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openAddMemberModal = (teamId) => {
    setSelectedTeamId(teamId);
    setNewMemberEmail("");
    setIsAddMemberModalOpen(true);
  };

  // FAST UPDATE: Add Member
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      toast.error("User email is required!");
      return;
    }

    try {
      await api.post(`/teams/${selectedTeamId}/members`, {
        email: newMemberEmail,
      });
      toast.success("Member added to team successfully! 👥");

      // UI ko fauran update karein
      setTeams(
        teams.map((team) => {
          if (team.id === selectedTeamId) {
            // Fake member object for instant UI update (will be corrected on next full refresh)
            return {
              ...team,
              members: [
                ...team.members,
                {
                  id: Date.now(),
                  email: newMemberEmail,
                  full_name: newMemberEmail.split("@")[0],
                },
              ],
            };
          }
          return team;
        }),
      );

      setIsAddMemberModalOpen(false);
      setNewMemberEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchTeam = true;
    if (selectedTeamFilter === "personal") {
      matchTeam = !task.team_id;
    } else if (selectedTeamFilter !== "all") {
      matchTeam = task.team_id == selectedTeamFilter;
    }

    return matchSearch && matchTeam;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block shadow-[1px_0_15px_rgba(0,0,0,0.03)] z-10 relative">
        <h1 className="text-3xl font-black mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
          TaskMaster
        </h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-300 ${activeTab === "dashboard" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border-l-4 border-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-300 ${activeTab === "teams" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border-l-4 border-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              My Teams
            </div>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-300 ${activeTab === "tasks" ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border-l-4 border-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              All Tasks
            </div>
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {activeTab === "dashboard" && "Overview"}
            {activeTab === "teams" && "Team Management"}
            {activeTab === "tasks" && "Task Directory"}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={handleCreateClick}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              + Create Task
            </button>
            <button
              onClick={handleLogout}
              className="bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(activeTab === "dashboard" || activeTab === "teams") && (
            <div
              className={`bg-transparent ${activeTab === "teams" ? "lg:col-span-3" : ""}`}
            >
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-xl font-bold text-slate-800">
                  Your Workspaces
                </h3>
                <button
                  onClick={() => setIsTeamModalOpen(true)}
                  className="text-blue-600 text-sm font-bold hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Team
                </button>
              </div>
              <div
                className={`space-y-4 ${activeTab === "teams" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 space-y-0" : ""}`}
              >
                {teams.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center col-span-full">
                    <p className="text-slate-500 font-medium">
                      No workspaces yet. Create one to collaborate!
                    </p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">
                              {team.name}
                            </h4>
                            {/* NAYA BUTTON: Edit Team */}
                            <button
                              onClick={() => openEditTeamModal(team)}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit Team Name"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 font-medium">
                            Created{" "}
                            {new Date(team.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => openAddMemberModal(team.id)}
                            className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
                            title="Add Member to Team"
                          >
                            + Invite
                          </button>
                          <button
                            onClick={() => setTeamToDelete(team)}
                            className="text-[11px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                            title="Delete Team"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                          Team Members ({team.members?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {team.members && team.members.length > 0 ? (
                            team.members.map((member) => (
                              <span
                                key={member.id}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl shadow-sm"
                              >
                                {member.full_name || member.email}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-dashed border-slate-200">
                              No members yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(activeTab === "dashboard" || activeTab === "tasks") && (
            <div
              className={`bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${activeTab === "tasks" ? "lg:col-span-3" : "lg:col-span-2"}`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h3 className="text-xl font-bold text-slate-800 w-full sm:w-auto">
                  Recent Tasks
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <select
                      value={selectedTeamFilter}
                      onChange={(e) => setSelectedTeamFilter(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer transition-all"
                    >
                      <option value="all">All Workspaces</option>
                      <option value="personal">Personal (No Team)</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    <p className="text-slate-500 font-medium">
                      No matching tasks found. You're all caught up! 🎉
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:border-slate-200 transition-all duration-300 group"
                    >
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-800 line-clamp-1">
                          {task.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                          {task.description ||
                            "No additional description provided."}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg ${task.status === "Completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                        >
                          {task.status || "Pending"}
                        </span>
                        <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
        refreshData={fetchDashboardData}
      />

      {/* CREATE TEAM MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-extrabold text-slate-800">
                Create New Workspace
              </h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            <form onSubmit={handleCreateTeamSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                  placeholder="e.g., Marketing Squad"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {isEditTeamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-extrabold text-slate-800">
                Edit Workspace Name
              </h3>
              <button
                onClick={() => setIsEditTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            <form onSubmit={handleEditTeamSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditTeamModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-800">
                Invite Team Member
              </h3>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            <form onSubmit={handleAddMemberSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  User Email Address
                </label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder-slate-400"
                  placeholder="e.g., ali@gmail.com"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TASK MODAL */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-3">
                Delete Task?
              </h3>
              <p className="text-slate-500 mb-8 font-medium">
                Are you sure you want to delete <br />
                <span className="font-bold text-slate-700">
                  "{taskToDelete.title}"
                </span>
                ?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="w-full px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteTask}
                  className="w-full px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 hover:shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TEAM MODAL */}
      {teamToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-3">
                Delete Workspace?
              </h3>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                You are about to delete{" "}
                <span className="font-bold text-slate-700">
                  "{teamToDelete.name}"
                </span>
                . All its internal data will be permanently removed!
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setTeamToDelete(null)}
                  className="w-full px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteTeam}
                  className="w-full px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 hover:shadow-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
