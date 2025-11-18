import { HolyricsBible, ProPresenter } from './services';
import { Orchestrator, MusicPresentation, BiblePresentation } from './presentations';
import { ConfigRepository } from './db';
import { Notifier, validateConfig } from './config';
import { createChildLogger } from './config/logger';

export interface MakePrsentation {
  orchestrator: Orchestrator;
  notifier: Notifier;
}

const logger = createChildLogger('makePresentations');

export const makePresentations = async () => {
  const configRepository = ConfigRepository.getInstance();
  const notifier = Notifier.getInstance();
  const orchestrator = new Orchestrator();

  logger.debug('starting orchestration');
  setInterval(async () => {
    orchestrateHolyrics(orchestrator, configRepository, notifier);
    orchestrateProPresenter(orchestrator, configRepository, notifier);
  }, 3000);

  return { orchestrator, notifier };
};

const orchestrateHolyrics = async (
  localPersistence: Orchestrator,
  configRepository: ConfigRepository,
  notifier: Notifier,
) => {
  const config = await configRepository.getConfigByCode('holyrics');

  const validatedConfig = validateConfig('holyrics', config?.configValues);

  if (!validatedConfig) {
    localPersistence.removePresentation('holyrics');
    return;
  }
  if (!localPersistence.isPresentationActive('holyrics')) {
    const holyricsConnector = new HolyricsBible(validatedConfig, notifier);
    const biblePresentation = new BiblePresentation(holyricsConnector);

    localPersistence.addPresentation(biblePresentation);
  }
};

const orchestrateProPresenter = async (
  localPersistence: Orchestrator,
  configRepository: ConfigRepository,
  notifier: Notifier,
) => {
  const config = await configRepository.getConfigByCode('pro-presenter');

  const validatedConfig = validateConfig('pro-presenter', config?.configValues);

  if (!validatedConfig) {
    localPersistence.removePresentation('pro-presenter');
    return;
  }
  if (!localPersistence.isPresentationActive('pro-presenter')) {
    const holyricsConnector = new ProPresenter(validatedConfig, notifier);
    const biblePresentation = new MusicPresentation(holyricsConnector);

    localPersistence.addPresentation(biblePresentation);
  }
};
