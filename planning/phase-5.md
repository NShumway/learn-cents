# Phase 5: AI Integration

**Stories 18-19** - AI-powered chat with guardrails and AI-enhanced assessment rendering.

**Architecture Note**: AI integration uses **Vercel AI SDK** with **Vercel serverless functions** (`/api/chat` routes). Leverages the unified serverless architecture from Phase 4 for authentication, database access, and chat history storage.

---

## Story 18: AI Integration - Core

### Goals

- Integrate Vercel AI SDK with OpenAI GPT-4
- Implement function calling for guardrails (tone, legal compliance, eligibility)
- Send assessment data structure (not raw financial data) to AI for context
- Store chat history server-side with assessment
- Enable resume capability for conversations
- Admin review of chat history with flagging for guardrail refinement

### Key Considerations

- AI receives assessment data structure (underlying data) NOT raw Plaid transactions
- Chat history stored server-side with assessment ID reference
- Function calling enforces guardrails BEFORE response delivery
- Guardrails: no regulated financial advice, empowering tone, eligibility checks for offers
- Admin can flag problematic responses for developer review
- Target: <2 second response latency
- Streaming responses via Vercel AI SDK for perceived speed

### Guardrail Implementation

```typescript
// Function definitions for AI guardrails
const functions = [
  {
    name: 'checkToneCompliance',
    description: 'Verify response tone is empowering and non-judgmental',
    parameters: {
      type: 'object',
      properties: {
        response: { type: 'string' },
        isCompliant: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'checkLegalCompliance',
    description: 'Verify response does not provide regulated financial advice',
    parameters: {
      type: 'object',
      properties: {
        response: { type: 'string' },
        isCompliant: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'checkOfferEligibility',
    description: 'Verify any mentioned offers match user eligibility',
    parameters: {
      type: 'object',
      properties: {
        offerId: { type: 'string' },
        isEligible: { type: 'boolean' },
        rationale: { type: 'string' },
      },
    },
  },
];
```

### Chat Context Structure

What gets sent to AI:

```typescript
{
  assessmentSummary: {
    priorityInsight: {
      personaType: 'High Utilization',
      underlyingData: { /* subscription arrays, credit data, etc. */ }
    },
    additionalInsights: [ /* ... */ ],
    eligibilityMetrics: { /* ... */ }
  },
  chatHistory: [
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' }
  ],
  systemPrompt: `You are a financial education assistant...`
}
```

What does NOT get sent to AI:

- Raw Plaid transaction data
- Account numbers
- Username/email
- Any PII

### Database Schema

```sql
chat_messages table:
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- assessment_id (UUID, foreign key to assessments)
- role (text) -- 'user' or 'assistant'
- content (text)
- flagged (boolean, default false) -- Admin flagged for review
- flag_reason (text, nullable)
- created_at (timestamp)
```

### API Routes

```
/api/chat                # POST - Send message, get AI response
/api/chat/history        # GET - Fetch chat history for current assessment
/api/admin/chat/:id      # GET - Fetch user chat history (admin only)
/api/admin/flag-message  # POST - Flag message for review (admin only)
```

### File Structure

```
api/
└── chat/
    ├── index.ts          # POST /api/chat
    └── history.ts        # GET /api/chat/history

api/admin/
├── chat/[id].ts          # GET /api/admin/chat/:id
└── flag-message.ts       # POST /api/admin/flag-message

lib/
└── ai/
    ├── client.ts         # Vercel AI SDK client
    ├── guardrails.ts     # Function calling guardrails
    ├── prompts.ts        # System prompts
    └── types.ts          # AI types

Frontend:
└── src/
    ├── components/chat/
    │   ├── ChatWindow.tsx
    │   ├── ChatMessage.tsx
    │   └── ChatInput.tsx
    └── hooks/
        └── useChat.ts    # Vercel AI SDK useChat hook
```

### System Prompt

```
You are a financial education assistant for Learning Cents. Your role is to help users understand their financial assessment and learn about personal finance topics.

CRITICAL RULES:
1. NEVER provide regulated financial advice. You provide education only.
2. ALWAYS use empowering, non-judgmental tone.
3. ONLY suggest partner offers that match user eligibility.
4. ALWAYS include disclaimer when discussing financial topics.
5. Focus on the "why" not just the "what".

User Assessment Summary:
{assessment data structure}

Disclaimer to include: "This is educational content, not financial advice. Consult a licensed advisor for personalized guidance."
```

### Acceptance Criteria

