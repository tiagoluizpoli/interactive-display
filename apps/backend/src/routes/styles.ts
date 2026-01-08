import { StyleRepository } from '@/db';
import { io } from '@/server';
import { HttpStatusCode } from 'axios';
import { Router } from 'express';
import { z } from 'zod';

export const styleRoutes = Router();

const styleRepository = StyleRepository.getInstance();

const types = ['music', 'bible'] as const;

const upsertStyleSchema = z.object({
  name: z.string().min(1, 'Style name is required'),
  type: z.enum(types),
  targets: z.array(
    z.object({
      targetId: z.string().uuid(),
      classes: z.string().min(1, 'Classes are required'),
    }),
  ),
});

const getStylesParametersSchema = z.object({
  type: z.enum(types).optional(),
});

const getTargetsSchema = z.object({
  type: z.enum(types).optional(),
});

const getActiveSchema = z.object({
  code: z.enum(types),
});

const setActiveSchema = z.object({
  code: z.enum(types),
  styleId: z.string().uuid(),
});

styleRoutes.get('/', async (req, res) => {
  const parsedParameters = getStylesParametersSchema.safeParse(req.query);

  if (!parsedParameters.success) {
    return res.status(HttpStatusCode.BadRequest).json({ errors: parsedParameters.error.errors });
  }

  const { type } = parsedParameters.data;

  const styles = await styleRepository.getStyles(type);

  // await new Promise((resolve) => setTimeout(resolve, 2 * 1000));

  return res.json(styles);
});

styleRoutes.get('/target', async (req, res) => {
  const parsedParameters = getTargetsSchema.safeParse(req.query);

  if (!parsedParameters.success) {
    return res.status(400).json({ errors: parsedParameters.error.errors });
  }

  const { type } = parsedParameters.data;
  const targets = await styleRepository.getTargets({ type });
  return res.json(targets);
});

styleRoutes.get('/:styleId', async (req, res) => {
  const { styleId } = req.params;
  const style = await styleRepository.getStyleById(styleId);

  if (!style) {
    return res.status(HttpStatusCode.NotFound).json({ message: 'Estilo não encontrado' });
  }

  return res.json(style);
});

styleRoutes.post('/', async (req, res) => {
  const parsedBody = upsertStyleSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(HttpStatusCode.BadRequest).json({ errors: parsedBody.error.errors });
  }

  const { type, name } = parsedBody.data;
  const existingStyle = await styleRepository.getSyleByName({ type, name });

  if (existingStyle) {
    return res.status(HttpStatusCode.Conflict).json({ message: 'Estilo já existe' });
  }

  const style = await styleRepository.insertStyle(parsedBody.data);

  return res.status(HttpStatusCode.Created).json({
    message: 'Estilo criado com sucesso',
    style,
  });
});

styleRoutes.put('/:styleId', async (req, res) => {
  try {
    const styleId = req.params.styleId;
    const parsedBody = upsertStyleSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(HttpStatusCode.BadRequest).json({ errors: parsedBody.error.errors });
    }

    const existingStyle = await styleRepository.getStyleById(styleId);

    if (!existingStyle) {
      return res.status(HttpStatusCode.NotFound).json({ message: 'Estilo não encontrado' });
    }

    const styleToUpdate = { ...parsedBody.data, id: styleId };

    await styleRepository.updateStyle(styleToUpdate);

    const style = await styleRepository.getStyleById(styleId);

    if (style?.isActive) {
      io.emit('style-updated', {
        code: style.type,
        styleId: style.id,
      });
    }

    return res.status(HttpStatusCode.Ok).json(style);
  } catch (e) {
    1;
    const error = e as Error;
    return res.status(HttpStatusCode.InternalServerError).json({
      message: error.message,
    });
  }
});

styleRoutes.delete('/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;

    const style = await styleRepository.getStyleById(styleId);

    if (!style) {
      return res.status(HttpStatusCode.NotFound).json({ message: 'Estilo não encontrado' });
    }

    if (style.isActive) {
      return res.status(HttpStatusCode.UnprocessableEntity).json({
        message: 'Não é possível excluir um estilo ativo.',
      });
    }

    await styleRepository.deleteStyle(styleId);
    return res.status(HttpStatusCode.Ok).json({
      message: 'Estilo deletado com sucesso',
    });
  } catch (error) {
    console.error(error);
  }
});

styleRoutes.get('/active/:code', async (req, res) => {
  const parsedParameters = getActiveSchema.safeParse(req.params);
  if (!parsedParameters.success) {
    return res.status(HttpStatusCode.BadRequest).json({ errors: parsedParameters.error.errors });
  }
  const { code } = parsedParameters.data;

  const activeStyles = await styleRepository.getActiveStyle(code);

  return res.status(HttpStatusCode.Ok).json(activeStyles);
});

styleRoutes.post('/active', async (req, res) => {
  const parsedBody = setActiveSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(HttpStatusCode.BadRequest).json({ errors: parsedBody.error.errors });
  }

  const { code, styleId } = parsedBody.data;

  await styleRepository.setActiveStyle(code, styleId);
  io.emit('style-updated', {
    code,
    styleId,
  });

  return res.status(HttpStatusCode.Ok).json({
    message: 'Estilo configurado como ativo com sucesso',
  });
});
