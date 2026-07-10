import { getApiBaseUrl } from './config';

export type DeployVersion = {
  commit: string;
  deployedAt: string | null;
};

export async function fetchDeployVersion(): Promise<DeployVersion> {
  const response = await fetch(`${getApiBaseUrl()}/api/version`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Surum bilgisi alinamadi');
  }

  const json: { success: boolean; data: DeployVersion } = await response.json();
  if (!json.success) {
    throw new Error('Surum bilgisi alinamadi');
  }

  return json.data;
}
