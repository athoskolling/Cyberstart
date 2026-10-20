import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Database, Download, HardDrive, Palette, RotateCcw, ShieldCheck, Trash2, Upload, User } from 'lucide-react'
import { CATEGORY_LABEL } from '../data'
import { useData, useStore, useToast } from '../store'
import { emptyData } from '../lib/defaults'
import { demoData } from '../lib/demo'
import { requestPersistence, storageEstimate } from '../lib/db'
import { ImportError, buildExport, parseImport } from '../lib/validate'
import { dayKey } from '../lib/dates'
import { Callout, Field, PageHead, Seg, download, useConfirm } from '../ui/ui'
import type { Accent, AppData, Category } from '../types'

const ACCENTS: { value: Accent; label: string; color: string }[] = [
  { value: 'violeta', label: 'Violeta', color: '#8b5cf6' },
  { value: 'magenta', label: 'Magenta', color: '#e05ad8' },
  { value: 'ciano', label: 'Ciano', color: '#22c3e0' },
  { value: 'esmeralda', label: 'Esmeralda', color: '#10b981' },
]
const LABELS: Record<string, string> = {
  attempts: 'tentativas', sessions: 'sessões', notes: 'notas', userCards: 'cartões', projects: 'projetos', jobs: 'vagas', interview: 'respostas de entrevista', activity: 'registros de atividade', customResources: 'recursos próprios',
}

