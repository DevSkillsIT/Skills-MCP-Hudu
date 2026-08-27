import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  createErrorResponse,
  createSuccessResponse,
  createWarnedResponse,
  type ToolResponse
} from './base.js';
import {
  createActionSchema,
  createFieldsSchema,
  createIncludeSchema,
  dateFilterProperties,
  paginationProperties,
  resolveIncludeGroups,
  projectRecord,
  idForActions
} from './schema-utils.js';
import { HUDU_LABELABLE_TYPES, type HuduLabel, type HuduLabelType } from '../types.js';
import type { HuduClient } from '../hudu-client.js';
import { checkRecordExists } from '../utils/record-exists.js';

const LABELABLE_TYPES: string[] = [...HUDU_LABELABLE_TYPES];

// Human-facing names for the Hudu class names, so the model does not have to
// guess that "AssetPassword" is what the UI calls a password.
const LABELABLE_DISPLAY: Record<string, string> = {
  Article: 'Artigo',
  Asset: 'Ativo',
  AssetPassword: 'Senha',
  Website: 'Site',
  IpAddress: 'Endereço IP',
  Vlan: 'VLAN',
  VlanZone: 'Zona de VLAN',
  Procedure: 'Procedimento/Processo',
  Network: 'Rede',
  RackStorage: 'Rack'
};

const RECORD_TYPE_HINT = LABELABLE_TYPES.map((t) => `${t} (${LABELABLE_DISPLAY[t]})`).join(', ');

/**
 * Rejects a record type Hudu does not accept.
 *
 * This guard used to run only on the write-that-creates. `remove`/`unflag`
 * passed the type straight to the API, where a wrong one has two bad endings
 * and the code could not tell them apart: the filter matches nothing and the
 * caller is told "was not applied" (false, the marking is still there), or the
 * filter is ignored and the lookup falls back to a broader match.
 */
function invalidRecordType(value: unknown): string | null {
  if (LABELABLE_TYPES.includes(String(value))) return null;
  return `labelable_type inválido: "${value}". Valores aceitos: ${RECORD_TYPE_HINT}`;
}

/**
 * Surfaces the company-scope caveat inside the answer when the deployment has
 * an allowlist these endpoints cannot honour. Duck-typed: only
 * FilteredHuduClient implements it.
 */
function scopeWarning(client: unknown): string | null {
  const fn = (client as { scopeWarningForUnscopedEndpoints?: () => string | null })
    ?.scopeWarningForUnscopedEndpoints;
  return typeof fn === 'function' ? fn.call(client) : null;
}

// ---------------------------------------------------------------------------
// Label definitions (the catalogue: what labels exist and where they may go)
// ---------------------------------------------------------------------------

const LABEL_TYPE_BASE_FIELDS = ['id', 'name', 'color', 'slug'] as const;
const LABEL_TYPE_GROUPS: Record<string, readonly string[]> = {
  scope: ['applicable_record_types', 'access_level', 'allowed_company_ids'],
  meta: ['created_at', 'updated_at']
};
const LABEL_TYPE_INCLUDE_GROUPS = Object.keys(LABEL_TYPE_GROUPS);
const LABEL_TYPE_ACTIONS = ['create', 'get', 'update', 'delete'];

export const labelTypesQueryTool: Tool = {
  name: 'hudu_search_label_definitions',
  description:
    'Etiquetas, tags e marcadores no Hudu — catálogo das definições existentes com nome, cor e escopo de aplicação. Use quando precisar descobrir o ID de uma etiqueta do Hudu antes de aplicá-la a um registro ou de filtrar por ela. Consulta somente leitura. Retorna tabela Markdown paginada; peça o grupo scope em include para ver tipos de registro e empresas permitidas.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Filtrar pelo nome da etiqueta' },
      color: { type: 'string', description: 'Filtrar pela cor em hexadecimal, ex: "#ff0000"' },
      slug: { type: 'string', description: 'Filtrar pelo slug da etiqueta' },
      ...dateFilterProperties,
      include: createIncludeSchema(
        LABEL_TYPE_INCLUDE_GROUPS,
        'Grupos extras de campos por linha. Padrão: apenas id, nome, cor e slug. Grupos: scope (tipos de registro aplicáveis, nível de acesso, empresas permitidas), meta (datas de criação e atualização).'
      ),
      page: paginationProperties.page,
      page_size: paginationProperties.page_size
    }
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
};

