import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const deviceBrandEnum = pgEnum("device_brand", [
  "zkteco",
  "hikvision",
  "suprema",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "check_in",
  "check_out",
  "unknown",
]);

// ---------------------------------------------------------------------------
// Empresas (multi-tenant: cada cliente da SaaS é uma "company")
// ---------------------------------------------------------------------------

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Funcionários
// ---------------------------------------------------------------------------

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    fullName: text("full_name").notNull(),
    employeeCode: text("employee_code").notNull(), // nº de funcionário interno do cliente
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyCodeIdx: uniqueIndex("employees_company_code_idx").on(
      table.companyId,
      table.employeeCode
    ),
  })
);

// ---------------------------------------------------------------------------
// Dispositivos (terminais biométricos)
// ---------------------------------------------------------------------------

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    brand: deviceBrandEnum("brand").notNull(),
    serialNumber: text("serial_number").notNull(), // usado para autenticar pushes (ZKTeco/Hikvision)
    name: text("name").notNull(),
    siteName: text("site_name"), // ex: "Mina de Moatize - Portaria 2"
    // Para Suprema: guarda o device_id interno do BioStar, usado nas chamadas à API
    externalRef: text("external_ref"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    serialIdx: uniqueIndex("devices_serial_idx").on(table.serialNumber),
  })
);

// ---------------------------------------------------------------------------
// Mapeamento: ID interno do utilizador no dispositivo -> funcionário real
// ---------------------------------------------------------------------------

export const deviceUserMap = pgTable(
  "device_user_map",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .references(() => devices.id, { onDelete: "cascade" })
      .notNull(),
    deviceUserId: text("device_user_id").notNull(), // PIN/userid tal como existe no terminal
    employeeId: uuid("employee_id")
      .references(() => employees.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    deviceUserIdx: uniqueIndex("device_user_map_idx").on(
      table.deviceId,
      table.deviceUserId
    ),
  })
);

// ---------------------------------------------------------------------------
// Eventos de assiduidade (schema normalizado, independente da marca)
// ---------------------------------------------------------------------------

export const attendanceEvents = pgTable(
  "attendance_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    employeeId: uuid("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    deviceId: uuid("device_id")
      .references(() => devices.id, { onDelete: "cascade" })
      .notNull(),
    // ID bruto do utilizador tal como veio do dispositivo, guardado mesmo que
    // ainda não exista mapeamento para um employeeId (para reconciliar depois)
    rawDeviceUserId: text("raw_device_user_id").notNull(),
    eventTime: timestamp("event_time", { withTimezone: true }).notNull(),
    eventType: eventTypeEnum("event_type").default("unknown").notNull(),
    verifyMethod: text("verify_method"), // fingerprint | face | card | password
    rawPayload: jsonb("raw_payload"), // payload original para auditoria/debug
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyTimeIdx: index("attendance_events_company_time_idx").on(
      table.companyId,
      table.eventTime
    ),
    employeeTimeIdx: index("attendance_events_employee_time_idx").on(
      table.employeeId,
      table.eventTime
    ),
  })
);

// ---------------------------------------------------------------------------
// Cursor de sincronização (usado pelo poller da Suprema, que não faz push)
// ---------------------------------------------------------------------------

export const syncCursors = pgTable("sync_cursors", {
  deviceId: uuid("device_id")
    .references(() => devices.id, { onDelete: "cascade" })
    .primaryKey(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
});
