import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const TaskModal = ({ isOpen, onClose, taskToEdit, refreshData }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "Pending",
    teamId: "",
    assigned_to: "", // Naya field Assignee ke liye
  });

  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]); // Selected team ke members yahan aayenge

  // Modal open hone par User ki Teams fetch karna
  useEffect(() => {
    if (isOpen) {
      api
        .get("/teams")
        .then((res) => setTeams(res.data))
        .catch((err) => console.error("Failed to load teams for modal", err));
    }
  }, [isOpen]);

  // Task Edit ya Create ke liye form data set karna
  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title || "",
        description: taskToEdit.description || "",
        dueDate: taskToEdit.due_date ? taskToEdit.due_date.split("T")[0] : "",
        status: taskToEdit.status || "Pending",
        teamId: taskToEdit.team_id || "",
        assigned_to: taskToEdit.assigned_to || "", // Pehle se assigned member
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        status: "Pending",
        teamId: "",
        assigned_to: "",
      });
    }
  }, [taskToEdit, isOpen]);

  // JAISE HI TEAM SELECT HO, USKE MEMBERS FETCH KAREIN (Cascading Dropdown Logic)
  useEffect(() => {
    if (formData.teamId) {
      api
        .get(`/teams/${formData.teamId}/members`)
        .then((res) => setTeamMembers(res.data))
        .catch((err) => console.error("Failed to fetch team members", err));
    } else {
      setTeamMembers([]);
      setFormData((prev) => ({ ...prev, assigned_to: "" })); // Team hatayen toh assignee bhi clear ho jaye
    }
  }, [formData.teamId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Task title is required!");
      return;
    }

    setLoading(true);
    try {
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, formData);
        toast.success("Task updated successfully! ✨");
      } else {
        await api.post("/tasks", formData);
        toast.success("Task created successfully! 🎉");
      }

      refreshData();
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to ${taskToEdit ? "update" : "create"} task`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-extrabold text-gray-800">
            {taskToEdit ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="e.g., Design Homepage UI"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none"
              rows="3"
              placeholder="Task details..."
            ></textarea>
          </div>

          {/* DYNAMIC GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Assign Team
              </label>
              <select
                value={formData.teamId}
                onChange={(e) =>
                  setFormData({ ...formData, teamId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">Personal Task (No Team)</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ASSIGN MEMBER DROPDOWN - Sirf tab aayega jab team select ho */}
            {formData.teamId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assign To (Member)
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_to: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            {taskToEdit && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-400"
            >
              {loading ? "Saving..." : taskToEdit ? "Update Task" : "Save Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
