import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AboutPage } from './pages/AboutPage'
import { ArchivePage } from './pages/ArchivePage'
import { FramePage } from './pages/FramePage'
import { AuthVerifyPage } from './pages/AuthVerifyPage'
import { DashboardPage } from './pages/DashboardPage'
import { FramePrototypePage } from './prototype/frame/FramePrototypePage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/prototype/frame" element={<FramePrototypePage />} />
        <Route path="/auth/verify" element={<AuthVerifyPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/onboarding" element={<DashboardPage />} />
        <Route path="/m/:slug" element={<FramePage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* /me (giver profile) arrives with identity claiming (B4/B6). */}
        <Route path="/me" element={<DashboardPage />} />
        <Route path="/:slug" element={<ArchivePage />} />
      </Routes>
    </BrowserRouter>
  )
}
