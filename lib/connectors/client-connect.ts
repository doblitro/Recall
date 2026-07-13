export async function initiateOAuthConnect(providerId: string): Promise<void> {
  const response = await fetch(`/api/connectors/${providerId}/connect`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to initiate ${providerId} OAuth`);
  }
  const { authUrl } = await response.json();
  window.location.href = authUrl;
}
