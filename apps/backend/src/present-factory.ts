import { env } from './config';
import { FilePresentationRepository, ProPresenter } from './infrastructure';
import { BannerPresentation, LocalPersistence, MusicPresentation } from './presentations';

const { jsonPath } = env.db;

export const makePresentations = () => {
  const presentationRepository = new FilePresentationRepository(jsonPath);
  const proPresenter = new ProPresenter();

  const bannerPresentation = new BannerPresentation(presentationRepository, proPresenter);
  const musicPresentation = new MusicPresentation(proPresenter);

  const localPersistence = new LocalPersistence([bannerPresentation, musicPresentation]);

  return localPersistence;
};
