import { useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import type { CreatedAgent } from '../../api/agentBuilder';

export interface AgentDraft {
  name: string;
  focusArea: string;
  category: string;
  model: string;
  maxTurns: number;
  toolNames: string[];
}

const CATEGORY_OPTIONS = ['finance', 'hr', 'procurement', 'it', 'sales', 'customer_success'];
const MODEL_OPTIONS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-6'];

export { CATEGORY_OPTIONS, MODEL_OPTIONS };

export function CreateAgentScreen() {
  const [draft, setDraft] = useState<AgentDraft>({
    name: '',
    focusArea: '',
    category: CATEGORY_OPTIONS[0],
    model: MODEL_OPTIONS[0],
    maxTurns: 10,
    toolNames: [],
  });
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);

  return (
    <section className="screen">
      <h1 className="page">Create an agent</h1>
      <div className="sub">Describe the job, pick its tools, and create it — the backend runs it as a real agent.</div>

      <div className="grid create-wrap">
        <ChatPanel draft={draft} onDraftChange={setDraft} createdAgent={createdAgent} onAgentCreated={setCreatedAgent} />
        <PreviewPanel draft={draft} createdAgent={createdAgent} />
      </div>
    </section>
  );
}
