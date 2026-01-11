// Supabase Edge Function: AI Proxy
// This function proxies AI requests to Groq, keeping the API key secure on the server
// @ts-nocheck - Deno types not available in Node.js IDE

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequestBody {
  mode: string
  tripContext: {
    destination?: string | { name?: string }
    startDate?: string
    endDate?: string
    itinerary?: Array<Record<string, unknown>>
  }
  prompt: string
}

// AI Modes
const AI_MODES = {
  GENERATE: 'generate',
  IMPROVE: 'improve',
  FILL_GAPS: 'fill_gaps',
  SUGGEST: 'suggest'
}

// Base JSON structure for all prompts
const JSON_STRUCTURE = `Each item must follow this exact structure:
{
  "type": "flight" | "hotel" | "transport" | "activity" | "restaurant" | "other",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM" or null,
  "title": "string",
  "details": {
    For flight: { "from": "city", "fromIata": "CODE", "to": "city", "toIata": "CODE", "airline": "name", "pnr": "" }
    For hotel: { "hotelName": "name", "address": "address", "checkInDate": "YYYY-MM-DD", "checkIn": "HH:MM", "checkOutDate": "YYYY-MM-DD", "checkOut": "HH:MM" }
    For transport: { "mode": "Taxi|Bus|Train|Auto|Car Rental|Metro|Bike|Walk|Other", "from": "location", "to": "location" }
    For activity: { "place": "name", "category": "Sightseeing|Adventure|Beach|Museum|Shopping|Nightlife|Wellness|Tour|Other", "location": "address" }
    For restaurant: { "restaurantName": "name", "cuisine": "type", "location": "address" }
    For other: { "description": "text", "location": "address" }
  },
  "location": { "lat": number, "lon": number },
  "notes": "string"
}`

// Base rules for all prompts
const BASE_RULES = `
IMPORTANT RULES:
1. Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.
2. Use realistic times and proper scheduling (don't overlap activities).
3. Include location coordinates when possible.
4. IDs are NOT needed - they will be added later.
5. Dates must be within the trip date range provided.
6. Be specific with place names and addresses for the destination.
7. Keep notes brief (under 20 words each).`

// Get system prompt based on mode
function getSystemPrompt(mode: string): string {
  switch (mode) {
    case AI_MODES.GENERATE:
      return `You are an AI travel itinerary assistant. Generate a complete trip itinerary in JSON format.

${JSON_STRUCTURE}

${BASE_RULES}
8. Create a balanced mix of activities, restaurants, and sightseeing.
9. Generate a reasonable number of items (not too hectic).`

    case AI_MODES.IMPROVE:
      return `You are an AI travel itinerary assistant. Your task is to IMPROVE an existing itinerary.

${JSON_STRUCTURE}

${BASE_RULES}
8. Analyze the existing itinerary and suggest BETTER alternatives or additions.
9. Replace generic places with more interesting/authentic options.
10. Optimize timing and logistics.
11. Return ONLY the NEW or IMPROVED items (not the unchanged existing ones).`

    case AI_MODES.FILL_GAPS:
      return `You are an AI travel itinerary assistant. Your task is to FILL GAPS in an existing itinerary.

${JSON_STRUCTURE}

${BASE_RULES}
8. Analyze the existing itinerary to find empty time slots or days.
9. Add activities/restaurants for morning, afternoon, or evening gaps.
10. Don't duplicate or overlap with existing items.
11. Return ONLY the NEW items to fill the gaps.`

    case AI_MODES.SUGGEST:
      return `You are an AI travel itinerary assistant. Your task is to SUGGEST restaurants and activities.

${JSON_STRUCTURE}

${BASE_RULES}
8. Focus ONLY on restaurants and activities (type: "restaurant" or "activity").
9. Suggest local favorites, hidden gems, and must-visit places.
10. Consider the existing itinerary to avoid duplicates.
11. Provide a variety of cuisines and activity types.`

    default:
      return getSystemPrompt(AI_MODES.GENERATE)
  }
}

// Build user message based on mode
function buildUserMessage(mode: string, tripContext: AIRequestBody['tripContext'], prompt: string): string {
  const destinationName = typeof tripContext?.destination === 'object' 
    ? tripContext?.destination?.name || 'the destination'
    : tripContext?.destination || 'the destination'
  const existingItinerary = tripContext?.itinerary || []

  let userMessage = `
Trip Context:
- Destination: ${destinationName}
- Start Date: ${tripContext?.startDate || 'Not specified'}
- End Date: ${tripContext?.endDate || 'Not specified'}
`

  // Include existing itinerary for modes that need it
  if (mode !== AI_MODES.GENERATE && existingItinerary.length > 0) {
    userMessage += `
Existing Itinerary (${existingItinerary.length} items):
${JSON.stringify(existingItinerary, null, 2)}
`
  }

  // Add mode-specific instructions
  switch (mode) {
    case AI_MODES.GENERATE:
      userMessage += `
User Request: ${prompt}

Generate a realistic itinerary based on the user's request. Don't make it too hectic. Focus on quality activities. Be specific to ${destinationName} with real places.`
      break
    case AI_MODES.IMPROVE:
      userMessage += `
User Request: ${prompt}

Review the existing itinerary above and suggest improvements. Replace generic items with better alternatives. Optimize the schedule. Return only NEW or IMPROVED items.`
      break
    case AI_MODES.FILL_GAPS:
      userMessage += `
User Request: ${prompt}

Analyze the existing itinerary and find empty time slots. Fill gaps with appropriate activities or meals. Don't overlap with existing items. Return only NEW items to add.`
      break
    case AI_MODES.SUGGEST:
      userMessage += `
User Request: ${prompt}

Based on the trip to ${destinationName}, suggest the best restaurants and activities. Include local favorites and hidden gems. Avoid duplicating existing items. Focus on food and experiences.`
      break
    default:
      userMessage += `\nUser Request: ${prompt}`
  }

  return userMessage
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { mode, tripContext, prompt }: AIRequestBody = await req.json()

    if (!prompt || !mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mode and prompt' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the Groq API key from environment variables (secure, server-side only)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured in environment variables')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build prompts
    const systemPrompt = getSystemPrompt(mode)
    const userMessage = buildUserMessage(mode, tripContext, prompt)

    // Call Groq AI API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      })
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json()
      console.error('Groq API error:', errorData)
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Failed to get response from AI' }),
        { 
          status: groqResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await groqResponse.json()
    
    return new Response(
      JSON.stringify({
        content: data.choices?.[0]?.message?.content || '',
        finishReason: data.choices?.[0]?.finish_reason
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
