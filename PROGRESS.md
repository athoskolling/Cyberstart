# CyberStart — estado do trabalho (pausa em 20/10/2026, 16h18)

Documento de retomada. Leia antes de continuar.

## Decisões tomadas
- Projeto criado **do zero** (nenhum projeto anterior foi anexado).
- Paleta **violeta/magenta + ciano** (da imagem de referência). Verde esmeralda fica como cor de destaque opcional nas Configurações.
- Destino final: **repositório no GitHub + GitHub Pages**. O repositório ainda não foi informado (sugestão: `athoskolling/cyberstart`, criado vazio).
- Stack: Vite + React 19 + TypeScript (strict) + react-router (HashRouter, para funcionar no Pages) + lucide-react + idb (IndexedDB) + Vitest. Fontes Geist e Geist Mono hospedadas no próprio projeto. Gráficos em SVG próprio (sem biblioteca).

## Como rodar
```bash
npm install
npm run dev      # desenvolvimento
npm test         # 27 testes de lógica e persistência
npm run build    # ainda NÃO compila — ver "Erros conhecidos"
```

## Estrutura
```
src/
  types.ts                 modelo de dados (conteúdo × dados do usuário)
  data/                    conteúdo educacional estático
    roadmap.ts             9 fases, 24 módulos
    lessons-*.ts           64 lições (próprias em 8 partes + externas sinalizadas)
    resources.ts           19 recursos conferidos nas páginas oficiais em 20/10/2026
    challenges.ts          30 desafios (6 tipos), correção declarativa
    labs.ts                7 laboratórios (+ datasets fictícios, IPs RFC 5737)
    cards.ts               ~60 flashcards iniciais em 6 baralhos
    career.ts              matriz de 5 funções, 9 perguntas de entrevista, 7 projetos, 7 modelos de nota, gerador de README
  lib/
    db.ts                  IndexedDB (store "meta" + um store por coleção), migrações por versão
    validate.ts            exportação versionada, importação validada, CSV seguro
    progress.ts            status de módulos, % do roadmap, recomendação determinística
    gamification.ts        XP derivado (com limites diários), níveis, sequência, missões, conquistas
    srs.ts                 repetição espaçada (SM-2 simplificado)
    planner.ts             sequência semanal sugerida + distribuição nos dias preferidos
    grading.ts             correção sem eval, embaralhamento determinístico
    dates.ts, id.ts, defaults.ts
    logic.test.ts          27 testes (todos passando)
  store.tsx                contexto global, gravação imediata no IndexedDB, toasts
  actions.ts               operações de domínio (concluir lição/módulo, tentativas…)
  search.ts                índice da busca global
  ui/                      Layout (sidebar recolhível, topbar, paleta Ctrl+K, atalhos, conquistas), ui.tsx (Modal, Kebab, Confirm, etc.), charts.tsx, markdown.tsx (renderização segura, sem innerHTML)
  components/              Sessions.tsx (modais de sessão), useAutosave.ts
  pages/                   uma página por seção
```

## Implementado (código escrito)
| Área | Estado |
|---|---|
| Fundação visual (tokens, tema escuro/claro, 4 cores de destaque, densidade, movimento reduzido, responsivo) | escrito |
| Persistência IndexedDB + export/import validado + migrações | escrito e **testado** |
| Conteúdo educacional completo (fases 1–9) | escrito e **testado** (integridade de referências) |
| Overview (gauge, Continue estudando com motivo, agenda com ações, radar, 5 métricas, missões, atividade, estados vazios, onboarding) | escrito |
| Roadmap (lista + mapa SVG, filtros fase/dificuldade/status/duração) e página de módulo | escrito |
| Modo de estudo (sumário, notas com autosave, retomada de posição, atalhos `[` `]`, exercícios) | escrito |
| Recursos (busca, 6 filtros, favoritos, status, avaliação, recurso personalizado) | escrito |
| Desafios (6 tipos, dica, feedback por alternativa, histórico, revisão de erros) | escrito |
| Laboratórios (etapas, evidências com autosave, dataset para download) | escrito |
| Revisão / flashcards (SRS, teclado, esquecidos, CRUD de cartões) | escrito |
| Planejador (semana/lista, cronômetro, meta, dias preferidos, sequência recomendada) | escrito |
| Notas (modelos, Markdown com pré-visualização segura, tags, vínculos, favoritos) | escrito |
| Projetos (cards/lista, modelos, checklist, regra de conclusão, README/relatório) | escrito |
| Carreira (kanban de vagas, lacunas, matriz de competências, treino de entrevistas) | escrito |
| Conquistas e Relatórios (filtro de período, exportação CSV) | escrito |

"Escrito" = código pronto, mas a interface **ainda não foi compilada nem aberta no navegador**. Só a camada de lógica foi verificada (testes).

## Falta implementar
1. **`src/pages/Settings.tsx`** (Configurações): nome, tema, destaque, densidade, horas, gamificação, animações, categorias prioritárias, exportar/importar JSON, restaurar demonstração, apagar dados com confirmação, aviso de que os dados ficam só neste dispositivo.
2. **Gerador de dados de demonstração** (marcado com `settings.demo = true`; o banner já existe no Layout).
3. Pequeno ajuste de CSS: `[data-stack]` precisa virar uma coluna só abaixo de 1024px (usado em ModulePage e na aba Entrevistas).
4. `index.html`: título, `lang="pt-BR"`, meta `theme-color`, favicon.
5. Corrigir os erros de compilação abaixo, rodar `npm run build`.
6. Verificação visual com Playwright (desktop e celular), erros de console, persistência após recarregar, import/export.
7. README de uso, push para o GitHub e workflow do GitHub Pages.

## Erros conhecidos (saída do `tsc` agora)
- `App.tsx`: falta `./pages/Settings` → item 1 acima.
- `Projects.tsx`: o ícone `Github` não existe nesta versão do lucide-react → trocar por `FolderGit2` ou `GitBranch`.
- `Reports.tsx`: import `solvedChallenges` sem uso → remover.
- `Study.tsx` (componente Exercise): `done` declarado duas vezes no objeto → mover `done: …` para depois do spread.
- `store.tsx` (`updateMeta`): tipo `Meta[K]` × `AppData[K]` → ajustar a assinatura de `db.putMeta` para `Meta[K]`.

Nenhum erro de lógica conhecido; os 27 testes passam.

## Pontos de atenção
- O cronômetro de estudo só tem botão de parar na página do Planejador (ele continua contando ao navegar, mas não aparece na barra superior).
- A paleta de comandos usa Ctrl/⌘+K, que no Chrome também foca a barra de endereço — o app intercepta só quando a página está em foco.
- Custos e certificados dos recursos foram conferidos em 20/10/2026. TryHackMe é freemium; Cisco não confirma condições de certificado na página pública; o exame SC-900 é pago.
