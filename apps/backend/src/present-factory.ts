import { HolyricsBible, ProPresenter } from './infrastructure';
import { LocalPersistence, MusicPresentation, BiblePresentation } from './presentations';

export const makePresentations = async () => {
  const proPresenter = new ProPresenter();

  const musicPresentation = new MusicPresentation(proPresenter);
  const biblePresentation = new BiblePresentation(new HolyricsBible());

  const localPersistence = new LocalPersistence([musicPresentation, biblePresentation], proPresenter);

  return localPersistence;
};
