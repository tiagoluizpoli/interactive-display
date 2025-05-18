import axios from 'axios';
import { env } from '../env';

const { proPresenter } = env.services;
export const httpClient = axios.create({
  baseURL: `http://${proPresenter.host}:${proPresenter.port}`,
});
