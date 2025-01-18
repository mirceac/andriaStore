export async function createCheckoutSession(items: { id: number; quantity: number }[]) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const { url } = await response.json();
  window.location.href = url;
}
