import { sqliteTable, text, integer, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const configSets = sqliteTable('config_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // e.g., 'holyrics', 'pro-presenter'
});

export const configValues = sqliteTable(
  'config_values',
  {
    configSetId: integer('config_set_id')
      .notNull()
      .references(() => configSets.id),
    key: text('key').notNull(),
    value: text('value').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.configSetId, table.key] }),
    };
  },
);

export const configSetRelations = relations(configSets, ({ many }) => ({
  configValues: many(configValues),
}));

export const configValueRelations = relations(configValues, ({ one }) => ({
  configSet: one(configSets, {
    fields: [configValues.configSetId],
    references: [configSets.id],
  }),
}));

export const presentationStyles = sqliteTable('presentation_styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'bible', 'music', etc.
});

export const styleProperties = sqliteTable('style_properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  styleId: integer('style_id')
    .notNull()
    .references(() => presentationStyles.id),
  key: text('key').notNull(), // e.g., 'textColor', 'fontSize', 'backgroundColor'
  value: text('value').notNull(), // e.g., 'text-white', 'text-4xl', 'bg-black'
});

export const presentationStyleRelations = relations(presentationStyles, ({ many }) => ({
  properties: many(styleProperties),
}));

export const stylePropertyRelations = relations(styleProperties, ({ one }) => ({
  style: one(presentationStyles, {
    fields: [styleProperties.styleId],
    references: [presentationStyles.id],
  }),
}));
