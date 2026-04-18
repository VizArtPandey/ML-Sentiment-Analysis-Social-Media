import { Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home      from './pages/Home'
import Dashboard from './pages/Dashboard'
import About     from './pages/About'
import LiveEval  from './pages/LiveEval'
import { healthCheck } from './lib/api'

const NAV_LINKS = [
  { to: '/',          label: 'Analyze',   icon: '⚡' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/live-eval', label: 'Live Eval', icon: '🐦' },
  { to: '/about',     label: 'About',     icon: 'ℹ️'  },
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
    <nav className={`fixed top-0 inset-x-0 z-50 nav-glass border-b transition-shadow duration-200
                     ${scrolled ? 'shadow-md border-slate-200' : 'border-slate-200/60'}`}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-200">
            SA
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-sm text-gray-900 tracking-tight">SentimentAI</span>
            <span className="text-xs text-slate-400 ml-1.5">Social Media Analysis</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-1.5
                 ${isActive
                   ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                   : 'text-gray-500 hover:text-gray-900 hover:bg-slate-100'}`
              }
            >
              <span className="hidden sm:inline text-base leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>

        {/* API status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0
                         ${apiStatus === 'online'
                           ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                           : apiStatus === 'offline'
                           ? 'bg-red-50 border-red-200 text-red-600'
                           : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full
                            ${apiStatus === 'online'  ? 'bg-emerald-500 animate-pulse' :
                              apiStatus === 'offline' ? 'bg-red-400' : 'bg-slate-400 animate-pulse'}`} />
          <span className="hidden sm:inline">
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
      <main className="pt-14 min-h-screen">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-eval" element={<LiveEval />} />
          <Route path="/about"     element={<About />} />
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
