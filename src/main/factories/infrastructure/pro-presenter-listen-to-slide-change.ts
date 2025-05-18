import { ExternalListenToSlideChange } from '../../../infrastructure';
export const makeListenToSlideChange = () => {
  return new ExternalListenToSlideChange();
};
