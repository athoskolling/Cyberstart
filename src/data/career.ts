import type { InterviewQuestion, ProjectTemplate, RoleMatrix } from '../types'

// Matriz de competências: referência geral construída a partir dos temas
// recorrentes em descrições de vagas de entrada. NÃO representa uma vaga real
// específica — valide sempre com as vagas que você cadastrar.

export const ROLE_MATRIX: RoleMatrix[] = [
  {
    id: 'estagio-ciber',
    title: 'Estágio em cybersecurity',
    summary: 'Porta de entrada: espera-se base sólida e vontade de aprender, mais do que experiência.',
    competencies: [
      { skill: 'Redes: TCP/IP, DNS, HTTP, portas', level: 'essencial', modules: ['m-redes-1', 'm-redes-2'] },
      { skill: 'Linux: terminal, permissões, logs', level: 'essencial', modules: ['m-linux-1', 'm-linux-2', 'm-linux-3'] },
      { skill: 'Conceitos: CIA, autenticação, criptografia', level: 'essencial', modules: ['m-sec-1', 'm-sec-2'] },
      { skill: 'Script em Python ou PowerShell', level: 'diferencial', modules: ['m-py-1', 'm-py-2'] },
      { skill: 'Inglês técnico para leitura', level: 'essencial', modules: [] },
      { skill: 'Projeto ou laboratório documentado', level: 'diferencial', modules: ['m-prof-1'] },
    ],
  },
  {
    id: 'soc-l1',
    title: 'SOC Analyst L1',
    summary: 'Monitora e tria alertas, documenta e escala incidentes.',
    competencies: [
      { skill: 'Análise de logs (Linux, Windows, web)', level: 'essencial', modules: ['m-linux-3', 'm-def-1', 'm-def-3'] },
      { skill: 'Conceito e uso de SIEM', level: 'essencial', modules: ['m-def-1'] },
      { skill: 'Triagem: falso x verdadeiro positivo', level: 'essencial', modules: ['m-def-1', 'm-def-2'] },
      { skill: 'IoCs e resposta a incidentes', level: 'essencial', modules: ['m-def-2'] },
      { skill: 'MITRE ATT&CK', level: 'diferencial', modules: ['m-def-2'] },
      { skill: 'Phishing e análise de e-mail', level: 'essencial', modules: ['m-sec-3'] },
      { skill: 'Escrita clara de relatórios', level: 'essencial', modules: ['m-prof-1'] },
    ],
  },
  {
    id: 'infra-seg',
    title: 'Analista de infraestrutura com foco em segurança',
    summary: 'Mantém servidores e redes, aplicando hardening, atualizações e controles de acesso.',
    competencies: [
      { skill: 'Linux e Windows Server', level: 'essencial', modules: ['m-linux-2', 'm-def-3'] },
      { skill: 'Firewall, roteamento e segmentação', level: 'essencial', modules: ['m-redes-3'] },
      { skill: 'Hardening e gestão de vulnerabilidades', level: 'essencial', modules: ['m-sec-3'] },
      { skill: 'Automação com Bash/Python', level: 'diferencial', modules: ['m-linux-3', 'm-py-3'] },
      { skill: 'Fundamentos de nuvem', level: 'diferencial', modules: ['m-def-3'] },
      { skill: 'Normas e controles (ex.: ISO 27001)', level: 'diferencial', modules: [] },
    ],
  },
  {
    id: 'jr-sec',
    title: 'Junior Security Analyst',
    summary: 'Generalista: apoia monitoramento, vulnerabilidades, conscientização e conformidade.',
    competencies: [
      { skill: 'Fundamentos de segurança completos', level: 'essencial', modules: ['m-sec-1', 'm-sec-2', 'm-sec-3'] },
      { skill: 'Gestão de vulnerabilidades (CVE/CVSS)', level: 'essencial', modules: ['m-sec-3'] },
      { skill: 'Logs e resposta a incidentes', level: 'essencial', modules: ['m-def-1', 'm-def-2'] },
      { skill: 'OWASP Top 10', level: 'diferencial', modules: ['m-off-2'] },
      { skill: 'Automação com Python', level: 'diferencial', modules: ['m-py-3'] },
    ],
  },
  {
    id: 'pentest-trainee',
    title: 'Pentest trainee',
    summary: 'Vagas mais raras para iniciantes; exigem prática comprovada em labs e CTFs.',
    competencies: [
      { skill: 'Metodologia e ética de pentest', level: 'essencial', modules: ['m-off-1'] },
      { skill: 'Aplicações web e OWASP Top 10', level: 'essencial', modules: ['m-off-2', 'm-off-3'] },
      { skill: 'Redes e Linux avançados', level: 'essencial', modules: ['m-redes-2', 'm-linux-3'] },
      { skill: 'Relatórios de vulnerabilidade', level: 'essencial', modules: ['m-off-3'] },
      { skill: 'Histórico em CTFs/labs (Web Security Academy etc.)', level: 'diferencial', modules: ['m-off-1'] },
    ],
  },
]

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'iq-1',
    type: 'tecnica',
    question: 'O que acontece quando você digita um endereço no navegador e aperta Enter?',
    guidance: 'Descreva do DNS até a página renderizada, passando pelas camadas.',
    keyPoints: [
      { label: 'Resolução DNS', keywords: ['dns', 'resolv'] },
      { label: 'Conexão TCP (handshake)', keywords: ['tcp', 'handshake', 'syn'] },
      { label: 'Negociação TLS', keywords: ['tls', 'https', 'certificado'] },
      { label: 'Requisição/resposta HTTP', keywords: ['http', 'get', 'requisi'] },
      { label: 'Renderização', keywords: ['render', 'html', 'navegador'] },
    ],
  },
  {
    id: 'iq-2',
    type: 'tecnica',
    question: 'Qual a diferença entre TCP e UDP? Dê um exemplo de uso de cada.',
    guidance: 'Fale de conexão, confiabilidade e latência, com exemplos.',
    keyPoints: [
      { label: 'TCP orientado a conexão/confiável', keywords: ['conex', 'confi', 'garant'] },
      { label: 'UDP sem conexão/sem garantia', keywords: ['sem conex', 'não garant', 'nao garant', 'sem garant'] },
      { label: 'Exemplo de TCP', keywords: ['http', 'ssh', 'web', 'e-mail', 'email'] },
      { label: 'Exemplo de UDP', keywords: ['dns', 'vídeo', 'video', 'voz', 'jogo', 'streaming'] },
    ],
  },
  {
    id: 'iq-3',
    type: 'tecnica',
    question: 'Explique a diferença entre hash e criptografia.',
    guidance: 'Mencione reversibilidade, chaves e usos.',
    keyPoints: [
      { label: 'Hash é de mão única', keywords: ['mão única', 'mao unica', 'irrevers', 'não revers', 'nao revers'] },
      { label: 'Criptografia usa chave e é reversível', keywords: ['chave', 'revers', 'descriptograf', 'decifr'] },
      { label: 'Uso: senhas/integridade', keywords: ['senha', 'integridade'] },
      { label: 'Salt', keywords: ['salt'] },
    ],
  },
  {
    id: 'iq-4',
    type: 'tecnica',
    question: 'Você recebe um alerta de várias falhas de login seguidas de um sucesso. Como investiga?',
    guidance: 'Mostre um processo de triagem estruturado.',
    keyPoints: [
      { label: 'Contexto: usuário, IP, horário', keywords: ['contexto', 'ip', 'horário', 'horario', 'usuário', 'usuario'] },
      { label: 'Comparar com o comportamento normal', keywords: ['normal', 'padrão', 'padrao', 'histórico', 'historico', 'baseline'] },
      { label: 'Ver atividade após o login', keywords: ['depois', 'após', 'apos', 'atividade'] },
      { label: 'Veredito e documentação', keywords: ['falso positivo', 'verdadeiro', 'document', 'registr'] },
      { label: 'Escalar/conter', keywords: ['escal', 'conten', 'bloque', 'reset'] },
    ],
  },
  {
    id: 'iq-5',
    type: 'tecnica',
    question: 'O que é SQL injection e como prevenir?',
    guidance: 'Explique a causa (mistura de dados e código) e a defesa correta.',
    keyPoints: [
      { label: 'Entrada interpretada como SQL', keywords: ['entrada', 'concaten', 'consulta', 'query'] },
      { label: 'Consultas parametrizadas', keywords: ['parametriz', 'prepared'] },
      { label: 'Menor privilégio no banco', keywords: ['privil'] },
      { label: 'Validação de entrada como camada extra', keywords: ['valida'] },
    ],
  },
  {
    id: 'iq-6',
    type: 'tecnica',
    question: 'Como você explicaria a tríade CIA para alguém de outra área?',
    guidance: 'Use exemplos do cotidiano.',
    keyPoints: [
      { label: 'Confidencialidade', keywords: ['confidencial'] },
      { label: 'Integridade', keywords: ['integridade'] },
      { label: 'Disponibilidade', keywords: ['disponibilidade'] },
      { label: 'Exemplo concreto', keywords: ['exemplo', 'como quando', 'imagine'] },
    ],
  },
  {
    id: 'iq-7',
    type: 'comportamental',
    question: 'Conte sobre uma vez em que você teve que aprender algo novo rapidamente.',
    guidance: 'Use STAR. Mostre COMO você aprende.',
    keyPoints: [
      { label: 'Situação', keywords: ['situação', 'situacao', 'quando', 'projeto', 'trabalho'] },
      { label: 'Tarefa/objetivo', keywords: ['precisava', 'objetivo', 'tarefa', 'meta'] },
      { label: 'Ação (em primeira pessoa)', keywords: ['eu ', 'estudei', 'fiz', 'criei', 'busquei'] },
      { label: 'Resultado mensurável', keywords: ['resultado', 'consegui', 'entreg', '%'] },
    ],
  },
  {
    id: 'iq-8',
    type: 'comportamental',
    question: 'Por que você quer trabalhar com segurança da informação?',
    guidance: 'Seja específico e conecte com o que você já fez.',
    keyPoints: [
      { label: 'Motivação genuína e específica', keywords: ['porque', 'interesse', 'motiv', 'gosto'] },
      { label: 'Evidência do que já fez', keywords: ['projeto', 'laborat', 'estud', 'curso', 'ctf'] },
      { label: 'Conexão com experiência anterior', keywords: ['experiência', 'experiencia', 'trabalho', 'iso', 'desenvolv'] },
      { label: 'Próximos passos', keywords: ['próximo', 'proximo', 'futuro', 'quero', 'plano'] },
    ],
  },
  {
    id: 'iq-9',
    type: 'comportamental',
    question: 'Descreva uma situação em que você cometeu um erro. O que fez depois?',
    guidance: 'Mostre responsabilidade e aprendizado, sem culpar outros.',
    keyPoints: [
      { label: 'Assume o erro', keywords: ['errei', 'meu erro', 'eu ', 'assumi'] },
      { label: 'Ação para corrigir', keywords: ['corrig', 'resolvi', 'avisei', 'comuniquei'] },
      { label: 'Aprendizado/prevenção', keywords: ['aprendi', 'checklist', 'agora', 'prevenir', 'evitar'] },
    ],
  },
]

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'pt-log-analyzer',
    title: 'Analisador simples de logs em Python',
    description: 'Script que lê logs de autenticação, conta falhas por IP/usuário e gera um resumo em CSV ou JSON.',
    objectives: ['Ler logs com segurança', 'Extrair dados com regex', 'Gerar relatório reutilizável'],
    tech: ['Python', 'regex', 'argparse'],
    category: 'programacao',
    checklist: ['Ler arquivo passado por argumento', 'Extrair IP e usuário', 'Top N por falhas', 'Exportar CSV', 'Testes com log fictício', 'README com exemplos'],
  },
  {
    id: 'pt-hardening',
    title: 'Checklist de hardening Linux documentado',
    description: 'Guia passo a passo, testado em VM, com justificativa de cada controle e comandos de verificação.',
    objectives: ['Aplicar controles básicos', 'Justificar cada item', 'Permitir reprodução'],
    tech: ['Linux', 'Bash', 'ufw', 'SSH'],
    category: 'linux',
    checklist: ['Lista de controles com justificativa', 'Comando de aplicação', 'Comando de verificação', 'Prints antes/depois', 'Script opcional de auditoria'],
  },
  {
    id: 'pt-traffic',
    title: 'Laboratório de análise de tráfego',
    description: 'Captura do tráfego da sua própria máquina em cenários controlados, com análise de DNS, TCP e HTTP.',
    objectives: ['Capturar com Wireshark/tcpdump', 'Explicar protocolos vistos', 'Documentar filtros usados'],
    tech: ['Wireshark', 'tcpdump'],
    category: 'redes',
    checklist: ['Cenário definido', 'Captura salva (sem dados sensíveis)', 'Análise de DNS', 'Análise de handshake', 'Relatório final'],
  },
  {
    id: 'pt-detector',
    title: 'Detector didático de padrões suspeitos',
    description: 'Regras simples (força bruta, login de país novo, horário incomum) aplicadas a logs fictícios.',
    objectives: ['Traduzir hipóteses em regras', 'Medir falsos positivos', 'Explicar limitações'],
    tech: ['Python'],
    category: 'seg_defensiva',
    checklist: ['3 regras implementadas', 'Dataset fictício', 'Saída com explicação de cada alerta', 'Seção de limitações'],
  },
  {
    id: 'pt-incident-report',
    title: 'Relatório de incidente simulado',
    description: 'Relatório completo de um incidente fictício: linha do tempo, IoCs, impacto, ações e lições aprendidas.',
    objectives: ['Estruturar um relatório profissional', 'Mapear para ATT&CK'],
    tech: ['Markdown', 'MITRE ATT&CK'],
    category: 'seg_defensiva',
    checklist: ['Resumo executivo', 'Linha do tempo', 'IoCs', 'Mapeamento ATT&CK', 'Recomendações'],
  },
  {
    id: 'pt-linux-guide',
    title: 'Guia documentado de comandos Linux',
    description: 'Seu "cheat sheet" comentado, organizado por tarefa de segurança (logs, processos, rede, permissões).',
    objectives: ['Consolidar o que aprendeu', 'Criar referência pública'],
    tech: ['Linux', 'Markdown'],
    category: 'linux',
    checklist: ['Seções por tarefa', 'Exemplos reais de uso', 'Armadilhas comuns', 'Publicado no GitHub'],
  },
  {
    id: 'pt-web-lab',
    title: 'Laboratório de segurança web autorizado',
    description: 'Write-ups dos labs resolvidos na Web Security Academy, com causa, exploração e correção.',
    objectives: ['Documentar raciocínio', 'Explicar correção'],
    tech: ['HTTP', 'Burp Suite Community', 'OWASP'],
    category: 'web',
    checklist: ['5 labs documentados', 'Causa raiz de cada', 'Correção sugerida', 'Sem spoilers de flags/senhas'],
  },
]

