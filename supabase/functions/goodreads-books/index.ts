// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"

serve(async (req) => {
  try {
    const { profileUrl } = await req.json()
    
    // Fetch the profile page
    const response = await fetch(profileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`)
    }
    
    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    
    // Extract books from the shelves
    const books = Array.from(doc.querySelectorAll(".bookalike")).map(book => ({
      id: book.getAttribute("data-resource-id") || "",
      title: book.querySelector(".title")?.textContent?.trim() || "",
      author: book.querySelector(".author")?.textContent?.trim() || "",
      rating: parseInt(book.querySelector(".rating")?.getAttribute("data-rating") || "0"),
      coverImage: book.querySelector("img")?.getAttribute("src") || undefined
    }))

    return new Response(
      JSON.stringify({ books }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
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
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
        } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/goodreads-books' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
