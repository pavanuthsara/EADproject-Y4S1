import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import BackofficeDashboard from "./pages/BackofficeDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import ProtectedLayout from "./components/ProtectedLayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedLayout allowedRoles={["Backoffice"]} />}>
        <Route path="/backoffice" element={<BackofficeDashboard />} />
      </Route>
      
      <Route element={<ProtectedLayout allowedRoles={["GridOperator"]} />}>
        <Route path="/operator" element={<OperatorDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;