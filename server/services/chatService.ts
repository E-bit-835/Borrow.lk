import { config } from '../config/env';
import { ProductService } from './productService';
import { CATEGORIES } from '../utils/categories';

/**
 * BorrowLK assistant. Talks to any OpenAI-compatible chat API (Groq, Gemini's compatible endpoint,
 * OpenRouter, a self-hosted Ollama...), chosen with AI_BASE_URL / AI_API_KEY / AI_MODEL.
 *
 * The model never invents listings: it is shown the real listings and may only recommend from them;
 * any listing id it returns that the server did not supply is dropped.
 */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function httpError(message: string, code: string, status: number) {
  const error: any = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

const CATEGORY_NAMES = CATEGORIES.map((c) => c.name).join(', ');

const ABOUT = `BorrowLK is a marketplace in Sri Lanka where people rent items (categories: ${CATEGORY_NAMES}) from hosts and hire service providers (drivers, plumbers, electricians, cleaners, cooks and so on).
How it works: open a listing, choose dates, press "Check Availability", then "Request to Rent" or "Request Service". The host or provider accepts or declines. Requests are under "Requests" and accepted ones under "My Bookings".
Customers never pay through BorrowLK: it takes no payment. The price is agreed and paid directly to the host or provider after the request is accepted.
To earn: "Become a Host" (rent out items, property, vehicles) or "Become a Provider" (offer a service), on the same account. Hosts and providers can buy a plan to publish more listings.`;

/** Free tiers are often briefly overloaded: a "busy" answer is retried a couple of times before giving up. */
async function complete(messages: Array<{ role: string; content: string }>, maxTokens: number, temperature: number): Promise<string> {
  const delays = [1500, 4000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await completeOnce(messages, maxTokens, temperature);
    } catch (err: any) {
      if (!err?.retryable || attempt >= delays.length) throw err;
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }
}

async function completeOnce(messages: Array<{ role: string; content: string }>, maxTokens: number, temperature: number): Promise<string> {
  const { baseUrl, apiKey, model } = config.ai;
  if (!baseUrl || !apiKey) {
    throw httpError('The AI assistant is not set up yet.', 'AI_NOT_CONFIGURED', 503);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.warn(`⚠️ AI provider returned ${res.status}:`, detail);
      const busy = res.status === 429 || res.status === 503;
      const error = httpError(
        busy ? 'The assistant is busy right now. Please try again in a minute.' : 'The assistant is unavailable right now. Please try again.',
        'AI_UNAVAILABLE',
        503
      );
      error.retryable = res.status === 503;
      throw error;
    }
    const json: any = await res.json();
    return String(json?.choices?.[0]?.message?.content || '').trim();
  } catch (err: any) {
    if (err?.status) throw err;
    console.warn('⚠️ AI request failed:', err?.name === 'AbortError' ? 'timed out' : err?.message);
    throw httpError('The assistant is unavailable right now. Please try again.', 'AI_UNAVAILABLE', 503);
  } finally {
    clearTimeout(timer);
  }
}

/** How many listings the model is shown per message. Keeps the prompt small as the catalogue grows. */
const MAX_CANDIDATES = 30;

/** Words from the latest question, used only to choose which listings to show the model. */
function candidateListings<T extends { title: string; category: string; subcategory?: string; district: string; description: string }>(all: T[], question: string): T[] {
  if (all.length <= MAX_CANDIDATES) return all;
  const words = question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
  return all
    .map((p) => {
      const text = `${p.title} ${p.category} ${p.subcategory || ''} ${p.district} ${p.description}`.toLowerCase();
      return { p, score: words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)
    .map((x) => x.p);
}

export class ChatService {
  /**
   * One model call per message: the model sees the real listings and answers with
   * its reply plus the ids of the listings that fit. Ids it did not get are ignored.
   */
  static async reply(history: ChatTurn[], location?: string) {
    const question = history[history.length - 1].content;
    const candidates = candidateListings(await ProductService.getAll({}), question);

    const catalogue = candidates
      .map(
        (p) =>
          `${p.id} | ${p.title} | ${p.category}${p.subcategory ? ' / ' + p.subcategory : ''} | Rs. ${Math.round(p.pricePerDay).toLocaleString()} per ${p.priceUnit} | ${p.location}, ${p.district}`
      )
      .join('\n');

    const text = await complete(
      [
        {
          role: 'system',
          content: `You are the BorrowLK assistant. ${ABOUT}
${location ? `The person is near ${location} unless they say otherwise.\n` : ''}Listings on BorrowLK right now (id | title | category | price | place):
${catalogue || '(none)'}

Answer with ONE JSON object and nothing else: {"reply": string, "listingIds": string[]}
- "reply": 2 to 4 short sentences of plain text, in the same language the person writes in (English, Sinhala or Tamil).
- "listingIds": ids from the list above that fit what the person wants to rent or hire, best first, at most 4. Use [] when nothing fits or the message is not a search.
- Recommend only listings from the list. Never invent a listing, price or availability. If nothing fits, say so and suggest another category, district or budget.
- The chosen listings are shown as cards under your reply, so do not repeat all their details.
- Politely decline anything unrelated to BorrowLK.`,
        },
        ...history.slice(-10),
      ],
      900,
      0.3
    );

    // Some models wrap the JSON in reasoning or code fences; take the outermost object
    const cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/g, '');
    let reply = '';
    let ids: string[] = [];
    try {
      const raw = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
      reply = typeof raw.reply === 'string' ? raw.reply.trim() : '';
      ids = Array.isArray(raw.listingIds) ? raw.listingIds.filter((x: unknown) => typeof x === 'string') : [];
    } catch {
      // Not JSON: use the text itself as the answer rather than failing
      reply = cleaned.replace(/```(json)?/g, '').trim();
    }

    const listings = ids
      .map((id) => candidates.find((p) => p.id === id))
      .filter((p): p is (typeof candidates)[number] => Boolean(p))
      .slice(0, 4);

    return {
      reply: reply || 'Sorry, I could not answer that. Please try asking in a different way.',
      listings,
    };
  }
}
