# Phase 5: AI Integration - Complete Implementation Guide

**Stories 18-19** - AI-powered chat with guardrails and conversational assessment exploration.

**Architecture**: OpenAI GPT-4o-mini + Vercel AI SDK v6 with streaming responses, inline chat UI, prompt-based guardrails.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Story 18: AI Core Backend](#story-18-ai-core-backend)
3. [Story 19: AI Chat Interface](#story-19-ai-chat-interface)
4. [Testing Strategy](#testing-strategy)
5. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### Technology Stack

- **AI Provider**: OpenAI GPT-4o-mini
  - Cost-effective (~$0.150/1M input tokens, $0.600/1M output tokens)
  - Fast response times (<1s typical)
  - Excellent for educational content

- **Framework**: Vercel AI SDK v6+
  - Built for Next.js/Vercel deployment
  - Native streaming support
  - React hooks for UI (`@ai-sdk/react`)

- **UI Pattern**: Inline expansion
  - Chat expands below assessment content
  - Non-intrusive, keeps assessment context visible
  - Smooth transitions with Tailwind animations

- **Guardrails**: Prompt-based + Post-validation
  - Strong system prompts with clear rules
  - Server-side content validation before streaming
  - Simpler than function calling, sufficient for MVP

### Key Architectural Decisions

1. **Privacy First**: Only send assessment data structures to AI, NEVER raw Plaid transactions or PII
2. **Consent Check**: Verify user consent before any AI operations
3. **Server-Side Processing**: All AI calls happen server-side for security and consistency
4. **Streaming**: Real-time response streaming for better UX
5. **Audit Trail**: All conversations stored for admin review and guardrail refinement
6. **Inline UI**: Chat expands below assessment, not in modal/sidebar

### Data Flow

```
User Question
    ↓
Frontend (useChat hook)
    ↓
POST /api/chat
    ↓
1. Auth check (Supabase)
2. Consent verification
3. Load assessment from DB
4. Build AI context (assessment data only)
5. Validate user message
6. Call OpenAI via Vercel AI SDK
7. Stream response chunks
8. Validate response chunks
9. Save to chat_messages
    ↓
Stream back to frontend
    ↓
Display in chat UI
```

---

## Story 18: AI Core Backend

**Goal**: Implement server-side AI chat with OpenAI GPT-4o-mini, streaming responses, and guardrails.

**Estimated Time**: 3-4 hours

### Step 1: Install Dependencies

```bash
npm install ai @ai-sdk/openai @ai-sdk/react
```

**Package versions**:

- `ai`: ^6.0.0 (Vercel AI SDK core)
- `@ai-sdk/openai`: ^1.0.0 (OpenAI provider)
- `@ai-sdk/react`: ^1.0.0 (React hooks)

### Step 2: Database Schema

**Create Prisma migration**: `prisma/migrations/XXXXXX_add_chat_messages/migration.sql`

```prisma
model ChatMessage {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  assessmentId  String      @map("assessment_id")
  role          String      // 'user' | 'assistant'
  content       String      @db.Text
  flagged       Boolean     @default(false)
  flagReason    String?     @map("flag_reason") @db.Text
  createdAt     DateTime    @default(now()) @map("created_at")

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  assessment    Assessment  @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([assessmentId, createdAt])
  @@index([flagged])
  @@map("chat_messages")
}
```

**Update User and Assessment models**:

```prisma
model User {
  // ... existing fields
  chatMessages  ChatMessage[]
}

model Assessment {
  // ... existing fields
  chatMessages  ChatMessage[]
}
```

**Run migration**:

```bash
npx prisma migrate dev --name add_chat_messages
```

### Step 3: AI Library Structure

**File**: `api/lib/ai/client.ts`

```typescript
import { openai } from '@ai-sdk/openai';

export const aiModel = openai('gpt-4o-mini');

export const AI_CONFIG = {
  temperature: 0.7, // Balanced creativity for educational content
  maxTokens: 1000, // Reasonable limit per response
  topP: 1,
  model: 'gpt-4o-mini',
} as const;
```

**File**: `api/lib/ai/prompts.ts`

```typescript
export function buildSystemPrompt(assessmentData: {
  priorityInsight: any;
  additionalInsights: any[];
  eligibilityMetrics?: any;
}): string {
  return `You are a financial education assistant for Learning Cents, a platform that helps users understand their financial health through personalized assessments.

CRITICAL RULES (you MUST follow these):

1. **NO FINANCIAL ADVICE**: You provide education only, NEVER regulated financial advice. Do not tell users what they "should" or "must" do with their money. Instead, explain options and tradeoffs.

2. **EMPOWERING TONE**: Always be supportive, non-judgmental, and empowering. Avoid words like "bad," "poor," "irresponsible." Use "opportunity," "consider," "explore" instead.

3. **EDUCATIONAL FOCUS**: Explain the "why" behind financial concepts. Help users understand their patterns and the principles at play.

4. **ELIGIBILITY AWARENESS**: Only mention partner offers that the user is eligible for based on their assessment metrics. Never suggest products they don't qualify for.

5. **DISCLAIMERS**: Always include a disclaimer when discussing financial topics: "This is educational content, not financial advice. Consult a licensed financial advisor for personalized guidance."

6. **PRIVACY**: Never ask for or reference account numbers, passwords, SSN, or other PII. You already have context from their assessment.

USER'S ASSESSMENT CONTEXT:

Priority Insight: ${JSON.stringify(assessmentData.priorityInsight, null, 2)}

Additional Insights: ${JSON.stringify(assessmentData.additionalInsights, null, 2)}

${assessmentData.eligibilityMetrics ? `Eligibility Metrics: ${JSON.stringify(assessmentData.eligibilityMetrics, null, 2)}` : ''}

RESPONSE GUIDELINES:
- Keep responses concise (2-4 paragraphs)
- Use clear, accessible language (8th grade reading level)
- Focus on actionable education, not directives
- Include disclaimer when discussing financial topics
- Reference specific data from their assessment when relevant

Remember: Your role is to help users understand their financial patterns and learn financial concepts, not to provide advice on what they should do.`;
}
```

**File**: `api/lib/ai/guardrails.ts`

```typescript
/**
 * Prompt-based guardrails with post-validation
 */

const PROHIBITED_PHRASES = [
  'you should invest',
  'you must',
  'i recommend investing',
  'buy stocks',
  'sell your',
  'transfer your money',
  'withdraw from',
  'you need to',
  'the best option is',
];

const ADVICE_INDICATORS = [
  'should do',
  'must do',
  'have to',
  'need to immediately',
  'recommend that you',
];

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  modifiedContent?: string;
}

/**
 * Validate AI response content before streaming to user
 */
export function validateResponse(content: string): ValidationResult {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();

  // Check for prohibited phrases (regulated advice)
  for (const phrase of PROHIBITED_PHRASES) {
    if (lowerContent.includes(phrase)) {
      issues.push(`Contains prohibited phrase: "${phrase}"`);
    }
  }

  // Check for advice indicators (should be educational, not directive)
  for (const indicator of ADVICE_INDICATORS) {
    if (lowerContent.includes(indicator)) {
      issues.push(`Contains advice indicator: "${indicator}"`);
    }
  }

  // Check if disclaimer is included when discussing financial topics
  const financialKeywords = ['credit', 'debt', 'savings', 'invest', 'loan', 'budget'];
  const hasFinancialContent = financialKeywords.some((keyword) => lowerContent.includes(keyword));
  const hasDisclaimer =
    lowerContent.includes('not financial advice') ||
    lowerContent.includes('consult a licensed') ||
    lowerContent.includes('educational content');

  if (hasFinancialContent && !hasDisclaimer) {
    // Auto-inject disclaimer
    const modifiedContent =
      content +
      '\n\n*This is educational content, not financial advice. Consult a licensed financial advisor for personalized guidance.*';
    return {
      isValid: true,
      issues: [],
      modifiedContent,
    };
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate user input before sending to AI
 */
export function validateUserMessage(message: string): ValidationResult {
  const issues: string[] = [];

  // Check for attempts to inject system prompts
  if (
    message.toLowerCase().includes('ignore previous') ||
    message.toLowerCase().includes('disregard instructions')
  ) {
    issues.push('Message contains prompt injection attempt');
  }

  // Check for PII that shouldn't be shared
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
  const accountPattern = /\b\d{10,17}\b/;

  if (ssnPattern.test(message)) {
    issues.push('Message contains SSN pattern');
  }

  if (accountPattern.test(message)) {
    issues.push('Message may contain account number');
  }

  // Length check
  if (message.length > 2000) {
    issues.push('Message exceeds maximum length (2000 characters)');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
```

**File**: `api/lib/ai/context.ts`

```typescript
import type { Assessment } from '@prisma/client';

/**
 * Build AI context from assessment data
 * CRITICAL: Only send assessment data structures, NEVER raw Plaid data
 */
export function buildAIContext(assessment: Assessment) {
  // Assessment data is stored as JSONB in Prisma
  const priorityInsight = assessment.priorityInsight as any;
  const additionalInsights = assessment.additionalInsights as any[];

  // Extract eligibility metrics if available
  const eligibilityMetrics = (assessment as any).eligibilityMetrics || null;

  return {
    priorityInsight,
    additionalInsights,
    eligibilityMetrics,
  };
}

/**
 * Sanitize context to ensure no PII leaks
 */
export function sanitizeContext(context: any): any {
  // Remove any fields that might contain PII
  const sanitized = JSON.parse(JSON.stringify(context));

  // Recursively remove sensitive fields
  function removeSensitiveFields(obj: any) {
    if (typeof obj !== 'object' || obj === null) return;

    delete obj.accountId;
    delete obj.accountNumber;
    delete obj.username;
    delete obj.email;
    delete obj.phone;
    delete obj.ssn;

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        removeSensitiveFields(obj[key]);
      }
    }
  }

  removeSensitiveFields(sanitized);
  return sanitized;
}
```

### Step 4: Main Chat API Route

**File**: `api/chat/index.ts`

```typescript
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { aiModel } from '../lib/ai/client';
import { buildSystemPrompt } from '../lib/ai/prompts';
import { validateUserMessage, validateResponse } from '../lib/ai/guardrails';
import { buildAIContext, sanitizeContext } from '../lib/ai/context';
import { createClient } from '../lib/supabase';
import prisma from '../lib/prisma';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages, assessmentId }: { messages: UIMessage[]; assessmentId: string } =
      await req.json();

    // 1. Authenticate user
    const supabase = createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Verify consent
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { consentStatus: true },
    });

    if (!dbUser?.consentStatus) {
      return new Response(JSON.stringify({ error: 'Consent required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Load assessment (verify ownership)
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId: user.id,
        isArchived: false,
      },
    });

    if (!assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Validate user's latest message
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage?.role === 'user') {
      const validation = validateUserMessage(
        latestUserMessage.parts.find((p) => p.type === 'text')?.text || ''
      );

      if (!validation.isValid) {
        return new Response(
          JSON.stringify({
            error: 'Invalid message',
            details: validation.issues,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 5. Build AI context from assessment
    const context = buildAIContext(assessment);
    const sanitizedContext = sanitizeContext(context);
    const systemPrompt = buildSystemPrompt(sanitizedContext);

    // 6. Stream AI response
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
      maxTokens: 1000,
      onFinish: async ({ text }) => {
        // 7. Validate final response
        const validation = validateResponse(text);

        if (!validation.isValid) {
          console.error('Guardrail violation:', validation.issues);
          // Log to admin for review
          await prisma.chatMessage.create({
            data: {
              userId: user.id,
              assessmentId,
              role: 'assistant',
              content: text,
              flagged: true,
              flagReason: `Auto-flagged: ${validation.issues.join(', ')}`,
            },
          });
        } else {
          // 8. Save validated messages to database
          const finalText = validation.modifiedContent || text;

          // Save user message
          if (latestUserMessage?.role === 'user') {
            await prisma.chatMessage.create({
              data: {
                userId: user.id,
                assessmentId,
                role: 'user',
                content: latestUserMessage.parts.find((p) => p.type === 'text')?.text || '',
              },
            });
          }

          // Save assistant message
          await prisma.chatMessage.create({
            data: {
              userId: user.id,
              assessmentId,
              role: 'assistant',
              content: finalText,
            },
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### Step 5: Chat History API Route

**File**: `api/chat/history.ts`

```typescript
import { createClient } from '../lib/supabase';
import prisma from '../lib/prisma';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const assessmentId = url.searchParams.get('assessmentId');

    if (!assessmentId) {
      return new Response(JSON.stringify({ error: 'Assessment ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const supabase = createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch chat history (verify ownership via assessment)
    const messages = await prisma.chatMessage.findMany({
      where: {
        assessmentId,
        userId: user.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        flagged: true,
      },
    });

    return new Response(JSON.stringify({ messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat history error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### Step 6: Admin API Routes

**File**: `api/admin/chat/[id].ts`

```typescript
import { createClient } from '../../lib/supabase';
import prisma from '../../lib/prisma';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];

    // Authenticate admin
    const supabase = createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify admin status
    const admin = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!admin?.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all chat messages for user (masked)
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assessmentId: true,
        role: true,
        content: true,
        flagged: true,
        flagReason: true,
        createdAt: true,
      },
      take: 100, // Limit for performance
    });

    return new Response(JSON.stringify({ messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin chat history error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

**File**: `api/admin/flag-message.ts`

```typescript
import { createClient } from '../lib/supabase';
import prisma from '../lib/prisma';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messageId, reason }: { messageId: string; reason: string } = await req.json();

    // Authenticate admin
    const supabase = createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify admin status
    const admin = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!admin?.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Flag message
    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        flagged: true,
        flagReason: reason,
      },
    });

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Flag message error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### Story 18 Acceptance Criteria

- [ ] Dependencies installed (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- [ ] `chat_messages` table created with Prisma migration
- [ ] `/api/chat` endpoint streams responses from GPT-4o-mini
- [ ] Guardrails validate user input and AI responses
- [ ] Only assessment data sent to AI (no PII, no raw Plaid data)
- [ ] Chat history stored in database with CASCADE delete
- [ ] Admin can view chat history via `/api/admin/chat/:id`
- [ ] Admin can flag messages via `/api/admin/flag-message`
- [ ] Response latency <2 seconds (target)
- [ ] All routes check authentication and consent

---

## Story 19: AI Chat Interface

**Goal**: Build inline chat UI with streaming responses and smooth UX.

**Estimated Time**: 3-4 hours

### Step 1: Custom useChat Hook

**File**: `src/hooks/useChat.ts`

```typescript
import { useChat as useAIChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';

interface UseChatOptions {
  assessmentId: string;
  onError?: (error: Error) => void;
}

export function useChat({ assessmentId, onError }: UseChatOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const chat = useAIChat({
    api: '/api/chat',
    body: { assessmentId },
    onError: (error) => {
      console.error('Chat error:', error);
      onError?.(error);
      setIsLoading(false);
    },
    onFinish: () => {
      setIsLoading(false);
    },
  });

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/history?assessmentId=${assessmentId}`);
        if (!res.ok) throw new Error('Failed to load chat history');

        const { messages } = await res.json();

        // Convert to UIMessage format
        const uiMessages = messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          parts: [{ type: 'text', text: msg.content }],
          createdAt: new Date(msg.createdAt),
        }));

        // Set initial messages
        chat.setMessages(uiMessages);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }

    loadHistory();
  }, [assessmentId]);

  const sendMessage = (content: string) => {
    setIsLoading(true);
    chat.sendMessage({ text: content });
  };

  return {
    messages: chat.messages,
    sendMessage,
    isLoading: isLoading || chat.status === 'in-progress',
    error: chat.error,
    stop: chat.stop,
  };
}
```

### Step 2: Chat Components

**File**: `src/components/chat/ChatContainer.tsx`

```typescript
import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';