export const labelTypesTool: Tool = {
  name: 'hudu_manage_label_definitions',
  description:
    'Etiquetas, tags e marcadores no Hudu — cria, consulta, edita e exclui as definições do catálogo do Hudu. Use quando precisar de uma etiqueta nova ou alterar nome, cor e escopo de uma existente. ATENÇÃO: reduzir applicable_record_types ou allowed_company_ids apaga as aplicações que deixarem de casar. Aceita action (create, get, update, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(
        LABEL_TYPE_ACTIONS,
        'Ação a executar. Valores: create (criar etiqueta no catálogo), get (obter por ID), update (alterar nome, cor ou escopo), delete (excluir a etiqueta e todas as suas aplicações)'
      ),
      id: idForActions(LABEL_TYPE_ACTIONS),
      fields: createFieldsSchema(
        {
          name: { type: 'string', description: 'Nome da etiqueta (obrigatório na criação)' },
          color: {
            type: 'string',
            description: 'Cor em hexadecimal, ex: "#ff0000" ou "#f00" (obrigatório na criação)'
          },
          applicable_record_types: {
            type: 'array',
            items: { type: 'string', enum: LABELABLE_TYPES },
            description: `Tipos de registro que aceitam esta etiqueta. Omita para permitir todos. Valores: ${RECORD_TYPE_HINT}`
          },
          allowed_company_ids: {
            type: 'array',
            items: { type: 'number' },
            description:
              'IDs das empresas às quais a etiqueta fica restrita. Omita ou envie lista vazia para liberar a todas.'
          }
        },
        ['name', 'color']
      )
    },
    required: ['action']
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true }
};

// ---------------------------------------------------------------------------
// Label assignments (which record carries which label)
// ---------------------------------------------------------------------------

export const labelsQueryTool: Tool = {
  name: 'hudu_search_labeled_records',
  description:
    'Etiquetas, tags e rótulos aplicados a registros no Hudu — mostra quais marcam um ativo, senha, artigo ou rede, ou quais registros carregam determinada etiqueta. Use quando precisar auditar a marcação de um registro do Hudu ou levantar tudo que tem uma tag. Consulta somente leitura. Retorna tabela Markdown paginada com o nome da etiqueta já resolvido.',
  inputSchema: {
    type: 'object',
    properties: {
      label_type_id: {
        type: 'number',
        description:
          'Listar todos os registros que carregam esta etiqueta. Descubra o ID em hudu_search_label_definitions.'
      },
      labelable_type: {
        type: 'string',
        enum: LABELABLE_TYPES,
        description: `Tipo do registro marcado. Use junto com labelable_id para ler as etiquetas de um registro. Valores: ${RECORD_TYPE_HINT}`
      },
      labelable_id: { type: 'number', description: 'ID numérico do registro marcado' },
      user_id: { type: 'number', description: 'Filtrar pelas aplicações feitas por um usuário' },
      ...dateFilterProperties,
      page: paginationProperties.page,
      page_size: paginationProperties.page_size
    }
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
};

export const labelsTool: Tool = {
  name: 'hudu_manage_labeled_records',
  description:
    'Etiquetas, tags e rótulos aplicados a registros no Hudu — marca e desmarca ativos, senhas, artigos, redes e procedimentos. Use quando precisar aplicar ou tirar uma etiqueta de um registro do Hudu; empresas não aceitam etiqueta. Descubra o label_type_id em hudu_search_label_definitions. remove usa o tipo + o registro; delete usa o id da aplicação. Aceita action (apply, remove, get, delete).',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(
        ['apply', 'remove', 'get', 'delete'],
        'Ação a executar. Valores: apply (aplicar etiqueta a um registro; repetir não duplica), remove (tirar a etiqueta do registro, identificada por label_type_id + labelable_type + labelable_id), get (obter uma aplicação pelo id dela), delete (excluir a aplicação pelo id dela)'
      ),
      id: { type: 'number', description: 'ID da aplicação da etiqueta, para get e delete' },
      label_type_id: {
        type: 'number',
        description: 'ID da etiqueta no catálogo (obrigatório em apply e remove)'
      },
      labelable_type: {
        type: 'string',
        enum: LABELABLE_TYPES,
        description: `Tipo do registro a marcar (obrigatório em apply e remove). Valores: ${RECORD_TYPE_HINT}`
      },
      labelable_id: {
        type: 'number',
        description: 'ID numérico do registro a marcar (obrigatório em apply e remove)'
      }
    },
    required: ['action']
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true }
};

