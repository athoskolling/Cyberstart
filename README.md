# CyberStart

Plataforma pessoal para aprender **cybersecurity do zero**: roadmap em 9 fases, lições próprias em português, laboratórios, desafios com correção automática, flashcards com repetição espaçada, planejador, notas técnicas, projetos de portfólio e acompanhamento de vagas.

Funciona 100% no navegador, sem conta e sem servidor. Os dados ficam no IndexedDB do seu navegador.

## O que tem dentro

| Área | Destaques |
|---|---|
| **Overview** | Próxima atividade recomendada (com o motivo), progresso do roadmap, agenda, métricas reais, missões semanais |
| **Roadmap** | 9 fases, 24 módulos, visão em lista e em mapa, filtros, pré-requisitos como recomendação (nada é bloqueado) |
| **Modo de estudo** | 60 lições: as próprias seguem 8 partes (o que é, por que importa, como funciona, exemplo, erro comum, exercício, como verificar, o que estudar depois); as externas são sinalizadas |
| **Recursos** | 19 cursos e materiais oficiais, com custo e certificado conferidos em 20/10/2026 |
| **Desafios** | 32 desafios em 6 formatos (múltipla escolha, V/F, ordenação, associação, lacuna, encontrar o erro) |
| **Laboratórios** | 7 laboratórios com etapas, registro de evidências e datasets fictícios |
| **Revisão** | Flashcards com repetição espaçada (SM-2 simplificado) |
| **Plano** | Agenda semanal, cronômetro, meta de horas e sequência recomendada |
| **Notas** | Markdown com pré-visualização segura e 7 modelos (incidente, vulnerabilidade, debugging…) |
| **Projetos / Carreira** | Checklist, gerador de README, kanban de vagas com lacunas, matriz de competências, treino de entrevistas |
| **Relatórios / Conquistas** | Gráficos com dados reais, exportação CSV, XP com limites diários, sem rankings |

## Rodar localmente

Requer Node 20 ou mais novo.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # testes de lógica, conteúdo e persistência
npm run build     # gera dist/ (estático)
```

## Publicação

Cada push na `main` roda os testes, gera o build e publica no GitHub Pages (`.github/workflows/deploy.yml`).
Na primeira vez, ative em **Settings → Pages → Source: GitHub Actions**.

## Seus dados

- Ficam **somente neste navegador, neste dispositivo**. Não há sincronização.
- **Configurações → Exportar backup** gera um `.json` versionado. Importar valida formato, versão e IDs antes de substituir qualquer coisa.
- Exportações CSV (sessões, tentativas, módulos) estão em **Relatórios**.
- **Configurações → Carregar demo** mostra a interface com dados fictícios (com aviso visível).

## Segurança

- Nenhum código ou HTML salvo pelo usuário é executado. O Markdown vira elementos React, sem `innerHTML`.
- Os desafios são corrigidos comparando a resposta com o gabarito, sem `eval`.
- Links externos abrem com `noopener noreferrer`. O CSV neutraliza fórmulas.
- Sem backend, sem analytics, sem chaves de API.
- Laboratórios ofensivos apontam só para ambientes autorizados (OverTheWire, PortSwigger, CyLab/picoCTF).

## Arquitetura

Vite + React + TypeScript (strict), react-router com HashRouter (compatível com o Pages), lucide-react, idb e Vitest. Os gráficos são SVG próprio.

```
src/data/        conteúdo educacional (estático, versionado)
src/lib/         regras puras: progresso, recomendação, XP, SRS, planejador, validação, IndexedDB
src/store.tsx    estado global + gravação imediata
src/pages/       uma página por seção (carregadas sob demanda)
src/ui/          layout, componentes, gráficos, markdown seguro
```

### Para continuar desenvolvendo

- **Novo conteúdo:** edite `src/data/*`. O teste `logic.test.ts` verifica se todas as referências entre módulos, lições, desafios e labs existem.
- **Mudança no modelo de dados:** incremente `DB_VERSION` em `lib/db.ts` (novos stores) e/ou `EXPORT_VERSION` em `lib/validate.ts`, e adicione o passo correspondente em `MIGRATIONS`.
- O estado do trabalho e as pendências conhecidas estão em `PROGRESS.md`.
