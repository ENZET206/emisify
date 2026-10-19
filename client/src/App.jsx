import { BrowserRouter } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CalculatorProvider } from './context/CalculatorContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <CalculatorProvider>
              <AppRoutes />
            </CalculatorProvider>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
