import { env } from './config';
import { FilePresentationRepository, HolyricsBible, ProPresenter } from './infrastructure';
import { BannerPresentation, LocalPersistence, MusicPresentation, BiblePresentation } from './presentations';

const { jsonPath } = env.db;

export const makePresentations = async () => {
  const presentationRepository = new FilePresentationRepository(jsonPath);
  await presentationRepository.connect();
  const proPresenter = new ProPresenter();

  const bannerPresentation = new BannerPresentation(presentationRepository, proPresenter);
  const musicPresentation = new MusicPresentation(proPresenter);
  const biblePresentation = new BiblePresentation(new HolyricsBible());

  const localPersistence = new LocalPersistence(
    [bannerPresentation, musicPresentation, biblePresentation],
    proPresenter,
  );

  return localPersistence;
};
