import { ProPresenter } from './services';
import { Holyrics } from './services/holyrics-v2/holyrics';
import { Orchestrator, MusicPresentation, BiblePresentation } from './presentations';
import { ConfigRepository } from './db';
import { StatusNotifier, validateConfig } from './config';
import { createChildLogger } from './config/logger';

export interface MakePrsentation {
  orchestrator: Orchestrator;
  notifier: StatusNotifier;
}

const logger = createChildLogger('makePresentations');
export const orchestrator = new Orchestrator();
const configRepository = ConfigRepository.getInstance();
const notifier = StatusNotifier.getInstance();

export const makePresentations = async () => {
  logger.debug('starting orchestration');
  setInterval(async () => {
    await orchestrateHolyrics(orchestrator, configRepository, notifier);
    await orchestrateProPresenter(orchestrator, configRepository, notifier);
  }, 3000);

  return { orchestrator, notifier };
};

const orchestrateHolyrics = async (
  localPersistence: Orchestrator,
  configRepository: ConfigRepository,
  statusNotifier: StatusNotifier,
) => {
  const config = await configRepository.getConfigByCode('holyrics');

  const validatedConfig = validateConfig('holyrics', config?.configValues);

  if (!validatedConfig) {
    localPersistence.removePresentation('holyrics');
    logger.info('Holyrics configuration missing or invalid. Removed existing presentation.');

    return;
  }

  if (!localPersistence.isPresentationActive('holyrics')) {
    const holyricsConnector = new Holyrics(validatedConfig, statusNotifier);
    const biblePresentation = new BiblePresentation(holyricsConnector);
    localPersistence.addPresentation(biblePresentation);
    logger.info('Added new Holyrics presentation.');
  }
};

const orchestrateProPresenter = async (
  localPersistence: Orchestrator,
  configRepository: ConfigRepository,
  notifier: StatusNotifier,
) => {
  const config = await configRepository.getConfigByCode('pro-presenter');

  const validatedConfig = validateConfig('pro-presenter', config?.configValues);

  if (!validatedConfig) {
    localPersistence.removePresentation('pro-presenter');
    logger.info('ProPresenter configuration missing or invalid. Removed existing presentation.');

    return;
  }

  if (!localPersistence.isPresentationActive('pro-presenter')) {
    const proPresenterConnector = new ProPresenter(validatedConfig, notifier);
    const musicPresentation = new MusicPresentation(proPresenterConnector);
    localPersistence.addPresentation(musicPresentation);
    logger.info('Added new ProPresenter presentation.');
  }
};
