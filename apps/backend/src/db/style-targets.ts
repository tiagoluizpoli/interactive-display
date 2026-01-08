import { sql } from 'drizzle-orm';
import { db } from './database-setup';
import { stylesTable, styleTargetsClassesTable, styleAvailableTargetsTable, activeStylesTable } from './schema';

export const seedStyles = async () => {
  const presentationTatgets = await db
    .insert(styleAvailableTargetsTable)
    .values([
      // Music
      { type: 'music', target: 'container', description: 'Bloco externo que envolve o conteúdo' },
      { type: 'music', target: 'text-container', description: 'Bloco interno que envolve a letra' },
      { type: 'music', target: 'text', description: 'A letra em si' },

      // bible
      { type: 'bible', target: 'container', description: 'Bloco externo que envolve todo o conteúdo' },
      { type: 'bible', target: 'inner-container', description: 'Bloco interno que envolve todo o conteúdo' },
      {
        type: 'bible',
        target: 'reference-container',
        description: 'Bloco envolve a referência da bíblia (referência e versão)',
      },
      { type: 'bible', target: 'reference', description: 'Referência da bíblia (Lívro, Capítulo e Versículo)' },
      { type: 'bible', target: 'version', description: 'Versão da bíblia' },
      {
        type: 'bible',
        target: 'text-container',
        description: 'Bloco interno que envolve o texto da bíblia',
      },

      { type: 'bible', target: 'text', description: 'Texto da bíblia' },
    ])
    .onConflictDoUpdate({
      target: [styleAvailableTargetsTable.type, styleAvailableTargetsTable.target],
      set: {
        type: sql`excluded.type`,
        target: sql`excluded.target`,
        description: sql`excluded.description`,
      },
    })
    .returning();

  const [musicStyle, bibleStyle] = await db
    .insert(stylesTable)
    .values([
      { name: 'default', type: 'music' },
      { name: 'default', type: 'bible' },
    ])
    .onConflictDoUpdate({
      target: [stylesTable.name, stylesTable.type],
      set: {
        name: sql`excluded.name`,
        type: sql`excluded.type`,
      },
    })
    .returning();

  await db
    .insert(styleTargetsClassesTable)
    .values([
      {
        styleTargetId: presentationTatgets.find((target) => target.type === 'music' && target.target === 'container')!
          .id!,
        styleId: musicStyle.id!,
        classes: 'w-full p-4 flex justify-center',
      },
      {
        styleTargetId: presentationTatgets.find(
          (target) => target.type === 'music' && target.target === 'text-container',
        )!.id!,
        styleId: musicStyle.id!,
        classes: 'w-fit text-5xl font-bold bg-[rgba(0,0,0,0.9)] text-white px-8 py-6 rounded-xl',
      },
      {
        styleTargetId: presentationTatgets.find((target) => target.type === 'bible' && target.target === 'container')!
          .id!,
        styleId: bibleStyle.id!,
        classes: 'w-full p-4',
      },
      {
        styleTargetId: presentationTatgets.find(
          (target) => target.type === 'bible' && target.target === 'inner-container',
        )!.id!,
        styleId: bibleStyle.id!,
        classes: 'bg-[rgba(0,0,0,0.9)] w-full font-sans flex flex-col items-end gap-2 p-8 rounded-2xl4',
      },
      {
        styleTargetId: presentationTatgets.find(
          (target) => target.type === 'bible' && target.target === 'reference-container',
        )!.id!,
        styleId: bibleStyle.id!,
        classes: 'flex items-start gap-4 pb-4 mb-2',
      },
      {
        styleTargetId: presentationTatgets.find((target) => target.type === 'bible' && target.target === 'reference')!
          .id!,
        styleId: bibleStyle.id!,
        classes: 'w-fit font-bold text-5xl text-white  rounded-xl',
      },
      {
        styleTargetId: presentationTatgets.find((target) => target.type === 'bible' && target.target === 'version')!
          .id!,
        styleId: bibleStyle.id!,
        classes: 'text-2xl font-thin text-white',
      },
      {
        styleTargetId: presentationTatgets.find(
          (target) => target.type === 'bible' && target.target === 'text-container',
        )!.id!,
        styleId: bibleStyle.id!,
        classes: 'w-full',
      },
      {
        styleTargetId: presentationTatgets.find((target) => target.type === 'bible' && target.target === 'text')!.id!,
        styleId: bibleStyle.id!,
        classes: 'text-5xl text-white',
      },
    ])
    .onConflictDoUpdate({
      target: [styleTargetsClassesTable.styleTargetId, styleTargetsClassesTable.styleId],
      set: {
        classes: sql`excluded.classes`,
      },
    });

  await db
    .insert(activeStylesTable)
    .values([
      { code: 'music', styleId: musicStyle.id! },
      { code: 'bible', styleId: bibleStyle.id! },
    ])
    .onConflictDoUpdate({
      target: [activeStylesTable.code],
      set: {
        styleId: sql`excluded.style_id`,
      },
    });
};
