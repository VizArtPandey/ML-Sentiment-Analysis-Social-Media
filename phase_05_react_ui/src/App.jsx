import { Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home     from './pages/Home'
import LiveEval from './pages/LiveEval'
import Project  from './pages/Project'
import { healthCheck } from './lib/api'

const NAV_LINKS = [
  { to: '/',           label: 'Analyse',           icon: '⚡' },
  { to: '/live-eval',  label: 'Twitter Live Eval', icon: '🐦' },
  { to: '/project',    label: 'Project',            icon: '📁' },
]

function Navbar() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [scrolled, setScrolled]   = useState(false)

  useEffect(() => {
    healthCheck().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 nav-glass border-b transition-all duration-300
                     ${scrolled ? 'shadow-lg border-slate-200 h-16' : 'border-slate-200/60 h-18'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center text-white text-sm font-extrabold
                          shadow-lg shadow-indigo-200/60">
            SA
          </div>
          <div className="hidden sm:block">
            <div className="font-extrabold text-base text-gray-900 tracking-tight leading-none">SentimentAI</div>
            <div className="text-xs text-slate-400 mt-0.5">Social Media Analysis</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-2">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2
                 ${isActive
                   ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/60 scale-105'
                   : 'text-slate-600 hover:text-gray-900 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`
              }
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* API status */}
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold border shrink-0
                         ${apiStatus === 'online'
                           ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                           : apiStatus === 'offline'
                           ? 'bg-red-50 border-red-200 text-red-600'
                           : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
          <span className={`w-2 h-2 rounded-full shrink-0
                            ${apiStatus === 'online'  ? 'bg-emerald-500 animate-pulse' :
                              apiStatus === 'offline' ? 'bg-red-400' : 'bg-slate-400 animate-pulse'}`} />
          <span className="hidden sm:inline font-bold">
            {apiStatus === 'checking' ? 'Connecting…' : `API ${apiStatus}`}
          </span>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/live-eval" element={<LiveEval />} />
          <Route path="/project"   element={<Project />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            SentimentAI · CUD Machine Learning Final Project
          </p>
          <p className="text-xs text-slate-400">
            VADER · Logistic Regression · Random Forest · SVM · BiLSTM+Attention
          </p>
        </div>
      </footer>
    </>
  )
}
