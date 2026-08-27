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
  dateFilterProperties,
  paginationProperties,
  idForActions
} from './schema-utils.js';
import {
  HUDU_FLAGABLE_TYPES,
  HUDU_FLAG_COLORS,
  type HuduFlag,
  type HuduFlagType
} from '../types.js';
import type { HuduClient } from '../hudu-client.js';
import { checkRecordExists } from '../utils/record-exists.js';

const FLAGABLE_TYPES: string[] = [...HUDU_FLAGABLE_TYPES];
const FLAG_COLORS: string[] = [...HUDU_FLAG_COLORS];
const FLAG_TYPE_ACTIONS = ['create', 'get', 'update', 'delete'];

const FLAGABLE_DISPLAY: Record<string, string> = {
  Asset: 'Ativo',
  Website: 'Site',
  Article: 'Artigo',
  AssetPassword: 'Senha',
  Company: 'Empresa',
  Procedure: 'Procedimento/Processo',
  RackStorage: 'Rack',
  Network: 'Rede',
  IpAddress: 'Endereço IP',
  Vlan: 'VLAN',
  VlanZone: 'Zona de VLAN'
};

const RECORD_TYPE_HINT = FLAGABLE_TYPES.map((t) => `${t} (${FLAGABLE_DISPLAY[t]})`).join(', ');

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
  if (FLAGABLE_TYPES.includes(String(value))) return null;
  return `flagable_type inválido: "${value}". Valores aceitos: ${RECORD_TYPE_HINT}`;
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
// Flag definitions (the catalogue of reasons something can be flagged)
// ---------------------------------------------------------------------------

export const flagTypesQueryTool: Tool = {
  name: 'hudu_search_flag_definitions',
  description:
    'Sinalizações, alertas e marcações de atenção no Hudu — catálogo dos tipos de flag disponíveis, com nome e cor. Use quando precisar do ID de um tipo antes de sinalizar um registro ou de filtrar pendências por motivo. Diferente das etiquetas do Hudu: a flag aponta que algo exige revisão, não categoriza. Consulta somente leitura. Retorna tabela Markdown paginada.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Filtrar pelo nome do tipo de sinalização' },
      color: {
        type: 'string',
        enum: FLAG_COLORS,
        description: 'Filtrar pela cor. Sinalizações usam nomes de cor, não hexadecimal.'
      },
      slug: { type: 'string', description: 'Filtrar pelo slug do tipo' },
      ...dateFilterProperties,
      page: paginationProperties.page,
      page_size: paginationProperties.page_size
    }
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
};

