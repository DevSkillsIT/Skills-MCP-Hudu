// prompts.ts - Handlers de prompts para Hudu MCP Server
// Skills IT Soluções em Tecnologia
// Total: 15 prompts (2 originais + 13 novos)
//
// Design note:
// MCP prompts são templates de instrução que o servidor entrega ao cliente
// (LLM) para guiar a geração do relatório. Cada prompt aqui segue o padrão:
//   1) INSTRUÇÕES PARA O LLM — lista explícita de tool calls a executar
//   2) FORMATO DE SAÍDA — estrutura Markdown com [PLACEHOLDERS] claros
//   3) REGRAS — o LLM NÃO deve inventar dados; placeholders viram dados reais
//
// O LLM lê o template, executa as tools listadas (via o próprio MCP), e
// preenche o formato com os resultados. Exemplos fictícios (srv-Skills-01,
// João Silva, etc.) foram removidos porque induziam o LLM a alucinar valores.

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

// Helper: bloco de regras padrão reutilizado em todos os prompts.
const RULES_BLOCK = `## 📝 Regras para o agente

1. Execute TODAS as tool calls listadas em "Instruções" ANTES de escrever o relatório.
2. Substitua cada \`[PLACEHOLDER]\` no formato por dados reais vindos das tools.
3. Se uma tool retornar lista vazia, escreva "Nenhum dado encontrado" na seção correspondente — NÃO invente.
4. NÃO gere valores fictícios (hostnames, emails, IPs, datas, nomes). Se não existe no Hudu, admita explicitamente.
5. Responda sempre em português brasileiro.
6. Preserve a estrutura de seções (headings, bullets) do formato abaixo.`;