- [ ] Vercel AI SDK integrated with OpenAI GPT-4
- [ ] Function calling guardrails implemented
- [ ] Assessment data structure sent to AI (not raw data)
- [ ] Chat history stored server-side
- [ ] Conversations resume correctly
- [ ] Response latency <2 seconds (target)
- [ ] Streaming responses work
- [ ] Admin can view chat history
- [ ] Admin can flag problematic responses
- [ ] Disclaimers included in AI responses

---

## Story 19: AI Chat Interface & Assessment Rendering

### Goals

- Build chat UI for user follow-up questions
- Button to reveal additional insights opens chat window
- AI-powered assessment rendering (moved from old Story 6)
- Integrate chat with assessment display
- Display loading states and error handling

### Key Considerations

- Split from old Story 6 (Assessment Engine Core) - AI rendering was deferred
- User views priority insight first
- Button to reveal additional insights opens chat window
- Chat window shows AI-rendered insights and allows follow-up questions
- AI can render insights in different formats (conversational, detailed, simplified)
- Chat persists with assessment (resume capability from Story 18)

### UI Flow

```
Assessment Page:
1. Priority insight displayed (rendered server-side or client-side from Phase 2)
2. Button: "View Additional Insights & Chat"
3. Click opens chat window (side panel or modal)
4. Chat window shows:
   - Additional insights (AI-rendered if requested)
   - Chat input for follow-up questions
   - Chat history
5. User can ask questions about insights
6. AI responds with guardrails
```

### Chat Window Components

```tsx
<ChatWindow>
  <ChatHeader>
    <h3>Chat with Learning Cents</h3>
    <CloseButton />
  </ChatHeader>

  <ChatMessages>
    {/* Auto-rendered additional insights */}
    <AssistantMessage>
      Here are your additional insights: - Subscription-Heavy: You have 6 recurring subscriptions...
      - Savings Builder: Your savings have grown 5% in the last 180 days...
    </AssistantMessage>

    {/* User question */}
    <UserMessage>How can I reduce my subscriptions?</UserMessage>

    {/* AI response with guardrails */}
    <AssistantMessage>
      Great question! Here are some strategies for reducing subscription costs... [Educational
      content] Disclaimer: This is educational content, not financial advice.
    </AssistantMessage>
  </ChatMessages>

  <ChatInput onSend={handleSend} placeholder="Ask a question about your assessment..." />
</ChatWindow>
```

### AI Assessment Rendering Options

User can request different rendering styles:

- **Conversational**: "Explain my assessment like I'm talking to a friend"
- **Detailed**: "Give me all the details about my credit utilization"
- **Simplified**: "Explain this in simple terms"
- **Action-oriented**: "What should I do first?"

### File Structure

```
Frontend:
└── src/
    ├── pages/Assessment.tsx (updated with chat integration)
    ├── components/chat/
    │   ├── ChatWindow.tsx
    │   ├── ChatHeader.tsx
    │   ├── ChatMessages.tsx
    │   ├── ChatMessage.tsx
    │   ├── ChatInput.tsx
    │   └── LoadingIndicator.tsx
    └── hooks/
        └── useChat.ts (Vercel AI SDK)
```

### Acceptance Criteria

- [ ] Chat window opens when "View Additional Insights" clicked
- [ ] Additional insights rendered in chat
- [ ] User can ask follow-up questions
- [ ] AI responds with guardrails
- [ ] Chat history persists
- [ ] Loading states display during AI response
- [ ] Error handling works
- [ ] Chat integrates with assessment display
- [ ] Streaming responses display in real-time
- [ ] User can close chat window

---

## Phase 5 Completion Checklist

### Story 18: AI Integration - Core

- [ ] Vercel AI SDK integrated
- [ ] Function calling guardrails working
- [ ] Assessment data sent to AI (not raw data)
- [ ] Chat history stored server-side
- [ ] Resume capability working
- [ ] Admin can view/flag chat history
- [ ] Response latency acceptable

### Story 19: AI Chat Interface & Assessment Rendering

- [ ] Chat window UI complete
- [ ] Additional insights rendered in chat
- [ ] User can ask follow-up questions
- [ ] AI responses display with streaming
- [ ] Loading/error states working
- [ ] Chat integrates with assessment

### Integration Test

- [ ] Full flow: Assessment → Additional Insights → Chat
- [ ] AI guardrails prevent inappropriate responses
- [ ] Chat history persists and resumes
- [ ] Admin can flag problematic responses
- [ ] Response latency <2 seconds (target)
- [ ] Streaming works correctly

---

## Next Steps

After completing Phase 5, move to Phase 6: Evaluation & Polish (Story 20)
See `phase-6.md` for detailed implementation guide.
