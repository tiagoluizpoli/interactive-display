import type {
  InsertStyle,
  Style,
  StyleTarget,
  Type,
  UpdateStyle,
} from '@/models';
import { and, eq } from 'drizzle-orm';
import { db } from '../database-setup';
import {
  stylesTable,
  styleTargetsClassesTable,
  styleAvailableTargetsTable,
  activeStylesTable,
} from '../schema';

export interface getTargetsFilter {
  type?: Type;
}

export interface GetStyleByName {
  type: Type;
  name: string;
}

export class StyleRepository {
  private static instance: StyleRepository;

  public static getInstance(): StyleRepository {
    if (!StyleRepository.instance) {
      StyleRepository.instance = new StyleRepository();
    }
    return StyleRepository.instance;
  }

  private constructor() {}

  public async getTargets(filter?: getTargetsFilter): Promise<StyleTarget[]> {
    const targets = await db.query.styleAvailableTargetsTable.findMany({
      where: filter?.type
        ? eq(styleAvailableTargetsTable.type, filter.type)
        : undefined,
      orderBy: (tbl, { asc }) => [asc(tbl.order)],
    });

    if (!targets.length) return [];

    return targets.map((target) => ({
      id: target.id!,
      type: target.type,
      target: target.target,
      order: target.order,
      description: target.description ?? undefined,
    }));
  }

  public async getStyles(type?: Type): Promise<Style[]> {
    const styles = await db.query.stylesTable.findMany({
      where: type ? eq(stylesTable.type, type) : undefined,
      with: {
        activeStyles: true,
      },
    });

    if (!styles.length) return [];

    return styles.map((style) => ({
      id: style.id!,
      name: style.name,
      type: style.type,
      isActive: !!style.activeStyles.length,
    }));
  }

  public async getStyleById(id: string) {
    const style = await db.query.stylesTable.findFirst({
      where: eq(stylesTable.id, id),
      with: {
        classes: {
          with: {
            styleTarget: true,
          },
        },
        activeStyles: true,
      },
    });

    if (!style) {
      return;
    }

    return {
      id: style.id!,
      name: style.name,
      type: style.type,
      isActive: !!style.activeStyles.length,
      classes: style.classes
        .sort((a, b) => a.styleTarget.order - b.styleTarget.order)
        .map((c) => ({
          target: {
            id: c.styleTargetId,
            name: c.styleTarget.target,
            order: c.styleTarget.order,
            description: c.styleTarget.description ?? undefined,
          },
          classes: c.classes,
        })),
    };
  }

  public async getSyleByName({ type, name }: GetStyleByName) {
    const style = await db.query.stylesTable.findFirst({
      where: and(eq(stylesTable.type, type), eq(stylesTable.name, name)),
    });

    if (!style) return;

    return {
      id: style.id!,
      name: style.name,
      type: style.type,
    };
  }

  public async insertStyle(style: InsertStyle) {
    const [styleResult] = await db
      .insert(stylesTable)
      .values({ type: style.type, name: style.name })
      .returning();

    await db.insert(styleTargetsClassesTable).values(
      style.targets.map((target) => ({
        styleId: styleResult.id!,
        styleTargetId: target.targetId,
        classes: target.classes,
      })),
    );

    return await this.getStyleById(styleResult.id!);
  }

  public async updateStyle(style: UpdateStyle) {
    const [updatedStyle] = await db
      .update(stylesTable)
      .set({
        name: style.name,
        type: style.type,
      })
      .where(eq(stylesTable.id, style.id!))
      .returning();

    await db
      .delete(styleTargetsClassesTable)
      .where(eq(styleTargetsClassesTable.styleId, updatedStyle.id!));

    await db.insert(styleTargetsClassesTable).values(
      style.targets.map((target) => ({
        styleId: updatedStyle.id!,
        styleTargetId: target.targetId,
        classes: target.classes,
      })),
    );
  }

  public async deleteStyle(id: string) {
    await db
      .delete(styleTargetsClassesTable)
      .where(eq(styleTargetsClassesTable.styleId, id))
      .execute();
    await db.delete(stylesTable).where(eq(stylesTable.id, id)).execute();
  }

  public async setActiveStyle(code: Type, styleId: string) {
    await db
      .insert(activeStylesTable)
      .values({ code, styleId })
      .onConflictDoUpdate({
        target: [activeStylesTable.code],
        set: {
          styleId,
        },
      });
  }

  public async getActiveStyle(code: Type) {
    const activeStyle = await db.query.activeStylesTable.findFirst({
      where: eq(activeStylesTable.code, code),
      with: {
        style: {
          with: {
            classes: {
              with: {
                styleTarget: true,
              },
            },
          },
        },
      },
    });

    if (!activeStyle) return;

    return {
      id: activeStyle.styleId,
      name: activeStyle.style.name,
      type: activeStyle.style.type,
      classes: activeStyle.style.classes
        .sort((a, b) => a.styleTarget.order - b.styleTarget.order)
        .map((c) => ({
          target: {
            id: c.styleTargetId,
            name: c.styleTarget.target,
            order: c.styleTarget.order,
            description: c.styleTarget.description ?? undefined,
          },
          classes: c.classes,
        })),
    };
  }
}
