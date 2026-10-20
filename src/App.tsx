import { useEffect, type ReactNode } from 'react'
import { HashRouter, Route, Routes, Link } from 'react-router-dom'
import { Compass, DatabaseZap } from 'lucide-react'
import { StoreProvider, useData } from './store'
import { Layout } from './ui/Layout'
import { Empty } from './ui/ui'
import Overview from './pages/Overview'
import Roadmap from './pages/Roadmap'
import ModulePage from './pages/ModulePage'
import Study from './pages/Study'
import Resources from './pages/Resources'
import Labs, { LabPage } from './pages/Labs'
import Challenges, { ChallengePage } from './pages/Challenges'
import Review from './pages/Review'
import Planner from './pages/Planner'
import Notes from './pages/Notes'
import Projects, { ProjectPage } from './pages/Projects'
import Career from './pages/Career'
import Achievements from './pages/Achievements'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'

function ThemeSync({ children }: { children: ReactNode }) {
  const s = useData().settings
  useEffect(() => {
    const el = document.documentElement
    el.dataset.theme = s.theme
    el.dataset.accent = s.accent
    el.dataset.density = s.density
    el.dataset.motion = s.animations ? 'on' : 'off'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.theme === 'dark' ? '#0a0913' : '#f5f4fa')
  }, [s.theme, s.accent, s.density, s.animations])
  return <>{children}</>
}

function Loading() {
  return (
    <div style={{ padding: 32, display: 'grid', gap: 16, maxWidth: 1200, margin: '0 auto' }} aria-busy="true" aria-label="Carregando seus dados">
      <div className="skeleton" style={{ height: 38, width: 280 }} />
      <div className="skeleton" style={{ height: 18, width: 420 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
        {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <Empty icon={<Compass size={22} />} title="Página não encontrada" action={<Link className="btn primary" to="/">Voltar ao início</Link>}>
      O endereço não corresponde a nenhuma página do CyberStart.
    </Empty>
  )
}

export default function App() {
  return (
    <StoreProvider
      fallback={(s) =>
        s.status === 'loading' ? (
          <Loading />
        ) : (
          <div style={{ padding: 32, maxWidth: 640, margin: '10vh auto' }}>
            <Empty icon={<DatabaseZap size={22} />} title="Não foi possível abrir o armazenamento local">
              {s.status === 'error' ? s.message : ''} Tente abrir em uma janela normal (não anônima) ou permitir dados de sites nas configurações do navegador.
            </Empty>
          </div>
        )
      }
    >
      <ThemeSync>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/roadmap/:id" element={<ModulePage />} />
              <Route path="/estudar/:id" element={<Study />} />
              <Route path="/recursos" element={<Resources />} />
              <Route path="/laboratorios" element={<Labs />} />
              <Route path="/laboratorios/:id" element={<LabPage />} />
              <Route path="/desafios" element={<Challenges />} />
              <Route path="/desafios/:id" element={<ChallengePage />} />
              <Route path="/revisao" element={<Review />} />
              <Route path="/plano" element={<Planner />} />
              <Route path="/notas" element={<Notes />} />
              <Route path="/projetos" element={<Projects />} />
              <Route path="/projetos/:id" element={<ProjectPage />} />
              <Route path="/carreira" element={<Career />} />
              <Route path="/conquistas" element={<Achievements />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </HashRouter>
      </ThemeSync>
    </StoreProvider>
  )
}
