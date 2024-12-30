/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.182.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.182.0/crypto/mod.ts"

function generateSignature(baseString: string, secret: string) {
  const hmac = createHmac("sha1", secret);
  hmac.update(baseString);
  return hmac.toString("base64");
}

serve(async (req) => {
  try {
    const { redirectUrl } = await req.json();
    const signature = generateSignature("test", "secret");
    
    return new Response(JSON.stringify({ signature }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}); 