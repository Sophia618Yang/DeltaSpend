import {corsHeaders} from '../_shared/cors.ts';
import {buildHeuristicDraft} from '../_shared/expense.ts';
import {requireUser} from '../_shared/auth.ts';

const IMAGE_LIMIT = 10 * 1024 * 1024;
const MODEL_API_URL = Deno.env.get('MODEL_API_URL');
const MODEL_API_KEY = Deno.env.get('MODEL_API_KEY');
const MODEL_PRIMARY = Deno.env.get('MODEL_PRIMARY') ?? 'gemini-2.5-flash';
const MODEL_FALLBACK = Deno.env.get('MODEL_FALLBACK') ?? 'gemini-2.5-flash-lite';
const STORAGE_BUCKET = Deno.env.get('SUPABASE_STORAGE_BUCKET') ?? 'expense-files';
const DEFAULT_TRIAL_DAILY_LIMIT = 10;
const DEFAULT_ADMIN_DAILY_LIMIT = 100;
const DEFAULT_RATE_PER_MINUTE = 3;
const DEFAULT_CONCURRENT_LIMIT = 2;
const MODEL_RETRY_ATTEMPTS = 3;
const MODEL_RETRY_BASE_DELAY_MS = 900;

function getUsageNumbers(payload: any) {
  const usage = payload?.usage ?? payload?.usageMetadata ?? {};
  return {
    inputTokens: Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokenCount ?? 0),
    outputTokens: Number(usage.output_tokens ?? usage.completion_tokens ?? usage.candidatesTokenCount ?? 0),
    totalTokens: Number(usage.total_tokens ?? usage.totalTokenCount ?? 0),
  };
}

function getPacificOffset(year: number, month: number, day: number) {
  const nthSunday = (targetMonth: number, nth: number) => {
    const first = new Date(Date.UTC(year, targetMonth - 1, 1));
    const firstSunday = 1 + ((7 - first.getUTCDay()) % 7);
    return firstSunday + (nth - 1) * 7;
  };
  const secondSundayInMarch = nthSunday(3, 2);
  const firstSundayInNovember = nthSunday(11, 1);
  const isDst =
    month > 3 && month < 11
      ? true
      : month === 3
        ? day >= secondSundayInMarch
        : month === 11
          ? day < firstSundayInNovember
          : false;
  return isDst ? '-07:00' : '-08:00';
}

function normalizeReceiptDate(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return new Date().toISOString();

  const isoDateOnly = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    const offset = getPacificOffset(Number(year), Number(month), Number(day));
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00${offset}`;
  }

  const monthFirst = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (monthFirst) {
    const [, month, day, rawYear, rawHour, rawMinute, rawSecond] = monthFirst;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const hour = rawHour ?? '12';
    const minute = rawMinute ?? '00';
    const second = rawSecond ?? '00';
    const offset = getPacificOffset(Number(year), Number(month), Number(day));
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}${offset}`;
  }

  const parsedDate = new Date(raw);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  return new Date().toISOString();
}

