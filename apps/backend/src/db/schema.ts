import { randomUUID } from 'node:crypto';
import { relations } from 'drizzle-orm';
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const presentationTypes = ['music', 'bible'] as const;

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

export const stylesTable = sqliteTable(
  'styles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    type: text('type', { enum: presentationTypes }).notNull(),
    name: text('name').notNull(),
  },
  (table) => [
    uniqueIndex('presentation_styles_name_type_unique').on(
      table.type,
      table.name,
    ),
  ],
);

export const styleAvailableTargetsTable = sqliteTable(
  'style_available_targets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    type: text('type', { enum: presentationTypes }).notNull(),
    target: text('target').notNull(),
    order: integer('order').notNull().default(0),
    description: text('description'),
  },
  (table) => [
    uniqueIndex('style_targets_type_target_unique').on(
      table.type,
      table.target,
    ),
  ],
);

export const styleTargetsClassesTable = sqliteTable(
  'style_targets_classes',
  {
    styleTargetId: text('style_target_id')
      .notNull()
      .references(() => styleAvailableTargetsTable.id),
    styleId: text('style_id')
      .notNull()
      .references(() => stylesTable.id),
    classes: text('classes').notNull(),
  },
  (table) => [primaryKey({ columns: [table.styleTargetId, table.styleId] })],
);

export const activeStylesTable = sqliteTable('active_styles', {
  code: text('code', { enum: presentationTypes }).unique().notNull(),
  styleId: text('style_id')
    .notNull()
    .references(() => stylesTable.id),
});

export const activeStylesRelations = relations(
  activeStylesTable,
  ({ one }) => ({
    style: one(stylesTable, {
      fields: [activeStylesTable.styleId],
      references: [stylesTable.id],
    }),
  }),
);

export const presentationStyleRelations = relations(
  stylesTable,
  ({ many }) => ({
    targets: many(styleAvailableTargetsTable),
    classes: many(styleTargetsClassesTable),
    activeStyles: many(activeStylesTable),
  }),
);

export const stylePropertyRelations = relations(
  styleAvailableTargetsTable,
  ({ many }) => ({
    classes: many(styleTargetsClassesTable),
  }),
);

export const styleClassesRelations = relations(
  styleTargetsClassesTable,
  ({ one }) => ({
    styleTarget: one(styleAvailableTargetsTable, {
      fields: [styleTargetsClassesTable.styleTargetId],
      references: [styleAvailableTargetsTable.id],
    }),
    style: one(stylesTable, {
      fields: [styleTargetsClassesTable.styleId],
      references: [stylesTable.id],
    }),
  }),
);
