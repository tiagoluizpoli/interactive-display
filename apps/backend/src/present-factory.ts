import { env } from './config';
import { FilePresentationRepository, HolyricsBible, ProPresenter } from './infrastructure';
import { LocalPersistence, MusicPresentation, BiblePresentation } from './presentations';

const { jsonPath } = env.db;

export const makePresentations = async () => {
  const presentationRepository = new FilePresentationRepository(jsonPath);
  await presentationRepository.connect();
  const proPresenter = new ProPresenter();

  const musicPresentation = new MusicPresentation(proPresenter);
  const biblePresentation = new BiblePresentation(new HolyricsBible());

  const localPersistence = new LocalPersistence([musicPresentation, biblePresentation], proPresenter);

  return localPersistence;
};
