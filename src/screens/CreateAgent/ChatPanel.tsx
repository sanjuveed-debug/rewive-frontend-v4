import { useState } from 'react';
import { useTools, useCreateAgent, describeAgentFocus, type CreatedAgent } from '../../api/agentBuilder';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';
import { useToast } from '../../components/shared/Toast';
import { CATEGORY_OPTIONS, MODEL_OPTIONS, type AgentDraft } from './index';

interface ChatPanelProps {
  draft: AgentDraft;
  onDraftChange: (draft: AgentDraft) => void;
  createdAgent: CreatedAgent | null;
  onAgentCreated: (agent: CreatedAgent) => void;
}

export function ChatPanel({ draft, onDraftChange, createdAgent, onAgentCreated }: ChatPanelProps) {
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useTools();
  const createAgent = useCreateAgent();
  const { showToast } = useToast();

  const [assistPrompt, setAssistPrompt] = useState('');
  const [assistLoading, setAssistLoading] = useState(false);
  const [toolsInitialized, setToolsInitialized] = useState(false);

  // Pre-check default tools once they load, if the user hasn't touched the list yet.
  if (tools && !toolsInitialized) {
    setToolsInitialized(true);
    if (draft.toolNames.length === 0) {
      onDraftChange({ ...draft, toolNames: tools.filter((t) => t.is_default).map((t) => t.name) });
    }
  }

  const update = <K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) => {
    onDraftChange({ ...draft, [key]: value });
  };

  const toggleTool = (name: string) => {
    const has = draft.toolNames.includes(name);
    update('toolNames', has ? draft.toolNames.filter((n) => n !== name) : [...draft.toolNames, name]);
  };

  const handleAssist = async () => {
    if (!assistPrompt.trim()) return;
    setAssistLoading(true);
    const result = await describeAgentFocus(assistPrompt);
    setAssistLoading(false);
    if (result) {
      update('focusArea', result);
    } else {
      showToast("Couldn't generate a description — try writing it directly");
    }
  };

  const canSubmit = draft.name.trim().length > 0 && draft.focusArea.trim().length > 0 && !createAgent.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createAgent.mutate(
      {
        name: draft.name.trim(),
        focus_area: draft.focusArea.trim(),
        category: draft.category,
        max_turns: draft.maxTurns,
        model: draft.model,
        tool_names: draft.toolNames,
        is_active: true,
      },
      {
        onSuccess: (agent) => {
          onAgentCreated(agent);
          showToast(`${agent.name ?? draft.name} is live`);
        },
        onError: () => showToast('Could not create the agent — try again'),
      }
    );
  };

  return (
    <div className="card chat">
      <div className="chat-head">
        <div className="logo-mark" style={{ width: 26, height: 26, fontSize: 12, borderRadius: 7 }}>R</div>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>Agent Builder</div>
      </div>
      <div className="chat-body">
        <div>
          <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Agent name</label>
          <input
            placeholder="e.g. Cashflow Variance Agent"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            disabled={!!createdAgent}
            style={{
              width: '100%',
              border: '1px solid var(--border-strong)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 13.5,
              fontFamily: 'inherit',
              background: 'rgba(255,255,255,.05)',
              color: 'inherit',
            }}
          />
        </div>

        <div>
          <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Describe in plain English (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="What should this agent watch and report on?"
              value={assistPrompt}
              onChange={(e) => setAssistPrompt(e.target.value)}
              disabled={!!createdAgent}
              style={{
                flex: 1,
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 13.5,
                fontFamily: 'inherit',
                background: 'rgba(255,255,255,.05)',
                color: 'inherit',
              }}
            />
            <button className="btn ghost sm" onClick={handleAssist} disabled={assistLoading || !!createdAgent}>
              {assistLoading ? 'Thinking…' : 'Assist'}
            </button>
          </div>
        </div>

        <div>
          <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Focus area / description</label>
          <textarea
            placeholder="What this agent is responsible for, what it should flag, and how often."
            value={draft.focusArea}
            onChange={(e) => update('focusArea', e.target.value)}
            disabled={!!createdAgent}
            rows={4}
            style={{
              width: '100%',
              border: '1px solid var(--border-strong)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 13.5,
              fontFamily: 'inherit',
              background: 'rgba(255,255,255,.05)',
              color: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Category</label>
            <select
              value={draft.category}
              onChange={(e) => update('category', e.target.value)}
              disabled={!!createdAgent}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,.05)', color: 'inherit', fontFamily: 'inherit', fontSize: 13 }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Model</label>
            <select
              value={draft.model}
              onChange={(e) => update('model', e.target.value)}
              disabled={!!createdAgent}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,.05)', color: 'inherit', fontFamily: 'inherit', fontSize: 13 }}
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ width: 110 }}>
            <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Max turns</label>
            <input
              type="number"
              min={1}
              max={50}
              value={draft.maxTurns}
              onChange={(e) => update('maxTurns', Number(e.target.value) || 1)}
              disabled={!!createdAgent}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,.05)', color: 'inherit', fontFamily: 'inherit', fontSize: 13 }}
            />
          </div>
        </div>

        <div>
          <label className="mini" style={{ display: 'block', marginBottom: 6 }}>Tools</label>
          {toolsLoading && <Loading label="Loading tools…" />}
          {toolsError && <ErrorMessage message="Couldn't load tools." />}
          {tools && (
            <div className="choice-grid">
              {tools.map((t) => (
                <div
                  key={t.id}
                  className={`choice${draft.toolNames.includes(t.name) ? ' on' : ''}`}
                  onClick={() => !createdAgent && toggleTool(t.name)}
                  title={t.description}
                >
                  <span className="box">{draft.toolNames.includes(t.name) ? '✓' : ''}</span>
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 4 }}>
          <button className="btn primary" disabled={!canSubmit || !!createdAgent} onClick={handleSubmit}>
            {createdAgent ? '✓ Agent created' : createAgent.isPending ? 'Creating agent…' : 'Create agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
