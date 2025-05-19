import { ExecutePresentSlide } from '../../../application';
import { makeListenToSlideChange } from '../infrastructure';
import { makePresentationRepository } from '../infrastructure/db-presentation-repository';

export const makePresentSlide = () => {
  const listenToSlideChange = makeListenToSlideChange();
  const presentationRepository = makePresentationRepository();

  return new ExecutePresentSlide(presentationRepository, listenToSlideChange);
};
