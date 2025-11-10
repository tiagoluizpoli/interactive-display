import axios from 'axios';
import { env } from './env';

const { proPresenter } = env.services;

export const proPresenterHttpClient = axios.create({
  baseURL: `http://${proPresenter.host}:${proPresenter.port}`,
});
