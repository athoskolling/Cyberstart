import type { SeedCard } from '../types'

type Row = [front: string, back: string, tags?: string[]]

const deck = (name: string, prefix: string, rows: Row[]): SeedCard[] =>
  rows.map(([front, back, tags = []], i) => ({ id: `${prefix}-${i + 1}`, front, back, deck: name, tags }))

export const SEED_CARDS: SeedCard[] = [
  ...deck('Portas de rede', 'sc-port', [
    ['Porta 22', 'SSH — acesso remoto seguro (TCP)'],
    ['Porta 21', 'FTP — transferência de arquivos, sem criptografia (TCP)'],
    ['Porta 23', 'Telnet — acesso remoto SEM criptografia (evitar)'],
    ['Porta 25', 'SMTP — envio de e-mail entre servidores'],
    ['Porta 53', 'DNS — UDP (consultas) e TCP (respostas grandes, transferências de zona)'],
    ['Porta 80', 'HTTP'],
    ['Porta 443', 'HTTPS (HTTP sobre TLS)'],
    ['Porta 445', 'SMB — compartilhamento de arquivos Windows'],
    ['Porta 3306', 'MySQL / MariaDB'],
    ['Porta 3389', 'RDP — área de trabalho remota do Windows'],
    ['Porta 67/68', 'DHCP (servidor/cliente, UDP)'],
    ['Porta 123', 'NTP — sincronização de horário (UDP)'],
  ]),
  ...deck('TCP/IP', 'sc-tcpip', [
    ['Camadas do modelo TCP/IP', 'Aplicação, Transporte, Internet, Enlace'],
    ['Handshake TCP', 'SYN → SYN-ACK → ACK'],
    ['Diferença TCP x UDP', 'TCP: orientado a conexão, confiável e ordenado. UDP: sem conexão, sem garantia, menor latência.'],
    ['Faixas IPv4 privadas (RFC 1918)', '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16'],
    ['Hosts utilizáveis em /24', '254 (256 − rede − broadcast)'],
    ['O que é NAT?', 'Tradução de endereços: vários IPs privados saem para a internet com um IP público.'],
    ['DHCP — etapas', 'DORA: Discover, Offer, Request, Acknowledge'],
    ['Registro DNS MX', 'Indica os servidores de e-mail de um domínio'],
    ['O que é o gateway padrão?', 'O roteador usado para enviar pacotes para fora da rede local'],
  ]),
  ...deck('Comandos Linux', 'sc-linux', [
    ['pwd', 'Mostra o diretório atual'],
    ['ls -la', 'Lista tudo, inclusive ocultos, com detalhes'],
    ['grep -c "x" arq', 'Conta as linhas de arq que contêm "x"'],
    ['chmod 600 arq', 'Leitura e escrita só para o dono'],
    ['ss -tulpn', 'Lista portas TCP/UDP em escuta e os processos'],
    ['journalctl -u ssh', 'Mostra os logs do serviço ssh (systemd)'],
    ['tail -f arq', 'Acompanha um arquivo em tempo real'],
    ['sort | uniq -c | sort -nr', 'Conta ocorrências e ordena da mais frequente para a menos'],
    ['sudo', 'Executa um comando com privilégios de outro usuário (geralmente root)'],
    ['> vs >>', '> sobrescreve o arquivo; >> acrescenta ao final'],
  ]),
  ...deck('Conceitos de segurança', 'sc-sec', [
    ['Tríade CIA', 'Confidencialidade, Integridade, Disponibilidade'],
    ['Autenticação x autorização', 'Autenticação: quem você é. Autorização: o que você pode fazer.'],
    ['Menor privilégio', 'Conceder apenas o acesso mínimo necessário para a tarefa'],
    ['Hash x criptografia', 'Hash é de mão única; criptografia é reversível com a chave'],
    ['Para que serve o salt?', 'Faz senhas iguais gerarem hashes diferentes, derrotando tabelas pré-computadas'],
    ['IoC', 'Indicator of Compromise — vestígio de atividade maliciosa (IP, hash, domínio…)'],
    ['Fases de resposta a incidentes (NIST)', 'Preparação; Detecção e análise; Contenção, erradicação e recuperação; Pós-incidente'],
    ['OWASP A01:2025', 'Broken Access Control'],
    ['STRIDE', 'Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege'],
    ['Defesa contra SQL injection', 'Consultas parametrizadas (prepared statements)'],
    ['Evento Windows 4625', 'Falha de logon'],
  ]),
  ...deck('Inglês técnico', 'sc-en', [
    ['Threat', 'Ameaça'],
    ['Vulnerability', 'Vulnerabilidade'],
    ['Breach', 'Violação / vazamento de dados'],
    ['Patch', 'Correção (atualização de segurança)'],
    ['Payload', 'Carga útil — a parte do ataque que executa a ação'],
    ['Foothold', 'Ponto de apoio inicial dentro de um ambiente'],
    ['Lateral movement', 'Movimento lateral — pular de uma máquina para outra na rede'],
    ['Privilege escalation', 'Escalação de privilégio'],
    ['Triage', 'Triagem'],
    ['Remediation', 'Remediação / correção'],
  ]),
  ...deck('Python', 'sc-py', [
    ['Tipo de retorno de input()', 'Sempre str (texto)'],
    ['dict.get(k, padrao)', 'Devolve o valor de k ou o padrão, sem KeyError'],
    ['with open(...) as f', 'Abre o arquivo e garante o fechamento, mesmo com erro'],
    ['set()', 'Coleção sem duplicatas e sem ordem'],
    ['re.findall(p, texto)', 'Lista com todas as ocorrências do padrão p'],
    ['json.loads(texto)', 'Converte texto JSON em objetos Python'],
    ['Counter.most_common(n)', 'Os n itens mais frequentes'],
    ['return vs print','return devolve o valor a quem chamou; print só mostra na tela'],
  ]),
]

export const DECKS = Array.from(new Set(SEED_CARDS.map((c) => c.deck)))
