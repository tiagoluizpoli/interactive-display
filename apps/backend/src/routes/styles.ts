import { StyleRepository } from '@/db';
import { io } from '@/server';
import { HttpStatusCode } from 'axios';
import { Router } from 'express';
import { z } from 'zod';

export const styleRoutes = Router();

const styleRepository = StyleRepository.getInstance();

const upsertStyleSchema = z.object({
  name: z.string().min(1, 'Style name is required'),
  type: z.enum(['music', 'bible']),
  targets: z.array(
    z.object({
      styleId: z.string().uuid(),
      targetId: z.string().uuid(),
      classes: z.string().min(1, 'Classes are required'),
    }),
  ),
});

const getTargetsSchema = z.object({
  type: z.enum(['music', 'bible']).optional(),
});

const getActiveSchema = z.object({
  code: z.enum(['music', 'bible']),
});

const setActiveSchema = z.object({
  code: z.enum(['music', 'bible']),
  styleId: z.string().uuid(),
});

styleRoutes.get('/', async (_, res) => {
  const styles = await styleRepository.getStyles();
  return res.json(styles);
});

styleRoutes.get('/:styleId', async (req, res) => {
  const { styleId } = req.params;
  const style = await styleRepository.getStyleById(styleId);

  if (!style) {
    return res.status(HttpStatusCode.NotFound).json({ message: 'Style not found' });
  }

  return res.json(style);
});

styleRoutes.post('/', async (req, res) => {
  const parsedBody = upsertStyleSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(HttpStatusCode.BadRequest).json({ errors: parsedBody.error.errors });
  }

  const existingStyle = await styleRepository.getSyleByName(parsedBody.data.name);

  if (existingStyle) {
    return res.status(HttpStatusCode.Conflict).json({ message: 'Style already exists' });
  }

  const style = await styleRepository.insertStyle(parsedBody.data);

  return res.status(201).json(style);
});

styleRoutes.put('/:styleId', async (req, res) => {
  const styleId = req.params.styleId;
  const parsedBody = upsertStyleSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(HttpStatusCode.BadRequest).json({ errors: parsedBody.error.errors });
  }

  const existingStyle = await styleRepository.getStyleById(styleId);

  if (!existingStyle) {
    return res.status(HttpStatusCode.NotFound).json({ message: 'Style not found' });
  }

  const styleToUpdate = { ...parsedBody.data, id: styleId };

  const style = await styleRepository.updateStyle(styleToUpdate);

  return res.status(HttpStatusCode.Ok).json(style);
});

styleRoutes.delete('/:styleId', async (req, res) => {
  const { styleId } = req.params;

  const style = await styleRepository.getStyleById(styleId);

  if (!style) {
    return res.status(HttpStatusCode.NotFound).json({ message: 'Style not found' });
  }

  await styleRepository.deleteStyle(styleId);
  return res.status(HttpStatusCode.Ok).json({
    message: 'Style deleted successfully',
  });
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
    message: 'Style set as active successfully',
  });
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