function normalizeParsedExpenseDraft(parsed: any) {
  const items = Array.isArray(parsed?.items)
    ? parsed.items
        .map((item: any) => ({
          name: String(item?.name ?? '').trim(),
          amount: Number(item?.amount ?? 0),
          quantity: item?.quantity == null ? null : Number(item.quantity ?? 0),
          unitPrice: item?.unitPrice == null ? null : Number(item.unitPrice ?? 0),
        }))
        .filter((item: {name: string; amount: number}) => item.name || item.amount)
    : [];

  const firstMeaningfulItem =
    items.find((item: {name: string; amount: number}) => item.amount > 0 && item.name) ?? items[0];

  const normalized = {
    isExpenseDocument:
      typeof parsed?.isExpenseDocument === 'boolean'
        ? parsed.isExpenseDocument
        : Boolean(parsed?.merchant || firstMeaningfulItem?.name) && Number(parsed?.amount ?? firstMeaningfulItem?.amount ?? 0) > 0,
    documentType: parsed?.documentType ?? 'other_expense',
    invalidReason: parsed?.invalidReason ?? null,
    merchant: String(parsed?.merchant ?? '').trim(),
    amount: Number(parsed?.amount ?? 0),
    currency: String(parsed?.currency ?? 'USD').trim() || 'USD',
    date: normalizeReceiptDate(parsed?.date),
    category: String(parsed?.category ?? 'other'),
    confidence: Number(parsed?.confidence ?? 0.75),
    rawText: String(parsed?.rawText ?? ''),
    items,
  };

  if (
    normalized.documentType === 'bank_statement' &&
    firstMeaningfulItem
  ) {
    if (!normalized.merchant || /bank|statement|account/i.test(normalized.merchant)) {
      normalized.merchant = firstMeaningfulItem.name;
    }
    if (!normalized.amount || normalized.amount <= 0) {
      normalized.amount = firstMeaningfulItem.amount;
    }
  }

  if (!normalized.merchant && firstMeaningfulItem?.name) {
    normalized.merchant = firstMeaningfulItem.name;
  }
  if ((!normalized.amount || normalized.amount <= 0) && firstMeaningfulItem?.amount) {
    normalized.amount = firstMeaningfulItem.amount;
  }

  if (!normalized.isExpenseDocument && normalized.merchant && normalized.amount > 0) {
    normalized.isExpenseDocument = true;
    normalized.documentType = normalized.documentType === 'invalid' ? 'other_expense' : normalized.documentType;
    normalized.invalidReason = null;
  }

  return normalized;
}

function extractParsedDraft(payload: any) {
  const direct =
    payload.output_parsed ??
    payload.choices?.[0]?.message?.parsed;
  if (direct) return direct;

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return payload;
    }
  }

  return payload;
}

function normalizeFailureReason(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? 'Parse failed');
  if (
    message.includes('Multiple authentication credentials received') ||
    message.includes('Missing or invalid Authorization header') ||
    message.includes('API key not valid') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('UNAUTHENTICATED')
  ) {
    return 'MODEL_AUTH_FAILED';
  }
  if (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Resource has been exhausted') ||
    message.includes('"code": 429')
  ) {
    return 'RATE_LIMITED';
  }
  return message;
}

