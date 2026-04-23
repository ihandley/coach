type Provider = "gmail";

type ConnectIntegration = (provider: Provider) => Promise<void> | void;

export async function handleConnectIntegration(
  provider: string,
  connectIntegration: ConnectIntegration,
) {
  if (provider !== "gmail") {
    return new Response(JSON.stringify({ error: "Unsupported provider" }), {
      status: 404,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  await connectIntegration(provider);

  return new Response(null, {
    status: 204,
  });
}
