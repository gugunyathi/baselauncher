
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useRef } from 'react';
import {
  Agent,
  AGENT_COLORS,
  AGENT_THEMES,
  INTERLOCUTOR_VOICE,
  INTERLOCUTOR_VOICES,
  createNewAgent,
} from '@/lib/presets/agents';
import Modal from './Modal';
import c from 'classnames';
import { useAgent, useUI } from '@/lib/state';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';

export default function EditAgent() {
  const { current: agent, availablePresets, availablePersonal, setCurrent, update: updateAgent, addAgent } = useAgent();
  const { disconnect, connected } = useLiveAPIContext();
  const nameInput = useRef(null);
  const { setShowAgentEdit } = useUI();

  function onClose() {
    setShowAgentEdit(false);
  }

  function updateCurrentAgent(adjustments: Partial<Agent>) {
    updateAgent(agent.id, adjustments);
  }

  function changeAgent(newAgent: Agent) {
    if (connected) {
        disconnect();
    }
    setCurrent(newAgent);
  }

  function addNewChatterBot() {
    if (connected) {
        disconnect();
    }
    const newAgent = createNewAgent();
    addAgent(newAgent);
    setCurrent(newAgent);
  }

  return (
    <Modal onClose={() => onClose()}>
      <div className="editAgent">
        <div className="agent-presets">
            <h3>AI Agent Presets</h3>
            <div className="preset-grid">
                {availablePresets.map(preset => (
                    <button
                        key={preset.id}
                        className={c('preset-button', { active: preset.id === agent.id })}
                        onClick={() => changeAgent(preset)}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            {availablePersonal.length > 0 && (
                <>
                    <h4>My Agents</h4>
                    <div className="preset-grid">
                        {availablePersonal.map(personalAgent => (
                            <button
                                key={personalAgent.id}
                                className={c('preset-button', { active: personalAgent.id === agent.id })}
                                onClick={() => changeAgent(personalAgent)}
                            >
                                {personalAgent.name}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <button className="button new-agent-button" onClick={addNewChatterBot}>
                <span className="icon">add</span> Create New Agent
            </button>
        </div>

        <hr />

        <div className="current-agent-settings">
            <h3>Edit Current Agent</h3>
            <form>
                <div>
                <input
                    className="largeInput"
                    type="text"
                    placeholder="Name"
                    value={agent.name}
                    onChange={e => updateCurrentAgent({ name: e.target.value })}
                    ref={nameInput}
                />
                </div>

                <div>
                <label>
                    Personality
                    <textarea
                    value={agent.personality}
                    onChange={e =>
                        updateCurrentAgent({ personality: e.target.value })
                    }
                    rows={7}
                    placeholder="How should I act? Whatʼs my purpose? How would you describe my personality?"
                    />
                </label>
                </div>
            </form>

            <div className="setting-groups">
                <div className="setting-section">
                    <h4>Avatar Color</h4>
                    <ul className="colorPicker">
                    {AGENT_COLORS.map((color, i) => (
                        <li
                        key={i}
                        className={c({ active: color === agent.bodyColor })}
                        >
                        <button
                            style={{ backgroundColor: color }}
                            onClick={() => updateCurrentAgent({ bodyColor: color })}
                        />
                        </li>
                    ))}
                    </ul>
                </div>
                
                <div className="setting-section">
                    <h4>Wallpaper Theme</h4>
                    <ul className="themePicker">
                    {AGENT_THEMES.map((theme) => (
                        <li
                        key={theme.id}
                        className={c({ active: theme.id === (agent.theme || 'base-blue') })}
                        >
                        <button
                            style={{ background: theme.css }}
                            onClick={() => updateCurrentAgent({ theme: theme.id })}
                            title={theme.name}
                        />
                        </li>
                    ))}
                    </ul>
                </div>

                <div className="voicePicker">
                    Voice
                    <select
                    value={agent.voice}
                    onChange={e => {
                        updateCurrentAgent({
                        voice: e.target.value as INTERLOCUTOR_VOICE,
                        });
                    }}
                    >
                    {INTERLOCUTOR_VOICES.map(voice => (
                        <option key={voice} value={voice}>
                        {voice}
                        </option>
                    ))}
                    </select>
                </div>
            </div>
        </div>

        <button onClick={() => onClose()} className="button primary">
          Done
        </button>
      </div>
    </Modal>
  );
}
