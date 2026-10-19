import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './guards';
import { AppLayout } from '../components/layout/AppLayout';
import LandingPage from '../pages/public/LandingPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import GoogleCallbackPage from '../pages/auth/GoogleCallbackPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import SelectActivityPage from '../pages/activities/SelectActivityPage';
import SelectCategoryPage from '../pages/activities/SelectCategoryPage';
import InputActivityPage from '../pages/activities/InputActivityPage';
import ResultPage from '../pages/emissions/ResultPage';
import HistoryPage from '../pages/emissions/HistoryPage';
import ImpactPage from '../pages/emissions/ImpactPage';
import ImpactDetailPage from '../pages/emissions/ImpactDetailPage';
import ItemDetailPage from '../pages/emissions/ItemDetailPage';
import RecommendationsPage from '../pages/recommendations/RecommendationsPage';
import RecommendationDetailPage from '../pages/recommendations/RecommendationDetailPage';
import AskAiPage from '../pages/recommendations/AskAiPage';
import ChallengesPage from '../pages/challenges/ChallengesPage';
import ProgressPage from '../pages/progress/ProgressPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google" element={<GoogleCallbackPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calculator" element={<SelectActivityPage />} />
        <Route path="/calculator/result" element={<ResultPage />} />
        <Route path="/calculator/:activity" element={<SelectCategoryPage />} />
        <Route path="/calculator/:activity/:subType" element={<InputActivityPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/impact" element={<ImpactPage />} />
        <Route path="/impact/:slug" element={<ImpactDetailPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/recommendations/:id" element={<RecommendationDetailPage />} />
        <Route path="/ask-ai" element={<AskAiPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
