import { Router } from 'express';
import { ConfigRepository } from '../db';
import { z } from 'zod';

export const configRoutes = Router();
const configService = ConfigRepository.getInstance();

const upsertConfigSchema = z.object({
  configCode: z.string().min(1, 'ConfigCode name is required'),
  values: z.array(
    z.object({
      key: z.string().min(1, 'Key is required'),
      value: z.string().min(1, 'Value is required'),
    }),
  ),
});

const configCodeParamSchema = z.object({
  configCode: z.string().min(1, 'ConfigCode is required'),
});

const deleteConfigSchema = z.object({
  configCode: z.string().min(1, 'ConfigCode is required'),
  key: z.string().min(1, 'Key is required'),
});

configRoutes.get('/', async (_, res) => {
  const allConfig = await configService.getAll();
  return res.json(allConfig);
});

configRoutes.post('/', async (req, res) => {
  const parsedBody = upsertConfigSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ message: parsedBody.error.errors });
  }
  const { configCode, values } = parsedBody.data;
  await configService.set(configCode, values);
  return res.status(200).json({ message: 'Config updated successfully' });
});

configRoutes.get('/:configCode', async (req, res) => {
  const parsedParams = configCodeParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error.errors });
  }
  const { configCode } = parsedParams.data;
  const configValues = await configService.getConfigByCode(configCode);
  if (!configValues) {
    return res.status(404).json({ message: `Config with code ${configCode} not found` });
  }
  return res.json(configValues);
});

configRoutes.delete('/:configCode/:key', async (req, res) => {
  const parsedParams = deleteConfigSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error.errors });
  }
  const { configCode, key } = parsedParams.data;
  await configService.deleteConfigValue(configCode, key);
  return res.status(200).json({ message: 'Configuration deleted successfully' });
});

configRoutes.delete('/:configCode', async (req, res) => {
  const parsedParams = configCodeParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ message: parsedParams.error.errors });
  }
  const { configCode } = parsedParams.data;
  await configService.deleteConfig(configCode);
  return res.status(200).json({ message: 'Configuration set deleted successfully' });
});
