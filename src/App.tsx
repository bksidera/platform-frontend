import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ArchivePage } from './pages/ArchivePage'
import { MonumentPage } from './pages/MonumentPage'
import { MomentFlowPage } from './pages/MomentFlowPage'
import { AuthVerifyPage } from './pages/AuthVerifyPage'
import { DashboardPage } from './pages/DashboardPage'
import { MonumentPrototypePage } from './prototype/MonumentPrototypePage'
import { CardStackPrototypePage } from './prototype/cards/CardStackPrototypePage'
import { FramePrototypePage } from './prototype/frame/FramePrototypePage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/prototype/monument" element={<MonumentPrototypePage />} />
        <Route path="/prototype/cards" element={<CardStackPrototypePage />} />
        <Route path="/prototype/frame" element={<FramePrototypePage />} />
        <Route path="/auth/verify" element={<AuthVerifyPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/onboarding" element={<DashboardPage />} />
        <Route path="/m/:slug" element={<MonumentPage />} />
        <Route path="/give/:slug" element={<MomentFlowPage />} />
        {/* /me (giver profile) arrives with identity claiming (B4/B6). */}
        <Route path="/me" element={<DashboardPage />} />
        <Route path="/:slug" element={<ArchivePage />} />
      </Routes>
    </BrowserRouter>
  )
}
