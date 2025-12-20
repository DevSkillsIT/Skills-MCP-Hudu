// prompts.ts - Handlers de prompts para Hudu MCP Server
// Skills IT Soluções em Tecnologia
// Total: 15 prompts (2 originais + 13 novos)

/**
 * Lista de prompts (para reutilização em handlers)
 */
export const HUDU_PROMPTS_LIST = [
  // Prompts originais (2)
  {
    name: 'hudu_security_audit',
    description: 'Generate a comprehensive security audit report based on Hudu data',
    arguments: [{ name: 'company_id', description: 'Company ID to audit (optional)', required: false }]
  },
  {
    name: 'hudu_asset_report',
    description: 'Generate an asset inventory report',
    arguments: [{ name: 'company_id', description: 'Company ID to report on (optional)', required: false }]
  },
  // Novos prompts gestor (5)
  {
    name: 'hudu_executive_dashboard',
    description: 'Dashboard executivo de documentação com métricas de compliance',
    arguments: [{ name: 'company_id', description: 'Company ID (opcional)', required: false }]
  },
  {
    name: 'hudu_documentation_coverage',
    description: 'Análise de cobertura de documentação com gaps identificados',
    arguments: [{ name: 'company_id', description: 'Company ID (opcional)', required: false }]
  },
  {
    name: 'hudu_asset_depreciation',
    description: 'Ativos próximos de EOL (End of Life) com planejamento de substituição',
    arguments: [
      { name: 'company_id', description: 'Company ID (opcional)', required: false },
      { name: 'warning_months', description: 'Meses de antecedência para alerta (padrão: 6)', required: false }
    ]
  },
  {
    name: 'hudu_compliance_gaps',
    description: 'Gaps de compliance e documentação obrigatória faltante',
    arguments: [{ name: 'company_id', description: 'Company ID (opcional)', required: false }]
  },
  {
    name: 'hudu_client_maturity',
    description: 'Análise de maturidade TI do cliente com recomendações',
    arguments: [{ name: 'company_id', description: 'Company ID', required: true }]
  },
  // Novos prompts analista (8)
  {
    name: 'hudu_quick_search',
    description: 'Busca rápida multi-recurso (assets, passwords, articles, companies)',
    arguments: [{ name: 'query', description: 'Termo de busca', required: true }]
  },
  {
    name: 'hudu_password_lookup',
    description: 'Busca de credenciais com filtros de segurança',
    arguments: [{ name: 'search_term', description: 'Nome do serviço ou recurso', required: true }]
  },
  {
    name: 'hudu_asset_history',
    description: 'Histórico de mudanças de ativo com auditoria',
    arguments: [{ name: 'asset_id', description: 'ID do ativo', required: true }]
  },
  {
    name: 'hudu_new_client_setup',
    description: 'Checklist de onboarding e setup inicial de novo cliente',
    arguments: [{ name: 'company_name', description: 'Nome da empresa', required: true }]
  },
  {
    name: 'hudu_documentation_checklist',
    description: 'Checklist de documentação obrigatória para cliente',
    arguments: [{ name: 'company_id', description: 'Company ID', required: true }]
  },
  {
    name: 'hudu_troubleshooting_wiki',
    description: 'Wiki de troubleshooting com soluções documentadas',
    arguments: [{ name: 'search_query', description: 'Termo de busca no knowledge base', required: true }]
  },
  {
    name: 'hudu_contact_directory',
    description: 'Diretório de contatos técnicos e comerciais',
    arguments: [{ name: 'company_id', description: 'Company ID (opcional)', required: false }]
  },
  {
    name: 'hudu_recent_changes',
    description: 'Mudanças recentes em documentação e ativos',
    arguments: [{ name: 'hours', description: 'Últimas X horas (padrão: 24)', required: false }]
  }
];

/**
 * Handler para prompts do Hudu
 * Retorna texto multi-step compacto para WhatsApp/Teams
 */
