/**
 * Newsletter provider integration (§5.7 / §8).
 * Set PUBLIC_SUBSCRIBE_URL to a real endpoint when chosen.
 */
export async function subscribe(email: string): Promise<void> {
  const endpoint = import.meta.env.PUBLIC_SUBSCRIBE_URL as string | undefined;

  if (!endpoint) {
    // Placeholder until a provider is chosen: succeed after a short delay.
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (email.endsWith('@fail.test')) {
      throw new Error('network');
    }
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`subscribe failed: ${response.status}`);
  }
}