export const flagTypesTool: Tool = {
  name: 'hudu_manage_flag_definitions',
  description:
    'Sinalizações, alertas e marcações de atenção no Hudu — cria, consulta, edita e exclui os tipos de flag do catálogo. Use quando precisar de um novo motivo de sinalização (revisar, desatualizado, pendência) ou ajustar um existente. A cor é um nome de paleta fixa do Hudu (Red, Blue, Grey...), não hexadecimal como nas etiquetas. Aceita action (create, get, update, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(
        FLAG_TYPE_ACTIONS,
        'Ação a executar. Valores: create (criar tipo de sinalização), get (obter por ID), update (alterar nome ou cor), delete (excluir o tipo e as sinalizações que o usam)'
      ),
      id: idForActions(FLAG_TYPE_ACTIONS),
      fields: createFieldsSchema(
        {
          name: {
            type: 'string',
            description:
              'Nome do tipo de sinalização (obrigatório na criação). Precisa ser único na instância, sem diferenciar maiúsculas.'
          },
          color: {
            type: 'string',
            enum: FLAG_COLORS,
            description: `Cor da sinalização (obrigatório na criação). Ao contrário das etiquetas, aqui a cor é um NOME da paleta fixa, não hexadecimal. Valores: ${FLAG_COLORS.join(', ')}`
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
// Flags (records marked for attention)
// ---------------------------------------------------------------------------

export const flagsQueryTool: Tool = {
  name: 'hudu_search_flagged_records',
  description:
    'Registros sinalizados, pendências e alertas no Hudu — lista ativos, senhas, artigos, sites e empresas marcados para revisão, com o motivo de cada um. Use quando precisar levantar o que está pendente na documentação do Hudu ou auditar as sinalizações de um registro específico. Consulta somente leitura. Retorna tabela Markdown paginada com tipo, registro e descrição.',
  inputSchema: {
    type: 'object',
    properties: {
      flag_type_id: {
        type: 'number',
        description:
          'Listar apenas sinalizações deste tipo. Descubra o ID em hudu_search_flag_definitions.'
      },
      flagable_type: {
        type: 'string',
        enum: FLAGABLE_TYPES,
        description: `Tipo do registro sinalizado. Use junto com flagable_id para auditar um registro. Valores: ${RECORD_TYPE_HINT}`
      },
      flagable_id: { type: 'number', description: 'ID numérico do registro sinalizado' },
      description: { type: 'string', description: 'Filtrar pelo texto do motivo da sinalização' },
      ...dateFilterProperties,
      page: paginationProperties.page,
      page_size: paginationProperties.page_size
    }
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
};

export const flagsTool: Tool = {
  name: 'hudu_manage_flagged_records',
  description:
    'Registros sinalizados, pendências e alertas no Hudu — sinaliza e retira a sinalização de ativos, senhas, artigos, empresas e redes. Use quando precisar apontar que um registro exige revisão ou dar baixa numa pendência resolvida no Hudu. Descubra o flag_type_id em hudu_search_flag_definitions antes. Aceita action (flag, unflag, get, update, delete). Retorna Markdown.',
  inputSchema: {
    type: 'object',
    properties: {
      action: createActionSchema(
        ['flag', 'unflag', 'get', 'update', 'delete'],
        'Ação a executar. Valores: flag (sinalizar um registro; repetir o mesmo tipo não duplica), unflag (retirar a sinalização identificada por flag_type_id + flagable_type + flagable_id), get (obter uma sinalização pelo id dela), update (alterar o motivo), delete (excluir a sinalização pelo id dela)'
      ),
      id: { type: 'number', description: 'ID da sinalização, para get, update e delete' },
      flag_type_id: {
        type: 'number',
        description: 'ID do tipo de sinalização (obrigatório em flag e unflag)'
      },
      flagable_type: {
        type: 'string',
        enum: FLAGABLE_TYPES,
        description: `Tipo do registro a sinalizar (obrigatório em flag e unflag). Valores: ${RECORD_TYPE_HINT}`
      },
      flagable_id: {
        type: 'number',
        description: 'ID numérico do registro a sinalizar (obrigatório em flag e unflag)'
      },
      description: {
        type: 'string',
        description: 'Motivo da sinalização, em texto livre. Usado em flag e update.'
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
 * Flag colours are a fixed palette of names. A hex value is the natural guess
 * (labels take hex) and the API answers it with a 422, so catch it here and
 * say what to send instead.
 */
function validateFlagColor(color: unknown): string | null {
  if (FLAG_COLORS.includes(String(color))) return null;
  const hint = String(color).startsWith('#')
    ? 'Sinalizações não aceitam cor hexadecimal — isso é das etiquetas. '
    : '';
  return `${hint}color inválida: "${color}". Valores aceitos: ${FLAG_COLORS.join(', ')}`;
}

/** Resolves flag_type_id -> {name, color} so rows read as names, not ids. */
async function hydrateFlagTypes(
  flags: HuduFlag[],
  client: HuduClient
): Promise<(HuduFlag & { flag_type_name?: string; flag_type_color?: string })[]> {
  if (!flags.length) return flags;
  let types: HuduFlagType[] = [];
  try {
    types = await client.getFlagTypes({ page_size: 1000 });
  } catch {
    return flags;
  }
  const byId = new Map(types.map((t) => [t.id, t]));
  return flags.map((f) => {
    const t = byId.get(f.flag_type_id);
    return t ? { ...f, flag_type_name: t.name, flag_type_color: t.color } : f;
  });
}

export async function executeFlagTypesQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    return createSuccessResponse(await client.getFlagTypes(args ?? {}));
  } catch (error: any) {
    return createErrorResponse(`Busca de tipos de sinalização falhou: ${error.message}`);
  }
}

export async function executeFlagTypesTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, fields } = args ?? {};

  try {
    switch (action) {
      case 'create': {
        if (!fields?.name || !fields?.color) {
          return createErrorResponse(
            `name e color são obrigatórios para criar um tipo de sinalização. A cor é um nome da paleta: ${FLAG_COLORS.join(', ')}`
          );
        }
        const colorError = validateFlagColor(fields.color);
        if (colorError) return createErrorResponse(colorError);
        const created = await client.createFlagType({ name: fields.name, color: fields.color });
        return createSuccessResponse(created, 'Tipo de sinalização criado.');
      }

      case 'get': {
        if (!id) return createErrorResponse('id é obrigatório para obter um tipo de sinalização.');
        return createSuccessResponse(await client.getFlagType(id));
      }

      case 'update': {
        if (!id) return createErrorResponse('id é obrigatório para alterar um tipo de sinalização.');
        const payload: Partial<HuduFlagType> = {};
        if (fields?.name !== undefined) payload.name = fields.name;
        if (fields?.color !== undefined) {
          const colorError = validateFlagColor(fields.color);
          if (colorError) return createErrorResponse(colorError);
          payload.color = fields.color;
        }
        if (Object.keys(payload).length === 0) {
          return createErrorResponse('Nenhum campo informado para alteração.');
        }
        return createSuccessResponse(
          await client.updateFlagType(id, payload),
          'Tipo de sinalização atualizado.'
        );
      }

      case 'delete': {
        if (!id) return createErrorResponse('id é obrigatório para excluir um tipo de sinalização.');
        await client.deleteFlagType(id);
        return createSuccessResponse(
          null,
          'Tipo de sinalização excluído, junto com as sinalizações que o usavam.'
        );
      }

      default:
        return createErrorResponse(`Ação desconhecida: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Operação em tipos de sinalização falhou: ${error.message}`);
  }
}

export async function executeFlagsQueryTool(args: any, client: HuduClient): Promise<ToolResponse> {
  try {
    if (args?.flagable_type !== undefined) {
      const e = invalidRecordType(args.flagable_type);
      if (e) return createErrorResponse(e);
    }
    const flags = await client.getFlags(args ?? {});
    return createWarnedResponse(await hydrateFlagTypes(flags, client), scopeWarning(client));
  } catch (error: any) {
    return createErrorResponse(`Busca de registros sinalizados falhou: ${error.message}`);
  }
}

export async function executeFlagsTool(args: any, client: HuduClient): Promise<ToolResponse> {
  const { action, id, flag_type_id, flagable_type, flagable_id, description } = args ?? {};

  try {
    switch (action) {
      case 'flag': {
        if (!flag_type_id || !flagable_type || !flagable_id) {
          return createErrorResponse(
            'flag_type_id, flagable_type e flagable_id são obrigatórios para sinalizar um registro.'
          );
        }
        const typeError = invalidRecordType(flagable_type);
        if (typeError) return createErrorResponse(typeError);
        // Same reasoning as label apply: re-flagging should report the state,
        // not fail. Unlike labels there is no unique index, so without this
        // check the record would accumulate duplicate flags.
        const existing = await client.getFlags({
          flag_type_id,
          flagable_type,
          flagable_id,
          page_size: 1
        });
        if (existing.length > 0) {
          const current = (await hydrateFlagTypes(existing, client))[0]!;
          // Idempotence is right, but a NEW description was being dropped in
          // silence: the caller asked to change the reason and got the old one
          // back reported as success.
          const reasonIgnored =
            description !== undefined && description !== (current.description ?? undefined);
          return createWarnedResponse(
            current,
            reasonIgnored
              ? `O motivo enviado NÃO foi gravado: o registro já estava sinalizado com este tipo e "flag" não altera sinalização existente. ` +
                `Motivo atual: ${JSON.stringify(current.description ?? null)}. Para trocá-lo, chame action="update" com id=${current.id}.`
              : null,
            'O registro já estava sinalizado com este tipo; nada foi alterado.'
          );
        }
        const exists = await checkRecordExists(client, flagable_type, Number(flagable_id));
        if (exists.state === 'missing') return createErrorResponse(exists.message);

        const created = await client.createFlag({
          flag_type_id,
          flagable_type,
          flagable_id,
          description
        });
        return createWarnedResponse(
          (await hydrateFlagTypes([created], client))[0],
          exists.state === 'unchecked'
            ? `Não foi possível confirmar que ${flagable_type} ${flagable_id} existe (${exists.reason}). Se o ID estiver errado, esta sinalização vira uma pendência fantasma.`
            : null,
          'Registro sinalizado.'
        );
      }

      case 'unflag': {
        if (!flag_type_id || !flagable_type || !flagable_id) {
          return createErrorResponse(
            'flag_type_id, flagable_type e flagable_id são obrigatórios para retirar uma sinalização.'
          );
        }
        const unflagTypeError = invalidRecordType(flagable_type);
        if (unflagTypeError) return createErrorResponse(unflagTypeError);
        const matches = await client.getFlags({
          flag_type_id,
          flagable_type,
          flagable_id,
          page_size: 1
        });
        if (matches.length === 0) {
          return createSuccessResponse(
            { removed: false, flag_type_id, flagable_type, flagable_id },
            'O registro não estava sinalizado com este tipo; nada foi alterado.'
          );
        }
        await client.deleteFlag(matches[0]!.id);
        return createSuccessResponse(
          { removed: true, id: matches[0]!.id, flag_type_id, flagable_type, flagable_id },
          'Sinalização retirada do registro.'
        );
      }

      case 'get': {
        if (!id) return createErrorResponse('id da sinalização é obrigatório para get.');
        const flag = await client.getFlag(id);
        return createSuccessResponse((await hydrateFlagTypes([flag], client))[0]);
      }

      case 'update': {
        if (!id) return createErrorResponse('id da sinalização é obrigatório para update.');
        if (description === undefined) {
          return createErrorResponse('Informe description para alterar o motivo da sinalização.');
        }
        const updated = await client.updateFlag(id, { description });
        return createSuccessResponse(
          (await hydrateFlagTypes([updated], client))[0],
          'Motivo da sinalização atualizado.'
        );
      }

      case 'delete': {
        if (!id) return createErrorResponse('id da sinalização é obrigatório para delete.');
        await client.deleteFlag(id);
        return createSuccessResponse({ removed: true, id }, 'Sinalização excluída.');
      }

      default:
        return createErrorResponse(`Ação desconhecida: ${action}`);
    }
  } catch (error: any) {
    return createErrorResponse(`Operação em registros sinalizados falhou: ${error.message}`);
  }
}
