import { JsonPresentationRepository } from '../../../infrastructure';
import { env } from '../../config';

export const makePresentationRepository = () => {
  const { jsonPath } = env.db;
  return new JsonPresentationRepository(jsonPath);
};
