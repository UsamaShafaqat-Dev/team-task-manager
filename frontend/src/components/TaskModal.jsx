const TaskModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-extrabold text-gray-800">Create New Task</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
              placeholder="e.g., Design Homepage UI" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none" 
              rows="3"
              placeholder="Task details..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Team</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                <option>Frontend Devs</option>
                <option>Backend Devs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;