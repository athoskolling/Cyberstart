# CyberStart — estado do trabalho

Última atualização: 20/10/2026.

## Situação
Versão 1.0 funcional, publicada em `athoskolling/Cyberstart`, com deploy automático no GitHub Pages.

## Verificações feitas
- `npm test`: 27 testes de lógica, integridade do conteúdo e persistência IndexedDB, todos passando.
- `tsc` sem erros; `npm run build` ok (bundle inicial de ~90 KB gzip, páginas carregadas sob demanda).
- Varredura com Playwright: 23 rotas × desktop (1440px) e celular (390px) × dados vazios e de demonstração. Nenhum erro de console e nenhuma rolagem horizontal.
- 16 fluxos ponta a ponta passando:
  - exercício de lição;
  - persistência após recarregar;
  - recomendação no dashboard;
  - desafio com erro e depois acerto;
  - histórico de tentativas;
  - flashcard pelo teclado;
  - nota com template;
  - Markdown não executa HTML (teste de XSS);
  - busca de notas;
  - sessão concluída alimentando as métricas;
  - busca global (Ctrl+K);
  - exportar backup;
  - apagar tudo;
  - importar backup;
  - backup inválido rejeitado;
  - tema claro.

## Limitações conhecidas / próximos passos possíveis
- Interface só em português (o seletor de idioma existe, mas tem uma única opção).
- Sem sincronização entre dispositivos; seria preciso um backend ou serviço (por exemplo, Firebase ou Gist), com autenticação.
- O cronômetro de estudo só pode ser parado na página do Plano (ele continua contando ao navegar).
- Depois de importar um backup, até 2 avisos de "conquista desbloqueada" podem aparecer, mesmo para conquistas que já existiam no backup.
- O lint (oxlint) mostra avisos de estilo do React Compiler, como `Date` no render e exportações não-componentes; nenhum afeta o funcionamento.
- Os dados dos recursos (custos, certificados) foram conferidos em 20/10/2026 e precisam de revisão periódica.
