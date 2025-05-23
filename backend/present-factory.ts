import { env } from './config';
import { FilePresentationRepository, ProPresenter } from './infrastructure';
import { Present } from './present';

const { jsonPath } = env.db;

export const makePresent = () => {
  const presentationRepository = new FilePresentationRepository(jsonPath);
  const proPresenter = new ProPresenter();

  return new Present(presentationRepository, proPresenter);
};
