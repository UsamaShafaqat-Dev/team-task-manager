import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        {/* Premium Test Header */}
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-gray-100">
          <h1 className="text-3xl font-extrabold text-blue-600 mb-2">
            Team Task Manager
          </h1>
          <p className="text-gray-500 mb-6">
            Welcome to the assessment project.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Login
            </button>
            <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Register
            </button>
          </div>
        </div>

        {/* Routes Yahan Ayenge */}
        <Routes>
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
