import { env } from './config';
import { FilePresentationRepository, ProPresenter } from './infrastructure';
import { LocalPersistence } from './presentaions/local-persistence';
import { BannerPresentation } from './presentaions/banner-presentation';
import { MusicPresentation } from './presentaions/music-presentation';

const { jsonPath } = env.db;

export const makePresentations = () => {
  const presentationRepository = new FilePresentationRepository(jsonPath);
  const proPresenter = new ProPresenter();

  const bannerPresentation = new BannerPresentation(presentationRepository, proPresenter);

  const musicPresentation = new MusicPresentation(presentationRepository, proPresenter);

  const localPersistence = new LocalPersistence([bannerPresentation, musicPresentation]);

  return localPersistence;
};