export function getHuduPromptText(name: string, args: any): any {
  const company_id = args?.company_id;
  const warning_months = args?.warning_months || 6;
  const query = args?.query;
  const search_term = args?.search_term;
  const asset_id = args?.asset_id;
  const company_name = args?.company_name;
  const search_query = args?.search_query;
  const hours = args?.hours || 24;

  switch (name) {
    // ============================================
    // PROMPTS ORIGINAIS (2)
    // ============================================

    case 'hudu_security_audit':
      return {
        description: 'Security audit prompt for Hudu data',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Perform a comprehensive security audit${company_id ? ` for company ID ${company_id}` : ' across all companies'}. Review assets, passwords, and documentation for security compliance. Focus on:

1. Password strength and rotation policies
2. Asset inventory completeness
3. Documentation coverage
4. Access controls and permissions
5. Compliance with security standards

Provide actionable recommendations for improvement.`
            }
          }
        ]
      };

    case 'hudu_asset_report':
      return {
        description: 'Asset inventory report prompt for Hudu data',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a comprehensive asset inventory report${company_id ? ` for company ID ${company_id}` : ' across all companies'}. Include:

1. Total asset count by type
2. Assets requiring updates
3. Missing documentation
4. Asset relationships and dependencies
5. Compliance status

Format as a professional report with executive summary.`
            }
          }
        ]
      };

    // ============================================
    // PROMPTS GESTOR (5 novos)
    // ============================================

    case 'hudu_executive_dashboard':
      return {
        description: `Dashboard executivo${company_id ? ` - Company ID ${company_id}` : ' (global)'}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📊 **DASHBOARD EXECUTIVO - HUDU${company_id ? ` (ID: ${company_id})` : ' (TODAS AS EMPRESAS)'}**

**Análise de Documentação e Ativos:**

✅ **Cobertura de Documentação:**
- Total de empresas documentadas: X
- Documentação completa: Y%
- Gaps críticos identificados: Z

📊 **Inventário de Ativos:**
- Total de ativos registrados: X
- Ativos atualizados (últimos 30 dias): Y%
- Ativos pendentes de atualização: Z

🔐 **Senhas e Credenciais:**
- Total de passwords armazenados: X
- Passwords com OTP/MFA: Y%
- Passwords expirados/vencidos: Z

📋 **Knowledge Base:**
- Artigos publicados: X
- Categorias cobertas: Y
- Artigos atualizados (últimos 90 dias): Z%

⚠️ **Alertas Críticos:**
- Documentação obrigatória faltante: X itens
- Ativos sem atualização (>180 dias): Y
- Passwords sem rotação (>1 ano): Z

🎯 **Métricas de Compliance:**
- Score geral de documentação: X/100
- Empresas em compliance: Y%
- Ações corretivas necessárias: Z

**Formato:** Dashboard executivo compacto para WhatsApp`
            }
          }
        ]
      };

    case 'hudu_documentation_coverage':
      return {
        description: `Cobertura de documentação${company_id ? ` - Company ID ${company_id}` : ' (global)'}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📋 **ANÁLISE DE COBERTURA DE DOCUMENTAÇÃO${company_id ? ` (ID: ${company_id})` : ' (GLOBAL)'}**

**Auditoria de Documentação:**

✅ **Documentação Completa:**
- Infraestrutura de rede: Sim/Não
- Políticas de segurança: Sim/Não
- Diagrama de topologia: Sim/Não
- Inventário de licenças: Sim/Não
- Plano de DR/Backup: Sim/Não
- Contatos técnicos: Sim/Não

⚠️ **Gaps Identificados:**
1. [CRÍTICO] Documentação de DR ausente
2. [ALTO] Diagrama de rede desatualizado (>6 meses)
3. [MÉDIO] Procedimentos de backup incompletos

📊 **Cobertura por Categoria:**
- Infraestrutura: X% completo
- Segurança: Y% completo
- Aplicações: Z% completo
- Políticas/Procedimentos: W% completo

📅 **Atualização de Documentos:**
- Atualizados (<30 dias): X documentos
- Desatualizados (>90 dias): Y documentos
- Nunca atualizados: Z documentos

🎯 **Ações Recomendadas:**
1. Criar documentação de DR (prioridade ALTA)
2. Atualizar diagrama de rede
3. Revisar políticas de segurança
4. Completar inventário de ativos

**Score de Cobertura:** X/100

**Formato:** Relatório de cobertura com priorização`
            }
          }
        ]
      };

    case 'hudu_asset_depreciation':
      return {
        description: `Ativos próximos de EOL (${warning_months} meses)${company_id ? ` - Company ID ${company_id}` : ''}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `⏰ **ATIVOS PRÓXIMOS DE EOL (End of Life)**
**Alerta:** ${warning_months} meses${company_id ? ` | Company ID: ${company_id}` : ' (global)'}

**Análise de Depreciação:**

🚨 **Ativos Críticos (EOL em ${warning_months} meses):**
1. [SERVIDOR] srv-dc01 - Windows Server 2012 R2 (EOL: 10/10/2023)
   - Impacto: Active Directory principal
   - Ação: Migração urgente para Server 2022

2. [FIREWALL] FW-Main - Fortigate 60E (EOL: 12/2024)
   - Impacto: Perímetro de segurança
   - Ação: Upgrade para modelo atual

3. [STORAGE] NAS-Backup - Synology DS1819+ (EOL: 06/2025)
   - Impacto: Repositório de backups
   - Ação: Planejar substituição

📊 **Estatísticas por Tipo:**
- Servidores: X em EOL
- Equipamentos de rede: Y em EOL
- Storage/Backup: Z em EOL
- Workstations: W em EOL

💰 **Planejamento Financeiro:**
- Investimento estimado: R$ X
- Prioridade orçamentária: ALTA/MÉDIA/BAIXA
- Distribuição ao longo do ano

📅 **Timeline de Substituição:**
- Q1 2024: Servidor DC (urgente)
- Q2 2024: Firewall principal
- Q3 2024: Storage de backup
- Q4 2024: Workstations

🎯 **Próximos Passos:**
1. Aprovar orçamento de substituição
2. Agendar migração do DC
3. RFP para novos equipamentos
4. Planejar janelas de manutenção

**Formato:** Relatório de planejamento de EOL`
            }
          }
        ]
      };

    case 'hudu_compliance_gaps':
      return {
        description: `Gaps de compliance${company_id ? ` - Company ID ${company_id}` : ' (global)'}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `🔍 **GAPS DE COMPLIANCE E DOCUMENTAÇÃO${company_id ? ` (ID: ${company_id})` : ' (GLOBAL)'}**

**Auditoria de Compliance:**

🚨 **Documentação Obrigatória Faltante:**

**[CRÍTICO - Regulatório]:**
1. Política de Segurança da Informação (ISO 27001)
   - Status: Ausente
   - Prazo: Imediato
   - Responsável: CISO

2. Plano de Continuidade de Negócios (BCP)
   - Status: Incompleto
   - Prazo: 30 dias
   - Responsável: TI Manager

3. Inventário de Dados Pessoais (LGPD)
   - Status: Desatualizado (>1 ano)
   - Prazo: 15 dias
   - Responsável: DPO

**[ALTO - Operacional]:**
4. Procedimentos de Backup/Restore
5. Matriz de Controle de Acesso
6. Registro de Incidentes de Segurança

**[MÉDIO - Melhoria]:**
7. Políticas de uso aceitável (AUP)
8. Diagrama de arquitetura atualizado
9. Documentação de APIs

📊 **Score de Compliance:**
- Regulatório: X%
- Operacional: Y%
- Segurança: Z%
- **Score Geral: W/100**

⚠️ **Riscos Identificados:**
- Multas regulatórias (LGPD): R$ X
- Auditoria reprovada: Probabilidade ALTA
- Incidentes sem rastreamento: Risco reputacional

🎯 **Plano de Ação (30/60/90 dias):**

**30 dias (CRÍTICO):**
- [ ] Publicar Política de Segurança
- [ ] Atualizar inventário LGPD
- [ ] Documentar BCP básico

**60 dias (ALTO):**
- [ ] Procedimentos de backup
- [ ] Matriz de controle de acesso
- [ ] Registro de incidentes

**90 dias (MÉDIO):**
- [ ] AUP publicada
- [ ] Diagrama de arquitetura
- [ ] Docs técnicas atualizadas

**Formato:** Relatório de compliance com ações priorizadas`
            }
          }
        ]
      };

    case 'hudu_client_maturity':
      return {
        description: `Maturidade TI - Company ID ${company_id}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📊 **ANÁLISE DE MATURIDADE TI**
**Cliente:** Company ID ${company_id}

**Avaliação em 5 Dimensões:**

**1. DOCUMENTAÇÃO (Score: X/10)**
✅ Pontos Fortes:
- Inventário de ativos completo
- Diagramas de rede atualizados

⚠️ Pontos Fracos:
- Procedimentos operacionais ausentes
- Políticas de segurança desatualizadas

**2. INFRAESTRUTURA (Score: Y/10)**
✅ Pontos Fortes:
- Redundância de servidores críticos
- Backup automatizado funcionando

⚠️ Pontos Fracos:
- Equipamentos próximos de EOL
- Ausência de monitoramento proativo

**3. SEGURANÇA (Score: Z/10)**
✅ Pontos Fortes:
- Firewall configurado corretamente
- Antivírus/EDR implantado

⚠️ Pontos Fracos:
- MFA não habilitado para todos
- Ausência de SIEM/log aggregation

**4. PROCESSOS (Score: W/10)**
✅ Pontos Fortes:
- Ticketing system em uso
- Change management básico

⚠️ Pontos Fracos:
- Ausência de gestão de capacidade
- Disaster Recovery não testado

**5. GOVERNANÇA (Score: V/10)**
✅ Pontos Fortes:
- Comitê de TI mensal
- Budget aprovado anualmente

⚠️ Pontos Fracos:
- Ausência de KPIs de TI
- RACI não documentado

**SCORE GERAL DE MATURIDADE: X/50**

**Nível de Maturidade:**
- 0-15: **INICIAL** (Ad-hoc, reativo)
- 16-30: **GERENCIADO** (Processos definidos)
- 31-40: **OTIMIZADO** (Melhoria contínua)
- 41-50: **EXCELÊNCIA** (Best-in-class)

**ROADMAP DE EVOLUÇÃO (12 meses):**

**Q1 - Quick Wins:**
- Habilitar MFA para todos os usuários
- Documentar procedimentos críticos
- Implementar monitoramento básico

**Q2 - Fundação:**
- Substituir equipamentos EOL
- Implementar gestão de mudanças formal
- Teste de DR/Backup

**Q3 - Maturidade:**
- Deploy de SIEM
- Políticas de segurança revisadas
- KPIs de TI definidos

**Q4 - Excelência:**
- Automação de processos
- Dashboard executivo
- Certificação ISO 27001 (opcional)

🎯 **Próximo Nível:** Passar de GERENCIADO para OTIMIZADO
**Investimento Estimado:** R$ X
**ROI Esperado:** Redução de 40% em incidentes

**Formato:** Scorecard de maturidade com roadmap`
            }
          }
        ]
      };

    // ============================================
    // PROMPTS ANALISTA (8 novos)
    // ============================================

    case 'hudu_quick_search':
      return {
        description: `Busca rápida: ${query}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `🔍 **BUSCA RÁPIDA HUDU**
**Termo:** "${query}"

**Resultados Encontrados:**

📦 **ASSETS (${query}):**
1. [SERVIDOR] srv-${query}-01
   - Tipo: Windows Server 2022
   - IP: 192.168.1.10
   - Status: Online
   - Documentado em: [link]

2. [WORKSTATION] ws-${query}-admin
   - Usuário: admin@empresa.com
   - Modelo: Dell Latitude 5520
   - Última atualização: 05/12/2024

🔐 **PASSWORDS (${query}):**
1. ${query} - Admin Account
   - Usuário: administrator
   - URL: https://${query}.empresa.com
   - Última rotação: 01/11/2024
   - [Visualizar senha]

2. ${query} - Database Access
   - Usuário: db_admin
   - Servidor: sql-${query}-01
   - [Visualizar senha]

📄 **ARTICLES (${query}):**
1. "Como configurar ${query}"
   - Categoria: Tutoriais
   - Atualizado: 20/11/2024
   - [Abrir artigo]

2. "Troubleshooting ${query} comum"
   - Categoria: Suporte
   - Atualizado: 15/10/2024
   - [Abrir artigo]

🏢 **COMPANIES:**
1. Empresa ${query} Ltda
   - Clientes ativos: 250
   - Assets registrados: 45
   - Último update: 01/12/2024

**Total de Resultados:** X assets, Y passwords, Z articles, W companies

🎯 **Ações Rápidas:**
- Abrir asset completo
- Copiar senha (com auditoria)
- Visualizar documentação
- Editar informações

**Formato:** Busca multi-recurso compacta`
            }
          }
        ]
      };

    case 'hudu_password_lookup':
      return {
        description: `Buscar credenciais: ${search_term}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `🔐 **BUSCA DE CREDENCIAIS**
**Recurso:** ${search_term}

**Credenciais Encontradas:**

**1. ${search_term} - Admin Principal**
   - Usuário: administrator
   - URL: https://${search_term}.empresa.com
   - Tipo: Acesso administrativo
   - OTP/MFA: Habilitado ✅
   - Última rotação: 15/11/2024
   - Próxima rotação: 15/02/2025

**2. ${search_term} - Usuário de Serviço**
   - Usuário: svc_${search_term}
   - Aplicação: Backup Service
   - Tipo: Service Account
   - OTP/MFA: Não aplicável
   - Última rotação: 01/10/2024
   - ⚠️ ATENÇÃO: Senha sem rotação há 70 dias

**3. ${search_term} - Database**
   - Usuário: db_admin
   - Servidor: sql-prod-01
   - Database: ${search_term}_db
   - Tipo: MySQL root
   - Última rotação: 20/11/2024

🔒 **Política de Segurança:**
- Rotação obrigatória: 90 dias
- Complexidade: Mínimo 16 caracteres
- OTP/MFA: Obrigatório para admin

⚠️ **Alertas:**
- Senha de serviço próxima de expirar (20 dias)
- Considerar rotação antecipada

🎯 **Ações Disponíveis:**
- [Copiar senha] (registra auditoria)
- [Visualizar senha]
- [Rotacionar senha]
- [Compartilhar com usuário]

📋 **Auditoria:**
- Último acesso: 05/12/2024 por admin@empresa.com
- Total de acessos (30 dias): 15
- Compartilhamentos ativos: 3 usuários

**Formato:** Lookup de senha com contexto de segurança`
            }
          }
        ]
      };

    case 'hudu_asset_history':
      return {
        description: `Histórico do ativo ID ${asset_id}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📜 **HISTÓRICO DE MUDANÇAS**
**Asset ID:** ${asset_id}

**Linha do Tempo (últimas 10 mudanças):**

**05/12/2024 14:30 - Atualização de IP**
- Usuário: admin@empresa.com
- Campo alterado: IP Address
- De: 192.168.1.10 → Para: 192.168.1.15
- Motivo: Reorganização de VLAN

**01/12/2024 09:15 - Atualização de Licença**
- Usuário: ti@empresa.com
- Campo alterado: Windows License Key
- Ação: Renovação anual
- Validade: 01/12/2025

**28/11/2024 16:45 - Upgrade de RAM**
- Usuário: tecnico@empresa.com
- Campo alterado: Memory
- De: 16 GB → Para: 32 GB
- Nota: Upgrade para melhor performance

**20/11/2024 10:00 - Atualização de Backup Job**
- Usuário: backup@empresa.com
- Campo alterado: Backup Configuration
- Ação: Adicionado job noturno incremental

**15/11/2024 08:30 - Mudança de Status**
- Usuário: admin@empresa.com
- Campo alterado: Status
- De: Em manutenção → Para: Em produção
- Nota: Manutenção preventiva concluída

📊 **Estatísticas:**
- Total de mudanças (90 dias): X
- Usuários que modificaram: Y pessoas
- Campos mais alterados: IP, Status, Notes

🔍 **Auditoria:**
- Primeira documentação: 01/01/2023
- Última modificação: 05/12/2024
- Total de versões: Z

🎯 **Compliance:**
- Change Management seguido: ✅
- Aprovações registradas: ✅
- Rollback disponível: ✅

**Formato:** Timeline de auditoria detalhada`
            }
          }
        ]
      };

    case 'hudu_new_client_setup':
      return {
        description: `Setup de novo cliente: ${company_name}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `🎯 **CHECKLIST DE ONBOARDING**
**Cliente:** ${company_name}

**FASE 1: CRIAÇÃO INICIAL (Dia 1)**

✅ **1.1 Configuração Básica:**
- [ ] Criar empresa no Hudu
- [ ] Configurar logo e branding
- [ ] Definir responsável técnico principal
- [ ] Criar pasta compartilhada (Sharepoint/Drive)

✅ **1.2 Coleta de Informações:**
- [ ] Questionário de infraestrutura enviado
- [ ] Diagrama de rede atual recebido
- [ ] Lista de fornecedores/contratos coletada
- [ ] Inventário inicial de ativos

**FASE 2: DOCUMENTAÇÃO (Dias 2-5)**

📋 **2.1 Infraestrutura:**
- [ ] Documentar servidores existentes
- [ ] Mapear topologia de rede
- [ ] Registrar equipamentos (switches, firewalls, APs)
- [ ] Inventariar workstations

🔐 **2.2 Segurança e Acessos:**
- [ ] Cadastrar credenciais administrativas (passwords)
- [ ] Documentar políticas de acesso
- [ ] Configurar MFA onde aplicável
- [ ] Criar matriz de permissões

💾 **2.3 Backup e DR:**
- [ ] Documentar estratégia de backup
- [ ] Registrar RPO/RTO acordados
- [ ] Testar restore de backup
- [ ] Criar plano de DR básico

**FASE 3: PROCESSOS (Dias 6-10)**

⚙️ **3.1 Procedimentos Operacionais:**
- [ ] Criar artigo: "Onboarding de novo usuário"
- [ ] Criar artigo: "Offboarding de usuário"
- [ ] Criar artigo: "Procedimento de backup"
- [ ] Criar artigo: "Escalonamento de incidentes"

📞 **3.2 Contatos:**
- [ ] Cadastrar contatos técnicos
- [ ] Cadastrar contatos comerciais
- [ ] Cadastrar fornecedores críticos
- [ ] Definir matriz de escalonamento

**FASE 4: MONITORAMENTO (Dias 11-15)**

📊 **4.1 Ferramentas:**
- [ ] Configurar RMM (Datto/NinjaRMM)
- [ ] Implementar monitoramento de rede
- [ ] Configurar alertas críticos
- [ ] Dashboard executivo criado

📋 **4.2 SLA e Métricas:**
- [ ] Definir SLA de atendimento
- [ ] Configurar ticketing (Autotask/ConnectWise)
- [ ] Estabelecer KPIs de TI
- [ ] Agendar review mensal

**FASE 5: HANDOFF (Dia 16-30)**

✅ **5.1 Treinamento:**
- [ ] Apresentar Hudu para cliente
- [ ] Treinar usuário-chave em portal
- [ ] Demonstrar portal de tickets
- [ ] Compartilhar documentação de processos

🎯 **5.2 Go-Live:**
- [ ] Validar toda documentação
- [ ] Confirmar acessos funcionando
- [ ] Agenda de reviews definida
- [ ] Contrato assinado e ativo

**VALIDAÇÃO FINAL:**

- [ ] Documentação completa: 100%
- [ ] Credenciais testadas: 100%
- [ ] Procedimentos aprovados: 100%
- [ ] Cliente satisfeito: ✅

**Próximos Passos:**
1. Agendar review de 30 dias
2. Coletar feedback do cliente
3. Ajustar processos conforme necessário

**Formato:** Checklist de onboarding executável`
            }
          }
        ]
      };

    case 'hudu_documentation_checklist':
      return {
        description: `Checklist de documentação - Company ID ${company_id}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📋 **CHECKLIST DE DOCUMENTAÇÃO OBRIGATÓRIA**
**Cliente:** Company ID ${company_id}

**INFRAESTRUTURA (10 itens obrigatórios)**

✅ **Rede:**
- [ ] Diagrama de topologia de rede (L1/L2/L3)
- [ ] Inventário de switches/routers
- [ ] Documentação de VLANs
- [ ] Matriz de portas (patch panel)
- [ ] Configuração de firewall (regras críticas)

✅ **Servidores:**
- [ ] Inventário de servidores físicos/virtuais
- [ ] Credenciais de acesso (iDRAC, iLO, ESXi)
- [ ] Configuração de storage/SAN
- [ ] Políticas de backup (3-2-1 rule)
- [ ] Procedimento de restore

**SEGURANÇA (8 itens obrigatórios)**

🔐 **Controle de Acesso:**
- [ ] Política de senhas (complexidade, rotação)
- [ ] Matriz de permissões (RBAC)
- [ ] Configuração de MFA/2FA
- [ ] Política de VPN (acesso remoto)

🛡️ **Compliance:**
- [ ] Política de Segurança da Informação (PSI)
- [ ] Plano de Continuidade de Negócios (BCP)
- [ ] Registro de Incidentes de Segurança
- [ ] Inventário de dados pessoais (LGPD)

**APLICAÇÕES (6 itens obrigatórios)**

⚙️ **Sistemas Críticos:**
- [ ] Inventário de aplicações
- [ ] Credenciais de admin (apps)
- [ ] Procedimento de atualização
- [ ] Licenciamento (chaves, vencimentos)
- [ ] Integrações/APIs documentadas
- [ ] Runbook de troubleshooting

**PROCESSOS (7 itens obrigatórios)**

📋 **Operacionais:**
- [ ] Onboarding de novo usuário
- [ ] Offboarding de usuário
- [ ] Gestão de mudanças (Change Management)
- [ ] Escalonamento de incidentes
- [ ] Procedure de backup/restore
- [ ] Janelas de manutenção
- [ ] Aprovações e assinaturas

**CONTATOS (4 itens obrigatórios)**

📞 **Stakeholders:**
- [ ] Contatos técnicos (TI interno)
- [ ] Contatos comerciais (tomadores de decisão)
- [ ] Fornecedores críticos (ISP, cloud, etc.)
- [ ] Matriz de escalonamento

**ATIVOS (5 itens obrigatórios)**

💾 **Inventário:**
- [ ] Workstations (usuário, modelo, S/N)
- [ ] Impressoras e periféricos
- [ ] Equipamentos de rede (switches, APs)
- [ ] Licenças de software (Office, Windows, etc.)
- [ ] Contratos de suporte/manutenção

**SCORE DE COMPLETUDE:**
- Total de itens: 40
- Completos: X (Y%)
- Faltantes: Z

**🎯 PRIORIZAÇÃO:**

**CRÍTICO (completar em 7 dias):**
1. Política de Segurança da Informação
2. Plano de Continuidade de Negócios
3. Procedimento de backup/restore
4. Credenciais administrativas

**ALTO (completar em 30 dias):**
1. Diagrama de topologia de rede
2. Inventário de servidores
3. Matriz de permissões
4. Runbook de troubleshooting

**MÉDIO (completar em 90 dias):**
1. Documentação de APIs
2. Licenciamento detalhado
3. Registro de incidentes
4. Matriz de portas

**Formato:** Checklist de compliance com priorização`
            }
          }
        ]
      };

    case 'hudu_troubleshooting_wiki':
      return {
        description: `Wiki de troubleshooting: ${search_query}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📚 **WIKI DE TROUBLESHOOTING**
**Busca:** "${search_query}"

**Artigos Encontrados (ordenados por relevância):**

**1. [RESOLVIDO] ${search_query} - Erro comum e solução**
   - Categoria: Troubleshooting
   - Atualizado: 20/11/2024
   - Visualizações: 45
   - Útil: 42/45 (93%)

**Problema:**
Erro "${search_query}" ao tentar acessar aplicação XYZ.

**Causa Raiz:**
Certificado SSL expirado no servidor web.

**Solução:**
\`\`\`bash
# 1. Verificar certificado
openssl x509 -in /etc/ssl/cert.pem -noout -dates

# 2. Renovar com Let's Encrypt
certbot renew --force-renewal

# 3. Reiniciar serviço
systemctl restart apache2
\`\`\`

**Validação:**
✅ Acessar https://app.example.com
✅ Verificar cadeado verde no navegador

**Tempo de Resolução:** 10 min

---

**2. [WORKAROUND] ${search_query} - Solução temporária**
   - Categoria: Known Issues
   - Atualizado: 15/11/2024
   - Visualizações: 32
   - Útil: 28/32 (88%)

**Problema:**
Performance degradada em ${search_query} após atualização.

**Causa Raiz:**
Bug conhecido na versão 2.5.1 (já reportado ao vendor).

**Workaround Temporário:**
1. Desabilitar módulo de cache:
   \`SET cache_enabled = false;\`
2. Aguardar patch (ETA: 15/12/2024)
3. Rollback não recomendado (perde dados)

**Impacto:**
- Redução de 20% na performance
- Aceitável para operação normal

---

**3. [TUTORIAL] Como prevenir ${search_query}**
   - Categoria: Best Practices
   - Atualizado: 01/11/2024
   - Visualizações: 67
   - Útil: 65/67 (97%)

**Medidas Preventivas:**
- Monitorar logs diariamente
- Configurar alertas proativos
- Aplicar patches mensalmente
- Testar em staging primeiro

**Scripts de Automação:**
\`\`\`bash
#!/bin/bash
# Monitor de ${search_query}
grep -i "error" /var/log/app.log | mail -s "Alert" admin@empresa.com
\`\`\`

---

**📊 Estatísticas da Base de Conhecimento:**
- Total de artigos sobre "${search_query}": 12
- Resolvidos: 9
- Workarounds: 2
- Em investigação: 1

**🎯 Artigos Relacionados:**
- "Troubleshooting geral de aplicações web"
- "Checklist de diagnóstico de erros SSL"
- "Melhores práticas de monitoramento"

**💡 Não encontrou solução?**
- Abrir ticket de suporte
- Escalonar para nível 2
- Consultar vendor support

**Formato:** Wiki de soluções técnicas com exemplos`
            }
          }
        ]
      };

    case 'hudu_contact_directory':
      return {
        description: `Diretório de contatos${company_id ? ` - Company ID ${company_id}` : ' (global)'}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `📞 **DIRETÓRIO DE CONTATOS${company_id ? ` (ID: ${company_id})` : ' (GLOBAL)'}**

**CONTATOS TÉCNICOS**

👨‍💼 **TI Interno:**
1. **João Silva** - CTO
   - Email: joao.silva@empresa.com
   - Celular: (11) 98765-4321
   - Disponibilidade: Seg-Sex 8h-18h
   - Responsabilidades: Decisões estratégicas, budget

2. **Maria Santos** - Gerente de TI
   - Email: maria.santos@empresa.com
   - Celular: (11) 98765-1234
   - Disponibilidade: Seg-Sex 8h-18h, plantão 24x7
   - Responsabilidades: Operação, gestão de equipe

3. **Carlos Oliveira** - Analista Sênior
   - Email: carlos.oliveira@empresa.com
   - Celular: (11) 98765-5678
   - Disponibilidade: Seg-Sex 9h-18h
   - Responsabilidades: Infraestrutura, backup

**CONTATOS COMERCIAIS**

💼 **Tomadores de Decisão:**
1. **Ana Paula Costa** - CEO
   - Email: ana.costa@empresa.com
   - Celular: (11) 91234-5678
   - Disponibilidade: Agendar previamente
   - Contato para: Contratos, aprovações orçamentárias

2. **Roberto Ferreira** - CFO
   - Email: roberto.ferreira@empresa.com
   - Celular: (11) 91234-9876
   - Disponibilidade: Seg-Qua-Sex 14h-17h
   - Contato para: Faturas, pagamentos

**FORNECEDORES CRÍTICOS**

🔧 **Suporte e Manutenção:**
1. **ISP Principal - Vivo Empresas**
   - Contato: 0800-123-4567
   - Email: suporte@vivo.com.br
   - SLA: 4 horas
   - Tickets: portal.vivo.com.br

2. **Cloud Provider - AWS**
   - TAM: Pedro Almeida
   - Email: pedro.almeida@amazon.com
   - Telefone: 0800-765-4321
   - Suporte: https://console.aws.amazon.com/support

3. **Backup/DR - Veeam**
   - Contato: Suporte Brasil
   - Email: support.br@veeam.com
   - Portal: https://my.veeam.com
   - SLA: 24 horas (licença Standard)

**MATRIZ DE ESCALONAMENTO**

🚨 **Incidentes Críticos (P1):**
1. Analista on-duty (plantão 24x7)
   → Não resolveu em 30 min?
2. Gerente de TI (Maria Santos)
   → Não resolveu em 1h?
3. CTO (João Silva)
   → Escalonar para vendor se necessário

⚠️ **Incidentes Altos (P2):**
1. Analista horário comercial
   → Não resolveu em 2h?
2. Gerente de TI
   → Não resolveu em 4h?
3. CTO (se impacto financeiro)

📋 **Solicitações Normais (P3/P4):**
1. Analista (fila padrão)
2. Gerente de TI (aprovação se necessário)

**PLANTÃO 24x7 (Emergências)**

📱 **Ordem de Contato:**
1. Plantão do mês: Carlos Oliveira (11) 98765-5678
2. Backup: Maria Santos (11) 98765-1234
3. Escalonamento: João Silva (11) 98765-4321

**🎯 Atualização:**
- Última revisão: 01/12/2024
- Próxima revisão: 01/03/2025
- Responsável: RH + TI

**Formato:** Diretório completo com matriz de escalonamento`
            }
          }
        ]
      };

    case 'hudu_recent_changes':
      return {
        description: `Mudanças recentes (últimas ${hours} horas)`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `🔄 **MUDANÇAS RECENTES NO HUDU**
**Período:** Últimas ${hours} horas

**ASSETS MODIFICADOS**

📦 **05/12/2024 14:30 - srv-dc01**
- Usuário: admin@empresa.com
- Ação: Atualização de IP
- Campo: IP Address (192.168.1.10 → 192.168.1.15)
- Motivo: Reorganização de VLAN

📦 **05/12/2024 12:15 - ws-maria-notebook**
- Usuário: tecnico@empresa.com
- Ação: Upgrade de hardware
- Campo: RAM (8 GB → 16 GB)
- Motivo: Melhor performance

📦 **05/12/2024 09:45 - fw-main**
- Usuário: security@empresa.com
- Ação: Atualização de firmware
- Campo: Firmware version (7.0.1 → 7.0.5)
- Motivo: Patch de segurança crítico

**PASSWORDS MODIFICADOS**

🔐 **05/12/2024 16:00 - Admin Office 365**
- Usuário: admin@empresa.com
- Ação: Rotação de senha (agendada)
- Próxima rotação: 05/03/2025

🔐 **05/12/2024 11:30 - Database SQL-PROD**
- Usuário: dba@empresa.com
- Ação: Atualização de credenciais
- Motivo: Compliance trimestral

**ARTIGOS PUBLICADOS/ATUALIZADOS**

📄 **05/12/2024 15:45 - "Procedimento de Backup Veeam"**
- Autor: backup@empresa.com
- Ação: Atualização de procedimento
- Mudança: Adicionado novo repositório remoto

📄 **05/12/2024 10:00 - "Troubleshooting VPN"**
- Autor: suporte@empresa.com
- Ação: Novo artigo criado
- Categoria: Suporte Remoto

**COMPANIES ATUALIZADAS**

🏢 **05/12/2024 13:20 - Empresa ABC Ltda**
- Usuário: comercial@empresa.com
- Ação: Atualização de contrato
- Campo: Contract End Date (31/12/2024 → 31/12/2025)

**ESTATÍSTICAS DO PERÍODO**

📊 **Resumo (${hours}h):**
- Assets modificados: X
- Passwords atualizados: Y
- Artigos publicados/editados: Z
- Companies atualizadas: W
- Total de mudanças: N

👥 **Usuários Mais Ativos:**
1. admin@empresa.com - 12 mudanças
2. tecnico@empresa.com - 8 mudanças
3. suporte@empresa.com - 5 mudanças

⚠️ **Alertas de Auditoria:**
- Mudanças fora do horário comercial: 3
- Mudanças sem aprovação: 0 ✅
- Mudanças críticas (production): 2

🎯 **Próximas Ações Agendadas:**
- 06/12/2024 02:00 - Manutenção programada (srv-backup)
- 07/12/2024 09:00 - Rotação de senhas (lote mensal)
- 10/12/2024 18:00 - Review de documentação

**Formato:** Feed de atividades com auditoria`
            }
          }
        ]
      };

    default:
      throw new Error(`Prompt desconhecido: ${name}`);
  }
}
