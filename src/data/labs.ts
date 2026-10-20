import type { Lab } from '../types'

// Laboratórios: guias + registro de evidências. Nada é executado no navegador.
// Datasets são fictícios e usam faixas de IP de documentação (RFC 5737).

const AUTH_LOG = `Oct 18 08:59:12 web01 sshd[1021]: Accepted publickey for ana from 192.168.1.20 port 50122 ssh2
Oct 18 09:15:40 web01 sshd[1050]: Accepted password for deploy from 192.168.1.35 port 50810 ssh2
Oct 18 22:41:03 web01 sshd[1503]: Failed password for root from 198.51.100.23 port 41022 ssh2
Oct 18 22:41:05 web01 sshd[1503]: Failed password for root from 198.51.100.23 port 41024 ssh2
Oct 18 22:41:07 web01 sshd[1503]: Failed password for invalid user admin from 198.51.100.23 port 41026 ssh2
Oct 18 22:41:09 web01 sshd[1503]: Failed password for invalid user test from 198.51.100.23 port 41030 ssh2
Oct 18 22:41:11 web01 sshd[1503]: Failed password for invalid user ubuntu from 198.51.100.23 port 41032 ssh2
Oct 19 02:13:55 web01 sshd[1777]: Failed password for deploy from 203.0.113.140 port 55001 ssh2
Oct 19 02:13:58 web01 sshd[1777]: Failed password for deploy from 203.0.113.140 port 55003 ssh2
Oct 19 02:14:02 web01 sshd[1777]: Failed password for deploy from 203.0.113.140 port 55007 ssh2
Oct 19 02:14:06 web01 sshd[1777]: Failed password for deploy from 203.0.113.140 port 55011 ssh2
Oct 19 02:14:10 web01 sshd[1777]: Failed password for deploy from 203.0.113.140 port 55015 ssh2
Oct 19 02:14:15 web01 sshd[1777]: Failed password for deploy from 203.0.113.140 port 55019 ssh2
Oct 19 02:14:21 web01 sshd[1790]: Accepted password for deploy from 203.0.113.140 port 55024 ssh2
Oct 19 02:15:02 web01 sudo:   deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
Oct 19 02:16:40 web01 useradd[1822]: new user: name=support, UID=1005, GID=1005, home=/home/support, shell=/bin/bash
Oct 19 02:17:05 web01 sshd[1790]: Received disconnect from 203.0.113.140 port 55024:11: disconnected by user
Oct 19 08:58:31 web01 sshd[1902]: Accepted publickey for ana from 192.168.1.20 port 50340 ssh2
Oct 19 23:02:10 web01 sshd[2010]: Failed password for invalid user postgres from 198.51.100.23 port 42011 ssh2
Oct 19 23:02:12 web01 sshd[2010]: Failed password for invalid user oracle from 198.51.100.23 port 42013 ssh2`

const EVENTS_CSV = `timestamp,user,src_ip,country,result,mfa
2026-10-19T08:01:13Z,maria,200.150.10.4,BR,success,yes
2026-10-19T08:15:42,joao,200.150.10.9,BR,success,yes
2026-10-19T11:03:20Z,maria,200.150.10.4,BR,success,yes
2026-10-19T13:47:05Z,carla,200.150.10.21,BR,success,yes
2026-10-19T13:52:11Z,maria,203.0.113.88,RO,failure,no
2026-10-19T13:52:19Z,maria,203.0.113.88,RO,failure,no
2026-10-19T13:52:30Z,maria,203.0.113.88,RO,failure,no
2026-10-19T13:53:02Z,maria,203.0.113.88,RO,success,push_approved
2026-10-19T13:55:40Z,maria,203.0.113.88,RO,success,push_approved
2026-10-19T14:10:00Z,joao,200.150.10.9,BR,success,yes
2026-10-19T16:20:33Z,carla,200.150.10.21,BR,success,yes`

const CAPTURA = `No.  Tempo     Origem            Destino           Proto  Info
1    0.000     192.168.1.20      192.168.1.1       DNS    Standard query A exemplo.com
2    0.021     192.168.1.1       192.168.1.20      DNS    Standard query response A 93.184.216.34
3    0.030     192.168.1.20      93.184.216.34     TCP    51544 → 443 [SYN]
4    0.180     93.184.216.34     192.168.1.20      TCP    443 → 51544 [SYN, ACK]
5    0.181     192.168.1.20      93.184.216.34     TCP    51544 → 443 [ACK]
6    0.182     192.168.1.20      93.184.216.34     TLSv1.3 Client Hello
7    2.400     192.168.1.20      192.168.1.50      TCP    51600 → 22 [SYN]
8    2.401     192.168.1.50      192.168.1.20      TCP    22 → 51600 [SYN, ACK]
9    2.402     192.168.1.20      192.168.1.50      TCP    51600 → 22 [ACK]
10   2.410     192.168.1.50      192.168.1.20      SSH    Server: Protocol (SSH-2.0-OpenSSH_9.6)
11   5.000     192.168.1.20      192.168.1.50      TCP    51700 → 3306 [SYN]
12   5.001     192.168.1.50      192.168.1.20      TCP    3306 → 51700 [RST, ACK]
13   7.300     192.168.1.20      192.168.1.1       DNS    Standard query A atualizacao-sistema.example
14   7.310     192.168.1.1       192.168.1.20      DNS    Standard query response No such name`