export const NOTE_TEMPLATES: { id: string; title: string; category: string; body: string }[] = [
  {
    id: 'nt-conceito',
    title: 'Conceito estudado',
    category: 'Conceito',
    body: '# Conceito: \n\n## O que é\n\n## Por que importa\n\n## Como funciona\n\n## Exemplo\n\n## Dúvidas que ficaram\n\n## Fontes\n',
  },
  {
    id: 'nt-comando',
    title: 'Comando Linux',
    category: 'Comando',
    body: '# Comando: \n\n## Para que serve\n\n## Sintaxe\n```bash\n\n```\n\n## Opções úteis\n- \n\n## Exemplo real\n```bash\n\n```\n\n## Armadilhas\n',
  },
  {
    id: 'nt-incidente',
    title: 'Análise de incidente',
    category: 'Incidente',
    body: '# Análise: \n\n## Resumo\n\n## Linha do tempo\n| Hora | Evento | Fonte |\n|---|---|---|\n|  |  |  |\n\n## IoCs\n- IP: \n- Domínio: \n- Hash: \n\n## Técnicas (ATT&CK)\n\n## Veredito\n\n## Ações recomendadas\n\n## Lições aprendidas\n',
  },
  {
    id: 'nt-lab',
    title: 'Laboratório',
    category: 'Laboratório',
    body: '# Lab: \n\n## Objetivo\n\n## Ambiente\n\n## Passos executados\n1. \n\n## Evidências\n\n## Resultado\n\n## Dificuldades\n\n## O que aprendi\n',
  },
  {
    id: 'nt-vuln',
    title: 'Vulnerabilidade',
    category: 'Vulnerabilidade',
    body: '# Achado: \n\n**Severidade:** \n**Ativo:** \n**Referência:** OWASP / CWE\n\n## Descrição\n\n## Passos para reproduzir\n1. \n\n## Evidências\n\n## Impacto\n\n## Recomendação de correção\n',
  },
  {
    id: 'nt-revisao',
    title: 'Revisão de conteúdo',
    category: 'Revisão',
    body: '# Revisão: \n\n## 3 ideias principais\n1. \n2. \n3. \n\n## O que ainda não está claro\n\n## Perguntas para testar a mim mesmo\n- \n',
  },
  {
    id: 'nt-debug',
    title: 'Registro de debugging',
    category: 'Debugging',
    body: '# Erro: \n\n## Mensagem de erro\n```\n\n```\n\n## Contexto (o que eu estava fazendo)\n\n## Hipóteses testadas\n- [ ] \n\n## Causa real\n\n## Solução\n\n## Como evitar\n',
  },
]

export const README_TEMPLATE = (p: {
  name: string
  description: string
  objectives: string
  tech: string[]
  learnings: string
  nextSteps: string
}) => `# ${p.name || 'Nome do projeto'}

${p.description || 'Uma frase explicando o que o projeto faz e para quem.'}

## Objetivos
${p.objectives || '- '}

## Tecnologias
${p.tech.length ? p.tech.map((t) => `- ${t}`).join('\n') : '- '}

## Como executar
\`\`\`bash
# passos para instalar e rodar
\`\`\`

## Exemplo de uso / saída

## O que aprendi
${p.learnings || ''}

## Limitações e próximos passos
${p.nextSteps || ''}

> Dados usados neste projeto são fictícios ou anonimizados.
`
