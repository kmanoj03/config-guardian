import type { Envelope, VerifyResp } from './types';

const API_BASE_URL = '';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from server');
  }
}

export async function fetchEnvelope(taskId: string): Promise<Envelope> {
  const response = await fetch(`${API_BASE_URL}/api/provenance/${taskId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await handleResponse<{ envelope: Envelope }>(response);
  return data.envelope;
}

export async function verifyEnvelope(envelope: Envelope): Promise<VerifyResp> {
  const response = await fetch(`${API_BASE_URL}/api/provenance/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ envelope }),
  });
  
  return handleResponse<VerifyResp>(response);
}