function isRetryableModelError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Resource has been exhausted') ||
    message.includes('"code": 429') ||
    message.includes('"status": "INTERNAL"') ||
    message.includes('internal error has occurred')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModel(model: string, filePath: string, signedUrl: string) {
  if (!MODEL_API_URL || !MODEL_API_KEY) return null;

  const response = await fetch(MODEL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MODEL_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'parsed_expense_draft',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              isExpenseDocument: {type: 'boolean'},
              documentType: {
                type: 'string',
                enum: [
                  'grocery_receipt',
                  'restaurant_receipt',
                  'bank_statement',
                  'ecommerce_screenshot',
                  'other_expense',
                  'invalid',
                ],
              },
              invalidReason: {type: ['string', 'null']},
              merchant: {type: 'string'},
              amount: {type: 'number'},
              currency: {type: 'string'},
              date: {type: 'string'},
              category: {type: 'string'},
              confidence: {type: 'number'},
              rawText: {type: 'string'},
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: {type: 'string'},
                    amount: {type: 'number'},
                    quantity: {type: ['number', 'null']},
                    unitPrice: {type: ['number', 'null']},
                  },
                  required: ['name', 'amount', 'quantity', 'unitPrice'],
                },
              },
            },
            required: [
              'isExpenseDocument',
              'documentType',
              'invalidReason',
              'merchant',
              'amount',
              'currency',
              'date',
              'category',
              'confidence',
              'rawText',
              'items',
            ],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You are an expense-document parser. Supported images include supermarket receipts, grocery receipts, restaurant receipts, bank statement screenshots, and shopping or payment screenshots. Extract the merchant/store name accurately, the total amount accurately, the printed transaction date accurately, and the item lines accurately when visible. Prefer the receipt transaction timestamp near labels such as DATE, TRANS, SALE TRANSACTION, or TOTAL PURCHASE; ignore photo metadata, upload time, card authorization metadata, and any unrelated background dates. For each item, return the visible line total as amount, and include quantity and unitPrice when visible, otherwise null. Do not extract or repeat personal information such as card tails, account numbers, loyalty numbers, phone numbers, addresses, or names of the cardholder. rawText should be a concise sanitized purchase summary, not a full OCR dump. For bank statements, merchant should be the institution name and items should be the visible spending transactions. If the image is not clearly expense-related, set isExpenseDocument=false, documentType=invalid, invalidReason to a short explanation, and do not hallucinate merchants, totals, or items. Keep category to one of: food, groceries, transport, shopping, entertainment, health, travel, utilities, subscription, other.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Parse this image from ${filePath}. Prioritize accurate merchant/store name, total amount, date, and item lines. ` +
                'Supported examples include supermarket receipts, bank statements, restaurant bills, and shopping/payment screenshots. ' +
                'If this is a meme, selfie, chat screenshot, landscape photo, or any non-expense image, mark it invalid instead of guessing. ' +
                'Use the printed receipt transaction date, especially bottom receipt fields like TRANS. DATE, and do not use the photo capture/upload date. If item lines are visible, return each item with name, amount, quantity, and unitPrice when visible. If quantity or unit price are missing, return null for them. Do not include personal information like card last 4 digits or customer details. If item lines are not visible, return an empty items array instead of inventing them.',
            },
            {
              type: 'image_url',
              image_url: {url: signedUrl},
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  return {
    parsed: extractParsedDraft(payload),
    usage: getUsageNumbers(payload),
    model,
  };
}

async function callModelWithRetry(model: string, filePath: string, signedUrl: string) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MODEL_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await callModel(model, filePath, signedUrl);
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error) || attempt === MODEL_RETRY_ATTEMPTS - 1) {
        throw error;
      }
      const delayMs = MODEL_RETRY_BASE_DELAY_MS * 2 ** attempt;
      await sleep(delayMs);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Model retry failed');
}

async function parseWithExternalModel(filePath: string, signedUrl: string) {
  if (!MODEL_API_URL || !MODEL_API_KEY) return null;

  try {
    return await callModelWithRetry(MODEL_PRIMARY, filePath, signedUrl);
  } catch (primaryError) {
    console.error('Primary model failed, trying fallback', primaryError);
    return await callModelWithRetry(MODEL_FALLBACK, filePath, signedUrl);
  }
}

async function sha256Hex(buffer: Uint8Array) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hashBuffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  try {
    const {user, supabase} = await requireUser(request);
    const {filePath} = (await request.json()) as {filePath: string};

    if (!filePath || !filePath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({error: 'Invalid file path'}), {
        status: 400,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    const {data: profile, error: profileError} = await supabase
      .from('profiles')
      .select('role, parse_daily_limit, parse_rate_per_minute, parse_concurrent_limit')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    const dailyLimit =
      profile.parse_daily_limit ??
      (profile.role === 'admin' ? DEFAULT_ADMIN_DAILY_LIMIT : DEFAULT_TRIAL_DAILY_LIMIT);
    const perMinuteLimit = profile.parse_rate_per_minute ?? DEFAULT_RATE_PER_MINUTE;
    const concurrentLimit = profile.parse_concurrent_limit ?? DEFAULT_CONCURRENT_LIMIT;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const {count, error: countError} = await supabase
      .from('expense_parse_jobs')
      .select('*', {count: 'exact', head: true})
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());
    if (countError) throw countError;

    if ((count ?? 0) >= dailyLimit) {
      return new Response(JSON.stringify({error: 'PARSE_QUOTA_REACHED'}), {
        status: 429,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const {count: minuteCount, error: minuteError} = await supabase
      .from('expense_parse_jobs')
      .select('*', {count: 'exact', head: true})
      .eq('user_id', user.id)
      .gte('created_at', minuteAgo);
    if (minuteError) throw minuteError;
    if ((minuteCount ?? 0) >= perMinuteLimit) {
      return new Response(JSON.stringify({error: 'RATE_LIMITED'}), {
        status: 429,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    const fileName = filePath.split('/').pop() ?? '';

    const {data: signedUrlData, error: signedUrlError} = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 600);
    if (signedUrlError) throw signedUrlError;

    const fileResponse = await fetch(signedUrlData.signedUrl);
    if (!fileResponse.ok) throw new Error('Unable to fetch uploaded file');
    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    const mimeType = fileResponse.headers.get('content-type') ?? '';
    if (!mimeType.startsWith('image/')) {
      return new Response(JSON.stringify({error: 'UNSUPPORTED_FILE_TYPE'}), {
        status: 415,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    if (fileBytes.byteLength > IMAGE_LIMIT) {
      return new Response(JSON.stringify({error: 'FILE_TOO_LARGE'}), {
        status: 413,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    const fileHash = await sha256Hex(fileBytes);

    const {data: duplicateJob, error: duplicateError} = await supabase
      .from('expense_parse_jobs')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('file_hash', fileHash)
      .order('created_at', {ascending: false})
      .limit(1)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicateJob?.id && duplicateJob.status !== 'failed') {
      return new Response(JSON.stringify({jobId: duplicateJob.id, deduped: true}), {
        status: 200,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    const {count: inProgressCount, error: inProgressError} = await supabase
      .from('expense_parse_jobs')
      .select('*', {count: 'exact', head: true})
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing']);
    if (inProgressError) throw inProgressError;
    if ((inProgressCount ?? 0) >= concurrentLimit) {
      return new Response(JSON.stringify({error: 'CONCURRENT_LIMIT_REACHED'}), {
        status: 429,
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
      });
    }

    const {data: job, error: insertError} = await supabase
      .from('expense_parse_jobs')
      .insert({
        user_id: user.id,
        file_url: filePath,
        file_hash: fileHash,
        mime_type: mimeType,
        file_size_bytes: fileBytes.byteLength,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (insertError) throw insertError;

    try {
      const startedAt = Date.now();
      let parsedPayloadResult: Awaited<ReturnType<typeof parseWithExternalModel>> | null = null;
      let retryCount = 0;
      try {
        parsedPayloadResult = await parseWithExternalModel(filePath, signedUrlData.signedUrl);
      } catch (_firstError) {
        retryCount = 1;
        parsedPayloadResult = await parseWithExternalModel(filePath, signedUrlData.signedUrl);
      }

      const parsedPayload = normalizeParsedExpenseDraft(
        parsedPayloadResult?.parsed ?? buildHeuristicDraft(filePath),
      );
      if (
        !parsedPayload?.isExpenseDocument ||
        parsedPayload.documentType === 'invalid' ||
        !parsedPayload.merchant ||
        !parsedPayload.amount
      ) {
        throw new Error('NO_VALID_EXPENSE_FOUND');
      }
      const usage = parsedPayloadResult?.usage ?? {inputTokens: 0, outputTokens: 0, totalTokens: 0};
      const modelUsed = parsedPayloadResult?.model ?? 'heuristic-fallback';
      const durationMs = Date.now() - startedAt;

      const {error: updateError} = await supabase
        .from('expense_parse_jobs')
        .update({
          status: 'completed',
          parsed_payload: parsedPayload,
          error_message: null,
          failure_reason: null,
          retry_count: retryCount,
          model_used: modelUsed,
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          total_tokens: usage.totalTokens,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('user_id', user.id);
      if (updateError) throw updateError;
    } catch (error) {
      const failureReason = normalizeFailureReason(error);
      await supabase
        .from('expense_parse_jobs')
        .update({
          status: 'failed',
          error_message: failureReason,
          failure_reason: failureReason,
          retry_count: 1,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({jobId: job.id}), {
      status: 200,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({error: error instanceof Error ? error.message : 'Unexpected error'}), {
      status: 500,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });
  }
});