// ---------------------------------------------------------------------------
// Executors
// ---------------------------------------------------------------------------

/**
 * Resolves label_type_id -> {name, color} so a list of labels reads as names
 * instead of a wall of ids. One extra request for the whole page; the API has
 * no way to expand the association.
 */
async function hydrateLabelTypes(
  labels: HuduLabel[],
  client: HuduClient
): Promise<(HuduLabel & { label_type_name?: string; label_type_color?: string })[]> {
  if (!labels.length) return labels;
  let types: HuduLabelType[] = [];
  try {
    types = await client.getLabelTypes({ page_size: 1000 });
  } catch {
    // Hydration is a nicety. If the catalogue is unreadable with this key the
    // ids still answer the question, so degrade instead of failing the call.
    return labels;
  }
  const byId = new Map(types.map((t) => [t.id, t]));
  return labels.map((l) => {
    const t = byId.get(l.label_type_id);
    return t ? { ...l, label_type_name: t.name, label_type_color: t.color } : l;
  });
}

export async function executeLabelTypesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    const { include, ...params } = args ?? {};
    const groups = resolveIncludeGroups(include, LABEL_TYPE_INCLUDE_GROUPS);
    const types = await client.getLabelTypes(params);
    const projected = types.map((t) =>
      projectRecord(t, LABEL_TYPE_BASE_FIELDS, LABEL_TYPE_GROUPS, groups)
    );
    return createSuccessResponse(projected);
  } catch (error: any) {
    return createErrorResponse(`Busca de definições de etiqueta falhou: ${error.message}`);
  }
}

export async function executeLabelTypesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args ?? {};

  try {
    switch (action) {
      case 'create': {
        if (!fields?.name || !fields?.color) {
          return createErrorResponse(
            'name e color são obrigatórios para criar uma etiqueta. A cor deve ser hexadecimal, ex: "#ff0000".'
          );
        }
        const payload: Partial<HuduLabelType> = {
          name: fields.name,
          color: fields.color,
          applicable_record_types:
            fields.applicable_record_types?.length ? fields.applicable_record_types : LABELABLE_TYPES
        };
        const companyIds: number[] = fields.allowed_company_ids ?? [];
        payload.allowed_company_ids = companyIds;
        payload.access_level = companyIds.length ? 'specific_companies' : 'all_companies';
        const created = await client.createLabelType(payload);
        return createSuccessResponse(created, 'Etiqueta criada no catálogo.');
      }

      case 'get': {
        if (!id) return createErrorResponse('id é obrigatório para obter uma etiqueta.');
        return createSuccessResponse(await client.getLabelType(id));
      }

      case 'update': {
        if (!id) return createErrorResponse('id é obrigatório para alterar uma etiqueta.');
        const payload: Partial<HuduLabelType> = {};
        if (fields?.name !== undefined) payload.name = fields.name;
        if (fields?.color !== undefined) payload.color = fields.color;
        if (fields?.applicable_record_types !== undefined) {
          payload.applicable_record_types = fields.applicable_record_types?.length
            ? fields.applicable_record_types
            : LABELABLE_TYPES;
        }
        if (fields?.allowed_company_ids !== undefined) {
          const companyIds: number[] = fields.allowed_company_ids ?? [];
          payload.allowed_company_ids = companyIds;
          payload.access_level = companyIds.length ? 'specific_companies' : 'all_companies';
        }
        if (Object.keys(payload).length === 0) {
          return createErrorResponse('Nenhum campo informado para alteração.');
        }
        const updated = await client.updateLabelType(id, payload);
        return createSuccessResponse(updated, 'Etiqueta atualizada.');
      }

      case 'delete': {
        if (!id) return createErrorResponse('id é obrigatório para excluir uma etiqueta.');
        await client.deleteLabelType(id);
        return createSuccessResponse(
          null,
          'Etiqueta excluída do catálogo, junto com todas as suas aplicações.'
        );
      }

      default:
        return createErrorResponse(`Ação desconhecida: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Operação em definições de etiqueta falhou: ${error.message}`);
  }
}

