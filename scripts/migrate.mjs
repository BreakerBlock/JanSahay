import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = neon(process.env.DATABASE_URL);

function splitSqlStatements(source) {
  const statements = [];
  let current = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') inLineComment = false;
      i += 1;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (dollarTag) {
      if (source.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      current += char;
      i += 1;
      continue;
    }

    if (inSingle) {
      current += char;
      if (char === "'" && next === "'") {
        current += next;
        i += 2;
        continue;
      }
      if (char === "'") inSingle = false;
      i += 1;
      continue;
    }

    if (inDouble) {
      current += char;
      if (char === '"' && next === '"') {
        current += next;
        i += 2;
        continue;
      }
      if (char === '"') inDouble = false;
      i += 1;
      continue;
    }

    if (char === '-' && next === '-') {
      current += char + next;
      inLineComment = true;
      i += 2;
      continue;
    }

    if (char === '/' && next === '*') {
      current += char + next;
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      current += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      current += char;
      i += 1;
      continue;
    }

    if (char === '$') {
      const match = source.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*?\$|^\$\$/);
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    if (char === ';') {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      i += 1;
      continue;
    }

    current += char;
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function runSqlFile(path) {
  const source = await readFile(path, 'utf8');
  const statements = splitSqlStatements(source);
  for (const statement of statements) {
    await sql.query(statement);
  }
}

await runSqlFile(new URL('../db/schema.sql', import.meta.url));
await runSqlFile(new URL('../db/seed.sql', import.meta.url));
console.log('Database schema applied.');