/**
 * Handler para prompts do Hudu
 * Retorna template com instruções de tool-calling explícitas para o LLM.
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

  const scope = company_id ? `company_id=${company_id}` : 'global (todas as empresas)';
  const companyArg = company_id ? `{ "company_id": ${company_id}, "page_size": 100 }` : `{ "page_size": 100 }`;

  switch (name) {
    // ============================================================
    // PROMPTS ORIGINAIS (2)
    // ============================================================

    case 'hudu_security_audit':
      return {
        description: `Security audit prompt for Hudu data (${scope})`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 🔒 Auditoria de Segurança Hudu
**Escopo:** ${scope}

## 🎯 Instruções para o agente

Antes de responder, execute as seguintes tool calls:

1. \`search_password_credentials\` com ${companyArg} → guardar como **passwords**
2. \`search_it_asset_inventory\` com ${companyArg} → guardar como **assets**
3. \`search_knowledge_articles\` com ${companyArg} → guardar como **articles**
4. \`search_activity_audit_logs\` com \`{ "page_size": 25${company_id ? `, "resource_id": ${company_id}` : ''} }\` → guardar como **audit_logs**
${company_id ? `5. \`admin_instance_operations\` com \`{ "action": "get_expirations", "company_id": ${company_id} }\` → guardar como **expirations**` : `5. \`admin_instance_operations\` com \`{ "action": "get_expirations" }\` → guardar como **expirations**`}

## 📊 Formato de saída

### Cobertura de Credenciais
- Total de senhas cadastradas: **[passwords.length]**
- Senhas com URL definida: **[count passwords where url != null]**
- Senhas sem URL (risco de orfandade): **[count passwords where url == null]**

### Cobertura de Ativos
- Total de ativos: **[assets.length]**
- Ativos ativos / arquivados: **[count active] / [count archived]**
- Ativos sem serial registrado: **[count assets where primary_serial is null]**

### Cobertura de Documentação
- Total de artigos: **[articles.length]**
- Artigos publicados / rascunhos: **[count published] / [count draft]**

### Expirações Próximas
| Tipo | Recurso | Data |
|---|---|---|
[Para cada expiration em até 90 dias: | expiration_type | expirationable_type#id | date |]

### Atividade Recente
- Ações registradas no período: **[audit_logs.length]**
- Usuários distintos que modificaram: **[count distinct user_email]**
- Ações destrutivas recentes (delete/archive): **[list se houver]**

### Recomendações Priorizadas
[Sintetize 3-5 ações ACIONÁVEIS baseadas nos dados acima. Cada recomendação deve apontar para um gap concreto encontrado. NÃO sugira itens genéricos.]

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_asset_report':
      return {
        description: `Asset inventory report (${scope})`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📦 Relatório de Inventário de Ativos
**Escopo:** ${scope}

## 🎯 Instruções para o agente

1. \`search_it_asset_inventory\` com ${companyArg} → guardar como **assets**
2. \`search_asset_layout_templates\` com \`{}\` → guardar como **layouts**
${company_id ? `3. \`manage_company_information\` com \`{ "action": "get", "id": ${company_id} }\` → guardar como **company**` : ''}
${company_id ? `4. \`search_entity_relations\` com \`{ "fromable_type": "Company", "fromable_id": ${company_id}, "page_size": 25 }\` → guardar como **relations**` : ''}

## 📊 Formato de saída

### Sumário Executivo
- Empresa: **[company.name ou "Global"]**
- Total de ativos: **[assets.length]**
- Layouts em uso: **[count distinct layout_id in assets]** de **[layouts.length]** disponíveis

### Distribuição por Tipo
| Layout | Quantidade |
|---|---|
[agrupar assets por asset_layout_id, mostrar nome do layout e contagem]

### Ativos Ativos vs Arquivados
- Ativos: **[count active]**
- Arquivados: **[count archived]**

### Ativos Sem Documentação Completa
[Listar até 10 assets onde primary_serial, primary_model ou primary_manufacturer estejam nulos]

### Relações Documentadas
- Total de vínculos da empresa: **[relations.length]**
[Se existir, agrupar por toable_type e mostrar contagem]

### Conclusão
[3 bullets com próximas ações baseadas em gaps identificados nos dados acima]

${RULES_BLOCK}` }
        }]
      };

    // ============================================================
    // PROMPTS GESTOR (5)
    // ============================================================

    case 'hudu_executive_dashboard':
      return {
        description: `Dashboard executivo (${scope})`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📊 Dashboard Executivo Hudu
**Escopo:** ${scope}

## 🎯 Instruções para o agente

1. \`search_company_information\` com \`{ "page_size": 25 }\` → guardar como **companies**
2. \`search_it_asset_inventory\` com ${companyArg} → guardar como **assets**
3. \`search_password_credentials\` com ${companyArg} → guardar como **passwords**
4. \`search_knowledge_articles\` com ${companyArg} → guardar como **articles**
5. \`admin_instance_operations\` com \`{ "action": "get_expirations"${company_id ? `, "company_id": ${company_id}` : ''}, "page_size": 50 }\` → guardar como **expirations**

## 📊 Formato de saída

### 🏢 Empresas
- Total cadastradas: **[companies.length]**${company_id ? `\n- Empresa em foco: **[company ID ${company_id}]**` : ''}

### 📦 Ativos
- Total: **[assets.length]**
- Arquivados: **[count archived]**
- Sem atualização há >90 dias: **[count where updated_at < today-90d]**

### 🔐 Credenciais
- Total: **[passwords.length]**
- Com URL configurada: **[count with url]**
- Com \`password_folder_id\` definido (organizadas): **[count with folder]**

### 📚 Base de Conhecimento
- Artigos totais: **[articles.length]**
- Publicados: **[count published]** / Rascunhos: **[count draft]**
- Atualizados em <30 dias: **[count]**

### ⚠️ Expirações
| Período | Quantidade |
|---|---|
| Vencidas | [count where date < today] |
| Próximos 30d | [count] |
| Próximos 90d | [count] |

### 🎯 Indicadores-Chave
- % de ativos com serial: **[100 * assets_with_serial / assets.length]%**
- % de passwords organizadas em pastas: **[100 * passwords_with_folder / passwords.length]%**
- Número de expirações críticas (<30d): **[count]**

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_documentation_coverage':
      return {
        description: `Cobertura de documentação (${scope})`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📋 Análise de Cobertura de Documentação
**Escopo:** ${scope}

## 🎯 Instruções para o agente

1. \`search_knowledge_articles\` com ${companyArg} → guardar como **articles**
2. \`search_kb_article_folders\` com ${company_id ? `\`{ "company_id": ${company_id} }\`` : `\`{}\``} → guardar como **folders**
3. \`search_workflow_procedures\` com ${companyArg} → guardar como **procedures**

## 📊 Formato de saída

### Volume
- Total de artigos: **[articles.length]**
- Total de pastas: **[folders.length]**
- Total de procedimentos: **[procedures.length]**

### Frescor da Documentação
- Atualizados em <30 dias: **[count]**
- Atualizados entre 30-90 dias: **[count]**
- Desatualizados (>90 dias): **[count]**
- Nunca atualizados (created_at == updated_at): **[count]**

### Organização
- Artigos sem folder_id (não organizados): **[count where folder_id is null]**
- Artigos em rascunho: **[count where draft == true]**

### Distribuição por Pasta
| Pasta | Qtd Artigos |
|---|---|
[Top 10 pastas por quantidade de artigos vinculados]

### Procedimentos com Progresso
[Listar até 5 procedures com baixo progresso (<50%)]

### Gaps Priorizados
[Com base nos dados acima, identifique 3-5 gaps concretos. Exemplo: "20 artigos sem pasta", "procedure X com 0% progresso há 6 meses". NÃO sugira gaps genéricos.]

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_asset_depreciation':
      return {
        description: `Ativos próximos de EOL (${warning_months} meses) — ${scope}`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# ⏰ Ativos Próximos de End-of-Life
**Escopo:** ${scope}
**Janela de alerta:** ${warning_months} meses

## 🎯 Instruções para o agente

1. \`search_it_asset_inventory\` com ${companyArg} → guardar como **assets**
2. Para cada asset, verifique se existe campo personalizado com label contendo "EOL", "End of Life", "warranty_end", "vencimento_garantia" ou "end_of_life_date"
3. \`admin_instance_operations\` com \`{ "action": "get_expirations"${company_id ? `, "company_id": ${company_id}` : ''}, "page_size": 100 }\` → guardar como **expirations** (para complementar com SSL/domain/warranty registrados)

## 📊 Formato de saída

### Escopo
- Total de ativos analisados: **[assets.length]**
- Janela de alerta considerada: **${warning_months} meses a partir de hoje**

### Ativos em Risco (EOL na janela)
| Ativo | Tipo | Data EOL | Ação Recomendada |
|---|---|---|---|
[Apenas ativos com campo EOL preenchido e date <= today + ${warning_months} meses. Se nenhum tiver dado, escreva "Nenhum ativo com campo EOL preenchido encontrado."]

### Ativos Sem Dado de EOL
- Quantidade: **[count]**
- Recomendação: **preencher o campo EOL em layouts relevantes para habilitar este relatório**

### Expirações Registradas (SSL / Domain / Warranty)
| Tipo | Recurso | Data |
|---|---|---|
[Filtre expirations por date <= today + ${warning_months} meses]

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_compliance_gaps':
      return {
        description: `Gaps de compliance (${scope})`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 🔍 Gaps de Compliance e Documentação Obrigatória
**Escopo:** ${scope}

## 🎯 Instruções para o agente

1. \`search_knowledge_articles\` com ${companyArg} → guardar como **articles**
2. \`search_workflow_procedures\` com ${companyArg} → guardar como **procedures**
3. \`search_password_credentials\` com ${companyArg} → guardar como **passwords**

Para avaliar presença dos artefatos obrigatórios, **busque por palavras-chave no campo \`name\`** dos artigos/procedimentos:
- "segurança da informação" / "PSI" / "ISO 27001"
- "continuidade" / "BCP" / "DR" / "disaster recovery"
- "LGPD" / "dados pessoais" / "privacidade"
- "backup" / "restore" / "restauração"
- "onboarding" / "offboarding"
- "incidente" / "incident response"

## 📊 Formato de saída

### Documentos Obrigatórios
| Artefato | Presente? | Referência |
|---|---|---|
| Política de Segurança da Informação | [✅/❌] | [id do artigo se presente] |
| Plano de Continuidade (BCP/DR) | [✅/❌] | [id] |
| Inventário LGPD / Dados Pessoais | [✅/❌] | [id] |
| Procedimento de Backup/Restore | [✅/❌] | [id do procedure] |
| Onboarding / Offboarding de usuário | [✅/❌] | [id] |
| Resposta a Incidentes | [✅/❌] | [id] |

### Gaps Identificados
[Liste APENAS os artefatos marcados ❌ acima, com: impacto regulatório, prazo sugerido e responsável típico]

### Métricas de Base
- Total de artigos considerados: **[articles.length]**
- Total de procedimentos considerados: **[procedures.length]**
- Total de passwords cadastradas: **[passwords.length]**

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_client_maturity':
      return {
        description: `Maturidade TI — company_id=${company_id}`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📈 Análise de Maturidade TI
**Cliente:** company_id=${company_id} (obrigatório)

## 🎯 Instruções para o agente

1. \`manage_company_information\` com \`{ "action": "get", "id": ${company_id} }\` → guardar como **company**
2. \`search_it_asset_inventory\` com \`{ "company_id": ${company_id}, "page_size": 100 }\` → guardar como **assets**
3. \`search_knowledge_articles\` com \`{ "company_id": ${company_id}, "page_size": 100 }\` → guardar como **articles**
4. \`search_password_credentials\` com \`{ "company_id": ${company_id}, "page_size": 100 }\` → guardar como **passwords**
5. \`search_workflow_procedures\` com \`{ "company_id": ${company_id}, "page_size": 50 }\` → guardar como **procedures**
6. \`search_network_documentation\` com \`{ "company_id": ${company_id}, "page_size": 50 }\` → guardar como **networks**

## 📊 Formato de saída

### Identificação
- Empresa: **[company.name]**
- Tipo: **[company.company_type]**
- Cidade/UF: **[company.city/company.state]**

### Dimensão 1 · Documentação (peso 10)
- Artigos publicados: **[count published articles]**
- Artigos desatualizados >90d: **[count]**
- Score proposto: **X/10** (regra: 0 artigos=0, 1-10=3, 11-30=6, 31+=9, e -1 se >30% desatualizados)

### Dimensão 2 · Infraestrutura (peso 10)
- Ativos cadastrados: **[assets.length]**
- Redes documentadas: **[networks.length]**
- Ativos sem serial: **[count]**
- Score proposto: **X/10**

### Dimensão 3 · Segurança (peso 10)
- Passwords totais: **[passwords.length]**
- Passwords sem URL (risco): **[count]**
- Score proposto: **X/10**

### Dimensão 4 · Processos (peso 10)
- Procedimentos documentados: **[procedures.length]**
- Procedimentos com progresso >0%: **[count]**
- Score proposto: **X/10**

### Dimensão 5 · Governança (peso 10)
- Este item não é observável pela API e deve ser avaliado qualitativamente (presença de CEO/CTO/CFO cadastrados como contatos, existência de procedimentos de aprovação etc.)
- Score proposto: **X/10** (justifique)

### Score Total e Classificação
- Total: **X/50**
- 0-15: INICIAL · 16-30: GERENCIADO · 31-40: OTIMIZADO · 41-50: EXCELÊNCIA

### Recomendações (3 quick-wins)
[3 ações concretas priorizadas por maior impacto no score, cada uma apontando para dado concreto acima]

${RULES_BLOCK}` }
        }]
      };

    // ============================================================
    // PROMPTS ANALISTA (8)
    // ============================================================

    case 'hudu_quick_search':
      return {
        description: `Busca rápida: "${query}"`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 🔍 Busca Rápida Multi-Recurso
**Termo:** "${query}"

## 🎯 Instruções para o agente

Execute \`search_all_resource_types\` com \`{ "query": "${query}", "page_size": 10 }\` → guardar como **results**

Esta tool já consolida as 4 categorias (articles, assets, passwords, companies) em uma única chamada.

## 📊 Formato de saída

### 🏢 Empresas ([results.companies.length])
| ID | Nome | Cidade |
|---|---|---|
[Top 5 companies]

### 📦 Ativos ([results.assets.length])
| ID | Nome | Tipo | Empresa |
|---|---|---|---|
[Top 5 assets]

### 🔐 Credenciais ([results.passwords.length])
| ID | Nome | Usuário | Empresa ID |
|---|---|---|---|
[Top 5 passwords — nunca exiba o campo \`password\`, sempre mascarado]

### 📄 Artigos ([results.articles.length])
| ID | Título | Empresa ID | Atualizado |
|---|---|---|---|
[Top 5 articles]

### Total: **[results.articles.length + assets.length + passwords.length + companies.length]** resultados

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_password_lookup':
      return {
        description: `Buscar credenciais: "${search_term}"`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 🔐 Lookup de Credenciais
**Termo de busca:** "${search_term}"

## 🎯 Instruções para o agente

1. \`search_password_credentials\` com \`{ "search": "${search_term}", "page_size": 20 }\` → guardar como **passwords**

## 📊 Formato de saída

### Credenciais encontradas ([passwords.length])
| ID | Nome | Usuário | URL | Empresa ID | Pasta |
|---|---|---|---|---|---|
[cada password — campo \`password\` vem mascarado como \`****\` da API; NUNCA tente adivinhar ou exibir]

### Observações de Segurança
- Senhas sem URL definida: **[count]**
- Senhas sem \`password_folder_id\` (desorganizadas): **[count]**
- Senhas vinculadas a asset (\`passwordable_type=Asset\`): **[count]**

### Ação para o usuário
Para ver o valor de uma senha específica, use a interface do Hudu (URL em cada linha). O MCP expõe apenas metadados — valores de senha são sempre mascarados na API.

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_asset_history':
      return {
        description: `Histórico do ativo id=${asset_id}`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📜 Histórico de Mudanças do Ativo
**Asset ID:** ${asset_id}

## 🎯 Instruções para o agente

1. \`manage_it_asset_inventory\` com \`{ "action": "get", "id": ${asset_id} }\` → guardar como **asset_detail**. O parâmetro \`fields\` NÃO se aplica a action=get; é usado apenas em buscas filtradas (search_*).
2. \`search_activity_audit_logs\` com \`{ "resource_type": "Asset", "resource_id": ${asset_id}, "page_size": 25 }\` → guardar como **logs**

## 📊 Formato de saída

### Identificação Atual
- Nome: **[asset_detail.name]**
- Empresa: **[asset_detail.company_name] (ID: [asset_detail.company_id])**
- Tipo: **[asset_detail.asset_type]**
- Layout ID: **[asset_detail.asset_layout_id]**
- URL: **[asset_detail.url]**

### Timeline de Mudanças ([logs.length])
| Data | Usuário | Ação | Campo alterado |
|---|---|---|---|
[cada log — se \`details\` contém JSON, extraia os campos modificados]

### Estatísticas
- Total de registros de auditoria: **[logs.length]**
- Usuários distintos que modificaram: **[count distinct user_email]**
- Data da primeira atividade: **[min created_at]**
- Data da última atividade: **[max created_at]**

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_new_client_setup':
      return {
        description: `Onboarding: "${company_name}"`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 🎯 Checklist de Onboarding de Cliente
**Cliente:** "${company_name}"

## 🎯 Instruções para o agente

1. \`search_company_information\` com \`{ "search": "${company_name}", "page_size": 5 }\` → guardar como **matches**
2. Se \`matches.length == 0\`: informar que a empresa não existe ainda e sugerir criação via \`manage_company_information\` com \`action=create\`
3. Se encontrada (pegue o primeiro match como **company**):
   - \`search_it_asset_inventory\` com \`{ "company_id": company.id, "page_size": 25 }\` → **assets**
   - \`search_knowledge_articles\` com \`{ "company_id": company.id, "page_size": 25 }\` → **articles**
   - \`search_password_credentials\` com \`{ "company_id": company.id, "page_size": 25 }\` → **passwords**
   - \`search_network_documentation\` com \`{ "company_id": company.id, "page_size": 25 }\` → **networks**

## 📊 Formato de saída

### Status da Empresa
[Se não existe: seção "Empresa não encontrada — criar primeiro"]
[Se existe:]
- ID: **[company.id]**
- Nome: **[company.name]**
- Criada em: **[company.created_at]**

### Progresso Atual (completude por categoria)
| Categoria | Status | Quantidade cadastrada |
|---|---|---|
| Ativos | [✅ se >0 / ⚠️ se 0] | [assets.length] |
| Artigos KB | [✅/⚠️] | [articles.length] |
| Senhas | [✅/⚠️] | [passwords.length] |
| Redes | [✅/⚠️] | [networks.length] |

### Checklist de Onboarding
**Fase 1 — Cadastro Inicial**
- [ ] Empresa criada no Hudu ([✅/❌ com base em matches.length])
- [ ] Responsável técnico cadastrado como ativo de contato

**Fase 2 — Documentação de Infraestrutura**
- [ ] Rede principal documentada ([✅ se networks.length >= 1])
- [ ] Servidores/workstations inventariados ([✅ se assets.length >= 1])
- [ ] Credenciais admin cadastradas ([✅ se passwords.length >= 1])

**Fase 3 — Processos**
- [ ] Procedimento de backup/restore documentado
- [ ] Artigo de onboarding de usuário criado
- [ ] Matriz de contatos definida

**Fase 4 — Validação**
- [ ] Todas as senhas testadas
- [ ] Diagrama de rede revisado
- [ ] Go-live aprovado

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_documentation_checklist':
      return {
        description: `Checklist de documentação — company_id=${company_id}`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📋 Checklist de Documentação Obrigatória
**Cliente:** company_id=${company_id}

## 🎯 Instruções para o agente

1. \`manage_company_information\` com \`{ "action": "get", "id": ${company_id} }\` → **company**
2. \`search_knowledge_articles\` com \`{ "company_id": ${company_id}, "page_size": 100 }\` → **articles**
3. \`search_network_documentation\` com \`{ "company_id": ${company_id}, "page_size": 50 }\` → **networks**
4. \`search_it_asset_inventory\` com \`{ "company_id": ${company_id}, "page_size": 100 }\` → **assets**
5. \`search_password_credentials\` com \`{ "company_id": ${company_id}, "page_size": 100 }\` → **passwords**
6. \`search_workflow_procedures\` com \`{ "company_id": ${company_id}, "page_size": 50 }\` → **procedures**

Para detectar presença de artefatos obrigatórios, faça match case-insensitive no \`name\` dos artigos/procedures.

## 📊 Formato de saída

### Identificação
- Empresa: **[company.name]**

### Infraestrutura (10 itens)
| Item | Status | Evidência |
|---|---|---|
| Diagrama de topologia | [✅/❌] | [id do artigo contendo "topologia" ou "diagrama de rede"] |
| Inventário de switches/routers | [✅/❌] | [count assets com asset_type "Network Devices"] |
| Documentação de VLANs | [✅/❌] | [count VLANs via search_network_vlan_records] |
| Firewall configuração | [✅/❌] | [artigo com "firewall"] |
| Inventário de servidores | [✅/❌] | [count assets de servidor] |
| Credenciais iDRAC/iLO/ESXi | [✅/❌] | [passwords com "idrac"/"ilo"/"esxi" no name] |
| Storage/SAN documentado | [✅/❌] | [artigo ou asset relevante] |
| Política de backup 3-2-1 | [✅/❌] | [procedure contendo "backup"] |
| Procedimento de restore | [✅/❌] | [procedure contendo "restore"] |
| Estratégia de DR | [✅/❌] | [artigo/procedure "disaster recovery" ou "BCP"] |

### Segurança (8 itens)
| Item | Status |
|---|---|
| PSI — Política de Segurança | [✅/❌] |
| BCP — Plano de Continuidade | [✅/❌] |
| Registro de incidentes | [✅/❌] |
| Inventário LGPD | [✅/❌] |
| Política de senhas | [✅/❌] |
| Matriz RBAC | [✅/❌] |
| Configuração MFA | [✅/❌] |
| VPN / acesso remoto | [✅/❌] |

### Aplicações (6 itens)
[inventário, credenciais, update, licenciamento, integrações, runbook — cada um ✅/❌]

### Processos (7 itens)
[onboarding, offboarding, change, escalonamento, backup/restore, janelas, aprovações]

### Contatos (4 itens)
[técnicos, comerciais, fornecedores, escalonamento]

### Ativos (5 itens)
[workstations, impressoras, rede, licenças, contratos]

### Score Final
- Total: **40 itens**
- Completos: **[count ✅]** (**[%]%**)
- Faltantes: **[count ❌]**

### Top 5 Gaps Priorizados
[Listar apenas itens ❌ categorizados por criticidade (CRÍTICO/ALTO/MÉDIO) com prazo sugerido]

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_troubleshooting_wiki':
      return {
        description: `Wiki: "${search_query}"`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📚 Wiki de Troubleshooting
**Termo:** "${search_query}"

## 🎯 Instruções para o agente

1. \`search_knowledge_articles\` com \`{ "search": "${search_query}", "page_size": 20 }\` → **articles**
2. \`search_workflow_procedures\` com \`{ "search": "${search_query}", "page_size": 10 }\` → **procedures**

## 📊 Formato de saída

### Artigos Relevantes ([articles.length])
| ID | Título | Empresa ID | Atualizado |
|---|---|---|---|
[listar artigos]

Para cada artigo listado, o usuário pode abrir pela URL usando \`hudu_read_resource\` com \`{ "uri": "hudu://articles", "id": <id> }\` ou acessar diretamente no Hudu.

### Procedimentos Relacionados ([procedures.length])
| ID | Nome | Empresa | Progresso |
|---|---|---|---|
[listar procedures]

### Resumo
- Total de artigos: **[articles.length]**
- Total de procedimentos: **[procedures.length]**
- Artigo mais recente: **[max updated_at]** ID **[id]**

### Se nada encontrado
Oriente o usuário a (a) verificar a grafia do termo, (b) abrir ticket de suporte, (c) criar novo artigo após solução via \`manage_knowledge_articles\` com \`action=create\`.

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_contact_directory':
      return {
        description: `Diretório de contatos (${scope})`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 📞 Diretório de Contatos
**Escopo:** ${scope}

## 🎯 Instruções para o agente

No Hudu, contatos geralmente são cadastrados como **ativos** com layout "Contatos" (asset_layout_id correspondente) ou como campo "primary_mail" em ativos técnicos.

1. \`search_asset_layout_templates\` com \`{ "search": "Contato" }\` → **contact_layouts**
2. Pegue o \`id\` do layout "Contatos" como **contact_layout_id**
3. \`search_it_asset_inventory\` com \`{ "asset_layout_id": contact_layout_id${company_id ? `, "company_id": ${company_id}` : ''}, "page_size": 50 }\` → **contacts**
${company_id ? `4. \`manage_company_information\` com \`{ "action": "get", "id": ${company_id} }\` → **company** (para telefone/endereço da empresa)` : ''}

## 📊 Formato de saída

${company_id ? `### Empresa
- Nome: **[company.name]**
- Telefone principal: **[company.phone_number]**
- Endereço: **[company.address_line_1], [company.city]/[company.state]**
- Website: **[company.website]**

` : ''}### Contatos Cadastrados ([contacts.length])
| ID | Nome | Email | Empresa |
|---|---|---|---|
[cada contato — extrair email de \`primary_mail\` ou campo personalizado]

### Observações
- Se \`contacts.length == 0\`: sugira criar ativos com layout "Contatos" usando \`manage_it_asset_inventory\` com \`action=create\` e \`asset_layout_id=contact_layout_id\`.
- Escalonamento (plantão, on-call) não é dado estruturado no Hudu padrão — verifique se há artigo KB específico.

${RULES_BLOCK}` }
        }]
      };

    case 'hudu_recent_changes':
      return {
        description: `Mudanças recentes (últimas ${hours}h)`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `# 🔄 Feed de Mudanças Recentes
**Janela:** últimas **${hours} horas**

## 🎯 Instruções para o agente

Calcule \`start_date\` = (agora - ${hours} horas) em formato ISO 8601 (AAAA-MM-DDTHH:mm:ssZ).

1. \`search_activity_audit_logs\` com \`{ "start_date": "<start_date>", "page_size": 25 }\` → **logs**
2. Se necessário paginar: chame novamente com \`"page": 2\` até cobrir todos os logs no período (máx 5 páginas = 125 logs).

## 📊 Formato de saída

### Resumo do Período
- Total de ações: **[logs.length]**
- Usuários distintos: **[count distinct user_email]**
- Tipos de recurso afetados: **[count distinct record_type]**

### Agrupado por Tipo de Recurso
| Tipo | Quantidade |
|---|---|
[agrupar por record_type]

### Agrupado por Ação
| Ação | Quantidade |
|---|---|
[agrupar por action: created, updated, viewed, signed in, deleted, archived, ...]

### Top 5 Usuários Mais Ativos
| Usuário | Ações |
|---|---|
[top 5 por count]

### Últimas 10 Mudanças (ordem reversa)
| Data | Usuário | Ação | Recurso |
|---|---|---|---|
[últimas 10 entradas]

### Alertas (se aplicável)
- Ações destrutivas (delete/archive): **[count]** — listar abaixo se houver
- Mudanças fora de horário comercial (sábado/domingo ou <7h ou >20h): **[count]**

${RULES_BLOCK}` }
        }]
      };

    default:
      throw new Error(`Prompt desconhecido: ${name}`);
  }
}
