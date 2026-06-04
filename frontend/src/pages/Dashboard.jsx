import { useState } from 'react';
import { Link } from 'react-router-dom';
import TaskModal from '../components/TaskModal';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden md:block">
        <h1 className="text-2xl font-black text-blue-600 mb-10">TaskMaster</h1>
        <nav className="space-y-3">
          <a href="#" className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-bold transition-colors">Dashboard</a>
          <a href="#" className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">My Teams</a>
          <a href="#" className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">All Tasks</a>
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
            <Link to="/login" className="bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-bold hover:bg-red-100 transition-colors">Logout</Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Your Teams</h3>
              <button className="text-blue-600 text-sm font-bold hover:underline">+ New Team</button>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700">Frontend Devs</h4>
                <p className="text-xs text-gray-500 mt-1">3 members</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Recent Tasks</h3>
              <input type="text" placeholder="Search tasks..." className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div className="space-y-4">
              <div className="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-bold text-gray-800">Setup UI Architecture</h4>
                  <p className="text-sm text-gray-500 mt-1">Assigned to: Usama • Team: Frontend Devs</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Render Modal Component */}
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;