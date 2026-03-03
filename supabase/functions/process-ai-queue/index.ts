Deno.serve(async () => {
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL");
  const secret = Deno.env.get("EMAIL_SEQUENCE_CRON_SECRET");

  if (!appUrl || !secret) {
    return new Response(
      JSON.stringify({
        error: "NEXT_PUBLIC_APP_URL or EMAIL_SEQUENCE_CRON_SECRET is missing.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }

  const response = await fetch(`${appUrl}/api/ai-enhancement/process`, {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
    method: "POST",
  });

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "application/json",
    },
    status: response.status,
  });
});
