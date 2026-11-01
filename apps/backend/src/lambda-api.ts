// Punto de entrada en AWS Lambda detrás de API Gateway (ADR-004, ADR-009).
import { configure } from '@codegenie/serverless-express';
import { createApplication } from './app.js';
import { loadEnv } from './shared/config/env.js';

const application = createApplication(loadEnv());

export const handler = configure({ app: application.app });
