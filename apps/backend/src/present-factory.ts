import { HolyricsBible, ProPresenter } from './services';
import { LocalPersistence, MusicPresentation, BiblePresentation } from './presentations';
import { ConfigRepository } from './db';
import { monitorConfig, type HolyricsConfig, type ProPresenterConfig } from './config';
import { createChildLogger } from './config/logger';

export const makePresentations = async () => {
  const logger = createChildLogger('makePresentations');
  monitorConfig();

  const configRepository = ConfigRepository.getInstance();

  const proPresenterConfig = await configRepository.getConfigByCode('pro-presenter');
  const holyricsConfig = await configRepository.getConfigByCode('holyrics');

  if (!proPresenterConfig || !holyricsConfig) {
    logger.error('Missing config', { proPresenterConfig, holyrics: holyricsConfig });
    return undefined;
  }

  const proPresenter = new ProPresenter(proPresenterConfig.configValues as ProPresenterConfig);

  const musicPresentation = new MusicPresentation(proPresenter);
  const biblePresentation = new BiblePresentation(new HolyricsBible(holyricsConfig.configValues as HolyricsConfig));

  const localPersistence = new LocalPersistence([musicPresentation, biblePresentation], proPresenter);

  return localPersistence;
};