export const LABS: Lab[] = [
  {
    id: 'lab-bandit',
    title: 'OverTheWire Bandit — níveis 0 a 5',
    category: 'linux',
    difficulty: 'iniciante',
    minutes: 150,
    objective: 'Praticar SSH, navegação, arquivos ocultos e leitura de arquivos em um servidor real feito para treino.',
    environment: 'Servidor externo do OverTheWire (acesso via SSH). Precisa de um terminal com cliente ssh: Linux, macOS, WSL ou PowerShell no Windows.',
    prereqs: 'Lições "Navegando no terminal" e "Manipulando arquivos".',
    instructions:
      'Cada nível revela a senha do próximo. Leia a página do nível, tente resolver sozinho e registre aqui o comando que funcionou e o conceito envolvido. Não publique as senhas — elas fazem parte do desafio para outras pessoas.',
    steps: [
      'Nível 0: conectar com `ssh bandit0@bandit.labs.overthewire.org -p 2220`',
      'Nível 0→1: ler o arquivo readme na home',
      'Nível 1→2: ler um arquivo chamado "-"',
      'Nível 2→3: ler um arquivo com espaços no nome',
      'Nível 3→4: encontrar um arquivo oculto',
      'Nível 4→5: achar o único arquivo legível por humanos (dica: `file`)',
    ],
    externalUrl: 'https://overthewire.org/wargames/bandit/bandit0.html',
    safety: 'Ambiente oferecido publicamente pelo OverTheWire para esta prática.',
  },
  {
    id: 'lab-logs-ssh',
    title: 'Investigar logs de autenticação SSH',
    category: 'seg_defensiva',
    difficulty: 'basico',
    minutes: 60,
    objective: 'Usar grep, pipes e raciocínio de triagem para descobrir se houve acesso indevido em um servidor (fictício).',
    environment: 'Seu terminal Linux/WSL. Baixe o arquivo de exemplo abaixo (dados fictícios).',
    prereqs: 'Lições "Redirecionamento e pipes" e "grep e logs do sistema".',
    instructions:
      'Baixe o auth.log fictício e responda às perguntas dos passos usando comandos. Registre os comandos e as respostas no campo de evidências. No final, escreva um veredito: houve comprometimento? Quais ações você recomendaria?',
    steps: [
      'Quantas falhas de senha existem? (`grep -c "Failed password" auth.log`)',
      'Quais IPs geraram falhas e quantas cada? (pipeline com sort | uniq -c)',
      'Algum IP externo teve login aceito? Qual usuário e horário?',
      'O que esse usuário fez depois de entrar? (procure linhas de sudo e useradd)',
      'Escreva o veredito e as ações recomendadas (contenção e próximos passos)',
    ],
    dataset: { name: 'auth.log', content: AUTH_LOG },
    safety: 'Dados 100% fictícios; IPs de faixas reservadas para documentação.',
  },
  {
    id: 'lab-py-contador',
    title: 'Script Python: contar eventos em um arquivo',
    category: 'programacao',
    difficulty: 'basico',
    minutes: 90,
    objective: 'Escrever seu primeiro script útil: ler um log, extrair IPs com regex e mostrar os mais frequentes.',
    environment: 'Python 3 instalado localmente. Use o mesmo auth.log fictício do laboratório de logs SSH.',
    prereqs: 'Lições "Arquivos e tratamento de erros" e "Expressões regulares e JSON".',
    instructions:
      'Escreva o script do zero, em partes pequenas. Só consulte a lição "Processando logs" depois de tentar. Cole o código final no campo de evidências e a saída obtida no campo de resultado.',
    steps: [
      'Ler o arquivo linha a linha com `with open`',
      'Filtrar apenas linhas com "Failed password"',
      'Extrair o IP de cada linha com regex',
      'Contar ocorrências com dict ou Counter',
      'Imprimir os 3 IPs com mais falhas',
      'Tratar o caso de arquivo inexistente com mensagem amigável',
    ],
    dataset: { name: 'auth.log', content: AUTH_LOG },
  },
  {
    id: 'lab-portas-captura',
    title: 'Identificar portas em uma captura didática',
    category: 'redes',
    difficulty: 'basico',
    minutes: 45,
    objective: 'Ler uma captura de pacotes simplificada e identificar serviços, handshakes e conexões recusadas.',
    environment: 'Somente leitura — a captura (fictícia) está abaixo em formato texto. Opcional: reproduzir na sua máquina com Wireshark.',
    prereqs: 'Lições "TCP, UDP e portas" e "Captura e interpretação de pacotes".',
    instructions: 'Analise a captura e responda nos passos. Registre suas respostas e o raciocínio no campo de evidências.',
    steps: [
      'Qual IP resolveu DNS e qual servidor respondeu?',
      'Identifique o handshake TCP completo para a porta 443 (números dos pacotes)',
      'Que serviço roda na porta 22 de 192.168.1.50 e qual versão ele anuncia?',
      'O que significa o RST no pacote 12? A porta 3306 está aberta?',
      'O domínio consultado no pacote 13 existe? Por que isso pode ser interessante numa investigação?',
    ],
    dataset: { name: 'captura.txt', content: CAPTURA },
  },
  {
    id: 'lab-http-headers',
    title: 'Analisar cabeçalhos HTTP',
    category: 'web',
    difficulty: 'iniciante',
    minutes: 40,
    objective: 'Inspecionar requisições e respostas reais no navegador e reconhecer cabeçalhos de segurança.',
    environment: 'Seu navegador com DevTools (F12). Analise apenas sites públicos, somente leitura — nada de alterar requisições em sites de terceiros.',
    prereqs: 'Lição "HTTP e HTTPS".',
    instructions:
      'Abra DevTools → Rede, acesse 2 sites públicos e anote, para a requisição principal: método, status e a presença dos cabeçalhos de segurança listados nos passos.',
    steps: [
      'Anotar método e código de status da requisição principal',
      'Verificar Strict-Transport-Security (HSTS)',
      'Verificar Content-Security-Policy',
      'Verificar X-Content-Type-Options e Referrer-Policy',
      'Verificar flags dos cookies (Secure, HttpOnly, SameSite) na aba Aplicação',
      'Comparar os dois sites e escrever o que cada cabeçalho protege',
    ],
  },
  {
    id: 'lab-hardening',
    title: 'Checklist de hardening Linux',
    category: 'linux',
    difficulty: 'basico',
    minutes: 90,
    objective: 'Aplicar controles básicos de segurança em uma VM Linux sua e documentar cada um.',
    environment: 'Uma máquina virtual Linux SUA (VirtualBox, VMware ou WSL). Não aplique em máquinas de trabalho sem autorização.',
    prereqs: 'Lições de permissões, processos, SSH e firewall.',
    instructions:
      'Execute cada item, registre o comando usado e o antes/depois no campo de evidências. Tire snapshot da VM antes de começar, para poder voltar se algo der errado.',
    steps: [
      'Tirar snapshot da VM',
      'Atualizar o sistema (`sudo apt update && sudo apt upgrade`)',
      'Criar usuário não-root com sudo e parar de usar root diretamente',
      'Configurar SSH com chave e `PasswordAuthentication no`',
      'Habilitar firewall (ufw) negando entrada por padrão e liberando só o SSH',
      'Listar serviços ativos e desativar um desnecessário',
      'Conferir permissões de ~/.ssh (700) e chaves privadas (600)',
    ],
  },
  {
    id: 'lab-login-suspeito',
    title: 'Investigar tentativa de login suspeita',
    category: 'seg_defensiva',
    difficulty: 'intermediario',
    minutes: 75,
    objective: 'Analisar eventos de autenticação de um provedor de identidade (fictício) e identificar um possível comprometimento de conta.',
    environment: 'Planilha, terminal ou script Python. Baixe o CSV fictício abaixo.',
    prereqs: 'Lições "Monitoramento, SIEM e análise de alertas" e "IoCs e resposta a incidentes".',
    instructions:
      'Investigue como um analista L1: qual conta, o que é anômalo, qual a sequência de eventos e o que você recomendaria. Use o template de nota "Análise de incidente" para o relatório.',
    steps: [
      'Identificar o padrão normal de login de cada usuário (IP, país, horário)',
      'Encontrar os eventos que fogem do padrão',
      'Explicar a sequência: falhas → sucesso com "push_approved"',
      'Pesquisar o que é "MFA fatigue" e relacionar com o caso',
      'Notar a inconsistência de formato de timestamp em uma linha (qualidade de dados!)',
      'Escrever veredito, IoCs e ações recomendadas',
    ],
    dataset: { name: 'eventos_login.csv', content: EVENTS_CSV },
    safety: 'Dados fictícios; IPs de faixas de documentação.',
  },
]

export const labById = new Map(LABS.map((l) => [l.id, l]))
