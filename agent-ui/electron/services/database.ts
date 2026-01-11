import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let db: Database.Database | null = null

// Get the database path
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')

  // Ensure directory exists
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  return join(dbDir, 'chrome-agent.db')
}

// Initialize database with schema
export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDatabasePath()
  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create tables
  db.exec(`
    -- Clients table
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      last_session_id TEXT,
      last_active DATETIME,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('user', 'ai', 'system')),
      content TEXT NOT NULL,
      data TEXT,
      status TEXT CHECK (status IN ('sending', 'sent', 'processing', 'executing', 'completed', 'error')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    -- Create index for faster message lookups
    CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

    -- Logs table (optional, for persistent logging)
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      direction TEXT CHECK (direction IN ('inbound', 'outbound')),
      level TEXT DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error')),
      client_id TEXT,
      client_name TEXT,
      summary TEXT,
      data TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for log filtering
    CREATE INDEX IF NOT EXISTS idx_logs_client_id ON logs(client_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);

    -- Templates table for command templates
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for template lookups
    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
    CREATE INDEX IF NOT EXISTS idx_templates_usage ON templates(usage_count DESC);
  `)

  console.log('Database initialized at:', dbPath)
  return db
}

// Close database connection
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// Get database instance
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

// Client operations
export interface ClientRecord {
  id: string
  name: string | null
  last_session_id: string | null
  last_active: string | null
  metadata: string | null
  created_at: string
}

export function getClients(): ClientRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM clients ORDER BY last_active DESC').all() as ClientRecord[]
}

export function getClient(id: string): ClientRecord | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as ClientRecord | undefined
}

export function upsertClient(client: Partial<ClientRecord> & { id: string }): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO clients (id, name, last_session_id, last_active, metadata)
    VALUES (@id, @name, @last_session_id, @last_active, @metadata)
    ON CONFLICT(id) DO UPDATE SET
      name = COALESCE(@name, name),
      last_session_id = COALESCE(@last_session_id, last_session_id),
      last_active = COALESCE(@last_active, last_active),
      metadata = COALESCE(@metadata, metadata)
  `)
  stmt.run({
    id: client.id,
    name: client.name ?? null,
    last_session_id: client.last_session_id ?? null,
    last_active: client.last_active ?? new Date().toISOString(),
    metadata: client.metadata ?? null
  })
}

export function deleteClient(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM clients WHERE id = ?').run(id)
}

// Message operations
export interface MessageRecord {
  id: string
  client_id: string
  type: 'user' | 'ai' | 'system'
  content: string
  data: string | null
  status: string | null
  created_at: string
}

export function getMessages(
  clientId: string,
  options: { limit?: number; offset?: number; before?: string } = {}
): MessageRecord[] {
  const db = getDatabase()
  const { limit = 50, offset = 0, before } = options

  let query = 'SELECT * FROM messages WHERE client_id = ?'
  const params: (string | number)[] = [clientId]

  if (before) {
    query += ' AND created_at < ?'
    params.push(before)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const messages = db.prepare(query).all(...params) as MessageRecord[]
  return messages.reverse() // Return in chronological order
}

export function getMessage(id: string): MessageRecord | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as MessageRecord | undefined
}

export function insertMessage(message: Omit<MessageRecord, 'created_at'>): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO messages (id, client_id, type, content, data, status)
    VALUES (@id, @client_id, @type, @content, @data, @status)
  `)
  stmt.run({
    id: message.id,
    client_id: message.client_id,
    type: message.type,
    content: message.content,
    data: message.data ?? null,
    status: message.status ?? null
  })
}

export function updateMessageStatus(id: string, status: string, data?: string): void {
  const db = getDatabase()
  if (data !== undefined) {
    db.prepare('UPDATE messages SET status = ?, data = ? WHERE id = ?').run(status, data, id)
  } else {
    db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id)
  }
}

export function deleteMessages(clientId: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM messages WHERE client_id = ?').run(clientId)
}

export function deleteAllMessages(): void {
  const db = getDatabase()
  db.prepare('DELETE FROM messages').run()
}

