// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.fresh.run/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.182.0/crypto/mod.ts"

function generateNonce() {
  return Math.random().toString(36).substring(2)
}

function generateTimestamp() {
  return Math.floor(Date.now() / 1000).toString()
}

function createSignature(baseString: string, secret: string) {
  const hmac = createHmac("sha1", secret)
  hmac.update(baseString)
  return hmac.toString("base64")
}

serve(async (req) => {
  try {
    const { redirectUrl } = await req.json()
    
    const oauth = {
      consumer_key: Deno.env.get("GOODREADS_KEY")!,
      consumer_secret: Deno.env.get("GOODREADS_SECRET")!,
      callback: `${redirectUrl}/auth/callback`,
      nonce: generateNonce(),
      timestamp: generateTimestamp(),
      signature_method: "HMAC-SHA1",
      version: "1.0",
    }

    const baseString = [
      "POST",
      encodeURIComponent("https://www.goodreads.com/oauth/request_token"),
      encodeURIComponent(
        Object.keys(oauth)
          .sort()
          .map(key => `${key}=${oauth[key]}`)
          .join("&")
      ),
    ].join("&")

    const signature = createSignature(
      baseString,
      `${oauth.consumer_secret}&`
    )

    const authHeader = `OAuth ${Object.entries({
      ...oauth,
      oauth_signature: signature,
    })
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(", ")}`

    const response = await fetch("https://www.goodreads.com/oauth/request_token", {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`Goodreads returned ${response.status}`)
    }

    const data = await response.text()
    const params = new URLSearchParams(data)
    const oauthToken = params.get("oauth_token")

    return new Response(
      JSON.stringify({
        url: `https://www.goodreads.com/oauth/authorize?oauth_token=${oauthToken}`,
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/goodreads-auth' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
