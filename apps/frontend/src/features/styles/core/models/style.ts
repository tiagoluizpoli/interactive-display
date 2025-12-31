import { z } from 'zod';

export interface StyleListItem {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export const createStyleTargetSchema = z.object({
  targetId: z.uuidv4(),
  classes: z.string().min(1),
});

export type CreateStyleTarget = z.infer<typeof createStyleTargetSchema>;

export const createStyleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['bible', 'music']),
  targets: z.array(createStyleTargetSchema),
});

export type CreateStyle = z.infer<typeof createStyleSchema>;
