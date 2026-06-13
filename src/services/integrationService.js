import { config } from '@/config/env';

async function callFunction(endpoint, body) {
  if (!config.api.functionsUrl) {
    throw new Error('Functions URL is not configured');
  }

  const response = await fetch(`${config.api.functionsUrl}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Function call failed: ${response.statusText}`);
  }

  return response.json();
}

export const integrationService = {
  async uploadFile({ file }) {
    const { storageService } = await import('@/services/storageService');
    return storageService.uploadFile(file);
  },

  async sendEmail({ to, subject, body, from_name }) {
    if (!config.features.enableEmail || !config.api.functionsUrl) {
      console.info('Email sending skipped (not configured):', { to, subject, from_name });
      return { success: true, skipped: true };
    }

    return callFunction('send-email', { to, subject, body, from_name });
  },

  async invokeLLM({ prompt, model, response_json_schema }) {
    if (!config.features.enableLlm || !config.api.functionsUrl) {
      throw new Error('LLM integration is not configured');
    }

    return callFunction('invoke-llm', { prompt, model, response_json_schema });
  },
};
