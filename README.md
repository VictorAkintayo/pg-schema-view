# pg-schema-view

A powerful CLI tool for exploring PostgreSQL database schemas with beautiful console output, Markdown documentation, JSON export, and Mermaid ER diagrams.

## Features

- 🔍 **Comprehensive Schema Introspection**: Extract tables, columns, data types, constraints, indexes, and relationships
- 🎨 **Beautiful Console Output**: Colorful, readable terminal output with icons and formatting
- 📝 **Markdown Export**: Generate documentation-ready Markdown files
- 📊 **JSON Export**: Machine-readable schema data
- 🗺️ **Mermaid ER Diagrams**: Generate entity-relationship diagrams for visualization
- ⚙️ **Flexible Configuration**: Support for config files, environment variables, and CLI flags
- 🎯 **Table Filtering**: Include or exclude specific tables
- 🔗 **Relationship Mapping**: Visualize foreign key relationships between tables

## Installation

```bash
npm install -g pg-schema-view
```

Or use it directly with `npx`:

```bash
npx pg-schema-view --connection postgres://user:pass@localhost:5432/dbname
```

## Quick Start

### Basic Usage

```bash
# Using connection string
pg-schema-view --connection postgres://user:pass@localhost:5432/mydb

# Using environment variables
PGHOST=localhost PGUSER=user PGDATABASE=mydb PGPASSWORD=pass pg-schema-view

# Multiple schemas
pg-schema-view -c postgres://... -s public -s audit

# Include indexes and constraints
pg-schema-view -c postgres://... --include-indexes --include-constraints
```

### Output Formats

#### Console Output (Default)

```bash
pg-schema-view -c postgres://...
```

Produces colorful, formatted output like:

```
Schema: public

📦 users
  • id (integer) NOT NULL PK
  • email (character varying) NOT NULL UNIQUE
  • created_at (timestamp without time zone) NOT NULL DEFAULT now()

📦 orders
  • id (integer) NOT NULL PK
  • user_id (integer) NOT NULL
  • total (numeric) NULL

  Foreign Keys:
    FK orders_user_id_fkey: (user_id) → users(id) ON DELETE CASCADE
```

#### Markdown Export

```bash
pg-schema-view -c postgres://... --output markdown --markdown-file schema.md
```

Generates a Markdown document with tables, columns, constraints, and relationships.

#### JSON Export

```bash
pg-schema-view -c postgres://... --output json --json-file schema.json
```

Exports the complete schema as structured JSON.

#### Mermaid ER Diagram

```bash
pg-schema-view -c postgres://... --output mermaid --mermaid-file schema.mmd
```

Generates a Mermaid ER diagram that can be rendered in Markdown viewers or Mermaid-compatible tools.

Example output:

```mermaid
erDiagram
  users {
    integer id PK
    varchar email
    timestamp created_at
  }
  orders {
    integer id PK
    integer user_id FK
    numeric total
  }
  users ||--o{ orders : "user_id"
```

### Table Filtering

```bash
# Include only specific tables
pg-schema-view -c postgres://... --tables users --tables orders

# Exclude specific tables
pg-schema-view -c postgres://... --exclude-tables migrations,schema_migrations

# Combine filters
pg-schema-view -c postgres://... -t users -t orders --exclude-tables audit_log
```

### Relationships Only

Generate a simplified ER diagram focusing only on relationships:

```bash
pg-schema-view -c postgres://... --output mermaid --relationships-only
```

## Configuration File

Create a `pg-schema-view.config.json` file:

```json
{
  "connection": "postgres://user:pass@localhost:5432/mydb",
  "schemas": ["public", "audit"],
  "excludeTables": ["migrations", "schema_migrations"],
  "includeIndexes": true,
  "includeConstraints": true,
  "output": "markdown",
  "markdownFile": "docs/schema.md"
}
```

Then use it:

```bash
pg-schema-view --config pg-schema-view.config.json
```

### Configuration Priority

Configuration values are merged in this order (later values override earlier ones):

1. Defaults
2. Config file
3. Environment variables
4. CLI flags (highest priority)

## CLI Options

### Core Options

| Option | Short | Description |
|--------|-------|-------------|
| `--connection` | `-c` | PostgreSQL connection string |
| `--schema` | `-s` | Target schema(s) to introspect (default: `public`) |
| `--output` | `-o` | Output format: `console`, `markdown`, `json`, `mermaid` (default: `console`) |
| `--config` | | Path to config file (JSON) |

### Filtering Options

| Option | Description |
|--------|-------------|
| `--tables` | Include only these tables (can be specified multiple times) |
| `--exclude-tables` | Exclude tables (comma-separated) |

### Output Options

| Option | Description |
|--------|-------------|
| `--include-indexes` | Include index information in output |
| `--include-constraints` | Include constraints (unique, check, foreign key details) |
| `--relationships-only` | Only render relationships/ER diagram, not detailed columns |
| `--markdown-file` | Write markdown output to file (only when `--output=markdown`) |
| `--json-file` | Write JSON output to file (only when `--output=json`) |
| `--mermaid-file` | Write Mermaid diagram to file (only when `--output=mermaid`) |

### Other Options

| Option | Description |
|--------|-------------|
| `--debug` | Print debug logs (connection info, timings, query stats) |
| `--version` | Show version number |
| `--help` | Show help message |

