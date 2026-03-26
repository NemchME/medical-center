import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

import { HomePage } from '@/pages/public/HomePage';
import { DoctorsPage } from '@/pages/public/DoctorsPage';
import { ServicesPage } from '@/pages/public/ServicesPage';
import { CentersPage } from '@/pages/public/CentersPage';
import { TestsPage } from '@/pages/public/TestsPage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

import { ProfilePage } from '@/pages/patient/ProfilePage';
import { AppointmentsPage } from '@/pages/patient/AppointmentsPage';
import { MedCardPage } from '@/pages/patient/MedCardPage';
import { PrescriptionsPage } from '@/pages/patient/PrescriptionsPage';
import { TestResultsPage } from '@/pages/patient/TestResultsPage';

import { SchedulePage } from '@/pages/doctor/SchedulePage';
import { DoctorPatientsPage } from '@/pages/doctor/DoctorPatientsPage';
import { DoctorProfilePage } from '@/pages/doctor/DoctorProfilePage';

import { AdminPatientsPage } from '@/pages/admin/AdminPatientsPage';
import { AdminAppointmentsPage } from '@/pages/admin/AdminAppointmentsPage';
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/centers" element={<CentersPage />} />
            <Route path="/tests" element={<TestsPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<DashboardLayout />}>

            <Route path="/patient/profile" element={<ProfilePage />} />
            <Route path="/patient/appointments" element={<AppointmentsPage />} />
            <Route path="/patient/med-card" element={<MedCardPage />} />
            <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/patient/test-results" element={<TestResultsPage />} />

   
            <Route path="/doctor/schedule" element={<SchedulePage />} />
            <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
            <Route path="/doctor/profile" element={<DoctorProfilePage />} />

  
            <Route path="/admin/patients" element={<AdminPatientsPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
