import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const configTable = sqliteTable('config', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => randomUUID()),
  code: text('code').notNull().unique(),
});

export const configValuesTable = sqliteTable(
  'config_values',
  {
    configId: text('config_id')
      .notNull()
      .references(() => configTable.id),
    key: text('key').notNull(),
    value: text('value').notNull(),
  },
  (table) => [primaryKey({ columns: [table.configId, table.key] })],
);

export const configRelations = relations(configTable, ({ many }) => ({
  configValues: many(configValuesTable),
}));

export const configValueRelations = relations(configValuesTable, ({ one }) => ({
  config: one(configTable, {
    fields: [configValuesTable.configId],
    references: [configTable.id],
  }),
}));

export const presentationStylesTable = sqliteTable('presentation_styles', {
  id: text('id').$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull(),
});

export const styleTargetsTable = sqliteTable('style_targets', {
  id: text('id').$defaultFn(() => randomUUID()),
  styleId: text('style_id')
    .notNull()
    .references(() => presentationStylesTable.id),
  target: text('target').notNull(),
  classes: text('classes').notNull(),
});

export const presentationStyleRelations = relations(presentationStylesTable, ({ many }) => ({
  targets: many(styleTargetsTable),
}));

export const stylePropertyRelations = relations(styleTargetsTable, ({ one }) => ({
  style: one(presentationStylesTable, {
    fields: [styleTargetsTable.styleId],
    references: [presentationStylesTable.id],
  }),
}));