export async function executeLabelsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    // An out-of-enum value here used to come back as "Nenhuma etiqueta aplicada
    // encontrada." — a wrong answer wearing the face of a fact. Worst case is
    // right concept, wrong case ("asset"), or a type valid for flags but not
    // for labels (Company).
    if (args?.labelable_type !== undefined) {
      const e = invalidRecordType(args.labelable_type);
      if (e) return createErrorResponse(`${e} (etiquetas não aceitam Company; sinalizações aceitam)`);
    }
    const labels = await client.getLabels(args ?? {});
    return createWarnedResponse(await hydrateLabelTypes(labels, client), scopeWarning(client));
  } catch (error: any) {
    return createErrorResponse(`Busca de etiquetas aplicadas falhou: ${error.message}`);
  }
}

export async function executeLabelsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, label_type_id, labelable_type, labelable_id } = args ?? {};

  try {
    switch (action) {
      case 'apply': {
        if (!label_type_id || !labelable_type || !labelable_id) {
          return createErrorResponse(
            'label_type_id, labelable_type e labelable_id são obrigatórios para aplicar uma etiqueta.'
          );
        }
        const typeError = invalidRecordType(labelable_type);
        if (typeError) return createErrorResponse(typeError);
        // Applying twice is a no-op in Hudu, but the API would answer with a
        // uniqueness validation error. Return the existing assignment instead,
        // so the caller sees the state it asked for rather than a failure.
        const existing = await client.getLabels({
          label_type_id,
          labelable_type,
          labelable_id,
          page_size: 1
        });
        if (existing.length > 0) {
          return createSuccessResponse(
            (await hydrateLabelTypes(existing, client))[0],
            'A etiqueta já estava aplicada a este registro; nada foi alterado.'
          );
        }
        // The API creates a label pointing at an id that does not exist, and
        // the orphan then reads as a legitimate row forever.
        const exists = await checkRecordExists(client, labelable_type, Number(labelable_id));
        if (exists.state === 'missing') return createErrorResponse(exists.message);

        const created = await client.createLabel({ label_type_id, labelable_type, labelable_id });
        return createWarnedResponse(
          (await hydrateLabelTypes([created], client))[0],
          exists.state === 'unchecked'
            ? `Não foi possível confirmar que ${labelable_type} ${labelable_id} existe (${exists.reason}). Se o ID estiver errado, esta etiqueta vira uma marcação órfã.`
            : null,
          'Etiqueta aplicada ao registro.'
        );
      }

      case 'remove': {
        if (!label_type_id || !labelable_type || !labelable_id) {
          return createErrorResponse(
            'label_type_id, labelable_type e labelable_id são obrigatórios para remover uma etiqueta.'
          );
        }
        const removeTypeError = invalidRecordType(labelable_type);
        if (removeTypeError) return createErrorResponse(removeTypeError);
        // The API deletes by the assignment id, which the caller never sees.
        // Look it up from the triple the caller does know.
        const matches = await client.getLabels({
          label_type_id,
          labelable_type,
          labelable_id,
          page_size: 1
        });
        if (matches.length === 0) {
          return createSuccessResponse(
            { removed: false, label_type_id, labelable_type, labelable_id },
            'Esta etiqueta não estava aplicada ao registro; nada foi alterado.'
          );
        }
        await client.deleteLabel(matches[0]!.id);
        return createSuccessResponse(
          { removed: true, id: matches[0]!.id, label_type_id, labelable_type, labelable_id },
          'Etiqueta removida do registro.'
        );
      }

      case 'get': {
        if (!id) return createErrorResponse('id da aplicação é obrigatório para get.');
        const label = await client.getLabel(id);
        return createSuccessResponse((await hydrateLabelTypes([label], client))[0]);
      }

      case 'delete': {
        if (!id) return createErrorResponse('id da aplicação é obrigatório para delete.');
        await client.deleteLabel(id);
        return createSuccessResponse({ removed: true, id }, 'Aplicação de etiqueta excluída.');
      }

      default:
        return createErrorResponse(`Ação desconhecida: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Operação em etiquetas de registro falhou: ${error.message}`);
  }
}