export default function SettingsPage() {
  const d = useData()
  const { setSettings, replaceAll } = useStore()
  const { toast } = useToast()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)
  const [est, setEst] = useState<Awaited<ReturnType<typeof storageEstimate>>>(null)
  const [name, setName] = useState(d.settings.name)
  const s = d.settings

  useEffect(() => { storageEstimate().then(setEst).catch(() => setEst(null)) }, [])
  useEffect(() => {
    if (location.hash.includes('dados')) document.getElementById('dados')?.scrollIntoView()
  }, [])

  const exportJson = () => {
    download(`cyberstart-backup-${dayKey()}.json`, JSON.stringify(buildExport(d), null, 2))
    toast('Backup exportado')
  }

  const onImport = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast('Arquivo grande demais (máx. 20 MB).', 'erro')
    let parsed: ReturnType<typeof parseImport>
    try {
      parsed = parseImport(await file.text())
    } catch (e) {
      return toast(e instanceof ImportError ? e.message : 'Não foi possível ler o arquivo.', 'erro')
    }
    const summary = Object.entries(parsed.summary).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${LABELS[k] ?? k}`).join(', ')
    const ok = await confirm.ask({
      title: 'Substituir os dados atuais?',
      body: (
        <>
          O backup contém: {summary || 'apenas configurações e progresso'}.<br />
          <strong>Todos os dados atuais deste dispositivo serão substituídos.</strong> Exporte um backup antes se quiser guardá-los.
        </>
      ),
      confirm: 'Importar e substituir',
      danger: true,
    })
    if (!ok) return
    try {
      await replaceAll(parsed.data)
      toast('Backup importado com sucesso')
    } catch {
      toast('Falha ao gravar os dados importados. Nada foi alterado.', 'erro')
    }
  }

  const reset = async (kind: 'demo' | 'apagar') => {
    const ok = await confirm.ask({
      title: kind === 'demo' ? 'Carregar dados de demonstração?' : 'Apagar todos os dados locais?',
      body:
        kind === 'demo'
          ? 'Seus dados atuais serão SUBSTITUÍDOS por um exemplo fictício, marcado com um aviso. Exporte um backup antes se quiser guardá-los.'
          : 'Progresso, notas, sessões, projetos, vagas e configurações deste dispositivo serão apagados permanentemente. Exporte um backup antes se quiser guardá-los.',
      confirm: kind === 'demo' ? 'Carregar demonstração' : 'Apagar tudo',
      danger: true,
    })
    if (!ok) return
    const keep = { theme: s.theme, accent: s.accent, density: s.density, animations: s.animations }
    const data: AppData = kind === 'demo' ? demoData() : emptyData()
    data.settings = { ...data.settings, ...keep }
    await replaceAll(data).catch(() => toast('Falha ao gravar. Nada foi alterado.', 'erro'))
    setName(data.settings.name)
    toast(kind === 'demo' ? 'Dados de demonstração carregados' : 'Dados apagados. Começando do zero.')
  }

  const fmtMB = (b: number) => `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
  const toggleCat = (c: Category) => setSettings({ priorityCategories: s.priorityCategories.includes(c) ? s.priorityCategories.filter((x) => x !== c) : [...s.priorityCategories, c] })

  return (
    <>
      <PageHead title="Configurações" desc="Preferências deste dispositivo e controle total sobre os seus dados." />
      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card stack-sm" style={{ gap: 14 }} aria-labelledby="h-perfil">
            <div className="card-head" style={{ marginBottom: 0 }}><div className="icon-tile"><User size={18} /></div><h2 id="h-perfil">Perfil e ritmo</h2></div>
            <Field label="Nome ou apelido (opcional)" hint="Usado só na saudação. Fica neste dispositivo.">
              <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={() => setSettings({ name: name.trim() })} />
            </Field>
            <Field label="Idioma da interface" hint="Por enquanto, apenas português (Brasil). Termos técnicos ficam em inglês quando é o uso comum.">
              <select className="select" value="pt-BR" disabled><option value="pt-BR">Português (Brasil)</option></select>
            </Field>
            <Field label={`Horas de estudo por semana: ${s.weeklyHours} h`}>
              <input type="range" min={1} max={40} value={s.weeklyHours} onChange={(e) => setSettings({ weeklyHours: Number(e.target.value) })} style={{ accentColor: 'var(--accent)' }} />
            </Field>
            <div className="field">
              <span className="label">Categorias prioritárias (objetivo de carreira)</span>
              <div className="row wrap" style={{ gap: 6 }}>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                  <button key={c} className={`btn sm ${s.priorityCategories.includes(c) ? 'primary' : ''}`} aria-pressed={s.priorityCategories.includes(c)} onClick={() => toggleCat(c)}>{CATEGORY_LABEL[c]}</button>
                ))}
              </div>
              <span className="field-hint">Influenciam a recomendação "Continue estudando" e a sequência do planejador, sempre respeitando pré-requisitos.</span>
            </div>
          </section>

          <section className="card stack-sm" style={{ gap: 14 }} aria-labelledby="h-apar">
            <div className="card-head" style={{ marginBottom: 0 }}><div className="icon-tile magenta"><Palette size={18} /></div><h2 id="h-apar">Aparência</h2></div>
            <div className="field"><span className="label">Tema</span><Seg label="Tema" value={s.theme} onChange={(v) => setSettings({ theme: v })} options={[{ value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }]} /></div>
            <div className="field">
              <span className="label">Cor de destaque</span>
              <div className="row wrap" style={{ gap: 8 }} role="group" aria-label="Cor de destaque">
                {ACCENTS.map((a) => (
                  <button key={a.value} className="btn sm" aria-pressed={s.accent === a.value} onClick={() => setSettings({ accent: a.value })} style={s.accent === a.value ? { borderColor: a.color, boxShadow: `0 0 0 2px ${a.color}55` } : undefined}>
                    <span className="cat-dot" style={{ background: a.color, width: 12, height: 12 }} /> {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><span className="label">Densidade</span><Seg label="Densidade" value={s.density} onChange={(v) => setSettings({ density: v })} options={[{ value: 'confortavel', label: 'Confortável' }, { value: 'compacta', label: 'Compacta' }]} /></div>
            <label className="check"><input type="checkbox" checked={s.animations} onChange={(e) => setSettings({ animations: e.target.checked })} /><span className="small">Animações e transições<br /><span className="xs dim">A preferência de movimento reduzido do sistema é sempre respeitada.</span></span></label>
            <label className="check"><input type="checkbox" checked={s.gamification} onChange={(e) => setSettings({ gamification: e.target.checked })} /><span className="small">Gamificação (XP, níveis, missões e conquistas)<br /><span className="xs dim">Desativar esconde os elementos; o progresso continua sendo registrado.</span></span></label>
            <div className="field">
              <span className="label">Notificações</span>
              <span className="small muted">Não implementadas. O CyberStart não envia notificações fora do navegador — a agenda aparece no Overview quando você abre o app.</span>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card stack-sm" id="dados" style={{ gap: 14 }} aria-labelledby="h-dados">
            <div className="card-head" style={{ marginBottom: 0 }}><div className="icon-tile cyan"><Database size={18} /></div><h2 id="h-dados">Seus dados</h2></div>
            <Callout tone="warn" title="Os dados existem só neste navegador, neste dispositivo">
              Não há conta nem sincronização. Limpar os dados do site, usar outro navegador ou outro aparelho = começar do zero. Exporte backups com frequência.
            </Callout>
            <div className="list-item" style={{ gap: 12 }}>
              <HardDrive size={18} className="dim" />
              <div className="grow small">
                {est ? <>Usando {fmtMB(est.usage)} de {fmtMB(est.quota)} disponíveis.<br /><span className="xs dim">{est.persisted ? 'Armazenamento persistente concedido: o navegador não apaga os dados sozinho.' : 'O navegador pode apagar os dados se faltar espaço.'}</span></> : 'Informação de espaço indisponível neste navegador.'}
              </div>
              {est && !est.persisted && <button className="btn sm" onClick={async () => { const ok = await requestPersistence(); toast(ok ? 'Armazenamento persistente concedido' : 'O navegador não concedeu persistência (comum fora de sites instalados).', ok ? 'ok' : 'info'); setEst(await storageEstimate()) }}>Pedir persistência</button>}
            </div>
            <div className="btn-row">
              <button className="btn primary" onClick={exportJson}><Download size={15} /> Exportar backup (.json)</button>
              <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Importar backup</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onImport(f) }} />
            </div>
            <p className="xs dim">O backup é validado antes de importar: formato, versão, identificadores e tamanho. Backups de versões antigas passam por migração automática; os de versões mais novas são recusados.</p>
          </section>

          <section className="card stack-sm" style={{ gap: 14 }} aria-labelledby="h-priv">
            <div className="card-head" style={{ marginBottom: 0 }}><div className="icon-tile ok"><ShieldCheck size={18} /></div><h2 id="h-priv">Privacidade e segurança</h2></div>
            <ul className="list small muted" style={{ gap: 6, paddingLeft: 18, listStyle: 'disc' }}>
              <li>Nada é enviado para servidores: não há backend, analytics nem chaves de API.</li>
              <li>Links externos abrem em nova aba com <code>noopener noreferrer</code>.</li>
              <li>Notas em Markdown são renderizadas sem HTML — nenhum código salvo é executado.</li>
              <li>Desafios são corrigidos comparando respostas com gabaritos; nada é executado com <code>eval</code>.</li>
              <li>Exportações CSV neutralizam fórmulas (proteção contra CSV injection).</li>
            </ul>
          </section>

          <section className="card stack-sm" style={{ gap: 14, borderColor: 'rgba(248,113,113,0.25)' }} aria-labelledby="h-zona">
            <div className="card-head" style={{ marginBottom: 0 }}><div className="icon-tile" style={{ background: 'var(--err-soft)', color: 'var(--err)', borderColor: 'rgba(248,113,113,.25)' }}><AlertTriangle size={18} /></div><h2 id="h-zona">Zona de cuidado</h2></div>
            <div className="row between wrap">
              <div className="small"><strong>Dados de demonstração</strong><br /><span className="xs muted">Substitui tudo por um exemplo fictício, útil para conhecer a interface.</span></div>
              <button className="btn" onClick={() => reset('demo')}><RotateCcw size={15} /> Carregar demo</button>
            </div>
            <div className="divider" style={{ margin: 0 }} />
            <div className="row between wrap">
              <div className="small"><strong>Apagar dados locais</strong><br /><span className="xs muted">Remove tudo deste dispositivo. Não pode ser desfeito.</span></div>
              <button className="btn danger" onClick={() => reset('apagar')}><Trash2 size={15} /> Apagar tudo</button>
            </div>
          </section>
        </div>
      </div>
      {confirm.node}
    </>
  )
}
