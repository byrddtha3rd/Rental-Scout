import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoadingScreen } from "./components/Ui";
import { useApp } from "./context/AppContext";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DataTransferPage } from "./pages/DataTransferPage";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { PropertyFormPage } from "./pages/PropertyFormPage";
import { PropertyListPage } from "./pages/PropertyListPage";
import { TripPlannerPage } from "./pages/TripPlannerPage";

export default function App() {
  const { authLoading, localMode, session } = useApp();
  if (authLoading) return <LoadingScreen />;
  if (!localMode && !session) return <AuthPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="properties" element={<PropertyListPage />} />
        <Route path="properties/new" element={<PropertyFormPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/:id/edit" element={<PropertyFormPage />} />
        <Route path="trip" element={<TripPlannerPage />} />
        <Route path="data" element={<DataTransferPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
