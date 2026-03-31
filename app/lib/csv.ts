export type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) => header.trim().toLowerCase();

export const parseCsvText = (text: string): { headers: string[]; rows: CsvRow[] } => {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  const rows: CsvRow[] = lines.slice(1).map((line) => {
    const cols = parseLine(line);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = (cols[index] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
};

export const validateHeaders = (
  headers: string[],
  requiredHeaders: string[],
  optionalHeaders: string[] = []
) => {
  const normalizedRequired = requiredHeaders.map(normalizeHeader);
  const normalizedOptional = optionalHeaders.map(normalizeHeader);
  const allowed = new Set([...normalizedRequired, ...normalizedOptional]);

  const missing = normalizedRequired.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required header(s): ${missing.join(", ")}`);
  }

  const extras = headers.filter((header) => !allowed.has(header));
  if (extras.length > 0) {
    throw new Error(`CSV has unsupported header(s): ${extras.join(", ")}`);
  }
};

export const splitMultiValueCell = (value: string) =>
  value
    .split(/[|;\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);

export const parseBooleanCell = (value: string, fallback: boolean) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "") return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
};
