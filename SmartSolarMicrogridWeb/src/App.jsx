import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import BackofficeDashboard from "./pages/BackofficeDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/backoffice" element={<BackofficeDashboard />} />
      <Route path="/operator" element={<OperatorDashboard />} />
    </Routes>
  );
}

export default App;