import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProsumerRegisterPage from "./pages/ProsumerRegisterPage";
import LoginPage from "./pages/LoginPage";
import BackofficeDashboard from "./pages/BackofficeDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import ProtectedLayout from "./components/ProtectedLayout";

// Defines the public pages and the role-protected dashboards.
function App() {
  return (
    <Routes>
      {/* Public Marketing & Prosumer Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<ProsumerRegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Operations Consoles */}
      <Route element={<ProtectedLayout allowedRoles={["Backoffice"]} />}>
        <Route path="/backoffice" element={<BackofficeDashboard />} />
      </Route>

      <Route element={<ProtectedLayout allowedRoles={["GridOperator"]} />}>
        <Route path="/operator" element={<OperatorDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;