import axios from "axios";

const api = axios.create({
  baseURL: "https://team-task-manager-mvgm.onrender.com", // Hamara Node.js backend server
  withCredentials: true, // PDF Req: PassportJS session cookies allow karne ke liye zaroori hai
});

export default api;
