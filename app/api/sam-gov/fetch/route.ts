import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as cheerio from "cheerio";
import FirecrawlApp from "@mendable/firecrawl-js";

// --- TYPE DEFINITIONS ---
interface ScrapedData {
  title?: string;
  solicitationNumber?: string;
  description?: string; // This will now hold the summary
  department?: string;
  agency?: string;
  office?: string;
  responseDeadLine?: string;
  postedDate?: string;
  naicsCode?: string;
  setAsideType?: string;
  pointOfContact?: { name: string; email: string; phone: string }[];
}


// --- PARSING & SCRAPING HELPERS ---

/**
 * 📄 Parses SAM.gov opportunity data from HTML content using Cheerio.
 * @param html The HTML string to parse.
 * @returns An object of type ScrapedData.
 */
function parseSamHtml(html: string): ScrapedData {
  try {
    const $ = cheerio.load(html);
    const extractText = (selectors: string[]): string => {
      for (const selector of selectors) {
        const text = $(selector).first().text().trim();
        if (text) return text;
      }
      return "";
    };

    const data: ScrapedData = {};
    data.title = extractText(['h1.card-title']);
    data.solicitationNumber = extractText(['#notice-id + .sds-field__value h5']);
    // We still parse the full description here as a fallback in case the summary fails
    data.description = extractText(['[aria-describedby="desc"]', '#desc .value-new-line']);
    data.department = extractText(['#dept-agency + .sds-field__value h5']);
    data.agency = extractText(['#sub-tier + .sds-field__value h5']);
    data.office = extractText(['#office + .sds-field__value h5']);
    data.responseDeadLine = extractText(['#date-offers-date + .sds-field__value h5']);
    data.postedDate = extractText(['#published-date + .sds-field__value h5']);
    data.naicsCode = extractText(['#naics + .sds-field__value h5']).split(' - ')[0];
    data.setAsideType = extractText(['#set-aside + .sds-field__value h5']);

    const contacts: { name: string; email: string; phone: string }[] = [];
    $('#contact .grid-row > .grid-col-12').each((_, el) => {
        const titleText = $(el).find('h2').text();
        if (titleText.includes('Point of Contact')) {
            const name = $(el).find('h5.contact-title-2').text().trim();
            const email = $(el).find('h6[aria-describedby="email"]').text().trim();
            const phone = $(el).find('h6[aria-describedby="phone"]').text().trim();
            if (name && email) contacts.push({ name, email, phone });
        }
    });
    data.pointOfContact = contacts;

    return data;
  } catch (error) {
    console.error('[SAM] 💥 Cheerio HTML parsing failed:', error);
    return {};
  }
}

/**
 * 🤖 Scrapes a URL using Firecrawl and generates an AI summary.
 * @param url The URL of the SAM.gov opportunity.
 * @returns A promise resolving to an object with the HTML and summary.
 */
async function scrapeAndSummarizeWithFirecrawl(url: string): Promise<{ html: string | null; summary: string | null }> {
  console.log(`[SAM] 🤖 Calling Firecrawl API for URL: ${url}`);
  try {
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

    const scrapeResult = await app.scrape(url, {
      formats: [
        "html", // Fetch HTML for parsing
        {
          type: "json",
          prompt: "Summarize the key objectives, requirements, and deadlines for this government contract opportunity in 2-3 sentences. Focus on what the contractor needs to know about this opportunity.",
          schema: {
            summary: { type: "string", description: "A concise 2-3 sentence summary of the opportunity" }
          }
        }
      ],
    });

    if (scrapeResult.html) {
      console.log('[SAM] ✅ Firecrawl returned data with HTML and summary.');
      const summary = (scrapeResult as any).json?.summary || null;
      return {
        html: scrapeResult.html,
        summary: summary,
      };
    } else {
      console.error('[SAM] ❌ Firecrawl scrape failed:', scrapeResult);
      return { html: null, summary: null };
    }
  } catch (error) {
    console.error('[SAM] 💥 Critical error calling Firecrawl:', error);
    return { html: null, summary: null };
  }
}


// --- API ROUTE HANDLER ---

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization & Input Validation
    const session = await getServerSession(authOptions);
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noticeId } = await req.json();
    if (!noticeId) {
      return NextResponse.json({ error: "noticeId is required" }, { status: 400 });
    }

    console.log(`[SAM] 🎯 Starting scrape for noticeId: ${noticeId}`);
    const htmlUrl = `https://sam.gov/workspace/contract/opp/${noticeId}/view`;

    // 2. Scrape & Summarize using Firecrawl
    console.log(`[SAM] 🚀 Using Firecrawl to scrape and summarize...`);
    const { html: finalHtml, summary } = await scrapeAndSummarizeWithFirecrawl(htmlUrl);
    
    if (!finalHtml) {
      return NextResponse.json({
        error: "Scraping failed: Could not retrieve rendered HTML from the source.",
        details: "The Firecrawl API failed to return content. Check your API key and the target URL.",
        noticeId, url: htmlUrl,
      }, { status: 422 });
    }

    // 3. Parse the HTML to get structured data
    const scrapedData = parseSamHtml(finalHtml);

    // ✨ KEY CHANGE: Overwrite the description with the summary if it exists
    if (summary) {
      console.log('[SAM] ✨ Replacing full description with AI summary.');
      scrapedData.description = summary;
    } else {
      console.warn('[SAM] ⚠️ AI summary not available, using full description as fallback.');
    }

    // 4. Database Interaction
    const companyName = scrapedData.department || 'Unknown Government Agency';
    let companyInfo = await db.company.findFirst({
        where: { name: companyName }
    });
    if (!companyInfo) {
        companyInfo = await db.company.create({
            data: {
                name: companyName,
                samRegistered: true,
                industry: "Government - Federal",
                country: "USA",
            }
        });
    }
    console.log(`[SAM] 🏢 Ensured company "${companyName}" exists with ID: ${companyInfo.id}`);

    // 5. Final Data Assembly & Response
    const opportunity = {
      noticeId,
      title: scrapedData.title || `Opportunity ${noticeId}`,
      solicitationNumber: scrapedData.solicitationNumber || noticeId,
      // The description field now contains the summary
      description: scrapedData.description || "No description available.",
      department: scrapedData.department,
      agency: scrapedData.agency,
      office: scrapedData.office,
      responseDeadLine: scrapedData.responseDeadLine,
      postedDate: scrapedData.postedDate,
      naicsCode: scrapedData.naicsCode,
      setAsideType: scrapedData.setAsideType,
      pointOfContact: scrapedData.pointOfContact || [],
      opportunityUrl: htmlUrl,
      companyId: companyInfo.id,
    };

    return NextResponse.json({
      ...opportunity,
      company: companyInfo,
      retrievedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error(`[SAM] 💥 CRITICAL ERROR in API route:`, error);
    return NextResponse.json(
      { error: "An unexpected server error occurred.", details: error.message },
      { status: 500 }
    );
  }
}
