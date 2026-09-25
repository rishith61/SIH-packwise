import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AnnouncerProvider } from './context/AnnouncerContext';
import { WizardProvider } from './context/WizardContext';
import PackWiseBridge from './components/PackWiseBridge';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './pages/LandingPage';
import WizardLayout from './pages/wizard/WizardLayout';
import CommodityStep from './pages/wizard/CommodityStep';
import ProfileStep from './pages/wizard/ProfileStep';
import ConditionsStep from './pages/wizard/ConditionsStep';
import PrioritiesStep from './pages/wizard/PrioritiesStep';
import RunningStep from './pages/wizard/RunningStep';
import ResultPage from './pages/wizard/ResultPage';
import ReportPage from './pages/wizard/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AnnouncerProvider>
        <WizardProvider>
          <PackWiseBridge />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<WizardLayout />}>
              <Route index element={<Navigate to="commodity" replace />} />
              <Route path="commodity" element={<CommodityStep />} />
              <Route path="profile" element={<ProfileStep />} />
              <Route path="conditions" element={<ConditionsStep />} />
              <Route path="priorities" element={<PrioritiesStep />} />
              <Route path="running" element={<RunningStep />} />
              <Route path="result" element={<ResultPage />} />
              <Route path="report" element={<ReportPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WizardProvider>
      </AnnouncerProvider>
    </BrowserRouter>
  );
}
