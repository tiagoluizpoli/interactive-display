import { ExecutePresentSlide } from '../../../application';
import { makeListenToSlideChange } from '../infrastructure';

export const makePresentSlide = () => {
  const listenToSlideChange = makeListenToSlideChange();
  return new ExecutePresentSlide(listenToSlideChange);
};
