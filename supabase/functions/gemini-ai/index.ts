import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REPOSITORY_GUARDRAIL = `CRITICAL INSTRUCTIONS — YOU MUST FOLLOW THESE RULES:
1. Only reference content from the provided chapter text.
2. Every factual claim must cite the source chapter.
3. If the answer cannot be found in the content, say so clearly.
4. Never fabricate regulatory codes or citations.
5. Responses are for educational reference only.`;


function buildSystemPrompt(
  type: string,
  chapterTitle: string,
  bookTitle: string,
  contentSnippet: string
): string {

  const baseContext = `

Chapter: "${chapterTitle}" from "${bookTitle}"

Chapter Content:
${contentSnippet}
`;

  switch (type) {
    case "summary":
      return `${REPOSITORY_GUARDRAIL}

Summarize this chapter including:
• Brief overview
• Core concepts
• Clinical significance
• Key takeaways

${baseContext}`;

    case "compliance":
      return `${REPOSITORY_GUARDRAIL}

Extract compliance related information including:
• JCAHO standards
• CMS requirements
• OSHA safety requirements
• Documentation requirements
• Risk indicators

${baseContext}`;

    case "qa":
      return `${REPOSITORY_GUARDRAIL}

Analyze medications and interactions mentioned in this chapter.

${baseContext}`;

    default:
      return `${REPOSITORY_GUARDRAIL}

Answer the user's question based ONLY on this chapter.

${baseContext}`;
  }
}


serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const {
      prompt,
      chapterContent,
      chapterTitle,
      bookTitle,
      type,
      bookId,
      chapterId,
    } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentSnippet = chapterContent?.slice(0, 4000) || "";

    const systemPrompt = buildSystemPrompt(
      type || "default",
      chapterTitle || "",
      bookTitle || "",
      contentSnippet
    );

    const userMessage = prompt || "Analyze this chapter.";

    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userMessage }
              ]
            }
          ],
        }),
      }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Gemini API error:", errorText);

      return new Response(
        JSON.stringify({ error: "Gemini API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    const tokensUsed = data?.usageMetadata?.totalTokenCount || null;


    // Log query to Supabase
    try {

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase.from("ai_query_logs").insert({
        book_id: bookId || "unknown",
        book_title: bookTitle || "Unknown",
        chapter_id: chapterId || "unknown",
        chapter_title: chapterTitle || "Unknown",
        query_type: type || "default",
        user_prompt: prompt || null,
        ai_response: content.slice(0, 10000),
        response_time_ms: responseTimeMs,
        model_used: "gemini-2.5-flash",
        tokens_used: tokensUsed,
      });

    } catch (logError) {
      console.error("Logging failed:", logError);
    }


    return new Response(
      JSON.stringify({ content, responseTimeMs }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );


  } catch (error) {

    console.error("gemini-ai error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});