import { Router } from 'express';
import { ConfigService } from '../infrastructure/config-service';
import { z } from 'zod';

export const configRoutes = Router();
const configService = ConfigService.getInstance();

const setConfigSchema = z.object({
  setName: z.string().min(1, 'Config set name is required'),
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});

const setNameParamSchema = z.object({
  setName: z.string().min(1, 'Config set name is required'),
});

const deleteConfigSchema = z.object({
  setName: z.string().min(1, 'Config set name is required'),
  key: z.string().min(1, 'Key is required'),
});

configRoutes.get('/', async (req, res) => {
  const allConfig = await configService.getAll();
  return res.json(allConfig);
});

configRoutes.post('/', async (req, res) => {
  const parsedBody = setConfigSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ message: parsedBody.error.errors });
  }
  const { setName, key, value } = parsedBody.data;
  await configService.set(setName, key, value);
  return res.status(200).json({ message: 'Configuration updated successfully' });
});

configRoutes.get('/:setName', async (req, res) => {
  const parsedParams = setNameParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error.errors });
  }
  const { setName } = parsedParams.data;
  const configValues = await configService.getConfigSetValues(setName);
  if (!configValues) {
    return res.status(404).json({ message: `Config set "${setName}" not found` });
  }
  return res.json(Object.fromEntries(configValues));
});

configRoutes.delete('/:setName/:key', async (req, res) => {
  const parsedParams = deleteConfigSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error.errors });
  }
  const { setName, key } = parsedParams.data;
  await configService.delete(setName, key);
  return res.status(200).json({ message: 'Configuration deleted successfully' });
});

configRoutes.delete('/:setName', async (req, res) => {
  const parsedParams = setNameParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error.errors });
  }
  const { setName } = parsedParams.data;
  await configService.deleteSet(setName);
  return res.status(200).json({ message: 'Configuration set deleted successfully' });
});
