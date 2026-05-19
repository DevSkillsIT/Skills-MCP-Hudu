/**
 * audit-encoding.ts — UTF-8 mojibake guard for SPEC-HUDU-FIX-001 / REQ-19 / PRB-08.
 *
 * Scans all .ts source files (excluding tests) for known mojibake patterns
 * (unaccented forms of common pt-BR words). Exits non-zero when any match
 * is found so it can be wired into CI.
 *
 * Usage:
 *   npx ts-node scripts/audit-encoding.ts
 *   npm run audit:encoding
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Each entry maps a mojibake pattern to the correct pt-BR form. The pattern
// is a literal substring; an entry only triggers when the substring appears
// outside identifiers (word boundaries enforced via regex \b).
const MOJIBAKE_PATTERNS: Array<{ wrong: string; right: string }> = [
  { wrong: 'paineis', right: 'painéis' },
  { wrong: 'paginacao', right: 'paginação' },
  { wrong: 'Acao', right: 'Ação' },
  { wrong: 'acao', right: 'ação' },
  { wrong: 'Descricao', right: 'Descrição' },
  { wrong: 'descricao', right: 'descrição' },
  { wrong: 'informacoes', right: 'informações' },
  { wrong: 'organizacoes', right: 'organizações' },
  { wrong: 'expiracoes', right: 'expirações' },
  { wrong: 'Expiracoes', right: 'Expirações' },
  { wrong: 'expiracao', right: 'expiração' },
  { wrong: 'renovacoes', right: 'renovações' },
  { wrong: 'dominios', right: 'domínios' },
  { wrong: 'licencas', right: 'licenças' },
  { wrong: 'relatorios', right: 'relatórios' },
  { wrong: 'analises', right: 'análises' },
  { wrong: 'catalogo', right: 'catálogo' },
  { wrong: 'disponiveis', right: 'disponíveis' },
  { wrong: 'disponivel', right: 'disponível' },
  { wrong: 'validos', right: 'válidos' },
  { wrong: 'obrigatoria', right: 'obrigatória' },
  { wrong: 'obrigatorio', right: 'obrigatório' },
  { wrong: 'endereco', right: 'endereço' },
  { wrong: 'Endereco', right: 'Endereço' },
  { wrong: 'especifico', right: 'específico' },
  { wrong: 'titulo', right: 'título' },
  { wrong: 'publicacao', right: 'publicação' },
  { wrong: 'criacao', right: 'criação' },
  { wrong: 'verificacao', right: 'verificação' },
  { wrong: 'observacoes', right: 'observações' },
  { wrong: 'OBRIGATORIO', right: 'OBRIGATÓRIO' },
];

function findFiles(): string[] {
  // Use git ls-files to respect .gitignore and avoid scanning node_modules.
  const output = execSync('git ls-files "src/**/*.ts"', { cwd: process.cwd() }).toString();
  return output
    .split('\n')
    .filter(Boolean)
    .filter((p) => !p.includes('/__tests__/') && !p.endsWith('.test.ts'));
}

interface Finding {
  file: string;
  line: number;
  column: number;
  pattern: string;
  suggestion: string;
  context: string;
}

function scanFile(path: string): Finding[] {
  const content = readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const findings: Finding[] = [];

  for (const { wrong, right } of MOJIBAKE_PATTERNS) {
    // Word-boundary match (avoids hitting identifiers like `acao_id` or words
    // longer than the pattern). The pattern is escaped because it has no
    // regex metacharacters in practice; if any are added, escape here.
    const re = new RegExp(`\\b${wrong}\\b`, 'g');
    lines.forEach((lineText, idx) => {
      let match: RegExpExecArray | null;
      while ((match = re.exec(lineText)) !== null) {
        findings.push({
          file: path,
          line: idx + 1,
          column: match.index + 1,
          pattern: wrong,
          suggestion: right,
          context: lineText.trim().slice(0, 120),
        });
      }
    });
  }

  return findings;
}

function main(): void {
  const files = findFiles();
  const findings: Finding[] = [];

  for (const file of files) {
    findings.push(...scanFile(file));
  }

  if (findings.length === 0) {
    console.log(`audit-encoding: scanned ${files.length} files — clean.`);
    process.exit(0);
  }

  console.error(`audit-encoding: ${findings.length} mojibake occurrence(s) in ${files.length} file(s).`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}:${f.column}  "${f.pattern}" -> "${f.suggestion}"  | ${f.context}`);
  }
  process.exit(1);
}

main();