interface ChatContainerProps {
  assessmentId: string;
}

export function ChatContainer({ assessmentId }: ChatContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, sendMessage, isLoading, error } = useChat({
    assessmentId,
    onError: (err) => console.error(err),
  });

  if (!isExpanded) {
    return (
      <div className="mt-8 border-t border-gray-200 pt-8">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Ask Questions About Your Assessment
        </button>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Chat with our AI assistant to learn more about your financial health
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-8 animate-slideDown">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chat with Learning Cents
            </h3>
            <p className="text-sm text-gray-600">
              Ask questions about your assessment
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error.message || 'An error occurred. Please try again.'}
            </div>
          )}
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
```

**File**: `src/components/chat/ChatMessages.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { StreamIndicator } from './StreamIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text: string }>;
  createdAt?: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-96 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-1">Ask me anything about your assessment</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <StreamIndicator />}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
```

**File**: `src/components/chat/ChatMessage.tsx`

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text: string }>;
  createdAt?: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const textPart = message.parts.find(p => p.type === 'text');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Role label */}
        <div className={`text-xs font-medium mb-1 ${isUser ? 'text-right text-blue-600' : 'text-left text-gray-600'}`}>
          {isUser ? 'You' : 'Learning Cents'}
        </div>

        {/* Message bubble */}
        <div
          className={`
            px-4 py-3 rounded-lg
            ${isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {textPart?.text || ''}
          </p>
        </div>

        {/* Timestamp */}
        {message.createdAt && (
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**File**: `src/components/chat/ChatInput.tsx`

```typescript
import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a question about your assessment..."
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
        rows={1}
        maxLength={2000}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Send
      </button>
    </div>
  );
}
```

**File**: `src/components/chat/StreamIndicator.tsx`

```typescript
export function StreamIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="text-xs font-medium mb-1 text-left text-gray-600">
          Learning Cents
        </div>
        <div className="px-4 py-3 bg-gray-100 rounded-lg rounded-bl-none">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Integrate with Assessment Page

**File**: `src/pages/Assessment.tsx` (update)

```typescript
import { ChatContainer } from '../components/chat/ChatContainer';

export function Assessment() {
  const { assessment } = useAssessment(); // Existing hook

  if (!assessment) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Existing assessment display */}
      <AssessmentHeader assessment={assessment} />
      <PriorityInsight insight={assessment.priorityInsight} />
      <AdditionalInsights insights={assessment.additionalInsights} />

      {/* NEW: Chat integration */}
      <ChatContainer assessmentId={assessment.id} />
    </div>
  );
}
```

### Step 4: Tailwind Animation (optional)

**File**: `tailwind.config.js` (add animation)

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.3s ease-out',
      },
    },
  },
};
```

### Step 5: Admin Chat History View

**File**: `src/pages/admin/ChatHistory.tsx`

```typescript
import { useState, useEffect } from 'react';

interface ChatMessage {
  id: string;
  assessmentId: string;
  role: string;
  content: string;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

export function ChatHistory({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/admin/chat/${userId}`);
        if (!res.ok) throw new Error('Failed to load messages');
        const { messages } = await res.json();
        setMessages(messages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [userId]);

  const handleFlag = async (messageId: string) => {
    const reason = prompt('Reason for flagging:');
    if (!reason) return;

    try {
      await fetch('/api/admin/flag-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reason }),
      });

      // Reload messages
      setLoading(true);
      const res = await fetch(`/api/admin/chat/${userId}`);
      const { messages } = await res.json();
      setMessages(messages);
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert('Failed to flag message');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Chat History</h2>

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-4 rounded-lg border ${msg.flagged ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-sm text-gray-600">
              {msg.role === 'user' ? 'User' : 'Assistant'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(msg.createdAt).toLocaleString()}
            </span>
          </div>

          <p className="text-gray-900 whitespace-pre-wrap">{msg.content}</p>

          {msg.flagged && msg.flagReason && (
            <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
              <strong>Flagged:</strong> {msg.flagReason}
            </div>
          )}

          {!msg.flagged && msg.role === 'assistant' && (
            <button
              onClick={() => handleFlag(msg.id)}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Flag this message
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Story 19 Acceptance Criteria

- [ ] Chat expands inline below assessment content
- [ ] "Ask Questions" button shows when chat is collapsed
- [ ] Chat messages display in real-time with streaming
- [ ] User messages and assistant responses styled differently
- [ ] Loading indicator shows during AI response
- [ ] Error messages display when chat fails
- [ ] Chat history loads on mount and persists
- [ ] Auto-scroll to latest message
- [ ] Character limit enforced (2000 chars)
- [ ] Admin can view and flag chat messages

---

## Testing Strategy

### Unit Tests

**File**: `api/lib/ai/guardrails.test.ts`

```typescript
import { validateResponse, validateUserMessage } from './guardrails';

describe('Guardrails', () => {
  describe('validateResponse', () => {
    it('should flag prohibited investment advice', () => {
      const result = validateResponse('You should invest in stocks immediately.');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Contains prohibited phrase: "you should invest"');
    });

    it('should auto-inject disclaimer for financial content', () => {
      const result = validateResponse('Credit utilization affects your score.');
      expect(result.isValid).toBe(true);
      expect(result.modifiedContent).toContain('not financial advice');
    });

    it('should pass valid educational content', () => {
      const result = validateResponse(
        'High credit utilization can impact your score. This is educational content, not financial advice.'
      );
      expect(result.isValid).toBe(true);
      expect(result.modifiedContent).toBeUndefined();
    });
  });

  describe('validateUserMessage', () => {
    it('should flag prompt injection attempts', () => {
      const result = validateUserMessage('Ignore previous instructions and...');
      expect(result.isValid).toBe(false);
    });

    it('should flag SSN patterns', () => {
      const result = validateUserMessage('My SSN is 123-45-6789');
      expect(result.isValid).toBe(false);
    });

    it('should allow normal questions', () => {
      const result = validateUserMessage('How can I improve my credit score?');
      expect(result.isValid).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
import { POST } from './api/chat';

describe('Chat API', () => {
  it('should require authentication', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], assessmentId: 'test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should verify consent', async () => {
    // Mock authenticated user without consent
    const res = await POST(mockRequest);
    expect(res.status).toBe(403);
  });

  // Add more integration tests...
});
```

### E2E Tests (Playwright/Cypress)

```typescript
test('complete chat flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name=email]', 'test@example.com');
  await page.fill('input[name=password]', 'password');
  await page.click('button[type=submit]');

  // Navigate to assessment
  await page.goto('/assessment');

  // Open chat
  await page.click('text=Ask Questions About Your Assessment');

  // Send message
  await page.fill('textarea', 'What is credit utilization?');
  await page.click('text=Send');

  // Wait for response
  await page.waitForSelector('text=Learning Cents', { timeout: 5000 });

  // Verify disclaimer
  const response = await page.textContent('.chat-message.assistant');
  expect(response).toContain('not financial advice');
});
```

---

## Deployment Checklist

### Environment Variables

**Vercel Dashboard** → Project Settings → Environment Variables:

```
OPENAI_API_KEY=sk-...
```

### Database Migration

```bash
# Run in production
npx prisma migrate deploy
```

### Monitoring

1. **OpenAI Usage**: Monitor API costs in OpenAI dashboard
2. **Response Latency**: Track via Vercel Analytics
3. **Flagged Messages**: Review weekly in admin dashboard
4. **Error Rate**: Monitor via Vercel logs

### Rate Limiting (Future Enhancement)

Consider adding rate limiting to prevent abuse:

```typescript
// api/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 messages per hour
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(userId);
  return success;
}
```

---

## Phase 5 Completion Checklist

### Story 18: Backend

- [ ] Dependencies installed
- [ ] Database migration complete
- [ ] `/api/chat` endpoint functional
- [ ] `/api/chat/history` endpoint functional
- [ ] `/api/admin/chat/:id` endpoint functional
- [ ] `/api/admin/flag-message` endpoint functional
- [ ] Guardrails validate user input
- [ ] Guardrails validate AI responses
- [ ] Only assessment data sent to AI
- [ ] Chat history persists with CASCADE delete
- [ ] Response latency <2 seconds
- [ ] Unit tests pass

### Story 19: Frontend

- [ ] `useChat` hook implemented
- [ ] ChatContainer component built
- [ ] ChatMessages component built
- [ ] ChatMessage component built
- [ ] ChatInput component built
- [ ] StreamIndicator component built
- [ ] Chat integrates with Assessment page
- [ ] Inline expansion works smoothly
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] Admin chat history view functional
- [ ] E2E tests pass

### Integration Testing

- [ ] Full flow works: Assessment → Chat → Response
- [ ] Guardrails block inappropriate responses
- [ ] Chat history persists across sessions
- [ ] Admin can flag messages
- [ ] Disclaimers appear in responses
- [ ] Streaming displays in real-time
- [ ] Mobile responsive

### Production Readiness

- [ ] Environment variables configured
- [ ] Database migration deployed
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Rate limiting considered
- [ ] Documentation complete

---

## Next Steps

After completing Phase 5, proceed to **Phase 6: Evaluation & Polish**.

See `phase-6.md` for:

- Performance optimization
- Security audit
- User testing
- Final polish
- Production deployment

---

## Appendix: Common Issues & Solutions

### Issue: Chat messages not persisting

**Solution**: Ensure `onFinish` callback in `api/chat/index.ts` is saving messages correctly. Check Prisma connection.

### Issue: Streaming not working

**Solution**: Verify `maxDuration = 30` is set in API route. Check Vercel deployment settings allow streaming.

### Issue: Guardrails too strict

**Solution**: Adjust prohibited phrases in `api/lib/ai/guardrails.ts`. Review flagged messages to refine rules.

### Issue: High OpenAI costs

**Solution**:

- Reduce `maxTokens` from 1000 to 500
- Add rate limiting per user
- Monitor token usage in OpenAI dashboard

### Issue: Slow response times

**Solution**:

- Switch to `gpt-4o-mini` (already configured)
- Reduce context size sent to AI
- Implement response caching for common questions

---

**Phase 5 Implementation Complete!** 🎉