## Environment Variables

The tool automatically reads PostgreSQL connection parameters from environment variables:

- `PGHOST` - Database host (default: `localhost`)
- `PGPORT` - Database port (default: `5432`)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

If a connection string is provided via `--connection`, it takes precedence.

## Examples

### Generate Documentation

```bash
# Generate Markdown documentation with all details
pg-schema-view \
  -c postgres://user:pass@localhost:5432/mydb \
  --output markdown \
  --markdown-file docs/schema.md \
  --include-indexes \
  --include-constraints
```

### Export Schema as JSON

```bash
# Export complete schema for programmatic use
pg-schema-view \
  -c postgres://user:pass@localhost:5432/mydb \
  --output json \
  --json-file schema.json \
  --include-indexes \
  --include-constraints
```

### Generate ER Diagram

```bash
# Create a Mermaid ER diagram
pg-schema-view \
  -c postgres://user:pass@localhost:5432/mydb \
  --output mermaid \
  --mermaid-file schema.mmd \
  --relationships-only
```

### Multiple Schemas

```bash
# Introspect multiple schemas
pg-schema-view \
  -c postgres://user:pass@localhost:5432/mydb \
  -s public \
  -s audit \
  -s reporting
```

### Filtered View

```bash
# View only specific tables with full details
pg-schema-view \
  -c postgres://user:pass@localhost:5432/mydb \
  --tables users \
  --tables orders \
  --tables order_items \
  --include-indexes \
  --include-constraints
```

## Schema Information Collected

The tool introspects and collects:

- **Tables**: Name, schema, type (table/view/materialized view)
- **Columns**: Name, data type, nullability, default values
- **Primary Keys**: Constraint name and columns
- **Unique Constraints**: Single and multi-column unique constraints
- **Foreign Keys**: Relationships with referenced tables, ON DELETE/ON UPDATE actions
- **Indexes**: Index names, columns, uniqueness, index type (btree, gin, gist, etc.)

## Output Formats

### Console Output

The default console output uses colors and icons to make the schema easy to read:

- 📦 Regular tables
- 👁️ Views
- 📊 Materialized views
- Color coding for:
  - Primary keys (green)
  - Unique constraints (cyan)
  - Foreign keys (magenta)
  - Nullable vs NOT NULL (subtle differences)

### Markdown Output

The Markdown output is suitable for documentation and includes:

- Hierarchical structure by schema
- Tables with column details
- Markdown tables for columns
- Lists for constraints, indexes, and foreign keys
- Proper formatting for code blocks and emphasis

### JSON Output

The JSON output provides a complete, structured representation of the schema:

```json
{
  "schemas": ["public"],
  "tables": [
    {
      "schema": "public",
      "name": "users",
      "kind": "table",
      "columns": [...],
      "primaryKey": {...},
      "uniqueConstraints": [...],
      "foreignKeys": [...],
      "indexes": [...]
    }
  ]
}
```

### Mermaid Output

The Mermaid output generates ER diagrams compatible with:

- GitHub Markdown (renders automatically)
- Mermaid Live Editor
- Documentation tools that support Mermaid
- VS Code with Mermaid extensions

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (for testing)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd pg-schema-view

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
pg-schema-view/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── cli.ts            # Command setup and argument parsing
│   ├── config.ts         # Configuration loading and merging
│   ├── db/
│   │   ├── connection.ts # Database connection management
│   │   └── introspect.ts # Schema introspection queries
│   ├── schema/
│   │   ├── types.ts      # TypeScript interfaces for schema model
│   │   └── transform.ts  # Transform raw DB results to normalized model
│   ├── output/
│   │   ├── consoleRenderer.ts  # Pretty console output
│   │   ├── markdownRenderer.ts # Markdown generation
│   │   ├── jsonRenderer.ts    # JSON export
│   │   └── mermaidRenderer.ts  # Mermaid ER diagrams
│   └── utils/
│       ├── logger.ts     # Logging utility
│       └── spinner.ts    # Loading spinner
├── tests/                # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

The project includes unit tests for schema transformation and renderers:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Responsible Usage

This tool is designed for developers to introspect their own databases or databases they have explicit permission to access. Always:

- Use appropriate connection credentials
- Respect database access policies
- Be mindful of sensitive data in connection strings
- Use environment variables or config files (not committed to version control) for credentials

## Troubleshooting

### Connection Issues

If you encounter connection errors:

1. Verify your PostgreSQL server is running
2. Check your connection string format: `postgres://user:password@host:port/database`
3. Ensure your credentials are correct
4. Check firewall and network settings
5. Use `--debug` flag for detailed connection information

### No Tables Found

If no tables are found:

1. Verify the schema name(s) are correct
2. Check that you have permissions to access the schema
3. Ensure tables exist in the specified schema(s)
4. Try using `--debug` to see what schemas are being queried

### Missing Foreign Keys or Constraints

If foreign keys or constraints are not showing:

1. Use `--include-constraints` flag
2. Verify that constraints actually exist in the database
3. Check that you're querying the correct schema(s)

## Changelog

### 1.0.0

- Initial release
- Console, Markdown, JSON, and Mermaid output formats
- Schema introspection with tables, columns, constraints, indexes
- Config file support
- Table filtering options
- Environment variable support