// Log operations (optional)
export interface LogRecord {
  id: number
  type: string
  direction: 'inbound' | 'outbound' | null
  level: 'info' | 'success' | 'warning' | 'error'
  client_id: string | null
  client_name: string | null
  summary: string | null
  data: string | null
  timestamp: string
}

export function insertLog(log: Omit<LogRecord, 'id' | 'timestamp'>): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO logs (type, direction, level, client_id, client_name, summary, data)
    VALUES (@type, @direction, @level, @client_id, @client_name, @summary, @data)
  `)
  stmt.run({
    type: log.type,
    direction: log.direction ?? null,
    level: log.level,
    client_id: log.client_id ?? null,
    client_name: log.client_name ?? null,
    summary: log.summary ?? null,
    data: log.data ?? null
  })
}

export function getLogs(options: {
  limit?: number
  offset?: number
  clientId?: string
  type?: string
  level?: string
} = {}): LogRecord[] {
  const db = getDatabase()
  const { limit = 100, offset = 0, clientId, type, level } = options

  let query = 'SELECT * FROM logs WHERE 1=1'
  const params: (string | number)[] = []

  if (clientId) {
    query += ' AND client_id = ?'
    params.push(clientId)
  }
  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }
  if (level) {
    query += ' AND level = ?'
    params.push(level)
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  return db.prepare(query).all(...params) as LogRecord[]
}

export function clearLogs(beforeDate?: string): void {
  const db = getDatabase()
  if (beforeDate) {
    db.prepare('DELETE FROM logs WHERE timestamp < ?').run(beforeDate)
  } else {
    db.prepare('DELETE FROM logs').run()
  }
}

// Template operations
export interface TemplateRecord {
  id: string
  name: string
  content: string
  description: string | null
  category: string
  usage_count: number
  created_at: string
  updated_at: string
}

export function getTemplates(options: { category?: string; limit?: number } = {}): TemplateRecord[] {
  const db = getDatabase()
  const { category, limit = 100 } = options

  let query = 'SELECT * FROM templates'
  const params: (string | number)[] = []

  if (category) {
    query += ' WHERE category = ?'
    params.push(category)
  }

  query += ' ORDER BY usage_count DESC, updated_at DESC LIMIT ?'
  params.push(limit)

  return db.prepare(query).all(...params) as TemplateRecord[]
}

export function getTemplate(id: string): TemplateRecord | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as TemplateRecord | undefined
}

export function insertTemplate(
  template: Omit<TemplateRecord, 'usage_count' | 'created_at' | 'updated_at'>
): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO templates (id, name, content, description, category)
    VALUES (@id, @name, @content, @description, @category)
  `)
  stmt.run({
    id: template.id,
    name: template.name,
    content: template.content,
    description: template.description ?? null,
    category: template.category ?? 'general'
  })
}

export function updateTemplate(
  id: string,
  updates: Partial<Omit<TemplateRecord, 'id' | 'created_at' | 'updated_at' | 'usage_count'>>
): void {
  const db = getDatabase()
  const fields: string[] = []
  const params: Record<string, unknown> = { id }

  if (updates.name !== undefined) {
    fields.push('name = @name')
    params.name = updates.name
  }
  if (updates.content !== undefined) {
    fields.push('content = @content')
    params.content = updates.content
  }
  if (updates.description !== undefined) {
    fields.push('description = @description')
    params.description = updates.description
  }
  if (updates.category !== undefined) {
    fields.push('category = @category')
    params.category = updates.category
  }

  if (fields.length === 0) return

  fields.push('updated_at = CURRENT_TIMESTAMP')
  const stmt = db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = @id`)
  stmt.run(params)
}

export function deleteTemplate(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM templates WHERE id = ?').run(id)
}

export function incrementTemplateUsage(id: string): void {
  const db = getDatabase()
  db.prepare('UPDATE templates SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
}

export function getTemplateCategories(): string[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT DISTINCT category FROM templates ORDER BY category').all() as { category: string }[]
  return rows.map((r) => r.category)
}
