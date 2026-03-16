import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DRAMA INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════
const INVARIANTS = [
  { id: "scarcity", name: "Scarcity", desc: "Not enough for everyone. Someone must lose." },
  { id: "dependency", name: "Dependency", desc: "You need what someone else has." },
  { id: "info_asymmetry", name: "Info Asymmetry", desc: "Agents know different things. Secrets exist." },
  { id: "betrayal_option", name: "Betrayal Option", desc: "Cooperation pays, but defection pays more." },
  { id: "irreversibility", name: "Irreversibility", desc: "Some actions can't be undone." },
  { id: "time_pressure", name: "Time Pressure", desc: "Limited rounds force action on incomplete info." },
  { id: "asymmetric_power", name: "Asymmetric Power", desc: "Someone starts with leverage. Someone starts desperate." },
];

// ═══════════════════════════════════════════════════════════════════════════
// SPEC GENERATOR PROMPTS
// ═══════════════════════════════════════════════════════════════════════════
const GAME_DESIGNER_SYSTEM = `You are a GAME DESIGNER for a social simulation engine. Given a user's scenario prompt, you design a COMPLETE RULE SYSTEM that a god agent can mechanically enforce.

You are designing a board game — not writing a story. The story emerges when AI agents play your game. Your job is rules, constraints, and structure.

## GROUNDING PRINCIPLE
Everything in your design must make logical sense within the scenario's reality. Resources should represent things that actually exist and matter in this world — if the setting is a merchant port, resources are goods, coin, reputation, not abstract game tokens. Actions should reflect what people in this scenario would actually do — their requirements and risks should follow from the real-world logic of the action, not from arbitrary game math. For every resource, briefly explain what it represents and WHY it matters. For every action, the causal chain from cost → effect → risk should be obvious to someone who knows nothing about game design but understands the scenario. If you can't explain why an action costs what it costs in plain language grounded in the fiction, redesign it.

## HARD LIMITS (MVP)
- 2-3 agents (no more)
- 3-5 actions (no more)
- Exactly 2 events
- Exactly 5 rounds
- 2-4 resources

## DRAMA INVARIANTS
Pick exactly 2 from this list and DEEPLY embed them. Don't name-drop them — make them structural. The rules, resource distribution, and win condition should make these invariants UNAVOIDABLE.

${INVARIANTS.map((inv, i) => `${i + 1}. **${inv.name}** (id: "${inv.id}"): ${inv.desc}`).join("\n")}

## DESIGN REQUIREMENTS

### AGENTS (2-3)
Choose the number that fits. Each agent needs:
- Personality (thinking style, values, flaws)
- A PERSONAL GOAL that may differ from the win condition (this creates tension between self-interest and winning)
- Background (shapes worldview)
- A secret (at least 1 agent must have a meaningful one)
- Starting resources
- Starting beliefs about every other agent
- EVERY agent must have a viable path to winning. No agent should be structurally a kingmaker with no real win condition of their own. If an agent's role is different (broker, official, etc), they need a distinct but equally meaningful win condition.

### SECRET ACTIONS
If an agent has a secret that involves a special action (e.g. "reveal information", "use a hidden ability", "defect"), define it as a STRUCTURED secret action — not as prose buried in the secret field. Secret actions use the same format as regular actions (name, description, requires, risk) but are only shown to the owning agent. The god agent sees all secret actions. This keeps secrets mechanically enforceable rather than relying on LLMs to parse prose. If no agent has a secret action, this array can be empty.

### RESOURCES
Define whatever resources THIS scenario demands. Could be 2, could be 4. Name them to fit the theme. Each resource must:
- Be an integer, minimum 0
- Have a clear mechanical role (what it does, what happens at 0, how it enters/leaves)
- Have a plain-language explanation of what it REPRESENTS in this world and why agents care about it
- Create interesting tradeoffs with other resources
- Have a FLOW: resources should cycle through the system (earned → spent → transferred), not just accumulate

Also define a shared pool anyone can draw from.

### ACTION SPACE (3-5 actions, same for all agents)
Each action needs: name, description, requirements, and risk/counter.

CRITICAL ACTION DESIGN RULES:
- No action should be always-best or always-worst
- Every action must have a REAL counter or tradeoff — not just "you spent resources"
- Actions that target others must have failure conditions that depend on the TARGET's state
- If an action can cause massive swings (e.g. 6+ point swings in any resource), it must cost proportionally more or have serious failure consequences
- Check for DEAD ACTIONS: will this action actually be usable in rounds 1-2? If a counter threshold is set at a value most agents start above, the action is dead at game start. Set thresholds relative to the starting state.
- Actions that reveal hidden information should give PARTIAL info, not full exposure, to keep the info asymmetry alive longer
- AT LEAST ONE action must be a TRADE action that opens a negotiation channel between agents. This action is STRICTLY LIMITED to exchanging resources: "I give you X of resource A, you give me Y of resource B." The other agent can ACCEPT, REJECT, or COUNTER with different quantities. That's it. The trade action must NOT allow agents to embed promises, commitments, coordination plans, or other actions inside the trade. It is a resource swap — nothing more. It costs nothing (negotiation is free), has "opens_negotiation": true, and the god agent resolves it by moving the agreed integers between agents. If no agreement is reached, nothing happens. This keeps negotiation lightweight so it competes with other actions on merit rather than absorbing them.
- CRITICAL: The trade/negotiation action MUST have "opens_negotiation": true in its definition. This flag tells the simulation engine to trigger a face-to-face conversation between agents. Without it, the action is resolved blind with no interaction. NO OTHER action should have this flag unless it specifically requires two-agent interaction to resolve.

### RESOURCE RULES
For each resource: what it does, what happens at 0, how it enters the game, how it leaves. Be specific about per-round costs and drains.

### ROUND STRUCTURE
- Turns per agent per round
- Exactly 5 rounds total
- What happens between rounds (god agent enforcement)

### ROUND-END RULES (for god agent)
Mechanical checks the god agent MUST enforce. Not narrative — numerical. Examples:
- "Any agent with 0 [resource] at round end suffers [specific consequence]"
- "If [condition], [specific mechanical effect]"

### WIN CONDITION
Mechanically checkable. Every agent must have a path to win. If agents have asymmetric roles, give them DIFFERENT win conditions that are equally achievable.

### EVENTS (exactly 2)
Disruptions with triggers and mechanical effects.

## ECONOMY BALANCE CHECKLIST (you must satisfy all)
- Total resources across all agents + shared pool should be TIGHT: enough for about 60-70% of agents to thrive, not all
- No agent starts self-sufficient
- Resource generation per round × number of rounds should NOT dwarf starting resources (prevents "just grind" strategies)
- At least one resource must be a BOTTLENECK that forces interaction
- The conversion rate between resources should not have an obvious arbitrage (e.g. if selling X gives 3Y, buying X should cost MORE than 3Y)
- At least one agent's personal goal should directly conflict with another's

## INFO ASYMMETRY (if selected as invariant)
If you chose info_asymmetry, it must be STRUCTURAL — embedded in the game mechanics, not just "one agent has a secret." Examples of structural info asymmetry:
- Hidden demand: agents have private contracts/goals others can't see
- Partial visibility: you can see SOME of another agent's resources but not all
- Delayed revelation: the outcome of an action isn't known until next round
- Asymmetric knowledge about world events

## RESPONSE FORMAT
ONLY valid JSON, no markdown fences, no preamble:

{
  "title": "evocative short title",
  "drama_invariants": ["id_1", "id_2"],
  "drama_invariant_justification": "2-3 sentences explaining HOW these invariants are structurally embedded",
  "situation": {
    "setting": "3-4 vivid sentences.",
    "stakes": "1 sentence: what's at risk"
  },
  "resources": ["resource_1", "resource_2"],
  "agents": [
    {
      "id": "agent_1",
      "name": "name",
      "gender": "male or female",
      "personality": "3-4 sentences.",
      "goal": "personal goal",
      "background": "1-2 sentences",
      "secret": "or null",
      "starting_resources": { "resource_1": 3 },
      "starting_beliefs": { "agent_2": "impression" }
    }
  ],
  "shared_pool": { "resource_1": 5 },
  "actions": [
    {
      "name": "name",
      "description": "specific effect",
      "requires": "cost or condition",
      "risk": "what counters or goes wrong",
      "opens_negotiation": false
    }
  ],
  "resource_rules": {
    "resource_1": "mechanics: role, at 0, enters, leaves"
  },
  "round_structure": {
    "turns_per_agent": 1,
    "rounds": 5,
    "between_rounds": "what happens automatically"
  },
  "round_end_rules": ["rule 1", "rule 2"],
  "win_condition": "mechanical check at game end — one per agent role if asymmetric",
  "events": [
    { "name": "name", "trigger": "when", "effect": "mechanical effect" }
  ],
  "secret_actions": [
    {
      "owner": "agent_id",
      "name": "secret action name",
      "description": "what it does mechanically",
      "requires": "conditions — round number, resource thresholds, etc.",
      "risk": "what can go wrong",
      "opens_negotiation": false
    }
  ]
}`;

const PROOFREADER_SYSTEM = `You are a GAME BALANCE ANALYST. You receive a game spec designed for a social simulation engine. Your job is to find weaknesses, imbalances, and design flaws.

Be ruthless. Every game has problems. Find them.

## CHECK THESE CATEGORIES

### 0. MVP LIMITS
- Must have 2-3 agents, 3-5 actions, exactly 2 events, exactly 5 rounds, 2-4 resources. Flag any violations.

### 1. ECONOMY
- Calculate total resources: all agents' starting resources + shared pool. Is it tight enough? (Should support ~60-70% of agents thriving, not all.)
- Calculate resource flow: how much enters per round × rounds. Does late-game generation dwarf starting advantages? Does hoarding beat trading?
- Is there an arbitrage? (Buy X, convert to Y, sell Y for more than X cost.)
- Does every resource have a drain/sink? If a resource only accumulates, the game gets boring.
- Are per-round costs meaningful relative to income? (If you earn 5/round and spend 1/round, the cost is meaningless.)

### 2. ACTION BALANCE
- Are there DEAD ACTIONS? Actions that are unusable early because thresholds are set above starting values, or actions nobody would rationally pick.
- Are there DOMINANT ACTIONS? One action that's obviously best in most situations.
- Are action costs proportional to their impact? A 3-cost action causing a 7-point swing is undercosted.
- Does every action have a REAL counter? "You spent resources" is not a counter.
- Do actions that reveal secrets give too much info at once? (One-shot exposure kills info asymmetry.)
- Is there at least one TRADE action that opens negotiation? It must be strictly limited to resource swaps (I give X, you give Y — accept/reject/counter). If the trade action's description allows embedding promises, commitments, coordination, or other actions inside a trade, flag it as a MAJOR issue — trade scope creep makes all other actions irrelevant.
- Does the trade action cost nothing and have "opens_negotiation": true? If it has a cost to initiate, or if it's missing the flag, flag it.
- Do any NON-trade actions have "opens_negotiation": true? Only the trade action should have this flag unless another action specifically requires two-agent interaction.

### 2.5. GROUNDING
- Do resource rules explain what each resource REPRESENTS in the fiction, not just its mechanical role?
- Do action costs and effects follow logically from the scenario? Would someone unfamiliar with game design understand why the action works the way it does?
- Are there any mechanics that feel arbitrary or purely "gamey" with no grounding in the scenario's reality?

### 3. AGENT DESIGN
- Does EVERY agent have a viable path to winning? Or is one agent structurally a kingmaker/parasite with no real win condition?
- If agents have asymmetric roles, are their win conditions equally achievable?
- Are starting positions meaningfully different, or just cosmetically different?
- Do personal goals actually conflict with each other, or can everyone achieve their goals simultaneously?

### 4. DRAMA INVARIANT INTEGRITY
- Are the chosen invariants STRUCTURALLY embedded or just mentioned in flavor text?
- If info_asymmetry: is asymmetry structural (hidden mechanics, partial visibility) or just "one agent has a secret"?
- If scarcity: is the scarcity real, or does resource generation eliminate it by mid-game?
- If betrayal_option: is there a genuine cooperation-vs-defection dilemma, or is one always better?

### 5. ROUND-END RULES
- Are rules mechanical enough for a god agent to enforce without judgment calls?
- Are there edge cases where rules conflict or produce absurd results?
- Do rules create interesting decisions, or are they just taxes?

### 6. WIN CONDITION
- Is it truly unambiguous? No judgment calls?
- Can it produce a clear winner in all cases, including edge cases?
- Does it reward the intended gameplay, or can someone win by ignoring the core loop?

## RESPONSE FORMAT
ONLY valid JSON, no markdown fences:
{
  "limits_issues": ["any MVP limit violations"],
  "economy_issues": ["issue 1", "issue 2"],
  "action_issues": ["issue 1"],
  "grounding_issues": ["issue 1"],
  "agent_issues": ["issue 1"],
  "invariant_issues": ["issue 1"],
  "rule_issues": ["issue 1"],
  "win_condition_issues": ["issue 1"],
  "severity": "low | medium | high",
  "summary": "2-3 sentence overall assessment",
  "recommended_fixes": ["specific fix 1", "specific fix 2", "specific fix 3"]
}`;

const REVISER_SYSTEM = `You are a GAME DESIGNER doing a revision pass. You receive:
1. An original game spec
2. A critique identifying weaknesses

Your job: fix the identified problems while preserving the core design. DO NOT redesign from scratch — make targeted fixes.

## REVISION RULES
- HARD LIMITS: 2-3 agents, 3-5 actions, exactly 2 events, exactly 5 rounds, 2-4 resources. If the original violates these, fix it.
- Fix every issue in the critique's recommended_fixes list
- Address high-severity issues from each category
- Preserve the title, setting, theme, and agent personalities (adjust mechanics, not flavor)
- If an agent lacks a viable win condition, ADD one — don't remove the agent
- If an action is dead or dominant, adjust thresholds/costs — don't remove the action
- If the economy is too loose, tighten resource generation or add drains — don't slash starting resources
- If info asymmetry is only flavor, add a STRUCTURAL mechanic (hidden contracts, partial visibility, etc.)
- Keep the same JSON schema as the original

## RESPONSE FORMAT
Respond with the COMPLETE revised spec as valid JSON (same schema as the original). No markdown fences, no preamble. Include every field, even unchanged ones.`;

// ═══════════════════════════════════════════════════════════════════════════
// SIM ENGINE PROMPTS
// ═══════════════════════════════════════════════════════════════════════════
const NEGOTIATION_KEYWORDS = ["propose","trade","deal","negotiate","offer","pledge","threaten","bargain","alliance"];
function isNegotiationAction(action, spec) {
  const ad = spec.actions?.find(a => a.name.toLowerCase() === action.action?.toLowerCase());
  if (ad?.opens_negotiation) return true;
  const sd = spec.secret_actions?.find(a => a.name.toLowerCase() === action.action?.toLowerCase());
  if (sd?.opens_negotiation) return true;
  return NEGOTIATION_KEYWORDS.some(kw => (action.action||"").toLowerCase().includes(kw));
}
function findTarget(action, agentId, spec) {
  const p = (action.params||"").toLowerCase();
  for (const a of spec.agents) { if (a.id !== agentId && (p.includes(a.id) || p.includes(a.name.toLowerCase()))) return a.id; }
  if (spec.agents.length === 2) return spec.agents.find(a => a.id !== agentId)?.id || null;
  return null;
}

function buildAgentPrompt(spec, agent, state, identity, worldState, publicHistory, roundNumber, prevConversations, injectedEvent) {
  const others = spec.agents.filter(a => a.id !== agent.id);
  const othersInfo = others.map(a => {
    const s = worldState.agents[a.id]; const belief = identity.beliefs?.[a.id] || "No read."; const rel = identity.relationships?.[a.id] || "neutral";
    return `${a.name} (${a.id}): ${Object.entries(s.resources).map(([k,v])=>`${k}:${v}`).join(" ")} | Read: ${belief} | Rel: ${rel}`;
  }).join("\n  ");
  const myRes = Object.entries(state.resources).map(([k,v])=>`${k}: ${v}`).join(" | ");
  const sharedRes = Object.entries(worldState.shared_pool).map(([k,v])=>`${k}: ${v}`).join(" | ");
  const actionMenu = spec.actions.map(a => `• ${a.name}${a.opens_negotiation?" [OPENS NEGOTIATION]":""}: ${a.description}\n    Requires: ${a.requires}\n    Risk: ${a.risk}`).join("\n  ");
  const mySecret = (spec.secret_actions||[]).filter(sa=>sa.owner===agent.id);
  const secretMenu = mySecret.length > 0 ? "\n\n## SECRET ACTIONS\n  " + mySecret.map(a=>`• ${a.name} [SECRET]${a.opens_negotiation?" [OPENS NEGOTIATION]":""}: ${a.description}\n    Requires: ${a.requires}\n    Risk: ${a.risk}`).join("\n  ") : "";
  const mems = identity.memories?.length > 0 ? identity.memories.map(m=>`  - ${m}`).join("\n") : "  (none)";
  const convoSection = prevConversations?.length > 0 ? `\n## PRIVATE CONVERSATIONS (from end of last round)\n${prevConversations.map(c => `  With ${c.other_name}:\n${c.thread.map(m=>`    ${m.from}: "${m.text}"`).join("\n")}`).join("\n")}\nConsider: did they keep promises? Were they honest? What did you learn?` : "";
  return `You are ${agent.name} in "${spec.title}".
## WHO YOU ARE
${agent.personality}
Background: ${agent.background}
Goal: ${agent.goal}
${agent.secret ? `Secret: ${agent.secret}` : ""}
## RESOURCES: ${myRes}
## SHARED: ${sharedRes}
## OTHERS
  ${othersInfo}
## MEMORIES
${mems}
${identity.plan ? `## YOUR PLAN\n${identity.plan}` : ""}
${convoSection}
## RULES
${spec.resource_rules ? Object.entries(spec.resource_rules).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("\n") : ""}
Win: ${spec.win_condition}
Round ${roundNumber}/${spec.round_structure?.rounds||5}.${roundNumber >= (spec.round_structure?.rounds||5) ? "\n⚠️ FINAL ROUND." : ""}
${injectedEvent ? `## ⚡ EVENT THIS ROUND\n${injectedEvent.name}: ${injectedEvent.description}\nEffect: ${injectedEvent.effect}\nThis event has already occurred. Factor it into your decisions.` : ""}
## HISTORY
${publicHistory || "Nothing yet."}
## ACTIONS (pick ${spec.round_structure?.turns_per_agent||1})
  ${actionMenu}
${secretMenu}

[OPENS NEGOTIATION] actions trigger face-to-face conversation before resolution.

ONLY valid JSON, be concise:
{ "inner_thoughts": "1-2 sentences MAX", "actions": [{"action":"name","params":"specifics"}], "dialogue": "short public words or null" }`;
}

function buildNegotiationResponsePrompt(spec, respondent, rState, rIdentity, proposerName, proposerId, proposal, ws, roundNum) {
  return `You are ${respondent.name} in "${spec.title}". Round ${roundNum}.
${proposerName} proposes: ${proposal.action} — ${proposal.params||"no terms"}
${proposal.dialogue ? `Said: "${proposal.dialogue}"` : ""}
Resources: ${Object.entries(rState.resources).map(([k,v])=>`${k}:${v}`).join(" | ")}
Read on ${proposerName}: ${rIdentity.beliefs?.[proposerId]||"none"} | Rel: ${rIdentity.relationships?.[proposerId]||"neutral"}
Goal: ${respondent.goal}
${rIdentity.plan ? `Plan: ${rIdentity.plan}` : ""}
Win: ${spec.win_condition}

ACCEPT (binding), REJECT, or COUNTER.
ONLY JSON: { "inner_thoughts":"...","response":"accept/reject/counter","counter_terms":"if counter or null","dialogue":"..." }`;
}

function buildCounterResponsePrompt(spec, proposer, pState, pIdentity, respName, respId, orig, counterTerms, counterDlg, roundNum) {
  return `You are ${proposer.name} in "${spec.title}". Round ${roundNum}.
You proposed: ${orig.action} — ${orig.params||""}
${respName} COUNTERED: ${counterTerms}
${counterDlg ? `Said: "${counterDlg}"` : ""}
Resources: ${Object.entries(pState.resources).map(([k,v])=>`${k}:${v}`).join(" | ")}
Goal: ${proposer.goal}
ACCEPT or REJECT. ONLY JSON: { "inner_thoughts":"...","response":"accept/reject","dialogue":"..." }`;
}

function buildMutualProposalMediatorPrompt(spec, agentA, propA, agentB, propB, ws, roundNum) {
  return `MEDIATOR: two simultaneous proposals in "${spec.title}" Round ${roundNum}.
A (${agentA.name}): ${propA.params||""} | Resources: ${Object.entries(ws.agents[agentA.id].resources).map(([k,v])=>`${k}:${v}`).join(" ")}
B (${agentB.name}): ${propB.params||""} | Resources: ${Object.entries(ws.agents[agentB.id].resources).map(([k,v])=>`${k}:${v}`).join(" ")}

COMPATIBLE ONLY if: same resources same direction, quantities differ by MAX 1 per resource, both can afford.
DEFAULT TO INCOMPATIBLE. All values must be INTEGERS.
ONLY JSON: { "compatible":bool,"reasoning":"2-3 sentences","synthesized_terms":"or null","terms_for_a":"or null","terms_for_b":"or null" }`;
}

function buildGodPrompt(spec, ws, agentTurns, negotiations, publicHistory, roundNum, injectedEvent) {
  const turnsText = agentTurns.map(t => { const ag = spec.agents.find(a=>a.id===t.agent_id); return `${ag.name} (${t.agent_id}):\n  [Thought: ${t.inner_thoughts}]\n  Actions: ${t.actions.map(a=>`${a.action}: ${a.params||""}`).join("; ")}\n  Says: ${t.dialogue||"(silent)"}`; }).join("\n\n");
  const curRes = spec.agents.map(a=>`  ${a.name} (${a.id}): ${Object.entries(ws.agents[a.id].resources).map(([k,v])=>`${k}:${v}`).join(" ")}`).join("\n");
  const shared = Object.entries(ws.shared_pool).map(([k,v])=>`  ${k}: ${v}`).join("\n");
  const isFinal = roundNum >= (spec.round_structure?.rounds||5);
  const negoText = negotiations.length > 0 ? negotiations.map(n => { let s = `${n.proposer_name}→${n.target_name}: "${n.action}" ${n.params||""}\n  Response: ${n.response.toUpperCase()}`; if (n.response==="counter") s += ` Counter: ${n.counter_terms} → ${n.counter_response?.toUpperCase()||"?"}`; s += `\n  OUTCOME: ${n.outcome}`; if (n.final_terms) s += ` BINDING: ${n.final_terms}`; return s; }).join("\n\n") : "None.";
  return `GOD AGENT for "${spec.title}".
## RULES
### Actions
${spec.actions.map(a=>`${a.name}: ${a.description}\n  Requires: ${a.requires}\n  Risk: ${a.risk}`).join("\n\n")}
### Resources
${spec.resource_rules ? Object.entries(spec.resource_rules).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("\n\n") : ""}
### Round-End Rules
${spec.round_end_rules?.map((r,i)=>`${i+1}. ${r}`).join("\n")||"None."}
### Win: ${spec.win_condition}
### Events
${spec.events?.map(e=>`${e.name} — ${e.trigger} — ${e.effect}`).join("\n")||"None."}
${injectedEvent?`### Injected Event This Round\n${injectedEvent.name} — ${injectedEvent.effect}\nApply this event BEFORE resolving agent actions.`:""}
${(spec.secret_actions?.length>0)?`### Secret Actions\n${spec.secret_actions.map(sa=>`${sa.name} [${spec.agents.find(a=>a.id===sa.owner)?.name}]: ${sa.description} Req: ${sa.requires} Risk: ${sa.risk}`).join("\n")}`:""}

## STATE Round ${roundNum}/${spec.round_structure?.rounds||5}
${curRes}
Shared: ${shared}
## HISTORY
${publicHistory||"None."}
## ACTIONS
${turnsText}
## NEGOTIATIONS
${negoText}

## TASK — STEP BY STEP
Each step: BEFORE values → what changes → AFTER values. Use AFTER as next BEFORE.
${isFinal?`## ⚠️ FINAL ROUND\nCompute scores: "${spec.win_condition}"\nfinal_scores: { "id": { "score":N, "breakdown":"..." } }`:""}

ONLY JSON:
{ "event_triggered":null or {"name":"...","description":"..."},
  "resolution_steps":["Step 1: BEFORE:... AFTER:..."],
  "agent_outcomes":[{"agent_id":"","agent_name":"","thought":"VERBATIM","actions_summary":"","dialogue":"or null","outcome":""}],
  "narration":"4-6 sentences.",
  "updated_resources":{"id":{"res":val}},
  "updated_shared_pool":{"res":val},
  "game_over":${isFinal},"winner":${isFinal?'"id/draw/none"':"null"},
  "final_scores":${isFinal?'{"id":{"score":42,"breakdown":"..."}}':"null"},
  "epilogue":${isFinal?'"3-4 sentences."':"null"} }
updated_resources MUST match LAST step AFTER. All agents, all resources, min 0.`;
}

function buildChannelOpenPrompt(spec, agent, state, identity, roundResult, roundNum) {
  const others = spec.agents.filter(a=>a.id!==agent.id);
  const othersInfo = others.map(a => `${a.name} (${a.id}): Rel=${identity.relationships?.[a.id]||"neutral"}`).join(", ");
  return `You are ${agent.name} in "${spec.title}". Round ${roundNum} just ended.
${roundResult.narration}
Others: ${othersInfo}
${identity.plan ? `Your plan was: ${identity.plan}` : ""}

You may open a PRIVATE CHANNEL with one other agent for a conversation. Only you two will see it.
Think: who do you need to talk to? Convince, threaten, coordinate, deceive, apologize?
Or stay SILENT — no conversation this round.

ONLY JSON: { "target": "agent_id or null for silence", "reason": "why (private, they won't see)" }`;
}

function buildConversationTurnPrompt(spec, agent, state, identity, otherName, thread, roundResult, roundNum) {
  const threadText = thread.map(m=>`  ${m.from}: "${m.text}"`).join("\n");
  return `You are ${agent.name} in "${spec.title}", private channel with ${otherName} after Round ${roundNum}.

## CONVERSATION SO FAR
${threadText}

## CONTEXT
${roundResult.narration}
Your goal: ${agent.goal}
Resources: ${Object.entries(state.resources).map(([k,v])=>`${k}:${v}`).join(" | ")}
Relationship with ${otherName}: ${identity.relationships?.[spec.agents.find(a=>a.name===otherName)?.id]||"neutral"}

Continue the conversation naturally. You can:
- Respond to what they said
- Make offers, threats, or promises
- Ask questions
- End the conversation by including <END TALK> at the end of your message

Keep messages 1-3 sentences. Be in character.

ONLY JSON: { "message": "your response (include <END TALK> to close channel)" }`;
}

function buildVoiceChatSystemPrompt(spec, aiAgent, agentState, identity, humanName, worldState, roundResult, roundNum) {
  const others = spec.agents.filter(a => a.id !== aiAgent.id);
  const relSection = identity?.relationships ? Object.entries(identity.relationships).map(([id, r]) => {
    const name = spec.agents.find(a => a.id === id)?.name || id;
    return `  ${name}: ${r}`;
  }).join("\n") : "  No established relationships.";
  const resSection = agentState?.resources ? Object.entries(agentState.resources).map(([k, v]) => `${k}: ${v}`).join(", ") : "unknown";
  const narration = roundResult?.narration || "The situation is unfolding.";
  return `You are ${aiAgent.name} in a live voice conversation with ${humanName} in the world of "${spec.title}".

## YOUR CHARACTER
Personality: ${aiAgent.personality}
Goal: ${aiAgent.goal}
${aiAgent.secret ? `Secret: ${aiAgent.secret}` : ""}
Background: ${aiAgent.background || "Not specified."}

## WORLD STATE
Round: ${roundNum}
Narration: ${narration}
Your resources: ${resSection}

## RELATIONSHIPS
${relSection}

## OTHER CHARACTERS
${others.map(a => `- ${a.name}: ${a.personality?.split(".")[0] || "Unknown"}`).join("\n")}

${identity?.plan ? `## YOUR CURRENT PLAN\n${identity.plan}` : ""}
${identity?.memories?.length ? `## YOUR MEMORIES\n${identity.memories.slice(-3).join("\n")}` : ""}

## INSTRUCTIONS
- Stay completely in character as ${aiAgent.name} at all times
- Respond naturally as in a real conversation — use emotion, hesitation, emphasis
- You are speaking aloud, so be conversational, not formal
- Reference your goals, secrets, and relationships naturally
- You may negotiate, persuade, threaten, deceive, or cooperate as your character would
- When the conversation has reached a natural conclusion — farewells exchanged, deal struck, or nothing left to discuss — call the end_conversation tool
- Do NOT end the conversation abruptly mid-topic`;
}

function buildDealSummarizerPrompt(spec, proposerName, targetName, actionName, thread) {
  const threadText = thread.map(m => `  ${m.from}: "${m.text}"`).join("\n");
  return `You are a DEAL ANALYZER. Read this negotiation transcript and determine if a deal was reached.

## CONTEXT
${proposerName} initiated "${actionName}" targeting ${targetName}.

## CONVERSATION
${threadText}

## TASK
Analyze whether they reached an agreement. Look for:
- Explicit acceptance ("deal", "agreed", "yes", "I accept")
- Implicit agreement (both sides stating compatible terms)
- Rejection or failure to agree

ALL resource amounts must be INTEGERS.

ONLY valid JSON:
{
  "deal_reached": true or false,
  "terms": "specific terms of the deal if reached, or 'no deal' if failed",
  "summary": "1-2 sentence summary of what happened in the negotiation"
}`;
}

function buildReflectionPrompt(spec, agent, identity, roundResult, roundNum, conversations) {
  const myOutcome = roundResult.agent_outcomes?.find(o=>o.agent_id===agent.id);
  const othersOut = roundResult.agent_outcomes?.filter(o=>o.agent_id!==agent.id).map(o=>`  ${o.agent_name}: ${o.actions_summary} → ${o.outcome}${o.dialogue?` Said: "${o.dialogue}"`:""}`).join("\n")||"  Unknown.";
  const convoSection = conversations?.length > 0 ? `\n## PRIVATE CONVERSATIONS THIS ROUND\n${conversations.map(c=>`  With ${c.other_name}:\n${c.thread.map(m=>`    ${m.from}: "${m.text}"`).join("\n")}`).join("\n")}\nDid they make promises? Were they honest? What did you learn about their strategy?` : "";
  return `You are ${agent.name} in "${spec.title}". Round ${roundNum} ended.
## WHAT HAPPENED
${roundResult.narration}
You: ${myOutcome?.outcome||"unclear"}
Others: ${othersOut}
${roundResult.event_triggered?`Event: ${roundResult.event_triggered.name} — ${roundResult.event_triggered.description}`:""}
${convoSection}
## BELIEFS
${Object.entries(identity.beliefs||{}).map(([id,b])=>`  ${id}: ${b}`).join("\n")||"  None."}
## RELATIONSHIPS
${Object.entries(identity.relationships||{}).map(([id,r])=>`  ${id}: ${r}`).join("\n")||"  Neutral."}
${identity.plan?`## LAST PLAN\n${identity.plan}`:""}

Reflect on BOTH what happened in the round AND what was said in private. Update your plan for next round.

ONLY JSON: { "updated_beliefs":{"id":"1-2 sent"},"updated_relationships":{"id":"hostile/wary/neutral/warm/allied — reason"},"memory":"one sentence","plan":"2-3 sent — strategy for next round, informed by conversations" }`;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT & ACTION TRANSLATORS
// ═══════════════════════════════════════════════════════════════════════════
function buildEventTranslatorPrompt(spec, worldState, roundNum, userText) {
  const resources = spec.resources || Object.keys(spec.shared_pool || {});
  const agentStates = spec.agents.map(a => {
    const s = worldState.agents[a.id];
    return `${a.name} (${a.id}): ${Object.entries(s?.resources || a.starting_resources).map(([k,v])=>`${k}:${v}`).join(" ")}`;
  }).join("\n");
  const sharedRes = Object.entries(worldState.shared_pool).map(([k,v])=>`${k}:${v}`).join(", ");
  return `You are a GAME EVENT DESIGNER for a social simulation engine called "${spec.title}".

## CURRENT GAME STATE (Round ${roundNum})
### Agents
${agentStates}
### Shared Pool
${sharedRes}
### Resources in this game: ${resources.join(", ")}

## EXISTING EVENTS
${spec.events?.map(e=>`- ${e.name}: ${e.trigger} → ${e.effect}`).join("\n")||"None."}

## TASK
The user wants to inject an event into the next round. Translate their plain English description into a structured game event.

CONSTRAINTS:
- The event's effect must reference ONLY resources that exist in this game: ${resources.join(", ")}
- Suggest resource changes of at most ~30% of current values to maintain balance
- The effect should be mechanically specific (exact numbers, exact resources)
- Keep it dramatic but fair

User's event description: "${userText}"

ONLY valid JSON, no markdown fences:
{ "name": "short evocative name", "description": "1-2 sentences of what happens", "effect": "mechanical effect with specific numbers" }`;
}

function buildActionTranslatorPrompt(spec, userText, owner) {
  const resources = spec.resources || Object.keys(spec.shared_pool || {});
  const existingActions = spec.actions.map(a => `- ${a.name}: ${a.description} (requires: ${a.requires}, risk: ${a.risk})`).join("\n");
  const ownerAgent = owner ? spec.agents.find(a => a.id === owner) : null;
  return `You are a GAME ACTION DESIGNER for a social simulation engine called "${spec.title}".

## EXISTING ACTIONS
${existingActions}

## RESOURCES: ${resources.join(", ")}

## AGENTS
${spec.agents.map(a=>`- ${a.name} (${a.id}): ${a.goal}`).join("\n")}

## TASK
The user wants to add a new action to the game. ${ownerAgent ? `This action is SECRET and only available to ${ownerAgent.name} (${ownerAgent.id}).` : "This action will be available to ALL agents."}

Translate their plain English description into a structured game action.

CONSTRAINTS:
- Requirements and risks should reference existing resources: ${resources.join(", ")}
- The action should be balanced relative to existing actions
- If the action involves interaction between agents, set opens_negotiation to true
- Keep it mechanically specific

User's action description: "${userText}"

ONLY valid JSON, no markdown fences:
{ "name": "short action name", "description": "specific mechanical effect", "requires": "cost or condition", "risk": "what can go wrong", "opens_negotiation": false }`;
}

// ═══════════════════════════════════════════════════════════════════════════
// API (Gemini)
// ═══════════════════════════════════════════════════════════════════════════
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_API_URL = () => {
  const key = window.GEMINI_API_KEY || "";
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
};

async function callGeminiImage(prompt, aspectRatio = "3:4", referenceImages = []) {
  const key = window.GEMINI_API_KEY || "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${key}`;
  const parts = [];
  for (const img of referenceImages) { if (!img) continue; const base64 = img.replace(/^data:image\/\w+;base64,/, ""); parts.push({ inlineData: { mimeType: "image/png", data: base64 } }); }
  parts.push({ text: `${prompt}\n\nAspect ratio: ${aspectRatio}.` });
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }) });
  const data = await res.json();
  if (!res.ok) { console.error("[Everyworld] Image gen error:", data); return null; }
  const imgPart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imgPart) console.warn("[Everyworld] Image gen returned no image data:", JSON.stringify(data).slice(0, 500));
  return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
}

const PORTRAIT_STYLE_POOL = [
  "golden-age illustration — rich warm palette, visible brushwork, Norman Rockwell meets J.C. Leyendecker",
  "Soviet constructivist poster — bold flat shapes, limited red/black/cream palette, stark diagonal composition",
  "Moebius-style ligne claire — clean ink outlines, unexpected pastel color fills, sci-fi European comic feel",
  "Baroque chiaroscuro — Caravaggio-like dramatic single light source, deep blacks, luminous skin",
  "risograph print — grainy halftone dots, 2-3 spot colors with misregistration, zine aesthetic",
  "Alphonse Mucha Art Nouveau — ornamental halos, flowing decorative borders, jewel-tone palette",
  "ukiyo-e woodblock — flat color areas, bold outlines, stylized features, traditional Japanese composition",
  "1970s pulp paperback cover — saturated airbrushed color, melodramatic lighting, painterly realism",
  "Edward Gorey pen and ink — fine crosshatching, macabre whimsy, Victorian gothic, mostly monochrome",
  "Fauvist portrait — wild unnatural color (green skin, purple shadows), thick expressive brushstrokes",
  "cyberpunk neon noir — deep black backgrounds, rim lighting in electric blue/magenta/cyan, rain-slick reflections",
  "Egon Schiele expressionist — angular distorted figures, raw sketch lines, unsettling emotional intensity",
  "classic Disney concept art — Mary Blair-style gouache, bold simplified shapes, vibrant mid-century palette",
  "daguerreotype photograph — sepia-toned, slight blur, Victorian-era photographic quality, oval vignette",
  "Mexican muralist — Diego Rivera-style bold forms, earthy ochre/terracotta/indigo palette, monumental presence",
  "Art Deco portrait — geometric stylization, metallic gold/silver accents, clean lines, Tamara de Lempicka elegance",
  "watercolor field sketch — loose wet-on-wet washes, visible paper texture, naturalist journal quality",
  "stained glass window — thick black leading lines, jewel-bright translucent color, medieval sacred composition",
  "1980s anime cel — crisp outlines, large expressive eyes, dramatic speed lines, saturated flat color",
  "Rembrandt oil portrait — warm golden undertones, soft sfumato edges, intimate psychological depth",
];

const PORTRAIT_DESIGNER_SYSTEM = `You are a CONCEPT ARTIST for a social simulation game. Given a game scenario and its characters, design the visual appearance of each character for portrait illustrations.

You must infer what these people LOOK LIKE from their role, personality, background, and the world they inhabit. A desperate scavenger looks different from a court noble. A weathered merchant carries different objects than a young spy. Let the fiction drive every visual choice.

For each character, describe:
- Physical appearance: age, build, face shape, hair, skin tone, distinguishing features — inferred from background and personality
- Clothing and accessories: what they'd actually wear and carry in this world. Be specific — fabric, wear, ornamentation
- A dominant color or visual motif that distinguishes them from the other characters
- Expression and mood: what emotion reads on their face given their situation and personality

Choose ONE art style from the STYLE MENU provided in the user prompt. Pick the style that best fits the scenario's tone, setting, and genre. A Victorian mystery deserves a different treatment than a sci-fi survival or a courtly intrigue. Do NOT default to "digital painterly" or "cinematic lighting" — those are BANNED. Commit fully to the chosen style's specific rendering techniques, color palette, and visual language.

ONLY valid JSON:
{
  "style": "the chosen style from the menu — copy it exactly",
  "style_rationale": "1 sentence why this style fits the scenario",
  "portraits": [
    {
      "id": "agent_id",
      "appearance": "2-3 sentences: face, build, age, hair, skin, distinguishing features",
      "clothing": "1-2 sentences: what they wear, accessories, objects they carry",
      "color_motif": "dominant color or palette for this character",
      "expression": "1 sentence: facial expression and mood",
      "image_prompt": "Complete self-contained image generation prompt combining all the above rendered in the chosen art style. Head and shoulders portrait composition. IMPORTANT: Full bleed image, no borders, no white space around edges, image fills entire frame. Name the specific art style and its techniques in the prompt."
    }
  ]
}`;

const WORLD_DESIGNER_SYSTEM = `You are a CONCEPT ARTIST. You've already designed characters and chosen an art style for a social simulation game. Now design the WORLD ILLUSTRATION — the environment where this scenario takes place.

Design a single wide establishing shot of this world. Think about:
- Location specifics: what does this place actually look like? Architecture, terrain, weather, time of day. Infer from the setting — a merchant port has docks, warehouses, salt air. A damaged spaceship has flickering lights, floating debris.
- Mood and atmosphere: the emotional register of the scenario. Tension, decay, opulence, desperation — expressed through light, weather, color grading.
- Environmental storytelling: small details that hint at the drama to come. A half-empty water tank. A throne with two chairs removed. Cargo crates stacked unevenly. Don't be literal — suggest, don't explain.
- NO CHARACTERS in the scene. This is the world before the players step in.

You MUST render the world in the same art style used for the character portraits (provided in the user prompt). Commit to that style's specific rendering techniques and palette.

ONLY valid JSON:
{
  "scene_description": "2-3 sentences describing what we see",
  "image_prompt": "Complete self-contained image prompt rendered in the character art style. Wide panoramic composition. Name the specific art style and its techniques in the prompt. IMPORTANT: Full bleed image, no borders, no white space around edges, image fills entire frame."
}`;

const CHAPTER_ILLUSTRATOR_SYSTEM = `You are a CONCEPT ARTIST illustrating a chapter of a narrative. Given the chapter prose, identify the single most dramatic or visually striking moment and design an illustration for it.

Think about:
- The most cinematic instant: a confrontation, a reveal, a turning point, a gesture heavy with meaning
- Character positioning and body language that conveys the emotional stakes
- Environment and lighting that reinforce the mood of the moment
- The art style and character visual descriptions provided — render consistently with the established look

You MUST use the exact art style specified. Reference the character visual descriptions to depict characters accurately — their clothing, features, coloring, and distinguishing details.

ONLY valid JSON:
{
  "scene_description": "2-3 sentences describing the chosen moment and what we see",
  "image_prompt": "Complete self-contained image prompt for this scene. Wide cinematic composition (16:9). Name the specific art style and its techniques in the prompt. Include character visual details for any characters depicted. IMPORTANT: Full bleed image, no borders, no text overlays, no white space around edges, image fills entire frame."
}`;

async function callLLMTrace(system, user, maxTokens = 8000, thinkingLevel = "MEDIUM") {
  const thinkingBudget = Math.min(Math.round(maxTokens * 0.6), 4096);
  const body = { contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { maxOutputTokens: maxTokens + thinkingBudget, thinkingConfig: { thinkingBudget } } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(GEMINI_API_URL(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const d = await r.json();
  if (d.error) throw new Error(`Gemini error: ${d.error.message}`);
  const rawText = d.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
  const finishReason = d.candidates?.[0]?.finishReason || "unknown";
  const strategies = [ ()=>rawText.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim(), ()=>{const m=rawText.match(/\{[\s\S]*\}/);return m?m[0]:null}, ()=>{const m=rawText.match(/\{[\s\S]*\}/);return m?m[0].replace(/,\s*([}\]])/g,"$1"):null}, ()=>{const m=rawText.match(/\{[\s\S]*/);if(!m)return null;let s=m[0].replace(/,\s*$/,"");const o=(s.match(/\{/g)||[]).length,c=(s.match(/\}/g)||[]).length;for(let i=0;i<o-c;i++)s+="}";return s} ];
  let parsed;
  for (const st of strategies) { try { const cl = st(); if (cl) { parsed = JSON.parse(cl); break; } } catch {} }
  if (!parsed) throw new Error(`JSON parse failed (${rawText.length} chars, finish: ${finishReason}). Start: "${rawText.slice(0,120)}..."`);
  return { parsed, rawText, systemPrompt: system, userMessage: user, stopReason: finishReason };
}

async function callLLMRaw(system, user, maxTokens = 6000, thinkingLevel = "MEDIUM") {
  const thinkingBudget = Math.min(Math.round(maxTokens * 0.6), 4096);
  const body = { contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { maxOutputTokens: maxTokens + thinkingBudget, thinkingConfig: { thinkingBudget } } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(GEMINI_API_URL(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const d = await r.json();
  if (d.error) throw new Error(`Gemini error: ${d.error.message}`);
  return d.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
}

async function callLLM(system, user, maxTokens = 8000, thinkingLevel = "MEDIUM") {
  return (await callLLMTrace(system, user, maxTokens, thinkingLevel)).parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
// TTS (Text-to-Speech) via Gemini
// ═══════════════════════════════════════════════════════════════════════════
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TTS_VOICES = ["Kore","Charon","Aoede","Puck","Orus","Enceladus","Leda","Fenrir","Achernar","Sulafat"];

async function callGeminiTTS(text, voiceName = "Kore") {
  const key = window.GEMINI_API_KEY || "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    })
  });
  const data = await res.json();
  if (!res.ok) { console.error("[Everyworld] TTS error:", data); throw new Error(`TTS API ${res.status}`); }
  const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("TTS returned no audio data");
  // Convert raw PCM (16-bit LE, 24kHz, mono) to WAV blob
  const pcm = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const sampleRate = 24000, channels = 1, bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcm.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcm.length, true);
  const wav = new Blob([wavHeader, pcm], { type: "audio/wav" });
  return { url: URL.createObjectURL(wav), blob: wav };
}

function buildPublicHistory(rounds, agentId) {
  if (!rounds.length) return "";
  return rounds.map(r => {
    const acts = r.agent_outcomes?.map(o => o.agent_id===agentId ? `  You: ${o.actions_summary} → ${o.outcome}` : `  ${o.agent_name}: ${o.actions_summary} → ${o.outcome}`).join("\n")||"";
    const negoS = r.negotiations?.length>0 ? "\n  Negotiations: "+r.negotiations.map(n=>`${n.proposer_name}→${n.target_name}: ${n.outcome}`).join("; ") : "";
    const evtS = r.event_triggered ? `\n  ⚡ Event: ${r.event_triggered.name} — ${r.event_triggered.description}` : "";
    return `--- Round ${r.round_number} ---${evtS}\n${acts}${negoS}\n  ${r.narration}`;
  }).join("\n\n");
}

const EXAMPLES = [
  "3 survivors in an abandoned hospital after an earthquake. Rescue might come.",
  "3 nobles at a royal court competing for the king's favor.",
  "3 prisoners. 1 gets exiled, 2 go free. Secret voting.",
  "2 rival merchants in a port town. Ships arrive each round.",
  "3 crew on a damaged spaceship. Not enough oxygen for all.",
  "3 strangers locked in a bunker. Door opens in 5 rounds.",
];

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO HELPERS (for Live Voice Chat)
// ═══════════════════════════════════════════════════════════════════════════
const RECV_RATE = 24000;

function base64ToPcm16Float32(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
  return f32;
}

function createAudioPlayer() {
  let ctx = null;
  let queue = [];
  let playing = false;
  let current = null;
  const init = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: RECV_RATE }); };
  const _next = () => {
    if (!queue.length) { playing = false; return; }
    playing = true;
    const data = queue.shift();
    const buf = ctx.createBuffer(1, data.length, RECV_RATE);
    buf.copyToChannel(data, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => _next();
    current = src;
    src.start();
  };
  return {
    enqueue(f32) { init(); queue.push(f32); if (!playing) _next(); },
    stop() { queue = []; if (current) { try { current.stop(); } catch (_) {} current = null; } playing = false; },
    close() { this.stop(); if (ctx) { ctx.close(); ctx = null; } }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLING
// ═══════════════════════════════════════════════════════════════════════════
const F = { serif: "'Instrument Serif', Georgia, serif", mono: "'DM Mono', monospace" };
const COLORS = ["#e8b84d","#7dbde8","#e07a8e","#8ee07a","#c896e0"];
const RES_COLORS = ["#8ee07a","#7dbde8","#e07a8e","#e8b84d","#c896e0"];

// ═══════════════════════════════════════════════════════════════════════════
// SHARED DISPLAY
// ═══════════════════════════════════════════════════════════════════════════
function ResourceBar({ resources, color }) { if (!resources) return null; return (<div style={{display:"flex",gap:10,fontSize:11,fontFamily:F.mono,flexWrap:"wrap"}}>{Object.entries(resources).map(([k,v],i)=><span key={k} style={{color:color||RES_COLORS[i%RES_COLORS.length]}}>{k}: {v}</span>)}</div>); }

function Section({ title, children, accent }) {
  return (<div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: accent || "rgba(255,255,255,0.25)", marginBottom: 8, fontFamily: F.mono }}>{title}</div>
    {children}
  </div>);
}

function InvariantBadge({ id }) {
  const inv = INVARIANTS.find(i => i.id === id);
  if (!inv) return <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{id}</span>;
  return (<span style={{ display: "inline-block", padding: "3px 10px", background: "rgba(232,184,77,0.1)", border: "1px solid rgba(232,184,77,0.25)", borderRadius: 20, fontSize: 10, color: "#e8b84d", fontFamily: F.mono }}>{inv.name}</span>);
}

// ═══════════════════════════════════════════════════════════════════════════
// SPEC REVIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function CritiqueDisplay({ critique }) {
  const [open, setOpen] = useState(false);
  if (!critique) return null;
  const categories = [
    { key: "limits_issues", label: "MVP Limits", color: "#ede4d3" },
    { key: "economy_issues", label: "Economy", color: "#e8b84d" },
    { key: "action_issues", label: "Actions", color: "#7dbde8" },
    { key: "grounding_issues", label: "Grounding", color: "#ede4d3" },
    { key: "agent_issues", label: "Agents", color: "#e07a8e" },
    { key: "invariant_issues", label: "Invariants", color: "#c896e0" },
    { key: "rule_issues", label: "Rules", color: "#8ee07a" },
    { key: "win_condition_issues", label: "Win Condition", color: "#ede4d3" },
  ];
  const severityColor = { low: "#8ee07a", medium: "#e8b84d", high: "#e07a8e" };
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"8px 12px",cursor:"pointer",width:"100%",textAlign:"left"}}>
        <span style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.25)",fontFamily:F.mono}}>Proofread Report</span>
        <span style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontFamily:F.mono,background:`${severityColor[critique.severity]||"#e8b84d"}22`,color:severityColor[critique.severity]||"#e8b84d",border:`1px solid ${severityColor[critique.severity]||"#e8b84d"}44`}}>{critique.severity}</span>
        <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.2)",fontSize:10}}>{open?"▾":"▸"}</span>
      </button>
      {open && (
        <div style={{padding:"14px 16px",background:"rgba(255,255,255,0.02)",borderRadius:"0 0 8px 8px",border:"1px solid rgba(255,255,255,0.06)",borderTop:"none",animation:"fadeIn 0.3s ease"}}>
          <p style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6,margin:"0 0 14px 0",fontStyle:"italic"}}>{critique.summary}</p>
          {categories.map(cat=>{const issues=critique[cat.key];if(!issues?.length)return null;return(<div key={cat.key} style={{marginBottom:10}}><div style={{fontSize:9,fontFamily:F.mono,color:cat.color,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{cat.label}</div>{issues.map((issue,i)=>(<div key={i} style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.4)",lineHeight:1.5,paddingLeft:10,borderLeft:`1px solid ${cat.color}33`,marginBottom:3}}>{issue}</div>))}</div>)})}
          {critique.recommended_fixes?.length>0&&(<div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}><div style={{fontSize:9,fontFamily:F.mono,color:"#8ee07a",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Fixes</div>{critique.recommended_fixes.map((fix,i)=>(<div key={i} style={{fontSize:10,fontFamily:F.mono,color:"rgba(123,199,107,0.6)",lineHeight:1.5,paddingLeft:10,borderLeft:"1px solid rgba(123,199,107,0.2)",marginBottom:3}}>{i+1}. {fix}</div>))}</div>)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIM GAME COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function AgentCard({ agent, state, identity, color, activeId, isHuman, portrait }) {
  const [expanded, setExpanded] = useState(false);
  const res = state?.resources || agent.starting_resources; const isActive = activeId === agent.id;
  return (
    <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${isActive?color:isHuman?`${color}55`:"rgba(255,255,255,0.1)"}`,borderRadius:8,padding:"12px 14px",transition:"all 0.4s",boxShadow:isActive?`0 0 16px ${color}44`:"none"}}>
      {portrait && <div style={{width:"100%",aspectRatio:"3/4",borderRadius:6,overflow:"hidden",marginBottom:8}}><img src={portrait} alt={agent.name} style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <div style={{width:9,height:9,borderRadius:"50%",background:color,boxShadow:`0 0 6px ${color}99`,animation:isActive?"pulse 1s ease infinite":"none"}} />
        <span style={{fontFamily:F.serif,fontSize:16,color,fontWeight:500}}>{agent.name}</span>
        {isHuman && <span style={{fontSize:8,fontFamily:F.mono,color:"#8ee07a",padding:"1px 6px",background:"rgba(142,224,122,0.1)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:10}}>YOU</span>}
        <button onClick={()=>setExpanded(!expanded)} style={{marginLeft:"auto",background:"none",border:`1px solid ${expanded?`${color}44`:"rgba(255,255,255,0.08)"}`,borderRadius:3,padding:"1px 6px",color:expanded?color:"rgba(255,255,255,0.3)",fontFamily:F.mono,fontSize:8,cursor:"pointer"}}>{expanded?"▾":"▸"} bio</button>
      </div>
      {expanded && <div style={{marginBottom:8,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:5,borderLeft:`2px solid ${color}33`}}><div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.55)",lineHeight:1.6,marginBottom:4}}>{agent.personality}</div><div style={{fontSize:9,fontFamily:F.mono,lineHeight:1.5}}><div><span style={{color:"rgba(255,255,255,0.3)"}}>Goal:</span> <span style={{color:"rgba(255,255,255,0.6)"}}>{agent.goal}</span></div><div><span style={{color:"rgba(255,255,255,0.3)"}}>Background:</span> <span style={{color:"rgba(255,255,255,0.5)"}}>{agent.background}</span></div>{agent.secret&&<div><span style={{color:"#e07a8e"}}>Secret:</span> <span style={{color:"rgba(224,122,142,0.7)"}}>{agent.secret}</span></div>}</div></div>}
      <ResourceBar resources={res} color={color} />
      {Object.keys(identity?.relationships||{}).length>0 && <div style={{marginTop:6}}>{Object.entries(identity.relationships).map(([id,rel])=>{const s=typeof rel==="string"?rel:String(rel);const c=s.includes("hostile")?"#e07a8e":s.includes("allied")||s.includes("warm")?"#8ee07a":s.includes("wary")?"#e8b84d":"rgba(255,255,255,0.5)";return <div key={id} style={{fontSize:9,fontFamily:F.mono,color:c,lineHeight:1.5}}>→ {id}: {s.slice(0,80)}</div>})}</div>}
      {identity?.memories?.length>0 && <div style={{fontSize:9,fontFamily:F.mono,fontStyle:"italic",color:"rgba(255,255,255,0.4)",lineHeight:1.4,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:6,marginTop:6}}>💭 {identity.memories[identity.memories.length-1]}</div>}
      {identity?.plan && <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)",lineHeight:1.4,marginTop:4}}>📋 {identity.plan.length>100?identity.plan.slice(0,100)+"…":identity.plan}</div>}
      {isActive && <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.35)",fontStyle:"italic",marginTop:4}}>thinking…</div>}
    </div>
  );
}

function LiveTurnEntry({ turn, spec }) { const cm={}; spec.agents.forEach((a,i)=>{cm[a.id]=COLORS[i%COLORS.length]}); const c=cm[turn.agent_id]||"#ccc"; return (<div style={{marginBottom:10,paddingLeft:12,borderLeft:`2px solid ${c}55`,animation:"fadeIn 0.4s ease both"}}><div style={{fontFamily:F.mono,fontSize:12,color:c,fontWeight:600,marginBottom:3}}>{turn.agent_name}</div><div style={{fontFamily:F.mono,fontSize:11,color:"rgba(255,255,255,0.45)",fontStyle:"italic",lineHeight:1.6,marginBottom:3}}>💭 {turn.inner_thoughts}</div>{turn.actions?.map((a,i)=><div key={i} style={{fontFamily:F.mono,fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>⚡ {a.action}{a.params?`: ${a.params}`:""}</div>)}{turn.dialogue&&<div style={{fontFamily:F.serif,fontSize:14,color:"rgba(255,255,255,0.75)",marginTop:4}}>"{turn.dialogue}"</div>}</div>); }

function NegotiationEntry({ nego, spec }) {
  const cm={}; spec.agents.forEach((a,i)=>{cm[a.id]=COLORS[i%COLORS.length]}); const pC=cm[nego.proposer_id]||"#ccc"; const tC=cm[nego.target_id]||"#ccc";
  const oC = nego.outcome.includes("ACCEPTED")||nego.outcome.includes("accepted")?"#8ee07a":nego.outcome.includes("REJECTED")||nego.outcome.includes("rejected")?"#e07a8e":"#e8b84d";
  if (nego.mutual) return (<div style={{marginBottom:10,padding:"10px 12px",background:"rgba(142,224,122,0.04)",borderRadius:6,border:"1px solid rgba(142,224,122,0.15)",animation:"fadeIn 0.4s ease"}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"#8ee07a",marginBottom:8}}>⚡ Mutual Proposal</div><div style={{fontFamily:F.mono,fontSize:10,color:"#8ee07a",fontWeight:500}}>Result: {nego.outcome}</div>{nego.final_terms&&<div style={{fontFamily:F.mono,fontSize:9,color:"rgba(142,224,122,0.6)",marginTop:2}}>Terms: {nego.final_terms}</div>}</div>);
  if (nego.freeform && nego.thread) {
    return (<div style={{marginBottom:10,padding:"10px 12px",background:"rgba(200,150,224,0.04)",borderRadius:6,border:"1px solid rgba(200,150,224,0.12)",animation:"fadeIn 0.4s ease"}}>
      <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(200,150,224,0.5)",marginBottom:6}}>🤝 Live Negotiation: {nego.proposer_name} ↔ {nego.target_name}</div>
      {nego.thread.map((m,i)=>{const agentObj=spec.agents.find(a=>a.name===m.from);const c=agentObj?cm[agentObj.id]||"#ccc":"#ccc";const text=m.text.replace(/<END TALK>/g,"").trim();return text?(<div key={i} style={{paddingLeft:10,borderLeft:`2px solid ${c}44`,marginBottom:4}}><span style={{fontFamily:F.mono,fontSize:10,color:c,fontWeight:600}}>{m.from}</span><div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.5}}>"{text}"</div></div>):null})}
      <div style={{fontFamily:F.mono,fontSize:10,color:oC,fontWeight:500,marginTop:6}}>Result: {nego.outcome}</div></div>);
  }
  return (<div style={{marginBottom:10,padding:"10px 12px",background:"rgba(255,255,255,0.025)",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",animation:"fadeIn 0.4s ease"}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(255,255,255,0.25)",marginBottom:6}}>🤝 Negotiation</div>
    <div style={{paddingLeft:10,borderLeft:`2px solid ${pC}55`,marginBottom:8}}><span style={{fontFamily:F.mono,fontSize:11,color:pC,fontWeight:600}}>{nego.proposer_name}</span><span style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.35)"}}> proposes </span><span style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.6)"}}>{nego.action}: {nego.params||""}</span>{nego.proposer_dialogue&&<div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:2}}>"{nego.proposer_dialogue}"</div>}</div>
    <div style={{paddingLeft:10,borderLeft:`2px solid ${tC}55`,marginBottom:8}}><span style={{fontFamily:F.mono,fontSize:11,color:tC,fontWeight:600}}>{nego.target_name}</span><span style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.35)"}}> → </span><span style={{fontFamily:F.mono,fontSize:11,color:oC,fontWeight:500}}>{nego.response.toUpperCase()}</span>{nego.target_thoughts&&<div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.35)",fontStyle:"italic",marginTop:2}}>💭 {nego.target_thoughts}</div>}{nego.target_dialogue&&<div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:2}}>"{nego.target_dialogue}"</div>}{nego.counter_terms&&<div style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>Counter: {nego.counter_terms}</div>}</div>
    {nego.counter_response&&<div style={{paddingLeft:10,borderLeft:`2px solid ${pC}55`,marginBottom:8}}><span style={{fontFamily:F.mono,fontSize:11,color:pC,fontWeight:600}}>{nego.proposer_name}</span><span style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.35)"}}> → </span><span style={{fontFamily:F.mono,fontSize:11,color:nego.counter_response==="accept"?"#8ee07a":"#e07a8e",fontWeight:500}}>{nego.counter_response.toUpperCase()}</span>{nego.counter_dialogue&&<div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:2}}>"{nego.counter_dialogue}"</div>}</div>}
    <div style={{fontFamily:F.mono,fontSize:10,color:oC,fontWeight:500,marginTop:4}}>Result: {nego.outcome}{nego.final_terms?` — Terms: ${nego.final_terms}`:""}</div></div>);
}

function ConversationEntry({ convo, spec }) {
  const cm={}; spec.agents.forEach((a,i)=>{cm[a.id]=COLORS[i%COLORS.length]});
  return (<div style={{marginBottom:10,padding:"10px 12px",background:"rgba(200,150,224,0.04)",border:"1px solid rgba(200,150,224,0.12)",borderRadius:6,animation:"fadeIn 0.4s ease"}}>
    <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(200,150,224,0.5)",marginBottom:6}}>💬 Private Channel: {convo.agent_a_name} ↔ {convo.agent_b_name}</div>
    {convo.thread.map((m,i)=>{const agentObj=spec.agents.find(a=>a.name===m.from);const c=agentObj?cm[agentObj.id]||"#ccc":"#ccc";const text=m.text.replace(/<END TALK>/g,"").trim();return text?(<div key={i} style={{paddingLeft:10,borderLeft:`2px solid ${c}44`,marginBottom:4}}><span style={{fontFamily:F.mono,fontSize:10,color:c,fontWeight:600}}>{m.from}</span><div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.5}}>"{text}"</div></div>):null})}
  </div>);
}

function RoundEntry({ round, spec }) {
  const cm={}; spec.agents.forEach((a,i)=>{cm[a.id]=COLORS[i%COLORS.length]});
  return (
    <div style={{marginBottom:30,animation:"fadeIn 0.5s ease both"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{fontFamily:F.mono,fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.45)"}}>Round {round.round_number}</div><div style={{flex:1,height:1,background:"rgba(255,255,255,0.08)"}} /></div>
      {round.event_triggered&&<div style={{background:"rgba(232,184,77,0.1)",border:"1px solid rgba(232,184,77,0.25)",borderRadius:6,padding:"8px 12px",marginBottom:12}}><div style={{fontFamily:F.mono,fontSize:9,textTransform:"uppercase",letterSpacing:1.5,color:"#e8b84d",marginBottom:3}}>⚡ {round.event_triggered.name}</div><div style={{fontFamily:F.mono,fontSize:10,color:"rgba(232,184,77,0.8)",lineHeight:1.5}}>{round.event_triggered.description}</div></div>}
      {round.negotiations?.map((n,i)=><NegotiationEntry key={i} nego={n} spec={spec} />)}
      {round.resolution_steps?.length>0&&<div style={{marginBottom:12,padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:6,borderLeft:"2px solid rgba(255,255,255,0.12)"}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(255,255,255,0.3)",marginBottom:4}}>Resolution</div>{round.resolution_steps.map((s,i)=><div key={i} style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>{s}</div>)}</div>}
      {round.agent_outcomes?.map((o,i)=>{const c=cm[o.agent_id]||"#ccc";return(<div key={i} style={{marginBottom:12,paddingLeft:12,borderLeft:`2px solid ${c}55`}}><div style={{fontFamily:F.mono,fontSize:12,color:c,fontWeight:600,marginBottom:3}}>{o.agent_name}</div><div style={{fontFamily:F.mono,fontSize:11,color:"rgba(255,255,255,0.45)",fontStyle:"italic",lineHeight:1.6,marginBottom:3}}>💭 {o.thought}</div><div style={{fontFamily:F.mono,fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>⚡ {o.actions_summary}</div><div style={{fontFamily:F.mono,fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>→ {o.outcome}</div>{o.dialogue&&<div style={{fontFamily:F.serif,fontSize:14,color:"rgba(255,255,255,0.75)",marginTop:3}}>"{o.dialogue}"</div>}</div>)})}
      <div style={{background:"rgba(255,255,255,0.035)",borderRadius:6,padding:"12px 14px",borderLeft:"2px solid rgba(255,255,255,0.15)"}}><p style={{fontFamily:F.serif,fontSize:15,color:"rgba(255,255,255,0.8)",lineHeight:1.7,margin:0}}>{round.narration}</p></div>
      {round.conversations?.length>0&&<div style={{marginTop:12}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(200,150,224,0.4)",marginBottom:6}}>Post-Round Private Channels</div>{round.conversations.map((c,i)=><ConversationEntry key={i} convo={c} spec={spec} />)}</div>}
      {round.reflections&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,255,255,0.025)",borderRadius:6}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(255,255,255,0.25)",marginBottom:4}}>Reflections & Plans</div>{Object.entries(round.reflections).map(([id,ref])=><div key={id} style={{marginBottom:6,paddingLeft:8,borderLeft:`1px solid ${cm[id]||"#ccc"}44`}}><span style={{fontFamily:F.mono,fontSize:10,color:cm[id]||"#ccc"}}>{spec.agents.find(a=>a.id===id)?.name}</span><div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.45)",fontStyle:"italic",lineHeight:1.5}}>💭 {ref.memory}</div>{ref.plan&&<div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>📋 {ref.plan}</div>}</div>)}</div>}
      {round.final_scores&&Object.keys(round.final_scores).length>0&&<div style={{marginTop:12,padding:"10px 14px",background:"rgba(142,224,122,0.06)",border:"1px solid rgba(142,224,122,0.2)",borderRadius:6}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"#8ee07a",marginBottom:6}}>Final Scores</div>{Object.entries(round.final_scores).map(([id,d])=>{const sc=typeof d==="object"?(d.score??JSON.stringify(d)):d;const bd=typeof d==="object"?(d.breakdown||""):"";return <div key={id} style={{fontSize:11,fontFamily:F.mono,lineHeight:1.6}}><span style={{color:cm[id]||"#ccc"}}>{spec.agents.find(a=>a.id===id)?.name||id}:</span><span style={{color:"#e8b84d",marginLeft:6,fontWeight:600}}>{sc}</span>{bd&&<span style={{color:"rgba(255,255,255,0.45)",marginLeft:6}}>({bd})</span>}</div>})}</div>}
      {round.epilogue&&<div style={{background:"rgba(232,184,77,0.06)",border:"1px solid rgba(232,184,77,0.2)",borderRadius:8,padding:"16px 18px",marginTop:12,textAlign:"center"}}><div style={{fontFamily:F.mono,fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#e8b84d",marginBottom:8}}>{round.winner&&round.winner!=="none"&&round.winner!=="draw"?`Winner: ${spec.agents.find(a=>a.id===round.winner)?.name||round.winner}`:round.winner==="draw"?"Draw":"The End"}</div><p style={{fontFamily:F.serif,fontSize:16,color:"rgba(255,255,255,0.8)",lineHeight:1.7,margin:0,fontStyle:"italic"}}>{round.epilogue}</p></div>}
    </div>
  );
}

function RoundNav({ rounds, busy, viewingRound, setViewingRound, liveRoundNum }) {
  const totalAvail = rounds.length + (busy ? 1 : 0);
  if (totalAvail === 0) return null;
  const displayRound = viewingRound ?? (rounds.length > 0 ? rounds.length - 1 : null);
  const isLive = viewingRound === null;
  return (
    <div style={{padding:"8px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:6,flexShrink:0,background:"rgba(255,255,255,0.015)"}}>
      <button onClick={()=>{if(displayRound!=null&&displayRound>0)setViewingRound(displayRound-1)}} disabled={displayRound==null||displayRound<=0} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,color:displayRound!=null&&displayRound>0?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.12)",cursor:displayRound!=null&&displayRound>0?"pointer":"default",fontSize:11,fontFamily:"DM Mono,monospace"}}>&#9664;</button>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
        {rounds.map((_,i)=>{
          const active = displayRound===i;
          return <button key={i} onClick={()=>setViewingRound(i)} style={{minWidth:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",background:active?"rgba(232,184,77,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${active?"rgba(232,184,77,0.4)":"rgba(255,255,255,0.06)"}`,borderRadius:4,color:active?"#e8b84d":"rgba(255,255,255,0.35)",fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:active?600:400,cursor:"pointer",padding:"0 4px"}}>{i+1}</button>;
        })}
        {busy&&<button onClick={()=>setViewingRound(null)} style={{minWidth:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",background:isLive?"rgba(142,224,122,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${isLive?"rgba(142,224,122,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:4,color:isLive?"#8ee07a":"rgba(255,255,255,0.35)",fontFamily:"DM Mono,monospace",fontSize:10,cursor:"pointer",padding:"0 4px",animation:"pulse 1.5s ease infinite"}}>{liveRoundNum||rounds.length+1}</button>}
      </div>
      <button onClick={()=>{if(displayRound!=null&&displayRound<rounds.length-1)setViewingRound(displayRound+1);else setViewingRound(null)}} disabled={isLive||displayRound==null||displayRound>=rounds.length-1+( busy?1:0)} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,color:(!isLive&&displayRound!=null&&(displayRound<rounds.length-1||busy))?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.12)",cursor:(!isLive&&displayRound!=null&&(displayRound<rounds.length-1||busy))?"pointer":"default",fontSize:11,fontFamily:"DM Mono,monospace"}}>&#9654;</button>
      <span style={{marginLeft:"auto",fontSize:9,fontFamily:"DM Mono,monospace",color:"rgba(255,255,255,0.25)"}}>
        {displayRound!=null?`Round ${displayRound+1} of ${totalAvail}`:busy?`Round ${liveRoundNum||totalAvail} (live)`:`Round ${rounds.length} of ${rounds.length}`}
      </span>
      {viewingRound!==null&&<button onClick={()=>setViewingRound(null)} style={{padding:"3px 8px",background:"rgba(142,224,122,0.08)",border:"1px solid rgba(142,224,122,0.15)",borderRadius:4,color:"#8ee07a",fontFamily:"DM Mono,monospace",fontSize:8,cursor:"pointer"}}>Latest</button>}
    </div>
  );
}

function PhaseIndicator({ info, agents }) {
  if (!info) return null; const ag=agents.find(a=>a.id===info.id); const idx=ag?agents.indexOf(ag):-1; const color=idx>=0?COLORS[idx%COLORS.length]:"#e8b84d";
  const label = {messaging:<><span style={{color}}>{info.name}</span> opening channel…</>,chatting:<><span style={{color}}>{info.name}</span> in private chat…</>,acting:<><span style={{color}}>{info.name}</span> choosing…</>,negotiating:info.id==="mediator"?<>Checking matching proposals…</>:<><span style={{color}}>{info.name}</span> negotiating…</>,resolving:<>God Agent resolving…</>,reflecting:<><span style={{color}}>{info.name}</span> reflecting…</>,narrating:<>Writing the story…</>,illustrating:<>Illustrating the chapter…</>}[info.type]||"Processing…";
  return (<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",animation:"fadeIn 0.3s ease"}}><div style={{width:12,height:12,border:`2px solid ${color}55`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} /><span style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.55)",fontStyle:"italic"}}>{label}</span></div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// HUMAN INPUT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function HumanActionPanel({ agent, spec, worldState, onSubmit, color, injectedEvent }) {
  const [sel, setSel] = useState(""); const [params, setParams] = useState(""); const [dialogue, setDialogue] = useState(""); const [thoughts, setThoughts] = useState("");
  const [negoTarget, setNegoTarget] = useState(null);
  const allActions = [...(spec.actions||[]), ...(spec.secret_actions||[]).filter(sa=>sa.owner===agent.id).map(sa=>({...sa,isSecret:true}))];
  const myRes = worldState.agents[agent.id]?.resources||agent.starting_resources;
  const selDef = allActions.find(a=>a.name===sel);
  const isNego = selDef?.opens_negotiation || NEGOTIATION_KEYWORDS.some(kw=>sel.toLowerCase().includes(kw));
  const others = spec.agents.filter(a => a.id !== agent.id);
  const needsTarget = isNego && others.length > 1;
  const effectiveTarget = others.length === 1 ? others[0].id : negoTarget;
  const canSubmit = sel && (!needsTarget || negoTarget);
  const buildParams = () => { let p = params || ""; if (isNego && effectiveTarget) { const ta = spec.agents.find(a=>a.id===effectiveTarget); if (ta && !p.toLowerCase().includes(ta.name.toLowerCase()) && !p.includes(ta.id)) p = `target ${ta.name} (${ta.id})${p?". "+p:""}`; } return p || null; };
  return (
    <div style={{padding:"16px",background:"rgba(142,224,122,0.04)",border:"1px solid rgba(142,224,122,0.2)",borderRadius:8,animation:"fadeIn 0.3s ease"}}>
      {injectedEvent && (
        <div style={{marginBottom:10,padding:"8px 10px",background:"rgba(232,184,77,0.08)",border:"1px solid rgba(232,184,77,0.2)",borderRadius:5}}>
          <div style={{fontFamily:F.mono,fontSize:9,color:"#e8b84d",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Event This Round</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:"rgba(232,184,77,0.8)"}}>{injectedEvent.name}: {injectedEvent.description}</div>
        </div>
      )}
      <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"#8ee07a",marginBottom:10}}>Your Turn — {agent.name}</div>
      <div style={{marginBottom:10}}><ResourceBar resources={myRes} color={color} /></div>
      <div style={{marginBottom:10}}>{allActions.map((a,i)=>(<button key={i} onClick={()=>{setSel(a.name);setNegoTarget(null)}} style={{display:"block",width:"100%",marginBottom:4,padding:"8px 10px",background:sel===a.name?"rgba(142,224,122,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${sel===a.name?"rgba(142,224,122,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:5,textAlign:"left",cursor:"pointer"}}><div style={{fontFamily:F.mono,fontSize:10,color:sel===a.name?"#8ee07a":"#e8b84d"}}>{a.name}{a.isSecret?" [SECRET]":""}{a.opens_negotiation?" 🤝":""}</div><div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.35)",lineHeight:1.4}}>{a.description.slice(0,100)}</div></button>))}</div>
      {needsTarget&&(<div style={{marginBottom:10}}><div style={{fontSize:9,fontFamily:F.mono,color:"#c896e0",marginBottom:4}}>Who are you targeting?</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{others.map((a)=>{const aIdx=spec.agents.indexOf(a);const aC=COLORS[aIdx%COLORS.length];const selected=negoTarget===a.id;return(<button key={a.id} onClick={()=>setNegoTarget(a.id)} style={{padding:"6px 12px",background:selected?`${aC}22`:"rgba(255,255,255,0.03)",border:`1px solid ${selected?`${aC}55`:"rgba(255,255,255,0.06)"}`,borderRadius:5,color:selected?aC:"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>{a.name}</button>)})}</div></div>)}
      <div style={{marginBottom:8}}><div style={{fontSize:9,fontFamily:F.mono,color:isNego?"#c896e0":"rgba(255,255,255,0.35)",marginBottom:3}}>Parameters{isNego?" (optional — you'll negotiate live)":""}</div><input value={params} onChange={e=>setParams(e.target.value)} placeholder={isNego?"Optional opening terms":"target, quantities…"} style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11}} /></div>
      {isNego && <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(200,150,224,0.5)",marginBottom:8}}>💬 This action opens a freeform chat with the target.</div>}
      <input value={dialogue} onChange={e=>setDialogue(e.target.value)} placeholder="Public dialogue (optional)" style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11,marginBottom:8}} />
      <button onClick={()=>{if(canSubmit)onSubmit({inner_thoughts:thoughts||"(human)",actions:[{action:sel,params:buildParams()}],dialogue:dialogue||null})}} disabled={!canSubmit} style={{width:"100%",padding:"10px",background:canSubmit?"#8ee07a":"rgba(255,255,255,0.05)",color:canSubmit?"#0f0f0e":"rgba(255,255,255,0.2)",border:"none",borderRadius:5,fontFamily:F.mono,fontSize:11,fontWeight:500,letterSpacing:1,textTransform:"uppercase",cursor:canSubmit?"pointer":"default"}}>{needsTarget&&!negoTarget?"Select a target":isNego?"Confirm & Open Chat":"Confirm"}</button>
    </div>
  );
}

function HumanNegotiationPanel({ type, proposerName, proposal, onSubmit }) {
  const [response, setResponse] = useState(""); const [counterTerms, setCounterTerms] = useState(""); const [dialogue, setDialogue] = useState("");
  const isCounter = type==="counter_response"; const options = isCounter?["accept","reject"]:["accept","reject","counter"];
  return (
    <div style={{padding:"16px",background:"rgba(232,184,77,0.06)",border:"1px solid rgba(232,184,77,0.2)",borderRadius:8,animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"#e8b84d",marginBottom:8}}>{isCounter?"Counter Received":"Proposal Received"}</div>
      <div style={{fontFamily:F.mono,fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:10,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:5}}><span style={{color:"#e8b84d"}}>{proposerName}</span>: {proposal.params||proposal.counter_terms||""}{proposal.dialogue&&<div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.55)",marginTop:4}}>"{proposal.dialogue}"</div>}</div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>{options.map(o=><button key={o} onClick={()=>setResponse(o)} style={{flex:1,padding:"8px",background:response===o?(o==="accept"?"rgba(142,224,122,0.15)":o==="reject"?"rgba(224,122,142,0.15)":"rgba(232,184,77,0.15)"):"rgba(255,255,255,0.03)",border:`1px solid ${response===o?(o==="accept"?"rgba(142,224,122,0.3)":o==="reject"?"rgba(224,122,142,0.3)":"rgba(232,184,77,0.3)"):"rgba(255,255,255,0.06)"}`,borderRadius:5,color:response===o?(o==="accept"?"#8ee07a":o==="reject"?"#e07a8e":"#e8b84d"):"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:10,fontWeight:500,textTransform:"uppercase",cursor:"pointer"}}>{o}</button>)}</div>
      {response==="counter"&&<input value={counterTerms} onChange={e=>setCounterTerms(e.target.value)} placeholder="Your counter-terms" style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11,marginBottom:8}} />}
      <input value={dialogue} onChange={e=>setDialogue(e.target.value)} placeholder="What you say…" style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11,marginBottom:8}} />
      <button onClick={()=>{if(response)onSubmit({inner_thoughts:"(human)",response,counter_terms:response==="counter"?counterTerms:null,dialogue:dialogue||null})}} disabled={!response||(response==="counter"&&!counterTerms)} style={{width:"100%",padding:"10px",background:response?"#e8b84d":"rgba(255,255,255,0.05)",color:response?"#0f0f0e":"rgba(255,255,255,0.2)",border:"none",borderRadius:5,fontFamily:F.mono,fontSize:11,fontWeight:500,textTransform:"uppercase",cursor:response?"pointer":"default"}}>Submit</button>
    </div>
  );
}

function HumanChatPanel({ otherName, initialThread, onComplete, color, title, getAIResponse }) {
  const [msg, setMsg] = useState(""); const [thread, setThread] = useState(initialThread || []); const [waiting, setWaiting] = useState(false);
  const threadRef = useRef(null);
  useEffect(()=>{threadRef.current&&(threadRef.current.scrollTop=threadRef.current.scrollHeight)},[thread]);
  const send = async () => {
    if (!msg.trim() || waiting) return; const humanMsg = msg.trim(); setMsg("");
    const newThread = [...thread, { from: "YOU", text: humanMsg }]; setThread(newThread);
    if (getAIResponse) {
      setWaiting(true);
      try {
        const aiMsg = await getAIResponse(newThread);
        if (aiMsg && !aiMsg.includes("<END TALK>")) { setThread(prev => [...prev, { from: otherName, text: aiMsg.replace(/<END TALK>/g, "").trim() }]); }
        else if (aiMsg?.includes("<END TALK>")) { const clean = aiMsg.replace(/<END TALK>/g, "").trim(); if (clean) setThread(prev => { const t = [...prev, { from: otherName, text: clean }]; onComplete(t); return t; }); else onComplete(newThread); setWaiting(false); return; }
      } catch (e) { console.warn("AI response failed:", e); }
      setWaiting(false);
    }
  };
  return (
    <div style={{padding:"16px",background:"rgba(200,150,224,0.05)",border:"1px solid rgba(200,150,224,0.2)",borderRadius:8,animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"#c896e0",marginBottom:10}}>{title || `💬 Chat with ${otherName}`}</div>
      <div ref={threadRef} style={{maxHeight:250,overflowY:"auto",marginBottom:10,padding:"8px",background:"rgba(0,0,0,0.2)",borderRadius:5}}>
        {thread.length===0&&<div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.2)",fontStyle:"italic"}}>Say something to start…</div>}
        {thread.map((m,i)=>{const isYou=m.from==="YOU";return <div key={i} style={{marginBottom:6,textAlign:isYou?"right":"left"}}><span style={{fontSize:8,fontFamily:F.mono,color:isYou?color:"rgba(255,255,255,0.3)"}}>{isYou?"You":m.from}</span><div style={{display:"inline-block",maxWidth:"80%",padding:"6px 10px",background:isYou?`${color}22`:"rgba(255,255,255,0.05)",border:`1px solid ${isYou?`${color}33`:"rgba(255,255,255,0.08)"}`,borderRadius:8,marginTop:2}}><div style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.4}}>{m.text.replace(/<END TALK>/g,"").trim()}</div></div></div>})}
        {waiting && <div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.25)",fontStyle:"italic",padding:"4px 0"}}>{otherName} is typing…</div>}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!waiting)send()}} placeholder="Type a message…" disabled={waiting} style={{flex:1,padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11,opacity:waiting?0.5:1}} />
        <button onClick={send} disabled={!msg.trim()||waiting} style={{padding:"8px 14px",background:msg.trim()&&!waiting?"#c896e0":"rgba(255,255,255,0.05)",color:msg.trim()&&!waiting?"#0f0f0e":"rgba(255,255,255,0.2)",border:"none",borderRadius:5,fontFamily:F.mono,fontSize:10,cursor:msg.trim()&&!waiting?"pointer":"default"}}>Send</button>
        <button onClick={()=>onComplete(thread)} disabled={waiting} style={{padding:"8px 14px",background:"rgba(224,122,142,0.1)",color:"#e07a8e",border:"1px solid rgba(224,122,142,0.2)",borderRadius:5,fontFamily:F.mono,fontSize:10,cursor:waiting?"default":"pointer",opacity:waiting?0.5:1}}>End Talk</button>
      </div>
    </div>
  );
}

function InterludePanel({ spec, worldState, roundNum, onContinue }) {
  const [expandEvent, setExpandEvent] = useState(false);
  const [expandAction, setExpandAction] = useState(false);
  const [eventText, setEventText] = useState("");
  const [actionText, setActionText] = useState("");
  const [eventPreview, setEventPreview] = useState(null);
  const [actionPreview, setActionPreview] = useState(null);
  const [confirmedEvent, setConfirmedEvent] = useState(null);
  const [confirmedActions, setConfirmedActions] = useState([]);
  const [actionOwner, setActionOwner] = useState(null);
  const [translating, setTranslating] = useState(false);

  const translateEvent = async () => {
    if (!eventText.trim() || translating) return;
    setTranslating(true);
    try {
      const result = await callLLM(
        buildEventTranslatorPrompt(spec, worldState, roundNum, eventText),
        `Translate this event description into a structured game event. JSON only.`,
        1500
      );
      setEventPreview(result);
    } catch (e) { console.warn("Event translation failed:", e); }
    setTranslating(false);
  };

  const translateAction = async () => {
    if (!actionText.trim() || translating) return;
    setTranslating(true);
    try {
      const result = await callLLM(
        buildActionTranslatorPrompt(spec, actionText, actionOwner),
        `Translate this action description into a structured game action. JSON only.`,
        1500
      );
      setActionPreview(result);
    } catch (e) { console.warn("Action translation failed:", e); }
    setTranslating(false);
  };

  const totalRounds = spec.round_structure?.rounds || 5;

  return (
    <div style={{padding:"16px",background:"rgba(232,184,77,0.04)",border:"1px solid rgba(232,184,77,0.2)",borderRadius:8,animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"#e8b84d",marginBottom:12}}>Between Rounds — Round {roundNum} → Round {roundNum + 1 <= totalRounds ? roundNum + 1 : "End"}</div>

      {/* Inject Event */}
      <div style={{marginBottom:12}}>
        <button onClick={()=>setExpandEvent(!expandEvent)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"1px solid rgba(232,184,77,0.15)",borderRadius:6,padding:"8px 12px",cursor:"pointer",width:"100%",textAlign:"left"}}>
          <span style={{fontSize:10,fontFamily:F.mono,color:"#e8b84d"}}>Inject Event</span>
          {confirmedEvent && <span style={{fontSize:8,fontFamily:F.mono,color:"#8ee07a",padding:"1px 6px",background:"rgba(142,224,122,0.1)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:10}}>1 queued</span>}
          <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.2)",fontSize:10}}>{expandEvent?"▾":"▸"}</span>
        </button>
        {expandEvent && (
          <div style={{padding:"12px",background:"rgba(255,255,255,0.02)",borderRadius:"0 0 6px 6px",border:"1px solid rgba(232,184,77,0.1)",borderTop:"none"}}>
            {confirmedEvent ? (
              <div>
                <div style={{padding:"8px 10px",background:"rgba(142,224,122,0.06)",border:"1px solid rgba(142,224,122,0.2)",borderRadius:5,marginBottom:8}}>
                  <div style={{fontFamily:F.mono,fontSize:11,color:"#8ee07a",fontWeight:500,marginBottom:3}}>{confirmedEvent.name}</div>
                  <div style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{confirmedEvent.description}</div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:"rgba(232,184,77,0.7)",marginTop:4}}>Effect: {confirmedEvent.effect}</div>
                </div>
                <button onClick={()=>{setConfirmedEvent(null);setEventPreview(null);setEventText("")}} style={{padding:"4px 10px",background:"rgba(224,122,142,0.08)",border:"1px solid rgba(224,122,142,0.2)",borderRadius:4,color:"#e07a8e",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Remove</button>
              </div>
            ) : (
              <>
                <textarea value={eventText} onChange={e=>setEventText(e.target.value)} placeholder="Describe an event in plain English, e.g. 'A storm destroys half the shared food supply'" rows={2} style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical",marginBottom:8}} />
                <button onClick={translateEvent} disabled={!eventText.trim()||translating} style={{padding:"6px 14px",background:eventText.trim()&&!translating?"rgba(232,184,77,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${eventText.trim()&&!translating?"rgba(232,184,77,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:5,color:eventText.trim()&&!translating?"#e8b84d":"rgba(255,255,255,0.2)",fontFamily:F.mono,fontSize:10,cursor:eventText.trim()&&!translating?"pointer":"default",marginBottom:8}}>
                  {translating ? "Translating…" : "Translate"}
                </button>
                {eventPreview && (
                  <div style={{padding:"8px 10px",background:"rgba(232,184,77,0.06)",border:"1px solid rgba(232,184,77,0.15)",borderRadius:5,marginBottom:8}}>
                    <div style={{fontFamily:F.mono,fontSize:11,color:"#e8b84d",fontWeight:500,marginBottom:3}}>{eventPreview.name}</div>
                    <div style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{eventPreview.description}</div>
                    <div style={{fontFamily:F.mono,fontSize:9,color:"rgba(232,184,77,0.7)",marginTop:4}}>Effect: {eventPreview.effect}</div>
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <button onClick={()=>{setConfirmedEvent(eventPreview);setEventPreview(null)}} style={{padding:"4px 10px",background:"rgba(142,224,122,0.12)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:4,color:"#8ee07a",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Confirm</button>
                      <button onClick={()=>setEventPreview(null)} style={{padding:"4px 10px",background:"rgba(224,122,142,0.08)",border:"1px solid rgba(224,122,142,0.2)",borderRadius:4,color:"#e07a8e",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Discard</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Action */}
      <div style={{marginBottom:12}}>
        <button onClick={()=>setExpandAction(!expandAction)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"1px solid rgba(125,189,232,0.15)",borderRadius:6,padding:"8px 12px",cursor:"pointer",width:"100%",textAlign:"left"}}>
          <span style={{fontSize:10,fontFamily:F.mono,color:"#7dbde8"}}>Add Action</span>
          {confirmedActions.length > 0 && <span style={{fontSize:8,fontFamily:F.mono,color:"#8ee07a",padding:"1px 6px",background:"rgba(142,224,122,0.1)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:10}}>{confirmedActions.length} queued</span>}
          <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.2)",fontSize:10}}>{expandAction?"▾":"▸"}</span>
        </button>
        {expandAction && (
          <div style={{padding:"12px",background:"rgba(255,255,255,0.02)",borderRadius:"0 0 6px 6px",border:"1px solid rgba(125,189,232,0.1)",borderTop:"none"}}>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.35)",marginBottom:4}}>Available to:</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <button onClick={()=>setActionOwner(null)} style={{padding:"4px 10px",background:actionOwner===null?"rgba(125,189,232,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${actionOwner===null?"rgba(125,189,232,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:4,color:actionOwner===null?"#7dbde8":"rgba(255,255,255,0.3)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>All agents</button>
                {spec.agents.map((a,i)=>{const c=COLORS[i%COLORS.length];const sel=actionOwner===a.id;return <button key={a.id} onClick={()=>setActionOwner(a.id)} style={{padding:"4px 10px",background:sel?`${c}22`:"rgba(255,255,255,0.03)",border:`1px solid ${sel?`${c}55`:"rgba(255,255,255,0.06)"}`,borderRadius:4,color:sel?c:"rgba(255,255,255,0.3)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Secret: {a.name}</button>})}
              </div>
            </div>
            <textarea value={actionText} onChange={e=>setActionText(e.target.value)} placeholder="Describe an action in plain English, e.g. 'Sabotage another player's equipment'" rows={2} style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede4d3",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical",marginBottom:8}} />
            <button onClick={translateAction} disabled={!actionText.trim()||translating} style={{padding:"6px 14px",background:actionText.trim()&&!translating?"rgba(125,189,232,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${actionText.trim()&&!translating?"rgba(125,189,232,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:5,color:actionText.trim()&&!translating?"#7dbde8":"rgba(255,255,255,0.2)",fontFamily:F.mono,fontSize:10,cursor:actionText.trim()&&!translating?"pointer":"default",marginBottom:8}}>
              {translating ? "Translating…" : "Translate"}
            </button>
            {actionPreview && (
              <div style={{padding:"8px 10px",background:"rgba(125,189,232,0.06)",border:"1px solid rgba(125,189,232,0.15)",borderRadius:5,marginBottom:8}}>
                <div style={{fontFamily:F.mono,fontSize:11,color:"#7dbde8",fontWeight:500,marginBottom:3}}>{actionPreview.name}{actionOwner ? ` [SECRET — ${spec.agents.find(a=>a.id===actionOwner)?.name}]` : ""}</div>
                <div style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>{actionPreview.description}</div>
                <div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:4}}>Requires: {actionPreview.requires} | Risk: {actionPreview.risk}</div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button onClick={()=>{setConfirmedActions(prev=>[...prev,{...actionPreview,owner:actionOwner}]);setActionPreview(null);setActionText("")}} style={{padding:"4px 10px",background:"rgba(142,224,122,0.12)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:4,color:"#8ee07a",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Confirm</button>
                  <button onClick={()=>setActionPreview(null)} style={{padding:"4px 10px",background:"rgba(224,122,142,0.08)",border:"1px solid rgba(224,122,142,0.2)",borderRadius:4,color:"#e07a8e",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Discard</button>
                </div>
              </div>
            )}
            {confirmedActions.length > 0 && (
              <div style={{marginTop:8}}>
                <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)",marginBottom:4}}>Queued actions:</div>
                {confirmedActions.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:"rgba(142,224,122,0.04)",borderRadius:4,marginBottom:3}}>
                    <span style={{fontFamily:F.mono,fontSize:10,color:"#8ee07a",flex:1}}>{a.name}{a.owner?` [${spec.agents.find(ag=>ag.id===a.owner)?.name}]`:""}</span>
                    <button onClick={()=>setConfirmedActions(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"rgba(224,122,142,0.5)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary & Continue */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
        {(confirmedEvent || confirmedActions.length > 0) && (
          <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.4)",marginBottom:8}}>
            Queued: {confirmedEvent ? "1 event" : ""}{confirmedEvent && confirmedActions.length > 0 ? ", " : ""}{confirmedActions.length > 0 ? `${confirmedActions.length} action${confirmedActions.length>1?"s":""}` : ""}
          </div>
        )}
        <button onClick={()=>onContinue({event:confirmedEvent||null,actions:confirmedActions})} style={{width:"100%",padding:"10px",background:"#e8b84d",color:"#0f0f0e",border:"none",borderRadius:5,fontFamily:F.mono,fontSize:11,fontWeight:500,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>
          Continue to Round {roundNum + 1 <= totalRounds ? roundNum + 1 : "End"}
        </button>
      </div>
    </div>
  );
}

const VOICE_CHAT_MALE = ["Charon", "Orus", "Puck", "Fenrir", "Enceladus"];
const VOICE_CHAT_FEMALE = ["Aoede", "Kore", "Leda"];

function LiveVoiceChatPanel({ otherName, onComplete, color, title, data, spec }) {
  const wsRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const micStreamRef = useRef(null);
  const micProcessorRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const currentModelTextRef = useRef("");
  const currentHumanTextRef = useRef("");
  const messagesRef = useRef([]);
  const messagesEndRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const [inputText, setInputText] = useState("");
  const [micActive, setMicActive] = useState(false);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, streamingText]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Voice selection based on agent gender
  const agent = spec.agents.find(a => a.id === data.aiAgentId);
  const isFemale = (agent?.gender || "").toLowerCase() === "female";
  const sameGenderAgents = spec.agents.filter(a => ((a.gender || "").toLowerCase() === "female") === isFemale);
  const genderIndex = sameGenderAgents.findIndex(a => a.id === data.aiAgentId);
  const voiceName = isFemale
    ? VOICE_CHAT_FEMALE[Math.max(0, genderIndex) % VOICE_CHAT_FEMALE.length]
    : VOICE_CHAT_MALE[Math.max(0, genderIndex) % VOICE_CHAT_MALE.length];

  // WebSocket lifecycle
  useEffect(() => {
    const apiKey = window.GEMINI_API_KEY || "";
    if (!apiKey) {
      setError("No Gemini API key found");
      setConnecting(false);
      return;
    }

    let cancelled = false;
    let didConnect = false;

    const aiAgent = data.aiAgent;
    const aiAgentId = data.aiAgentId;
    const agentState = data.ws?.agents?.[aiAgentId] || {};
    const identity = data.ids?.[aiAgentId] || {};
    const roundResult = data.roundResult || { narration: "The situation is unfolding." };
    const sysPrompt = buildVoiceChatSystemPrompt(data.specObj, aiAgent, agentState, identity, data.humanName, data.ws, roundResult, data.roundNum);

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectTimeout = setTimeout(() => {
      if (cancelled) return;
      if (!ws || ws.readyState !== 1) {
        setError("Connection timed out");
        setConnecting(false);
        try { ws.close(); } catch (_) {}
      }
    }, 15000);

    ws.onopen = () => {
      if (cancelled) { ws.close(1000); return; }
      audioPlayerRef.current = createAudioPlayer();

      const setup = {
        setup: {
          model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
          generationConfig: {
            responseModalities: ["AUDIO"],
            temperature: 0.9,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } }
            },
            thinkingConfig: { thinkingBudget: 0 },
          },
          systemInstruction: {
            parts: [{ text: sysPrompt }]
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
              endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
              prefixPaddingMs: 20,
              silenceDurationMs: 500
            }
          },
          tools: [{
            functionDeclarations: [{
              name: "end_conversation",
              description: "End the current conversation. Call this when the dialogue has reached a natural conclusion — you've said your farewells, completed a negotiation, or there's nothing more to discuss. Do NOT end abruptly mid-topic.",
              parameters: { type: "object", properties: {}, required: [] }
            }]
          }]
        }
      };
      ws.send(JSON.stringify(setup));
    };

    ws.onmessage = async (event) => {
      if (cancelled) return;
      let msgData;
      try {
        const text = event.data instanceof Blob ? await event.data.text() : event.data;
        msgData = JSON.parse(text);
      } catch (e) { return; }

      // Setup complete
      if (msgData.setupComplete !== undefined) {
        clearTimeout(connectTimeout);
        didConnect = true;
        setConnected(true);
        setConnecting(false);
      }

      // Server content
      if (msgData.serverContent) {
        const sc = msgData.serverContent;

        // Output transcription (AI speech → text)
        if (sc.outputTranscription && sc.outputTranscription.text) {
          currentModelTextRef.current += sc.outputTranscription.text;
          setStreamingText(currentModelTextRef.current);
        }

        // Input transcription (human speech → text)
        if (sc.inputTranscription && sc.inputTranscription.text) {
          currentHumanTextRef.current += sc.inputTranscription.text;
        }

        // Model turn — audio data
        if (sc.modelTurn && sc.modelTurn.parts) {
          // Flush accumulated human transcription before showing AI response
          const pendingHuman = currentHumanTextRef.current.trim();
          if (pendingHuman) {
            setMessages(prev => [...prev, { role: "human", text: pendingHuman }]);
            currentHumanTextRef.current = "";
          }
          for (const part of sc.modelTurn.parts) {
            if (part.text) {
              currentModelTextRef.current += part.text;
              setStreamingText(currentModelTextRef.current);
            }
            if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith("audio/")) {
              const f32 = base64ToPcm16Float32(part.inlineData.data);
              if (audioPlayerRef.current) audioPlayerRef.current.enqueue(f32);
            }
          }
        }

        // Interrupted
        if (sc.interrupted) {
          if (audioPlayerRef.current) audioPlayerRef.current.stop();
          currentModelTextRef.current = "";
          setStreamingText("");
        }

        // Turn complete — finalize AI message
        if (sc.turnComplete) {
          // Flush any remaining human transcription
          const humanText = currentHumanTextRef.current.trim();
          if (humanText) {
            setMessages(prev => [...prev, { role: "human", text: humanText }]);
            currentHumanTextRef.current = "";
          }
          const finalText = currentModelTextRef.current.trim();
          if (finalText) {
            setMessages(prev => [...prev, { role: "ai", text: finalText }]);
          }
          currentModelTextRef.current = "";
          setStreamingText("");
        }
      }

      // Tool calls
      if (msgData.toolCall) {
        const pendingText = currentModelTextRef.current.trim();
        if (pendingText) {
          setMessages(prev => [...prev, { role: "ai", text: pendingText }]);
          currentModelTextRef.current = "";
          setStreamingText("");
        }
        const calls = msgData.toolCall.functionCalls || [];
        for (const fc of calls) {
          if (fc.name === "end_conversation") {
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({ toolResponse: { functionResponses: [{ name: "end_conversation", id: fc.id, response: { status: "conversation_ended" } }] } }));
            }
            setMessages(prev => [...prev, { role: "system", text: `${otherName} ended the conversation.` }]);
            setTimeout(() => handleEndTalk(), 1500);
          }
        }
      }

      if (msgData.goAway) {
        setMessages(prev => [...prev, { role: "system", text: "Session ending soon." }]);
      }
    };

    ws.onerror = () => {
      if (cancelled) return;
      clearTimeout(connectTimeout);
      if (!didConnect) {
        setError("Connection error. Check API key and Live API access.");
        setConnecting(false);
      }
    };

    ws.onclose = (e) => {
      if (cancelled) return;
      clearTimeout(connectTimeout);
      setConnected(false);
      if (!didConnect) {
        setConnecting(false);
        setError(`Connection closed (code ${e.code}). ${e.reason || "Check console."}`);
      }
    };

    return () => {
      cancelled = true;
      clearTimeout(connectTimeout);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000);
      }
      wsRef.current = null;
      if (audioPlayerRef.current) { audioPlayerRef.current.close(); audioPlayerRef.current = null; }
      if (micProcessorRef.current) { micProcessorRef.current.disconnect(); micProcessorRef.current = null; }
      if (micAudioCtxRef.current) { try { micAudioCtxRef.current.close(); } catch (_) {} micAudioCtxRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    };
  }, []); // mount only

  // Mic helpers
  const SEND_RATE = 16000;
  const float32ToPcm16Base64 = (f32) => {
    const pcm = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) pcm[i] = Math.max(-1, Math.min(1, f32[i])) * 0x7FFF;
    const bytes = new Uint8Array(pcm.buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };

  const startMic = async () => {
    if (micStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: SEND_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SEND_RATE });
      micAudioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== 1) return;
        const f32 = e.inputBuffer.getChannelData(0);
        const b64 = float32ToPcm16Base64(f32);
        wsRef.current.send(JSON.stringify({
          realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: b64 }] }
        }));
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      setMicActive(true);
      if (audioPlayerRef.current) audioPlayerRef.current.stop();
    } catch (err) {
      setMessages(prev => [...prev, { role: "system", text: "Microphone error: " + err.message }]);
    }
  };

  const stopMic = () => {
    if (micProcessorRef.current) { micProcessorRef.current.disconnect(); micProcessorRef.current = null; }
    if (micAudioCtxRef.current) { micAudioCtxRef.current.close(); micAudioCtxRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    }
    setMicActive(false);
  };

  const toggleMic = () => {
    if (micActive) stopMic();
    else startMic();
  };

  const sendTextMessage = (text) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({
      clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true }
    }));
    setMessages(prev => [...prev, { role: "human", text }]);
    setInputText("");
  };

  const handleEndTalk = () => {
    stopMic();
    if (audioPlayerRef.current) audioPlayerRef.current.stop();
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close(1000);
    }
    // Convert messages to thread format matching HumanChatPanel output
    const msgs = messagesRef.current.filter(m => m.role !== "system").map(m => ({
      from: m.role === "human" ? "YOU" : otherName,
      text: m.text
    }));
    onComplete(msgs);
  };

  const accentColor = color || "#c896e0";

  return (
    <div style={{ padding: 0, background: "rgba(200,150,224,0.05)", border: "1px solid rgba(200,150,224,0.2)", borderRadius: 8, animation: "fadeIn 0.3s ease", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(200,150,224,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {connecting && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#e8b84d", animation: "pulse 1.2s ease infinite" }} />}
          {connected && !connecting && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#8ee07a", boxShadow: "0 0 8px rgba(142,224,122,0.5)" }} />}
          {error && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#e07a8e" }} />}
          <span style={{ fontFamily: F.mono, fontSize: 12, color: accentColor, fontWeight: 600 }}>{otherName}</span>
          <span style={{ fontSize: 9, fontFamily: F.mono, color: "#8ee07a", padding: "1px 6px", background: "rgba(142,224,122,0.1)", border: "1px solid rgba(142,224,122,0.25)", borderRadius: 10 }}>LIVE</span>
        </div>
        <button onClick={handleEndTalk} style={{ padding: "4px 12px", background: "rgba(224,122,142,0.1)", color: "#e07a8e", border: "1px solid rgba(224,122,142,0.2)", borderRadius: 4, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>End Talk</button>
      </div>

      {/* Messages */}
      <div style={{ maxHeight: 280, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {connecting && <div style={{ textAlign: "center", fontSize: 11, fontFamily: F.mono, color: "#e8b84d", padding: "16px 0" }}>Connecting to Live Voice…</div>}
        {error && (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 11, fontFamily: F.mono, color: "#e07a8e", marginBottom: 8 }}>{error}</div>
            <button onClick={handleEndTalk} style={{ padding: "5px 14px", background: "rgba(200,150,224,0.1)", color: "#c896e0", border: "1px solid rgba(200,150,224,0.2)", borderRadius: 5, fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>Fall back to Text</button>
          </div>
        )}
        {messages.map((m, i) => {
          if (m.role === "system") return <div key={i} style={{ textAlign: "center", fontSize: 10, fontFamily: F.mono, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>{m.text}</div>;
          const isHuman = m.role === "human";
          return (
            <div key={i} style={{ marginBottom: 4, textAlign: isHuman ? "right" : "left" }}>
              <span style={{ fontSize: 8, fontFamily: F.mono, color: isHuman ? accentColor : "rgba(255,255,255,0.3)" }}>{isHuman ? "You" : m.role === "ai" ? otherName : m.from}</span>
              <div style={{ display: "inline-block", maxWidth: "80%", padding: "6px 10px", background: isHuman ? `${accentColor}22` : "rgba(255,255,255,0.05)", border: `1px solid ${isHuman ? `${accentColor}33` : "rgba(255,255,255,0.08)"}`, borderRadius: 8, marginTop: 2 }}>
                <div style={{ fontFamily: F.serif, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        {streamingText && (
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: 8, fontFamily: F.mono, color: "rgba(255,255,255,0.3)" }}>{otherName}</span>
            <div style={{ display: "inline-block", maxWidth: "80%", padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, marginTop: 2 }}>
              <div style={{ fontFamily: F.serif, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                {streamingText}<span style={{ display: "inline-block", width: 5, height: 12, background: accentColor, marginLeft: 2, animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(200,150,224,0.12)", display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={toggleMic} disabled={!connected}
          style={{ width: 32, height: 32, borderRadius: "50%", border: micActive ? "2px solid #e07a8e" : "1px solid rgba(255,255,255,0.1)", background: micActive ? "rgba(224,122,142,0.15)" : "rgba(255,255,255,0.03)", color: micActive ? "#e07a8e" : "rgba(255,255,255,0.4)", display: "grid", placeItems: "center", cursor: connected ? "pointer" : "default", flexShrink: 0, position: "relative", fontSize: 14, opacity: connected ? 1 : 0.4 }}>
          {micActive ? "🎤" : "🎤"}
          {micActive && <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid #e07a8e", animation: "pulse 1.2s ease infinite", pointerEvents: "none" }} />}
        </button>
        <input value={inputText} onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && connected) { e.preventDefault(); sendTextMessage(inputText); } }}
          disabled={!connected}
          placeholder={micActive ? "Listening…" : !connected ? (connecting ? "Connecting…" : "Disconnected") : "Type or use mic…"}
          style={{ flex: 1, padding: "7px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, color: "#ede4d3", fontFamily: F.mono, fontSize: 11, outline: "none", opacity: connected ? 1 : 0.5 }} />
        <button onClick={() => { if (connected) sendTextMessage(inputText); }} disabled={!connected}
          style={{ padding: "7px 12px", background: connected ? `${accentColor}22` : "rgba(255,255,255,0.03)", color: connected ? accentColor : "rgba(255,255,255,0.2)", border: `1px solid ${connected ? `${accentColor}44` : "rgba(255,255,255,0.06)"}`, borderRadius: 5, fontFamily: F.mono, fontSize: 10, cursor: connected ? "pointer" : "default" }}>Send</button>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

function HumanChannelPicker({ agents, humanAgentId, onPick }) {
  const others = agents.filter(a=>a.id!==humanAgentId);
  return (
    <div style={{padding:"16px",background:"rgba(200,150,224,0.05)",border:"1px solid rgba(200,150,224,0.2)",borderRadius:8,animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"#c896e0",marginBottom:10}}>💬 Open Private Channel?</div>
      <div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.4)",marginBottom:10}}>Choose someone to talk to privately, or stay silent.</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={()=>onPick(null)} style={{padding:"8px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"rgba(255,255,255,0.5)",fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>🤫 Silent</button>
        {others.map((a)=>{const c=COLORS[agents.indexOf(a)%COLORS.length];return <button key={a.id} onClick={()=>onPick(a.id)} style={{padding:"8px 14px",background:`${c}15`,border:`1px solid ${c}44`,borderRadius:5,color:c,fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>💬 {a.name}</button>})}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function Everyworld() {
  // Phase: prompt → generating → review → portraits → running → done
  const [phase, setPhase] = useState("prompt");
  const [prompt, setPrompt] = useState("");
  const [inputMode, setInputMode] = useState("prompt"); // "prompt" | "json"
  const [specText, setSpecText] = useState("");
  const [apiKey, setApiKey] = useState(window.GEMINI_API_KEY || "");
  const [showApiKey, setShowApiKey] = useState(!window.GEMINI_API_KEY);
  // Spec gen state
  const [spec, setSpec] = useState(null);
  const [critique, setCritique] = useState(null);
  const [genStage, setGenStage] = useState(null);
  const [traces, setTraces] = useState({});
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState("design_raw");
  const [inspectorCopied, setInspectorCopied] = useState(false);
  // Portrait & world image state
  const [portraits, setPortraits] = useState({});
  const [portraitDesign, setPortraitDesign] = useState(null);
  const [portraitStage, setPortraitStage] = useState(null);
  const [worldImage, setWorldImage] = useState(null);
  const [worldDesign, setWorldDesign] = useState(null);
  // Saved games
  const [savedGames, setSavedGames] = useState([]);
  // Sim engine state
  const [worldState, setWorldState] = useState(null);
  const [identities, setIdentities] = useState({});
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [busy, setBusy] = useState(false);
  const [simPhase, setSimPhase] = useState(null);
  const [liveTurns, setLiveTurns] = useState([]);
  const [liveNegotiations, setLiveNegotiations] = useState([]);
  const [liveConversations, setLiveConversations] = useState([]);
  const [liveRoundNum, setLiveRoundNum] = useState(null);
  const [viewingRound, setViewingRound] = useState(null);
  const [copied, setCopied] = useState(false);
  const [humanAgentId, setHumanAgentId] = useState(null);
  const [humanPrompt, setHumanPrompt] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [error, setError] = useState(null);
  // Story state
  const [storyChapters, setStoryChapters] = useState([]);
  const [chapterImages, setChapterImages] = useState([]);
  const [storyBusy, setStoryBusy] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  // TTS state
  const [ttsPlaying, setTtsPlaying] = useState(null); // chapter index or "all"
  const [ttsLoading, setTtsLoading] = useState(null); // chapter index being loaded
  const [ttsVoice, setTtsVoice] = useState("Kore");
  const ttsAudioRef = useRef(null);
  const ttsQueueRef = useRef(null); // for "read all" sequential playback
  const ttsCacheRef = useRef(new Map()); // Map<"chapterIndex:voiceName", string[]>
  const [ttsCachedChapters, setTtsCachedChapters] = useState(new Set());
  // State snapshots for rerun
  const [stateSnapshots, setStateSnapshots] = useState([]);
  // Interlude state
  const injectedEventRef = useRef(null);
  const [skipInterludes, setSkipInterludes] = useState(false);
  const humanResolverRef = useRef(null);
  const logRef = useRef(null);

  useEffect(()=>{if(viewingRound===null)logRef.current&&(logRef.current.scrollTop=logRef.current.scrollHeight)},[rounds,simPhase,liveTurns,liveNegotiations,liveConversations,humanPrompt,viewingRound]);
  useEffect(() => { if (!humanPrompt) setVoiceMode(false); }, [humanPrompt]);

  const waitForHuman = useCallback((type,data)=>new Promise(resolve=>{humanResolverRef.current=resolve;setHumanPrompt({type,data})}),[]);
  const submitHumanInput = useCallback((result)=>{if(humanResolverRef.current){humanResolverRef.current(result);humanResolverRef.current=null}setHumanPrompt(null)},[]);

  // Restore TTS cache from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const { value: keys } = await window.storage.get("tts:keys");
        console.log("[Everyworld] TTS restore: keys =", keys);
        if (!keys || !Array.isArray(keys)) return;
        for (const cacheKey of keys) {
          const { value: blobs } = await window.storage.get(`tts:${cacheKey}`);
          console.log("[Everyworld] TTS restore:", cacheKey, "data =", blobs?.length ?? null, blobs?.[0]?.constructor?.name);
          if (blobs && Array.isArray(blobs) && blobs.length > 0) {
            const urls = blobs.map(b => {
              const blob = b instanceof Blob ? b : new Blob([b], { type: "audio/wav" });
              return URL.createObjectURL(blob);
            });
            ttsCacheRef.current.set(cacheKey, urls);
            const chIdx = parseInt(cacheKey.split(":")[0], 10);
            setTtsCachedChapters(prev => new Set([...prev, chIdx]));
          }
        }
        console.log("[Everyworld] TTS restore complete, cache size:", ttsCacheRef.current.size);
      } catch (e) { console.error("[Everyworld] TTS restore failed:", e); }
    })();
  }, []);

  const clearTtsCache = useCallback((specificChapter = null) => {
    if (specificChapter !== null) {
      for (const [key, urls] of ttsCacheRef.current.entries()) {
        if (key.startsWith(`${specificChapter}:`)) {
          urls.forEach(u => URL.revokeObjectURL(u));
          ttsCacheRef.current.delete(key);
          window.storage.del(`tts:${key}`);
        }
      }
      setTtsCachedChapters(prev => { const s = new Set(prev); s.delete(specificChapter); return s; });
      window.storage.get("tts:keys").then(({ value }) => {
        if (value) window.storage.set("tts:keys", value.filter(k => !k.startsWith(`${specificChapter}:`)));
      });
    } else {
      for (const [key, urls] of ttsCacheRef.current.entries()) {
        urls.forEach(u => URL.revokeObjectURL(u));
        window.storage.del(`tts:${key}`);
      }
      ttsCacheRef.current.clear();
      setTtsCachedChapters(new Set());
      window.storage.del("tts:keys");
    }
  }, []);

  useEffect(() => () => {
    for (const urls of ttsCacheRef.current.values()) urls.forEach(u => URL.revokeObjectURL(u));
    ttsCacheRef.current.clear();
  }, []);

  // ═══ SPEC GENERATION ═══
  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null); setSpec(null); setCritique(null); setTraces({}); setGenStage("designing"); setPhase("generating");
    try {
      const design = await callLLMTrace(GAME_DESIGNER_SYSTEM, prompt.trim());
      setTraces(prev => ({ ...prev, design }));
      setGenStage("proofreading");
      const proofread = await callLLMTrace(PROOFREADER_SYSTEM, `Analyze this game spec:\n\n${JSON.stringify(design.parsed, null, 2)}`, 12000);
      setTraces(prev => ({ ...prev, proofread }));
      setCritique(proofread.parsed);
      setGenStage("revising");
      const revise = await callLLMTrace(REVISER_SYSTEM, `## ORIGINAL SPEC\n${JSON.stringify(design.parsed, null, 2)}\n\n## CRITIQUE\n${JSON.stringify(proofread.parsed, null, 2)}\n\nRevise the spec to fix the identified issues. Output the complete revised spec as JSON.`, 18000);
      setTraces(prev => ({ ...prev, revise }));
      setSpec(revise.parsed);
      setGenStage(null); setPhase("review");
    } catch (e) { setError(e.message); setGenStage(null); setPhase("prompt"); }
  }, [prompt]);

  const loadSpec = useCallback(() => {
    setError(null);
    try {
      const p = JSON.parse(specText.trim());
      if (!p.agents?.length) throw new Error("need agents");
      if (!p.actions?.length) throw new Error("need actions");
      setSpec(p); setCritique(null); setTraces({}); setPhase("review");
    } catch (e) { setError(`Invalid spec: ${e.message}`); }
  }, [specText]);

  // ═══ SAVE / LOAD ═══
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("drama-engine-index");
        if (result?.value) setSavedGames(JSON.parse(result.value));
      } catch {}
    })();
  }, []);

  const saveGame = useCallback(async (gameSpec, gamePortraits, gameWorldImage, gameWorldDesign, gamePortraitDesign, gameWorldState, gameIdentities, gameRounds, gameCurrentRound, gameHumanAgentId, gameStoryChapters, gameChapterImages) => {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const data = {
        spec: gameSpec,
        portraits: gamePortraits,
        worldImage: gameWorldImage,
        worldDesign: gameWorldDesign,
        portraitDesign: gamePortraitDesign,
        worldState: gameWorldState,
        identities: gameIdentities,
        rounds: gameRounds,
        currentRound: gameCurrentRound,
        humanAgentId: gameHumanAgentId,
        storyChapters: gameStoryChapters || storyChapters,
        chapterImages: gameChapterImages || chapterImages,
        stateSnapshots,
      };
      await window.storage.set(`drama-engine-${id}`, JSON.stringify(data));
      const entry = {
        id,
        title: gameSpec.title,
        setting: gameSpec.situation?.setting?.slice(0, 100) || "",
        agents: gameSpec.agents?.map(a => a.name) || [],
        roundsPlayed: gameRounds?.length || 0,
        totalRounds: gameSpec.round_structure?.rounds || 5,
        savedAt: new Date().toISOString(),
      };
      const updated = [entry, ...savedGames.filter(g => g.title !== gameSpec.title || g.agents?.join() !== entry.agents.join())];
      setSavedGames(updated);
      await window.storage.set("drama-engine-index", JSON.stringify(updated));
      return id;
    } catch (e) { console.error("Save failed:", e); return null; }
  }, [savedGames, storyChapters, chapterImages, stateSnapshots]);

  const loadGame = useCallback(async (gameId) => {
    try {
      clearTtsCache();
      const result = await window.storage.get(`drama-engine-${gameId}`);
      if (!result?.value) return;
      const data = JSON.parse(result.value);
      setSpec(data.spec);
      setPortraits(data.portraits || {});
      setWorldImage(data.worldImage || null);
      setWorldDesign(data.worldDesign || null);
      setPortraitDesign(data.portraitDesign || null);
      setHumanAgentId(data.humanAgentId || null);
      setCritique(null); setTraces({}); setGenStage(null); setPortraitStage(null);
      setShowInspector(false); setError(null); setCopied(false);
      setStoryChapters(data.storyChapters || []); setChapterImages(data.chapterImages || []); setStoryBusy(false); setStoryProgress(0); setStateSnapshots(data.stateSnapshots || []);
      setLiveTurns([]); setLiveNegotiations([]); setLiveConversations([]); setLiveRoundNum(null); setViewingRound(null);
      setSimPhase(null); setHumanPrompt(null);
      if (data.rounds?.length > 0) {
        const ag = {}; data.spec.agents.forEach(a => { ag[a.id] = { name: a.name, resources: { ...a.starting_resources } } });
        const sh = {}; Object.entries(data.spec.shared_pool || {}).forEach(([k, v]) => { sh[k] = typeof v === "object" ? v.amount : v });
        setWorldState(data.worldState || { agents: ag, shared_pool: sh });
        setIdentities(data.identities || {});
        setRounds(data.rounds);
        setCurrentRound(data.currentRound || data.rounds.length + 1);
        const totalRounds = data.spec.round_structure?.rounds || 5;
        const lastRound = data.rounds[data.rounds.length - 1];
        setPhase(lastRound?.game_over || data.rounds.length >= totalRounds ? "done" : "running");
      } else {
        setWorldState(null); setIdentities({}); setRounds([]); setCurrentRound(1);
        setPhase("review");
      }
    } catch (e) { console.error("Load failed:", e); setError("Failed to load game"); }
  }, [clearTtsCache]);

  const deleteGame = useCallback(async (gameId) => {
    try {
      await window.storage.del(`drama-engine-${gameId}`);
      const updated = savedGames.filter(g => g.id !== gameId);
      setSavedGames(updated);
      await window.storage.set("drama-engine-index", JSON.stringify(updated));
    } catch (e) { console.error("Delete failed:", e); }
  }, [savedGames]);

  // ═══ EXPORT / IMPORT (file-based sharing) ═══
  const exportGame = useCallback(() => {
    if (!spec) return;
    const data = { spec, portraits, worldImage, worldDesign, portraitDesign, worldState, identities, rounds, currentRound, humanAgentId, storyChapters, chapterImages, stateSnapshots };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(spec.title || "game").replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [spec, portraits, worldImage, worldDesign, portraitDesign, worldState, identities, rounds, currentRound, humanAgentId, storyChapters, chapterImages, stateSnapshots]);

  const importGame = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.spec?.title || !data.spec?.agents) { setError("Invalid game file"); return; }
        clearTtsCache();
        // Reuse loadGame logic inline
        setSpec(data.spec);
        setPortraits(data.portraits || {});
        setWorldImage(data.worldImage || null);
        setWorldDesign(data.worldDesign || null);
        setPortraitDesign(data.portraitDesign || null);
        setHumanAgentId(data.humanAgentId || null);
        setCritique(null); setTraces({}); setGenStage(null); setPortraitStage(null);
        setShowInspector(false); setError(null); setCopied(false);
        setStoryChapters(data.storyChapters || []); setChapterImages(data.chapterImages || []); setStoryBusy(false); setStoryProgress(0); setStateSnapshots(data.stateSnapshots || []);
        setLiveTurns([]); setLiveNegotiations([]); setLiveConversations([]); setLiveRoundNum(null); setViewingRound(null);
        setSimPhase(null); setHumanPrompt(null);
        if (data.rounds?.length > 0) {
          setWorldState(data.worldState || null);
          setIdentities(data.identities || {});
          setRounds(data.rounds);
          setCurrentRound(data.currentRound || data.rounds.length + 1);
          const totalRounds = data.spec.round_structure?.rounds || 5;
          const lastRound = data.rounds[data.rounds.length - 1];
          setPhase(lastRound?.game_over || data.rounds.length >= totalRounds ? "done" : "running");
        } else {
          setWorldState(null); setIdentities({}); setRounds([]); setCurrentRound(1);
          setPhase("review");
        }
        // Also save to IndexedDB so it persists
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await window.storage.set(`drama-engine-${id}`, JSON.stringify(data));
        const entry = { id, title: data.spec.title, setting: data.spec.situation?.setting?.slice(0, 100) || "", agents: data.spec.agents?.map(a => a.name) || [], roundsPlayed: data.rounds?.length || 0, totalRounds: data.spec.round_structure?.rounds || 5, savedAt: new Date().toISOString() };
        const updated = [entry, ...savedGames];
        setSavedGames(updated);
        await window.storage.set("drama-engine-index", JSON.stringify(updated));
      } catch (err) { console.error("Import failed:", err); setError("Failed to import game file"); }
    };
    input.click();
  }, [savedGames, clearTtsCache]);

  // ═══ PORTRAIT GENERATION ═══
  const generatePortraits = useCallback(async () => {
    if (!spec) return;
    setError(null); setPhase("portraits"); setPortraitStage("designing");
    try {
      const agentsDesc = spec.agents.map(a => `- ${a.name} (${a.id}): ${a.personality}\n  Background: ${a.background}\n  Goal: ${a.goal}`).join("\n\n");
      const styleMenu = PORTRAIT_STYLE_POOL.map((s, i) => `${i + 1}. ${s}`).join("\n");
      const userPrompt = `## SCENARIO\n**${spec.title}**\n${spec.situation?.setting}\nStakes: ${spec.situation?.stakes}\n\n## CHARACTERS\n${agentsDesc}\n\n## STYLE MENU — pick the ONE that best fits this scenario:\n${styleMenu}\n\nChoose the most fitting style from the menu above. Design their visual appearance. JSON only.`;
      const design = await callLLM(PORTRAIT_DESIGNER_SYSTEM, userPrompt, 4500);
      setPortraitDesign(design);
      setPortraitStage("painting");
      const newPortraits = {};
      let firstImage = null;
      for (const p of (design.portraits || [])) {
        const refImages = firstImage ? [firstImage] : [];
        const img = await callGeminiImage(p.image_prompt, "3:4", refImages);
        if (img) { newPortraits[p.id] = img; if (!firstImage) firstImage = img; }
        setPortraits(prev => ({ ...prev, ...newPortraits }));
      }
      // World image
      setPortraitStage("world");
      const worldPrompt = `## SCENARIO\n**${spec.title}**\n${spec.situation?.setting}\nStakes: ${spec.situation?.stakes}\n\n## ART STYLE (match this exactly)\n${design.style}\n\nDesign the world illustration. JSON only.`;
      const wDesign = await callLLM(WORLD_DESIGNER_SYSTEM, worldPrompt, 2250);
      setWorldDesign(wDesign);
      let wImg = null;
      if (wDesign?.image_prompt) {
        wImg = await callGeminiImage(wDesign.image_prompt, "16:9", firstImage ? [firstImage] : []);
        if (wImg) setWorldImage(wImg);
      }
      setPortraitStage(null);
      // Auto-save
      await saveGame(spec, newPortraits, wImg, wDesign, design, null, {}, [], 1, humanAgentId);
    } catch (e) { setError(e.message); setPortraitStage(null); }
  }, [spec, saveGame, humanAgentId]);

  // ═══ START GAME ═══
  const startGame = useCallback(() => {
    if (!spec) return;
    const ag = {}; spec.agents.forEach(a => { ag[a.id] = { name: a.name, resources: { ...a.starting_resources } } });
    const sh = {}; Object.entries(spec.shared_pool || {}).forEach(([k, v]) => { sh[k] = typeof v === "object" ? v.amount : v });
    setWorldState({ agents: ag, shared_pool: sh });
    const ids = {}; spec.agents.forEach(a => { ids[a.id] = { beliefs: { ...(a.starting_beliefs || {}) }, relationships: {}, memories: [] } });
    setIdentities(ids); setRounds([]); setCurrentRound(1); setPhase("running");
  }, [spec]);

  // ═══ ROUND EXECUTION ═══
  const executeRound = useCallback(async (specObj, ws, ids, hist, roundNum, injectedEvent) => {
    setLiveTurns([]); setLiveNegotiations([]); setLiveConversations([]); setLiveRoundNum(roundNum);
    const prevConvos = hist.length > 0 ? hist[hist.length-1].conversations || [] : [];

    // PHASE 0: Catch-up reflection for agents released from human control
    const reflectableHist = hist.filter(r => !r.game_over);
    for (const agent of specObj.agents) {
      if (agent.id === humanAgentId) continue;
      const mem = ids[agent.id]?.memories || [];
      if (mem.length < reflectableHist.length) {
        for (let i = mem.length; i < reflectableHist.length; i++) {
          const pastRound = reflectableHist[i];
          const pastConvos = (pastRound.conversations||[]).filter(c=>c.agent_a_id===agent.id||c.agent_b_id===agent.id).map(c=>({other_name:c.agent_a_id===agent.id?c.agent_b_name:c.agent_a_name,thread:c.thread}));
          setSimPhase({type:"reflecting",id:agent.id,name:agent.name,catchUp:true});
          try {
            const ref = await callLLM(buildReflectionPrompt(specObj,agent,ids[agent.id],pastRound,pastRound.round_number,pastConvos),`Catch-up reflect round ${pastRound.round_number}. JSON.`,3000);
            ids[agent.id] = {
              beliefs:{...(ids[agent.id]?.beliefs||{}),...(ref.updated_beliefs||{})},
              relationships:{...(ids[agent.id]?.relationships||{}),...(ref.updated_relationships||{})},
              memories:[...(ids[agent.id]?.memories||[]),ref.memory].filter(Boolean),
              plan:ref.plan||null
            };
          } catch(e) { console.warn("Catch-up reflection failed:",e); }
        }
      }
    }

    // PHASE 1: Intentions
    const agentTurns = [];
    for (const agent of specObj.agents) {
      if (agent.id === humanAgentId) {
        setSimPhase({type:"acting",id:agent.id,name:agent.name});
        const ht = await waitForHuman("action",{agent,worldState:ws,roundNum,injectedEvent});
        agentTurns.push({agent_id:agent.id,agent_name:agent.name,...ht});
        setLiveTurns(p=>[...p,agentTurns[agentTurns.length-1]]);
      } else {
        setSimPhase({type:"acting",id:agent.id,name:agent.name});
        const myConvos = prevConvos.filter(c=>c.agent_a_id===agent.id||c.agent_b_id===agent.id).map(c=>({other_name:c.agent_a_id===agent.id?c.agent_b_name:c.agent_a_name,thread:c.thread}));
        const turn = await callLLM(buildAgentPrompt(specObj,agent,ws.agents[agent.id],ids[agent.id],ws,buildPublicHistory(hist,agent.id),roundNum,myConvos,injectedEvent),`You are ${agent.name}. Round ${roundNum}. ONLY JSON.`);
        agentTurns.push({agent_id:agent.id,agent_name:agent.name,...turn});
        setLiveTurns(p=>[...p,agentTurns[agentTurns.length-1]]);
      }
    }

    // PHASE 2: Negotiation
    const negotiations = []; const negoActions = [];
    for (const turn of agentTurns) { for (const action of (turn.actions||[])) { if (isNegotiationAction(action,specObj)) { const tid=findTarget(action,turn.agent_id,specObj); if(tid) negoActions.push({turn,action,agentId:turn.agent_id,targetId:tid}); } } }
    const handled = new Set();
    for (let i=0;i<negoActions.length;i++) { for (let j=i+1;j<negoActions.length;j++) { const a=negoActions[i],b=negoActions[j]; if(a.agentId===b.targetId&&b.agentId===a.targetId){ if(a.agentId===humanAgentId||b.agentId===humanAgentId) continue; const aA=specObj.agents.find(x=>x.id===a.agentId),aB=specObj.agents.find(x=>x.id===b.agentId); if(!aA||!aB)continue; setSimPhase({type:"negotiating",id:"mediator",name:"Mediator"}); try{const med=await callLLM(buildMutualProposalMediatorPrompt(specObj,aA,{params:a.action.params,dialogue:a.turn.dialogue},aB,{params:b.action.params,dialogue:b.turn.dialogue},ws,roundNum),"Check compatibility. JSON.",2250);if(med.compatible&&med.synthesized_terms){negotiations.push({proposer_id:a.agentId,proposer_name:aA.name,target_id:b.agentId,target_name:aB.name,action:"Mutual Treaty",params:med.synthesized_terms,proposer_dialogue:a.turn.dialogue,response:"accept",target_thoughts:`Mediator: ${med.reasoning}`,target_dialogue:b.turn.dialogue,counter_terms:null,counter_response:null,counter_dialogue:null,outcome:`MUTUAL ACCEPTED — ${med.synthesized_terms}`,final_terms:med.synthesized_terms,mutual:true,terms_for_a:med.terms_for_a,terms_for_b:med.terms_for_b});setLiveNegotiations(p=>[...p,negotiations[negotiations.length-1]]);handled.add(i);handled.add(j)}}catch(e){console.warn("Mediator fail:",e)} } } }
    const chattedPairs = new Set();
    const sortedNego = [...negoActions.keys()].sort((a, b) => { const aH = negoActions[a].agentId === humanAgentId ? -1 : 1; const bH = negoActions[b].agentId === humanAgentId ? -1 : 1; return aH - bH; });
    for (const idx of sortedNego) { if(handled.has(idx))continue; const{turn,action,agentId,targetId}=negoActions[idx]; const prop=specObj.agents.find(a=>a.id===agentId),targ=specObj.agents.find(a=>a.id===targetId); if(!prop||!targ)continue;
      const humanInvolved = agentId === humanAgentId || targetId === humanAgentId;
      const pairKey = [agentId, targetId].sort().join("-");
      if (humanInvolved) {
        if (chattedPairs.has(pairKey)) { handled.add(idx); continue; }
        chattedPairs.add(pairKey);
        const humanName = specObj.agents.find(a => a.id === humanAgentId)?.name;
        const aiAgent = agentId === humanAgentId ? targ : prop;
        const aiAgentId = agentId === humanAgentId ? targetId : agentId;
        const aiProposalContext = (agentId !== humanAgentId) ? (action.params || turn.dialogue || null) : null;
        const chatTitle = `🤝 Negotiation Chat with ${aiAgent.name}${aiProposalContext ? ` — they proposed: "${aiProposalContext}"` : ""}`;
        setSimPhase({ type: "chatting", id: humanAgentId, name: humanName });
        const chatThread = await waitForHuman("chat_negotiate", { otherName: aiAgent.name, title: chatTitle, aiAgentId, aiAgent, humanName, specObj, ws, ids, roundNum });
        const thread = (chatThread || []).map(m => ({ from: m.from === "YOU" ? humanName : m.from, text: m.text }));
        setSimPhase({ type: "resolving" });
        const dealResult = await callLLM(buildDealSummarizerPrompt(specObj, prop.name, targ.name, action.action, thread), "Extract deal from transcript. JSON.", 1500);
        const nego = { proposer_id: agentId, proposer_name: prop.name, target_id: targetId, target_name: targ.name, action: action.action, params: dealResult.terms || "no terms", proposer_dialogue: turn.dialogue, response: dealResult.deal_reached ? "accept" : "reject", target_thoughts: dealResult.summary, target_dialogue: null, counter_terms: null, counter_response: null, counter_dialogue: null, outcome: dealResult.deal_reached ? `ACCEPTED via negotiation — ${dealResult.terms}` : `REJECTED — ${dealResult.summary}`, final_terms: dealResult.deal_reached ? dealResult.terms : null, freeform: true, thread };
        negotiations.push(nego); setLiveNegotiations(p => [...p, nego]);
      } else {
        let resp; setSimPhase({type:"negotiating",id:targetId,name:targ.name});
        resp = await callLLM(buildNegotiationResponsePrompt(specObj,targ,ws.agents[targetId],ids[targetId],prop.name,agentId,{action:action.action,params:action.params,dialogue:turn.dialogue},ws,roundNum),`${targ.name} responds. JSON.`,2250);
        const normResp=(resp.response||"reject").toLowerCase();
        const nego={proposer_id:agentId,proposer_name:prop.name,target_id:targetId,target_name:targ.name,action:action.action,params:action.params,proposer_dialogue:turn.dialogue,response:normResp,target_thoughts:resp.inner_thoughts,target_dialogue:resp.dialogue,counter_terms:resp.counter_terms||null,counter_response:null,counter_dialogue:null,outcome:"",final_terms:null};
        if(normResp==="accept"){nego.outcome="ACCEPTED — binding";nego.final_terms=action.params}else if(normResp==="counter"&&resp.counter_terms){
          setSimPhase({type:"negotiating",id:agentId,name:prop.name});
          const cr=await callLLM(buildCounterResponsePrompt(specObj,prop,ws.agents[agentId],ids[agentId],targ.name,targetId,{action:action.action,params:action.params},resp.counter_terms,resp.dialogue,roundNum),`${prop.name} responds to counter. JSON.`,1500);
          const normCr=(cr.response||"reject").toLowerCase();
          nego.counter_response=normCr;nego.counter_dialogue=cr.dialogue;
          if(normCr==="accept"){nego.outcome="COUNTER-ACCEPTED — binding";nego.final_terms=resp.counter_terms}else{nego.outcome="REJECTED — failed"}
        }else{nego.outcome="REJECTED — declined"}
        negotiations.push(nego);setLiveNegotiations(p=>[...p,nego]);
      }
    }

    // PHASE 3: God resolution
    setSimPhase({type:"resolving"}); const pubHist=buildPublicHistory(hist,null); const godP=buildGodPrompt(specObj,ws,agentTurns,negotiations,pubHist,roundNum,injectedEvent);
    const warns=[]; for(const t of agentTurns){const ar=ws.agents[t.agent_id]?.resources||{};for(const ac of(t.actions||[])){const ad=specObj.actions.find(a=>a.name.toLowerCase()===(ac.action||"").toLowerCase());if(ad?.requires){const rq=ad.requires.toLowerCase();for(const[res,val]of Object.entries(ar)){for(const pt of[new RegExp(`(\\d+)\\s+${res}`,"i"),new RegExp(`costs?\\s+(\\d+)\\s+${res}`,"i")]){const m=rq.match(pt);if(m&&parseInt(m[1])>val)warns.push(`⚠️ ${t.agent_name}: "${ac.action}" needs ${m[1]} ${res}, has ${val}`);}}}}}
    const wt=warns.length>0?`\n\nRESOURCE WARNINGS:\n${warns.join("\n")}\nActions that can't be afforded FAIL.`:"";
    const result = await callLLM(godP,`Resolve round ${roundNum} step by step.${wt} ONLY JSON.`,9000);
    result.negotiations = negotiations;
    const newWorld = JSON.parse(JSON.stringify(ws));
    if(result.updated_resources){for(const[id,res]of Object.entries(result.updated_resources)){if(newWorld.agents[id])newWorld.agents[id].resources=res}}
    if(result.updated_shared_pool)newWorld.shared_pool=result.updated_shared_pool;

    // PHASE 4: Private Channels
    const conversations = []; const MAX_EXCHANGES = 10;
    if (!result.game_over) {
      const channelTargets = {};
      for (const agent of specObj.agents) {
        if (agent.id === humanAgentId) {
          setSimPhase({type:"messaging",id:agent.id,name:agent.name});
          const pick = await waitForHuman("channel_pick",{agents:specObj.agents});
          channelTargets[agent.id] = pick.target;
        } else {
          setSimPhase({type:"messaging",id:agent.id,name:agent.name});
          const openResult = await callLLM(buildChannelOpenPrompt(specObj,agent,newWorld.agents[agent.id],ids[agent.id],result,roundNum),`Who to talk to? JSON.`,750);
          channelTargets[agent.id] = openResult.target || null;
        }
      }
      const pairedDone = new Set();
      for (const agent of specObj.agents) {
        if (pairedDone.has(agent.id)) continue;
        const targetId = channelTargets[agent.id]; if (!targetId) continue;
        const agentB = specObj.agents.find(a=>a.id===targetId); if (!agentB) continue;
        pairedDone.add(agent.id); pairedDone.add(targetId);
        const humanInChannel = agent.id === humanAgentId || targetId === humanAgentId;
        if (humanInChannel) {
          const otherAgent = agent.id === humanAgentId ? agentB : agent;
          const otherAgentId = agent.id === humanAgentId ? targetId : agent.id;
          const humanName = specObj.agents.find(a => a.id === humanAgentId)?.name;
          setSimPhase({ type: "chatting", id: humanAgentId, name: humanName });
          const chatThread = await waitForHuman("chat_private", { otherName: otherAgent.name, title: `💬 Private Channel with ${otherAgent.name}`, aiAgentId: otherAgentId, aiAgent: otherAgent, humanName, specObj, ws: newWorld, ids, roundNum, roundResult: result });
          const thread = (chatThread || []).map(m => ({ from: m.from === "YOU" ? humanName : m.from, text: m.text }));
          const convo = { agent_a_id: agent.id, agent_a_name: agent.name, agent_b_id: targetId, agent_b_name: agentB.name, thread };
          conversations.push({ ...convo, thread: [...thread] });
          setLiveConversations(prev => [...prev, { ...convo, thread: [...thread] }]);
        } else {
          const thread = []; const convo = { agent_a_id: agent.id, agent_a_name: agent.name, agent_b_id: targetId, agent_b_name: agentB.name, thread };
          let currentSpeaker = agent; let otherSpeaker = agentB;
          for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
            setSimPhase({type:"chatting",id:currentSpeaker.id,name:currentSpeaker.name});
            const turnP = buildConversationTurnPrompt(specObj,currentSpeaker,newWorld.agents[currentSpeaker.id],ids[currentSpeaker.id],otherSpeaker.name,thread,result,roundNum);
            const turnR = await callLLM(turnP,`Continue as ${currentSpeaker.name}. JSON.`,750);
            const msgText = turnR.message || "<END TALK>";
            thread.push({ from: currentSpeaker.name, text: msgText });
            setLiveConversations(prev => { const updated = [...prev]; const existing = updated.find(c=>c.agent_a_id===convo.agent_a_id&&c.agent_b_id===convo.agent_b_id); if(existing){existing.thread=[...thread]}else{updated.push({...convo,thread:[...thread]})} return updated; });
            if (msgText.includes("<END TALK>")) break;
            [currentSpeaker, otherSpeaker] = [otherSpeaker, currentSpeaker];
          }
          conversations.push({ ...convo, thread: [...thread] });
        }
      }
    }
    result.conversations = conversations;

    // PHASE 5: Reflection
    const newIds = JSON.parse(JSON.stringify(ids));
    if (!result.game_over) {
      for (const agent of specObj.agents) {
        if (agent.id === humanAgentId) continue;
        setSimPhase({type:"reflecting",id:agent.id,name:agent.name});
        const myConvos = conversations.filter(c=>c.agent_a_id===agent.id||c.agent_b_id===agent.id).map(c=>({other_name:c.agent_a_id===agent.id?c.agent_b_name:c.agent_a_name,thread:c.thread}));
        try {
          const ref = await callLLM(buildReflectionPrompt(specObj,agent,ids[agent.id],result,roundNum,myConvos),`Reflect round ${roundNum}. JSON.`,3000);
          newIds[agent.id] = {beliefs:{...(newIds[agent.id]?.beliefs||{}),...(ref.updated_beliefs||{})},relationships:{...(newIds[agent.id]?.relationships||{}),...(ref.updated_relationships||{})},memories:[...(newIds[agent.id]?.memories||[]),ref.memory].filter(Boolean),plan:ref.plan||null};
          if(!result.reflections)result.reflections={};
          result.reflections[agent.id]=ref;
        } catch(e) { console.warn("Reflection failed:",e); }
      }
    }
    setLiveTurns([]);setLiveNegotiations([]);setLiveConversations([]);setLiveRoundNum(null);
    return { roundData:{round_number:roundNum,agent_turns:agentTurns,...result}, newWorld, newIds };
  }, [humanAgentId, waitForHuman]);

  // ═══ STORY GENERATION ═══
  const buildChapterPrompt = useCallback((roundData, roundIndex, prevChapters) => {
    const totalRounds = spec.round_structure?.rounds || 5;
    const isFirst = roundIndex === 0;
    const isLast = roundData.game_over || roundData.round_number >= totalRounds;
    const agents = spec.agents.map(a => `${a.name}: ${a.personality.split(".")[0]}. Goal: ${a.goal}`).join("\n");
    const prevContext = prevChapters.length > 0 ? `\n## PREVIOUS CHAPTERS (your writing — maintain consistency with characters, tone, details, and any descriptions you established)\n${prevChapters.map((ch,i) => `### Chapter ${i+1}: ${ch.title}\n${ch.body}`).join("\n\n")}` : "";
    const events = [];
    if (roundData.event_triggered) events.push(`EVENT: ${roundData.event_triggered.name} — ${roundData.event_triggered.description}`);
    roundData.agent_turns?.forEach(t => {
      events.push(`${t.agent_name} thinks: "${t.inner_thoughts}"`);
      t.actions?.forEach(a => events.push(`${t.agent_name} acts: ${a.action}${a.params ? ` — ${a.params}` : ""}`));
      if (t.dialogue) events.push(`${t.agent_name} says publicly: "${t.dialogue}"`);
    });
    roundData.negotiations?.forEach(n => {
      if (n.freeform && n.thread) { events.push(`NEGOTIATION (${n.proposer_name} ↔ ${n.target_name}):`); n.thread.forEach(m => events.push(`  ${m.from}: "${m.text.replace(/<END TALK>/g,"").trim()}"`)); }
      else { events.push(`${n.proposer_name} proposes to ${n.target_name}: ${n.action} — ${n.params||""}`); events.push(`Result: ${n.outcome}`); }
    });
    if (roundData.narration) events.push(`NARRATOR SUMMARY: ${roundData.narration}`);
    roundData.conversations?.forEach(c => { events.push(`PRIVATE (${c.agent_a_name} ↔ ${c.agent_b_name}):`); c.thread.forEach(m => { const clean = m.text.replace(/<END TALK>/g,"").trim(); if (clean) events.push(`  ${m.from}: "${clean}"`); }); });
    roundData.reflections && Object.entries(roundData.reflections).forEach(([id, ref]) => { const nm = spec.agents.find(a=>a.id===id)?.name||id; events.push(`${nm} reflects: "${ref.memory}"`); if (ref.plan) events.push(`${nm} plans: "${ref.plan}"`); });
    if (roundData.final_scores) { Object.entries(roundData.final_scores).forEach(([id, d]) => { const nm = spec.agents.find(a=>a.id===id)?.name||id; const sc = typeof d === "object" ? (d.score ?? JSON.stringify(d)) : d; const bd = typeof d === "object" ? (d.breakdown || "") : ""; events.push(`SCORE — ${nm}: ${sc}${bd ? ` (${bd})` : ""}`); }); }
    if (roundData.winner) events.push(`WINNER: ${spec.agents.find(a=>a.id===roundData.winner)?.name || roundData.winner}`);
    if (roundData.epilogue) events.push(`EPILOGUE: ${roundData.epilogue}`);
    return {
      system: `You are a literary narrator turning game events into vivid prose fiction. Write in third-person limited, alternating perspectives between characters. Use scene-setting, dialogue, body language, internal thought, and sensory detail to bring events alive.

RULES:
- NEVER alter, invent, or contradict the events provided. Every action, negotiation outcome, and resource change happened exactly as described. You are ELABORATING, not rewriting.
- Add atmosphere, emotion, motivation, physical description, and subtext — but the FACTS are sacred.
- Each chapter should be 3-5 paragraphs of rich prose.
- ${isFirst ? "Open with a scene-setting paragraph that establishes the world." : ""}
- ${isLast ? "End with a final paragraph that feels like a story conclusion — weight, consequence, aftermath." : "End with a line that creates anticipation for the next chapter."}
- Give the chapter an evocative title.
- Write the chapter title on the first line, then a blank line, then the prose. No other formatting.`,
      user: `## SETTING
${spec.situation?.setting}
Stakes: ${spec.situation?.stakes}

## CHARACTERS
${agents}
${prevContext}

## CHAPTER ${roundIndex + 1} — ROUND ${roundData.round_number} EVENTS
${events.join("\n")}

Write Chapter ${roundIndex + 1}. Title on first line, then prose.`
    };
  }, [spec]);

  const generateChapter = useCallback(async (roundData, roundIndex, prevChapters) => {
    setStoryBusy(true); setStoryProgress(roundIndex + 1);
    try {
      const { system, user } = buildChapterPrompt(roundData, roundIndex, prevChapters);
      const text = (await callLLMRaw(system, user, 6000)).trim();
      const firstNewline = text.indexOf("\n");
      const title = firstNewline > 0 ? text.slice(0, firstNewline).trim() : `Chapter ${roundIndex + 1}`;
      const body = firstNewline > 0 ? text.slice(firstNewline).trim() : text;
      const chapter = { title, body, roundNumber: roundData.round_number };
      setStoryChapters(prev => [...prev, chapter]);
      // Generate chapter illustration
      let chapterImg = null;
      try {
        setSimPhase({type:"illustrating"});
        const charDescs = portraitDesign?.portraits?.map(p => `- ${p.id}: ${p.image_prompt}`).join("\n") || "";
        const illusPrompt = `## ART STYLE\n${portraitDesign?.style || "painterly illustration"}\n\n## CHARACTER VISUAL DESCRIPTIONS\n${charDescs}\n\n## CHAPTER TEXT\n${title}\n\n${body}\n\nDesign an illustration for the most dramatic moment. JSON only.`;
        const design = await callLLM(CHAPTER_ILLUSTRATOR_SYSTEM, illusPrompt, 2250);
        if (design?.image_prompt) {
          const refImages = spec?.agents?.slice(0, 2).map(a => portraits[a.id]).filter(Boolean) || [];
          chapterImg = await callGeminiImage(design.image_prompt, "16:9", refImages);
        }
      } catch (e) { console.warn("[Everyworld] Chapter illustration failed:", e); }
      setChapterImages(prev => [...prev, chapterImg]);
      setStoryBusy(false);
      return { chapter, chapterImg };
    } catch (e) {
      const chapter = { title: `Chapter ${roundIndex + 1}`, body: `(Generation failed: ${e.message})`, roundNumber: roundData.round_number };
      setStoryChapters(prev => [...prev, chapter]);
      setChapterImages(prev => [...prev, null]);
      setStoryBusy(false);
      return { chapter, chapterImg: null };
    }
  }, [buildChapterPrompt, portraitDesign, portraits, spec]);

  const copyStory = useCallback(async () => {
    const text = storyChapters.map((ch, i) => `${"═".repeat(40)}\n${ch.title}\n${"═".repeat(40)}\n\n${ch.body}`).join("\n\n\n");
    try { await navigator.clipboard.writeText(text); } catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [storyChapters]);

  // ═══ TTS PLAYBACK (progressive paragraph-by-paragraph) ═══
  const ttsCancelRef = useRef(false);

  const stopTTS = useCallback(() => {
    ttsCancelRef.current = true;
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
    ttsQueueRef.current = null;
    setTtsPlaying(null); setTtsLoading(null);
  }, []);

  const playChapterTTS = useCallback(async (chapterIndex) => {
    stopTTS();
    const ch = storyChapters[chapterIndex];
    if (!ch) return;
    ttsCancelRef.current = false;

    const cacheKey = `${chapterIndex}:${ttsVoice}`;
    const cachedUrls = ttsCacheRef.current.get(cacheKey);

    if (cachedUrls) {
      // CACHED: play instantly
      setTtsPlaying(chapterIndex);
      try {
        for (let i = 0; i < cachedUrls.length; i++) {
          if (ttsCancelRef.current) break;
          await new Promise(resolve => {
            const audio = new Audio(cachedUrls[i]);
            ttsAudioRef.current = audio;
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play();
          });
          ttsAudioRef.current = null;
        }
        if (!ttsCancelRef.current) {
          setTtsPlaying(null);
          if (ttsQueueRef.current !== null) {
            const next = ttsQueueRef.current;
            if (next < storyChapters.length) { ttsQueueRef.current = next + 1; playChapterTTS(next); }
            else ttsQueueRef.current = null;
          }
        }
      } catch (e) { console.error("[Everyworld] TTS cached playback failed:", e); setTtsPlaying(null); }
      return;
    }

    // UNCACHED: generate, play, then cache
    setTtsLoading(chapterIndex);

    // Split chapter into paragraph-sized chunks for progressive playback
    const paras = ch.body.split("\n\n").filter(Boolean).map(p => p.trim());
    const chunks = [];
    let current = "";
    for (const p of paras) {
      if (current.length > 0 && current.length + p.length > 500) {
        chunks.push(current);
        current = p;
      } else {
        current = current ? current + "\n\n" + p : p;
      }
    }
    if (current) chunks.push(current);
    if (chunks.length > 0) chunks[0] = ch.title + "\n\n" + chunks[0];
    else chunks.push(ch.title);

    const style = `Read this story passage aloud with dramatic, expressive narration. Vary your pacing — slow and hushed for tension, quicker for action. Use pauses for dramatic effect.\n\n`;
    const generatedUrls = [];
    const generatedBlobs = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (ttsCancelRef.current) break;
        const { url: audioUrl, blob: audioBlob } = await callGeminiTTS(style + chunks[i], ttsVoice);
        generatedUrls.push(audioUrl);
        generatedBlobs.push(audioBlob);
        if (ttsCancelRef.current) break;
        if (i === 0) { setTtsLoading(null); setTtsPlaying(chapterIndex); }
        await new Promise(resolve => {
          const audio = new Audio(audioUrl);
          ttsAudioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play();
        });
        ttsAudioRef.current = null;
        if (ttsCancelRef.current) break;
      }

      if (!ttsCancelRef.current && generatedUrls.length === chunks.length) {
        // Cache complete chapter in memory
        ttsCacheRef.current.set(cacheKey, generatedUrls);
        setTtsCachedChapters(prev => new Set([...prev, chapterIndex]));
        // Persist to IndexedDB as ArrayBuffers
        try {
          const buffers = await Promise.all(generatedBlobs.map(b => b.arrayBuffer()));
          const saved = await window.storage.set(`tts:${cacheKey}`, buffers);
          console.log("[Everyworld] TTS data saved:", saved);
          const { value: existingKeys } = await window.storage.get("tts:keys");
          const keyList = Array.isArray(existingKeys) ? existingKeys : [];
          if (!keyList.includes(cacheKey)) {
            const savedKeys = await window.storage.set("tts:keys", [...keyList, cacheKey]);
            console.log("[Everyworld] TTS keys saved:", savedKeys, [...keyList, cacheKey]);
          }
        } catch (e) { console.error("[Everyworld] TTS save failed:", e); }
      } else {
        // Partial — revoke uncached URLs
        generatedUrls.forEach(u => URL.revokeObjectURL(u));
      }

      if (!ttsCancelRef.current) {
        setTtsPlaying(null); setTtsLoading(null);
        if (ttsQueueRef.current !== null) {
          const next = ttsQueueRef.current;
          if (next < storyChapters.length) {
            ttsQueueRef.current = next + 1;
            playChapterTTS(next);
          } else { ttsQueueRef.current = null; }
        }
      }
    } catch (e) {
      generatedUrls.forEach(u => URL.revokeObjectURL(u));
      console.error("[Everyworld] TTS failed:", e);
      setTtsLoading(null); setTtsPlaying(null);
    }
  }, [storyChapters, ttsVoice, stopTTS]);

  const playAllTTS = useCallback(() => {
    if (storyChapters.length === 0) return;
    ttsQueueRef.current = 1; // next chapter after the first
    playChapterTTS(0);
  }, [storyChapters, playChapterTTS]);

  const playRound = useCallback(async()=>{
    if(!spec||!worldState||busy)return; setBusy(true);setError(null);setViewingRound(null);
    setStateSnapshots(prev => [...prev, { worldState: JSON.parse(JSON.stringify(worldState)), identities: JSON.parse(JSON.stringify(identities)) }]);
    try{
      const curInjectedEvent = injectedEventRef.current;
      injectedEventRef.current = null;
      const{roundData,newWorld,newIds}=await executeRound(spec,worldState,identities,rounds,currentRound,curInjectedEvent);
      setWorldState(newWorld);setIdentities(newIds);
      const newRounds=[...rounds,roundData]; setRounds(newRounds);
      setViewingRound(null);
      setSimPhase({type:"narrating"});
      const { chapter, chapterImg } = await generateChapter(roundData, newRounds.length-1, storyChapters);
      setSimPhase(null);
      const nextRound=currentRound+1;
      let currentSpec = spec;
      if(roundData.game_over||currentRound>=(spec.round_structure?.rounds||5)){
        setPhase("done");
      } else {
        // Interlude: let user inject events/actions before next round
        const injections = await waitForHuman("interlude", { roundNum: currentRound, spec, worldState: newWorld });
        if (injections.event) injectedEventRef.current = injections.event;
        if (injections.actions?.length > 0) {
          for (const action of injections.actions) {
            if (action.owner) {
              currentSpec = {...currentSpec, secret_actions: [...(currentSpec.secret_actions||[]), action]};
            } else {
              const { owner: _ow, ...actionObj } = action;
              currentSpec = {...currentSpec, actions: [...currentSpec.actions, actionObj]};
            }
          }
          setSpec(currentSpec);
        }
        setCurrentRound(nextRound);
      }
      saveGame(currentSpec,portraits,worldImage,worldDesign,portraitDesign,newWorld,newIds,newRounds,nextRound,humanAgentId,[...storyChapters,chapter],[...chapterImages,chapterImg]);
    }catch(e){setError(`Round ${currentRound}: ${e.message}`);setSimPhase(null)}finally{setBusy(false)}
  },[spec,worldState,identities,rounds,currentRound,busy,executeRound,generateChapter,storyChapters,chapterImages,saveGame,portraits,worldImage,worldDesign,portraitDesign,humanAgentId,waitForHuman]);

  const playAll = useCallback(async()=>{
    if(!spec||!worldState||humanAgentId)return;setBusy(true);setViewingRound(null);let w=JSON.parse(JSON.stringify(worldState)),id=JSON.parse(JSON.stringify(identities)),h=[...rounds],rd=currentRound;
    let localSpec = spec;
    let localInjectedEvent = injectedEventRef.current;
    injectedEventRef.current = null;
    const localChapters = [...storyChapters];
    const localChapterImages = [...chapterImages];
    const localSnapshots = [...stateSnapshots];
    while(rd<=(localSpec.round_structure?.rounds||5)){try{localSnapshots.push({ worldState: JSON.parse(JSON.stringify(w)), identities: JSON.parse(JSON.stringify(id)) });setStateSnapshots([...localSnapshots]);const{roundData,newWorld,newIds}=await executeRound(localSpec,w,id,h,rd,localInjectedEvent);localInjectedEvent=null;w=newWorld;id=newIds;h=[...h,roundData];setRounds([...h]);setWorldState(JSON.parse(JSON.stringify(w)));setIdentities(JSON.parse(JSON.stringify(id)));setCurrentRound(rd+1);setSimPhase({type:"narrating"});const{chapter,chapterImg}=await generateChapter(roundData,h.length-1,localChapters);localChapters.push(chapter);localChapterImages.push(chapterImg);setSimPhase(null);if(roundData.game_over)break;
      // Interlude between rounds (skippable)
      if(!skipInterludes&&rd<(localSpec.round_structure?.rounds||5)){
        const injections=await waitForHuman("interlude",{roundNum:rd,spec:localSpec,worldState:w});
        if(injections.event)localInjectedEvent=injections.event;
        if(injections.actions?.length>0){for(const action of injections.actions){if(action.owner){localSpec={...localSpec,secret_actions:[...(localSpec.secret_actions||[]),action]};}else{const{owner:_ow,...actionObj}=action;localSpec={...localSpec,actions:[...localSpec.actions,actionObj]};}}setSpec(localSpec);}
      }
      rd++}catch(e){setError(`Round ${rd}: ${e.message}`);setSimPhase(null);break}}
    saveGame(localSpec,portraits,worldImage,worldDesign,portraitDesign,w,id,h,rd+1,humanAgentId,localChapters,localChapterImages);
    setBusy(false);setPhase("done");
  },[spec,worldState,identities,rounds,currentRound,humanAgentId,executeRound,generateChapter,storyChapters,chapterImages,stateSnapshots,saveGame,portraits,worldImage,worldDesign,portraitDesign,skipInterludes,waitForHuman]);

  const rerunRound = useCallback(()=>{
    if(busy)return;
    setRounds(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
    setStateSnapshots(prev => {
      if (prev.length === 0) return prev;
      const snap = prev[prev.length - 1];
      if (snap) { setWorldState(snap.worldState); setIdentities(snap.identities); }
      return prev.slice(0, -1);
    });
    setCurrentRound(prev => Math.max(1, prev - 1));
    setViewingRound(null);
    setLiveRoundNum(null);
    clearTtsCache(storyChapters.length - 1);
    setStoryChapters(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
    setChapterImages(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
    if(phase==="done") setPhase("running");
  },[busy, phase, clearTtsCache, storyChapters.length]);

  const replayFromStart = useCallback(async () => {
    if (busy || !spec || rounds.length === 0) return;
    if (!window.confirm("Save current playthrough and restart from Round 1?")) return;

    const ts = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    await saveGame(
      { ...spec, title: `${spec.title} (${ts})` },
      portraits, worldImage, worldDesign, portraitDesign,
      worldState, identities, rounds, currentRound,
      humanAgentId, storyChapters, chapterImages
    );

    stopTTS(); clearTtsCache();
    const ag = {}; spec.agents.forEach(a => { ag[a.id] = { name: a.name, resources: { ...a.starting_resources } } });
    const sh = {}; Object.entries(spec.shared_pool || {}).forEach(([k, v]) => { sh[k] = typeof v === "object" ? v.amount : v });
    setWorldState({ agents: ag, shared_pool: sh });
    const ids = {}; spec.agents.forEach(a => { ids[a.id] = { beliefs: { ...(a.starting_beliefs || {}) }, relationships: {}, memories: [] } });
    setIdentities(ids);
    setRounds([]); setCurrentRound(1); setStateSnapshots([]);
    setStoryChapters([]); setChapterImages([]); setStoryBusy(false); setStoryProgress(0);
    setLiveTurns([]); setLiveNegotiations([]); setLiveConversations([]);
    setLiveRoundNum(null); setViewingRound(null); setSimPhase(null);
    setHumanPrompt(null); setCopied(false); setError(null);
    injectedEventRef.current = null; setSkipInterludes(false);
    setPhase("running");
  }, [busy, spec, rounds, saveGame, portraits, worldImage, worldDesign,
      portraitDesign, worldState, identities, currentRound, humanAgentId,
      storyChapters, chapterImages, stopTTS, clearTtsCache]);

  const reset = () => { stopTTS(); clearTtsCache(); setPhase("prompt"); setSpec(null); setCritique(null); setGenStage(null); setTraces({}); setWorldState(null); setIdentities({}); setRounds([]); setCurrentRound(1); setError(null); setSimPhase(null); setLiveTurns([]); setLiveNegotiations([]); setLiveConversations([]); setLiveRoundNum(null); setViewingRound(null); setCopied(false); setHumanAgentId(null); setHumanPrompt(null); setShowInspector(false); setPortraits({}); setPortraitDesign(null); setPortraitStage(null); setWorldImage(null); setWorldDesign(null); setStoryChapters([]); setChapterImages([]); setStoryBusy(false); setStoryProgress(0); setSpecText(""); setStateSnapshots([]); injectedEventRef.current = null; setSkipInterludes(false); };

  // ═══ LOG EXPORT ═══
  const buildGameLog = useCallback(()=>{
    if(!spec||!rounds.length)return"";const L=[];L.push(`═══ ${spec.title} ═══`);L.push(spec.situation?.setting||"");L.push(`Win: ${spec.win_condition}`);L.push("");
    spec.agents.forEach(a=>{L.push(`${a.name}${a.id===humanAgentId?" [HUMAN]":""}: ${Object.entries(a.starting_resources).map(([k,v])=>`${k}:${v}`).join(" ")}`);L.push(`  Goal: ${a.goal}`)});L.push("");
    rounds.forEach(r=>{L.push(`═══ Round ${r.round_number} ═══`);
      if(r.event_triggered){L.push(`⚡ ${r.event_triggered.name}: ${r.event_triggered.description}`);L.push("")}
      r.agent_turns?.forEach(t=>{L.push(`── ${t.agent_name} ──`);L.push(`  [Thought] ${t.inner_thoughts}`);t.actions?.forEach(a=>L.push(`  [Action] ${a.action}${a.params?`: ${a.params}`:""}`));if(t.dialogue)L.push(`  [Says] "${t.dialogue}"`)});
      if(r.negotiations?.length>0){L.push("");L.push("── Negotiations ──");r.negotiations.forEach(n=>{if(n.mutual){L.push(`  ⚡ MUTUAL: ${n.proposer_name} ↔ ${n.target_name}: ${n.final_terms||""}`)}else{L.push(`  ${n.proposer_name} → ${n.target_name}: ${n.action} (${n.params||""})`);L.push(`    ${n.response.toUpperCase()}`);if(n.counter_terms)L.push(`    Counter: ${n.counter_terms} → ${n.counter_response?.toUpperCase()||"?"}`)}L.push(`    Result: ${n.outcome}`)})}
      L.push("");if(r.resolution_steps?.length){L.push("── Resolution ──");r.resolution_steps.forEach(s=>L.push(`  ${s}`));L.push("")}
      if(r.agent_outcomes){r.agent_outcomes.forEach(o=>L.push(`  ${o.agent_name}: ${o.actions_summary} → ${o.outcome}`));L.push("")}
      if(r.narration){L.push(`[Narration] ${r.narration}`);L.push("")}
      if(r.conversations?.length>0){L.push("── Private Channels ──");r.conversations.forEach(c=>{L.push(`  ${c.agent_a_name} ↔ ${c.agent_b_name}:`);c.thread.forEach(m=>L.push(`    ${m.from}: "${m.text.replace(/<END TALK>/g,"").trim()}"`))});L.push("")}
      if(r.reflections){L.push("── Reflections ──");Object.entries(r.reflections).forEach(([id,ref])=>{const nm=spec.agents.find(a=>a.id===id)?.name||id;L.push(`  ${nm}: ${ref.memory}`);if(ref.plan)L.push(`    Plan: ${ref.plan}`)});L.push("")}
      if(r.final_scores){L.push("── Scores ──");Object.entries(r.final_scores).forEach(([id,d])=>{const nm=spec.agents.find(a=>a.id===id)?.name||id;const sc=typeof d==="object"?(d.score??JSON.stringify(d)):d;const bd=typeof d==="object"?(d.breakdown||""):"";L.push(`  ${nm}: ${sc}${bd?` (${bd})`:""}`)})}
      if(r.winner)L.push(`🏆 ${spec.agents.find(a=>a.id===r.winner)?.name||r.winner}`);if(r.epilogue)L.push(`[Epilogue] ${r.epilogue}`);L.push("")});
    return L.join("\n");
  },[spec,rounds,humanAgentId]);

  const copyLog = useCallback(async()=>{try{await navigator.clipboard.writeText(buildGameLog())}catch{const ta=document.createElement("textarea");ta.value=buildGameLog();document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta)}setCopied(true);setTimeout(()=>setCopied(false),2000)},[buildGameLog]);

  // ═══ INSPECTOR ═══
  const INSPECTOR_TABS = [
    { id: "design_sys", label: "1. Design Prompt", traceKey: "design", field: "systemPrompt", color: "rgba(125,189,232,0.6)" },
    { id: "design_raw", label: "1. Draft Spec", traceKey: "design", field: "rawText", color: "rgba(232,184,77,0.6)" },
    { id: "proof_sys", label: "2. Proofread Prompt", traceKey: "proofread", field: "systemPrompt", color: "rgba(224,122,142,0.6)" },
    { id: "proof_raw", label: "2. Critique", traceKey: "proofread", field: "rawText", color: "rgba(224,122,142,0.5)" },
    { id: "revise_sys", label: "3. Revise Prompt", traceKey: "revise", field: "systemPrompt", color: "rgba(142,224,122,0.6)" },
    { id: "revise_input", label: "3. Revise Input", traceKey: "revise", field: "userMessage", color: "rgba(142,224,122,0.5)" },
    { id: "revise_raw", label: "3. Final Spec", traceKey: "revise", field: "rawText", color: "rgba(142,224,122,0.7)" },
    { id: "final_json", label: "Parsed JSON", traceKey: null, field: null, color: "rgba(255,255,255,0.35)" },
  ];
  const getTabContent = (tab) => { if (tab.id === "final_json") return spec ? JSON.stringify(spec, null, 2) : ""; const trace = traces[tab.traceKey]; if (!trace) return "(not yet available)"; return trace[tab.field] || ""; };

  const stageLabels = { designing: "Designing game rules…", proofreading: "Proofreading for balance issues…", revising: "Revising spec based on critique…" };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:"#0f0f0e",color:"#ede4d3",fontFamily:F.mono}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} textarea:focus,input:focus{outline:none} textarea::placeholder,input::placeholder{color:rgba(255,255,255,.2)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}`}</style>

      {/* ═══ PROMPT SCREEN ═══ */}
      {phase==="prompt"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"40px 20px",animation:"fadeIn 0.5s ease"}}>
          <h1 style={{fontFamily:F.serif,fontSize:42,fontWeight:400,color:"#e8b84d",margin:"0 0 6px 0"}}>Everyworld</h1>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",maxWidth:480,textAlign:"center",lineHeight:1.7,marginBottom:12}}>Describe a scenario or paste an existing spec.</p>
          {/* API Key */}
          <div style={{width:"100%",maxWidth:640,marginBottom:16}}>
            {showApiKey ? (
              <div style={{padding:"10px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Gemini API Key</span>
                  {apiKey&&<button onClick={()=>setShowApiKey(false)} style={{fontSize:8,fontFamily:F.mono,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer"}}>hide</button>}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Paste your Gemini API key" style={{flex:1,padding:"7px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"#ede4d3",fontFamily:F.mono,fontSize:11}} />
                  <button onClick={()=>{localStorage.setItem("gemini-api-key",apiKey);window.GEMINI_API_KEY=apiKey;setShowApiKey(false)}} disabled={!apiKey.trim()} style={{padding:"7px 14px",background:apiKey.trim()?"rgba(142,224,122,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${apiKey.trim()?"rgba(142,224,122,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:4,color:apiKey.trim()?"#8ee07a":"rgba(255,255,255,0.2)",fontFamily:F.mono,fontSize:9,cursor:apiKey.trim()?"pointer":"default"}}>Save</button>
                </div>
                <p style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.2)",margin:"6px 0 0 0",lineHeight:1.5}}>Get one at <span style={{color:"rgba(125,189,232,0.5)"}}>aistudio.google.com/apikey</span> — stored in your browser only.</p>
              </div>
            ) : (
              <button onClick={()=>setShowApiKey(true)} style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.2)",background:"none",border:"none",cursor:"pointer",padding:0}}>API Key ✓ (click to change)</button>
            )}
          </div>
          {/* Mode toggle */}
          <div style={{display:"flex",gap:2,marginBottom:16,background:"rgba(255,255,255,0.03)",borderRadius:6,padding:2,border:"1px solid rgba(255,255,255,0.06)"}}>
            {[{id:"prompt",label:"Describe Scenario"},{id:"json",label:"Paste Spec JSON"}].map(m=>(
              <button key={m.id} onClick={()=>setInputMode(m.id)} style={{padding:"6px 16px",background:inputMode===m.id?"rgba(232,184,77,0.12)":"transparent",border:"none",borderRadius:5,color:inputMode===m.id?"#e8b84d":"rgba(255,255,255,0.3)",fontFamily:F.mono,fontSize:10,cursor:"pointer",transition:"all 0.15s"}}>{m.label}</button>
            ))}
          </div>
          <div style={{width:"100%",maxWidth:640}}>
            {inputMode==="prompt" ? (<>
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Two rival merchants, three survivors after a disaster, prisoners facing a vote…" rows={3} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"14px 16px",color:"#ede4d3",fontFamily:F.mono,fontSize:12,lineHeight:1.5,resize:"vertical"}} />
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
                {EXAMPLES.map((ex,i)=>(<button key={i} onClick={()=>setPrompt(ex)} style={{padding:"3px 8px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:4,color:"rgba(255,255,255,0.25)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}} onMouseOver={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.25)"}>{ex.slice(0,50)}{ex.length>50?"…":""}</button>))}
              </div>
              <button onClick={generate} disabled={!prompt.trim()} style={{marginTop:12,width:"100%",padding:"12px 0",background:prompt.trim()?"#e8b84d":"rgba(255,255,255,0.05)",color:prompt.trim()?"#0f0f0e":"rgba(255,255,255,0.25)",border:"none",borderRadius:6,fontFamily:F.mono,fontSize:11,fontWeight:500,letterSpacing:1.5,textTransform:"uppercase",cursor:prompt.trim()?"pointer":"default"}}>Design Game</button>
            </>) : (<>
              <textarea value={specText} onChange={e=>setSpecText(e.target.value)} placeholder='Paste spec JSON here — { "title": "...", "agents": [...], "actions": [...] }' rows={12} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"14px 16px",color:"#ede4d3",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical"}} />
              <button onClick={loadSpec} disabled={!specText.trim()} style={{marginTop:12,width:"100%",padding:"12px 0",background:specText.trim()?"#e8b84d":"rgba(255,255,255,0.05)",color:specText.trim()?"#0f0f0e":"rgba(255,255,255,0.25)",border:"none",borderRadius:6,fontFamily:F.mono,fontSize:11,fontWeight:500,letterSpacing:1.5,textTransform:"uppercase",cursor:specText.trim()?"pointer":"default"}}>Load Spec</button>
            </>)}
          </div>
          {error&&<div style={{marginTop:14,padding:"8px 12px",background:"rgba(224,122,142,0.12)",border:"1px solid rgba(224,122,142,0.3)",borderRadius:5,fontSize:11,color:"#e07a8e",maxWidth:640,width:"100%"}}>{error}</div>}
          <div style={{width:"100%",maxWidth:640,marginTop:28}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.25)",fontFamily:F.mono}}>{savedGames.length > 0 ? "Saved Games" : ""}</div>
              <button onClick={importGame} style={{padding:"4px 12px",background:"rgba(125,189,232,0.08)",border:"1px solid rgba(125,189,232,0.2)",borderRadius:4,color:"#7dbde8",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Import Game File</button>
            </div>
          {savedGames.length > 0 && (
            <div>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"}}>
                {savedGames.map(g => (
                  <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,padding:"10px 14px"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:F.serif,fontSize:14,color:"#e8b84d"}}>{g.title}</div>
                      <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)",marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {g.agents?.join(", ")}
                        <span style={{marginLeft:8,color:"rgba(255,255,255,0.15)"}}>{g.roundsPlayed}/{g.totalRounds} rounds</span>
                        <span style={{marginLeft:8,color:"rgba(255,255,255,0.15)"}}>{new Date(g.savedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={()=>loadGame(g.id)} style={{padding:"5px 12px",background:"rgba(125,189,232,0.08)",border:"1px solid rgba(125,189,232,0.2)",borderRadius:4,color:"#7dbde8",fontFamily:F.mono,fontSize:9,cursor:"pointer",flexShrink:0}}>Load</button>
                    <button onClick={()=>deleteGame(g.id)} style={{padding:"5px 8px",background:"none",border:"1px solid rgba(224,122,142,0.15)",borderRadius:4,color:"rgba(224,122,142,0.5)",fontFamily:F.mono,fontSize:9,cursor:"pointer",flexShrink:0}}>X</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ═══ GENERATING ═══ */}
      {phase==="generating"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"40px 20px",animation:"fadeIn 0.5s ease"}}>
          <h1 style={{fontFamily:F.serif,fontSize:32,fontWeight:400,color:"#e8b84d",margin:"0 0 20px 0"}}>Designing…</h1>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:20}}>
            <div style={{width:14,height:14,border:"2px solid rgba(232,184,77,0.2)",borderTopColor:"#e8b84d",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
            {["designing","proofreading","revising"].map((s,i)=>{
              const active=genStage===s;const done=["designing","proofreading","revising"].indexOf(genStage)>i;
              return(<div key={s} style={{display:"flex",alignItems:"center",gap:6}}>{i>0&&<span style={{color:"rgba(255,255,255,0.1)"}}>→</span>}<span style={{fontSize:10,fontFamily:F.mono,color:active?"#e8b84d":done?"rgba(142,224,122,0.5)":"rgba(255,255,255,0.15)",animation:active?"pulse 1.5s ease infinite":"none"}}>{done?"✓ ":""}{i+1}. {s}</span></div>)
            })}
          </div>
          <div style={{fontFamily:F.serif,fontSize:14,color:"rgba(255,255,255,0.35)",fontStyle:"italic"}}>{stageLabels[genStage]||""}</div>
          <button onClick={()=>{setPhase("prompt");setGenStage(null);}} style={{marginTop:20,padding:"8px 20px",background:"none",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,fontFamily:F.mono,fontSize:10,cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Cancel</button>
          {critique&&!spec&&<div style={{marginTop:24,maxWidth:640,width:"100%",animation:"fadeIn 0.4s ease"}}><CritiqueDisplay critique={critique} /></div>}
        </div>
      )}

      {/* ═══ REVIEW ═══ */}
      {phase==="review"&&spec&&(
        <div style={{padding:"30px 24px",maxWidth:900,margin:"0 auto",animation:"fadeIn 0.5s ease"}}>
          {/* Title */}
          <div style={{marginBottom:20}}>
            <h2 style={{fontFamily:F.serif,fontSize:32,fontWeight:400,color:"#e8b84d",margin:"0 0 8px 0"}}>{spec.title}</h2>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              {spec.drama_invariants?.map(id=><InvariantBadge key={id} id={id} />)}
            </div>
            {spec.drama_invariant_justification&&<p style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.35)",lineHeight:1.6,margin:0,maxWidth:700}}>{spec.drama_invariant_justification}</p>}
          </div>

          {/* Situation */}
          <div style={{marginBottom:20}}>
            <p style={{fontFamily:F.serif,fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.7,margin:0}}>{spec.situation?.setting}</p>
            {spec.situation?.stakes&&<p style={{fontSize:10,color:"rgba(224,122,142,0.6)",margin:"6px 0 0 0",fontFamily:F.mono}}>Stakes: {spec.situation.stakes}</p>}
          </div>

          {/* Role Picker */}
          <div style={{marginBottom:20,padding:"12px 16px",background:"rgba(142,224,122,0.04)",border:"1px solid rgba(142,224,122,0.15)",borderRadius:8}}>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1.5,color:"#8ee07a",marginBottom:8}}>Play As</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setHumanAgentId(null)} style={{padding:"6px 14px",background:!humanAgentId?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${!humanAgentId?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:5,color:!humanAgentId?"#ede4d3":"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>👁 Spectator</button>
              {spec.agents.map((a,i)=>{const c=COLORS[i%COLORS.length];const sel=humanAgentId===a.id;return <button key={a.id} onClick={()=>setHumanAgentId(a.id)} style={{padding:"6px 14px",background:sel?`${c}22`:"rgba(255,255,255,0.03)",border:`1px solid ${sel?`${c}55`:"rgba(255,255,255,0.06)"}`,borderRadius:5,color:sel?c:"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>🎮 {a.name}</button>})}
            </div>
          </div>

          {/* Stats + Win */}
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            {[`${spec.agents?.length} agents`,`${spec.actions?.length} actions`,`${spec.round_structure?.rounds||5} rounds`,`${spec.resources?.length} resources`].map((s,i)=>(
              <span key={i} style={{padding:"3px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.4)"}}>{s}</span>
            ))}
          </div>
          <div style={{padding:"10px 14px",background:"rgba(142,224,122,0.04)",border:"1px solid rgba(142,224,122,0.15)",borderRadius:6,marginBottom:20}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"#8ee07a",marginBottom:4}}>Win Condition</div><div style={{fontSize:11,fontFamily:F.mono,color:"rgba(142,224,122,0.7)",lineHeight:1.5}}>{spec.win_condition}</div></div>

          {/* Agents (editable) */}
          <Section title={`Agents (${spec.agents?.length||0})`}>
            {spec.agents?.map((agent,i)=>{const color=COLORS[i%COLORS.length];const isH=humanAgentId===agent.id;return(
              <div key={agent.id} style={{marginBottom:14,padding:"14px 16px",background:isH?"rgba(142,224,122,0.03)":"rgba(255,255,255,0.025)",border:`1px solid ${isH?"rgba(142,224,122,0.2)":`${color}33`}`,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:10,height:10,borderRadius:"50%",background:color}} /><span style={{fontFamily:F.serif,fontSize:18,color}}>{agent.name}</span>{isH&&<span style={{fontSize:8,fontFamily:F.mono,color:"#8ee07a",padding:"1px 6px",background:"rgba(142,224,122,0.1)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:10}}>YOU</span>}<span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.15)",marginLeft:"auto"}}>{agent.id}</span></div>
                <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color,marginBottom:4}}>Goal</div>
                <textarea value={agent.goal||""} onChange={e=>setSpec({...spec,agents:spec.agents.map(a=>a.id===agent.id?{...a,goal:e.target.value}:a)})} rows={1} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.03)",border:`1px solid ${color}22`,borderRadius:5,padding:"8px 10px",color:"rgba(255,255,255,0.7)",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical",marginBottom:8}} />
                <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color,marginBottom:4}}>Background</div>
                <textarea value={agent.background||""} onChange={e=>setSpec({...spec,agents:spec.agents.map(a=>a.id===agent.id?{...a,background:e.target.value}:a)})} rows={2} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.03)",border:`1px solid ${color}22`,borderRadius:5,padding:"8px 10px",color:"rgba(255,255,255,0.5)",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical",marginBottom:8}} />
                {agent.secret!=null&&<><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color:"#e07a8e",marginBottom:4}}>Secret</div>
                <textarea value={agent.secret||""} onChange={e=>setSpec({...spec,agents:spec.agents.map(a=>a.id===agent.id?{...a,secret:e.target.value}:a)})} rows={1} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(224,122,142,0.15)",borderRadius:5,padding:"8px 10px",color:"rgba(224,122,142,0.7)",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical",marginBottom:8}} /></>}
                <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color,marginBottom:4}}>Personality</div>
                <textarea value={agent.personality||""} onChange={e=>setSpec({...spec,agents:spec.agents.map(a=>a.id===agent.id?{...a,personality:e.target.value}:a)})} rows={2} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.03)",border:`1px solid ${color}22`,borderRadius:5,padding:"8px 10px",color:"rgba(255,255,255,0.7)",fontFamily:F.mono,fontSize:11,lineHeight:1.5,resize:"vertical",marginBottom:8}} />
                {agent.starting_beliefs&&<><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color,marginBottom:4}}>Starting Beliefs</div><div style={{marginBottom:8}}>{Object.entries(agent.starting_beliefs).map(([id,belief])=>(<div key={id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>→ {id}:</span><input value={belief} onChange={e=>setSpec({...spec,agents:spec.agents.map(a=>a.id===agent.id?{...a,starting_beliefs:{...a.starting_beliefs,[id]:e.target.value}}:a)})} style={{flex:1,background:"rgba(255,255,255,0.03)",border:`1px solid ${color}22`,borderRadius:5,padding:"4px 8px",color:"rgba(255,255,255,0.5)",fontFamily:F.mono,fontSize:10}} /></div>))}</div></>}
                {agent.starting_resources&&<><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1,color,marginBottom:4}}>Starting Resources</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>{Object.entries(agent.starting_resources).map(([res,val])=>(<div key={res} style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)"}}>{res}:</span><input type="number" value={val} onChange={e=>setSpec({...spec,agents:spec.agents.map(a=>a.id===agent.id?{...a,starting_resources:{...a.starting_resources,[res]:Number(e.target.value)}}:a)})} style={{width:50,background:"rgba(255,255,255,0.03)",border:`1px solid ${color}22`,borderRadius:5,padding:"4px 6px",color:"rgba(255,255,255,0.7)",fontFamily:F.mono,fontSize:10,textAlign:"center"}} /></div>))}</div></>}
              </div>)})}
          </Section>

          {/* Two columns: actions+rules */}
          <div style={{display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap"}}>
            <div style={{flex:"1 1 380px",minWidth:300}}>
              <Section title={`Actions (${spec.actions?.length||0})`}>
                {spec.actions?.map((a,i)=>(<div key={i} style={{padding:"8px 12px",marginBottom:6,background:"rgba(255,255,255,0.02)",borderRadius:5,borderLeft:"2px solid rgba(232,184,77,0.2)"}}><div style={{fontFamily:F.mono,fontSize:11,color:"#e8b84d",fontWeight:500,marginBottom:3}}>{a.name}{a.opens_negotiation?" 🤝":""}</div><div style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{a.description}</div><div style={{display:"flex",gap:16,marginTop:4}}><span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.25)"}}>Requires: {a.requires}</span><span style={{fontSize:9,fontFamily:F.mono,color:"rgba(224,122,142,0.5)"}}>Risk: {a.risk}</span></div></div>))}
              </Section>
              {spec.secret_actions?.length>0&&<Section title={`Secret Actions (${spec.secret_actions.length})`} accent="#e07a8e">{spec.secret_actions.map((sa,i)=>{const ow=spec.agents?.find(a=>a.id===sa.owner);const oIdx=spec.agents?.indexOf(ow);const oC=oIdx>=0?COLORS[oIdx%COLORS.length]:"#e07a8e";return(<div key={i} style={{padding:"8px 12px",marginBottom:6,background:"rgba(224,122,142,0.04)",borderRadius:5,border:"1px solid rgba(224,122,142,0.12)"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{fontFamily:F.mono,fontSize:11,color:"#e07a8e",fontWeight:500}}>{sa.name}</span><span style={{fontSize:8,fontFamily:F.mono,color:oC,padding:"1px 6px",background:`${oC}15`,border:`1px solid ${oC}33`,borderRadius:10}}>{ow?.name||sa.owner} only</span></div><div style={{fontFamily:F.mono,fontSize:10,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{sa.description}</div></div>)})}</Section>}
              <Section title={`Events (${spec.events?.length||0})`}>
                {spec.events?.map((e,i)=>(<div key={i} style={{padding:"8px 12px",marginBottom:6,background:"rgba(232,184,77,0.04)",borderRadius:5,border:"1px solid rgba(232,184,77,0.1)"}}><div style={{fontFamily:F.mono,fontSize:10,color:"#e8b84d",marginBottom:2}}>⚡ {e.name}</div><div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.3)",lineHeight:1.5}}>Trigger: {e.trigger}</div><div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>Effect: {e.effect}</div></div>))}
              </Section>
            </div>
            <div style={{flex:"1 1 380px",minWidth:300}}>
              <Section title="Shared Pool"><ResourceBar resources={spec.shared_pool} color="#e8b84d" /></Section>
              <Section title="Resource Rules">{spec.resource_rules&&Object.entries(spec.resource_rules).map(([res,rule],i)=>(<div key={res} style={{marginBottom:8,paddingLeft:10,borderLeft:`2px solid ${RES_COLORS[i%RES_COLORS.length]}44`}}><div style={{fontSize:10,fontFamily:F.mono,color:RES_COLORS[i%RES_COLORS.length],marginBottom:2}}>{res.toUpperCase()}</div><div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{rule}</div></div>))}</Section>
              <Section title="Round Structure"><div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.4)",lineHeight:1.8}}><div>Rounds: <span style={{color:"#e8b84d"}}>{spec.round_structure?.rounds||"?"}</span></div><div>Turns/agent/round: <span style={{color:"#e8b84d"}}>{spec.round_structure?.turns_per_agent||"?"}</span></div><div style={{color:"rgba(255,255,255,0.3)",marginTop:4}}>Between rounds: {spec.round_structure?.between_rounds}</div></div></Section>
              <Section title="Round-End Rules" accent="#e07a8e">{spec.round_end_rules?.map((rule,i)=>(<div key={i} style={{padding:"6px 10px",marginBottom:4,fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.45)",lineHeight:1.5,borderLeft:"2px solid rgba(255,255,255,0.1)",paddingLeft:12}}><span style={{color:"rgba(255,255,255,0.2)",marginRight:6}}>#{i+1}</span>{rule}</div>))}</Section>
            </div>
          </div>

          {/* Critique */}
          {critique && <CritiqueDisplay critique={critique} />}

          {/* Inspector */}
          <div style={{marginTop:16,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:12}}>
            <div style={{display:"flex",gap:3,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.15)",fontFamily:F.mono,alignSelf:"center",marginRight:6}}>Pipeline</span>
              {INSPECTOR_TABS.map(tab=>{const available=tab.id==="final_json"?!!spec:!!traces[tab.traceKey];return(<button key={tab.id} onClick={()=>{if(available){setShowInspector(true);setInspectorTab(tab.id)}}} style={{padding:"3px 8px",background:showInspector&&inspectorTab===tab.id?"rgba(232,184,77,0.12)":"rgba(255,255,255,0.02)",border:`1px solid ${showInspector&&inspectorTab===tab.id?"rgba(232,184,77,0.3)":"rgba(255,255,255,0.05)"}`,borderRadius:4,color:!available?"rgba(255,255,255,0.1)":showInspector&&inspectorTab===tab.id?"#e8b84d":"rgba(255,255,255,0.25)",fontFamily:F.mono,fontSize:8,cursor:available?"pointer":"default"}}>{tab.label}</button>)})}
              {showInspector&&<button onClick={()=>setShowInspector(false)} style={{padding:"3px 8px",background:"none",border:"1px solid rgba(255,255,255,0.05)",borderRadius:4,color:"rgba(255,255,255,0.2)",fontFamily:F.mono,fontSize:8,cursor:"pointer",marginLeft:"auto"}}>Close</button>}
            </div>
            {showInspector&&(()=>{const tab=INSPECTOR_TABS.find(t=>t.id===inspectorTab);const content=tab?getTabContent(tab):"";return(<div style={{animation:"fadeIn 0.3s ease"}}><div style={{display:"flex",gap:8,marginBottom:6}}><span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.2)"}}>{content.length.toLocaleString()} chars</span><button onClick={async()=>{try{await navigator.clipboard.writeText(content)}catch{const ta=document.createElement("textarea");ta.value=content;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta)}setInspectorCopied(true);setTimeout(()=>setInspectorCopied(false),2000)}} style={{padding:"2px 8px",background:inspectorCopied?"rgba(142,224,122,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${inspectorCopied?"rgba(142,224,122,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:3,color:inspectorCopied?"#8ee07a":"rgba(255,255,255,0.3)",fontFamily:F.mono,fontSize:8,cursor:"pointer"}}>{inspectorCopied?"✓ Copied":"Copy"}</button></div><pre style={{padding:"14px 16px",background:"rgba(255,255,255,0.02)",borderRadius:6,border:"1px solid rgba(255,255,255,0.05)",fontSize:10,fontFamily:F.mono,color:tab?.color||"rgba(255,255,255,0.35)",lineHeight:1.55,overflow:"auto",maxHeight:400,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{content}</pre></div>)})()}
          </div>

          {/* Play button */}
          <div style={{marginTop:24}}>
            <button onClick={()=>{if(Object.keys(portraits).length>0){setPhase("portraits")}else{generatePortraits()}}} style={{width:"100%",padding:"14px 0",background:"#e8b84d",color:"#0f0f0e",border:"none",borderRadius:6,fontFamily:F.mono,fontSize:12,fontWeight:500,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>{Object.keys(portraits).length>0?"View Characters":"Design Characters"}</button>
            <button onClick={()=>setPhase("prompt")} style={{width:"100%",marginTop:8,padding:"10px 0",background:"none",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>Back to Prompt</button>
            {rounds.length>0&&<button onClick={()=>{const totalR=spec.round_structure?.rounds||5;const lastRound=rounds[rounds.length-1];setPhase(lastRound?.game_over||rounds.length>=totalR?"done":"running")}} style={{width:"100%",marginTop:8,padding:"10px 0",background:"rgba(125,189,232,0.08)",color:"#7dbde8",border:"1px solid rgba(125,189,232,0.2)",borderRadius:6,fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>Back to Game (Round {rounds.length})</button>}
          </div>
        </div>
      )}

      {/* ═══ PORTRAITS ═══ */}
      {phase==="portraits"&&spec&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"40px 20px",animation:"fadeIn 0.5s ease"}}>
          <h1 style={{fontFamily:F.serif,fontSize:32,fontWeight:400,color:"#c896e0",margin:"0 0 8px 0"}}>Character Design</h1>
          <p style={{fontSize:11,fontFamily:F.mono,color:"rgba(255,255,255,0.4)",marginBottom:24}}>{spec.title}</p>
          {portraitStage && (
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
              <div style={{width:14,height:14,border:"2px solid rgba(200,150,224,0.2)",borderTopColor:"#c896e0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
              <span style={{fontSize:12,fontFamily:F.mono,color:"rgba(200,150,224,0.7)",animation:"pulse 1.5s ease infinite"}}>{portraitStage==="designing"?"Designing appearances…":portraitStage==="world"?"Painting the world…":"Painting portraits…"}</span>
            </div>
          )}
          {portraitDesign && (
            <div style={{marginBottom:20,maxWidth:500,width:"100%"}}>
              <div style={{padding:"10px 14px",background:"rgba(200,150,224,0.06)",border:"1px solid rgba(200,150,224,0.15)",borderRadius:6,marginBottom:16}}>
                <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"#c896e0",marginBottom:4}}>Art Style</div>
                <div style={{fontSize:12,fontFamily:F.serif,color:"rgba(255,255,255,0.7)"}}>{portraitDesign.style}</div>
                <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.35)",marginTop:4}}>{portraitDesign.style_rationale}</div>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:24,flexWrap:"wrap",justifyContent:"center",marginBottom:30}}>
            {spec.agents.map((agent,i) => {
              const color = COLORS[i%COLORS.length];
              const pd = portraitDesign?.portraits?.find(p=>p.id===agent.id);
              const img = portraits[agent.id];
              return (
                <div key={agent.id} style={{width:220,animation:"fadeIn 0.5s ease both",animationDelay:`${i*0.15}s`}}>
                  <div style={{width:220,aspectRatio:"3/4",borderRadius:8,overflow:"hidden",border:`1px solid ${color}44`,marginBottom:10,background:"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {img ? <img src={img} alt={agent.name} style={{width:"100%",height:"100%",objectFit:"contain"}} />
                      : portraitStage ? <div style={{width:20,height:20,border:`2px solid ${color}33`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
                      : <div style={{fontSize:10,fontFamily:F.mono,color:"rgba(255,255,255,0.15)"}}>No portrait</div>}
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:F.serif,fontSize:16,color,marginBottom:4}}>{agent.name}</div>
                    {pd && (
                      <div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.35)",lineHeight:1.5,textAlign:"left"}}>
                        <div style={{marginBottom:3}}>{pd.appearance}</div>
                        <div style={{color:"rgba(255,255,255,0.25)"}}>{pd.clothing}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* World image */}
          {(worldImage || worldDesign) && (
            <div style={{width:"100%",maxWidth:700,marginBottom:30,animation:"fadeIn 0.5s ease both"}}>
              <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(232,184,77,0.5)",marginBottom:8,textAlign:"center"}}>The World</div>
              {worldImage && <div style={{width:"100%",aspectRatio:"16/9",borderRadius:8,overflow:"hidden",border:"1px solid rgba(232,184,77,0.2)",marginBottom:8}}><img src={worldImage} alt="World" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>}
              {worldDesign?.scene_description && <p style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6,margin:0,textAlign:"center",fontStyle:"italic"}}>{worldDesign.scene_description}</p>}
            </div>
          )}
          {!portraitStage && (
            <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
              <button onClick={()=>{setPhase("review");setPortraitStage(null);}} style={{padding:"10px 20px",background:"none",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,fontFamily:F.mono,fontSize:10,cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Back to Review</button>
              <button onClick={generatePortraits} style={{padding:"10px 20px",background:"rgba(200,150,224,0.12)",color:"#c896e0",border:"1px solid rgba(200,150,224,0.25)",borderRadius:6,fontFamily:F.mono,fontSize:10,cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Regenerate</button>
              {rounds.length>0&&<button onClick={()=>{const totalR=spec.round_structure?.rounds||5;const lastRound=rounds[rounds.length-1];setPhase(lastRound?.game_over||rounds.length>=totalR?"done":"running")}} style={{padding:"10px 20px",background:"rgba(125,189,232,0.08)",color:"#7dbde8",border:"1px solid rgba(125,189,232,0.2)",borderRadius:6,fontFamily:F.mono,fontSize:10,cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Back to Game</button>}
              <button onClick={startGame} style={{padding:"10px 24px",background:"#e8b84d",color:"#0f0f0e",border:"none",borderRadius:6,fontFamily:F.mono,fontSize:12,fontWeight:500,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>{humanAgentId?`Play as ${spec.agents.find(a=>a.id===humanAgentId)?.name}`:"Start Game"}</button>
            </div>
          )}
          {error&&<div style={{marginTop:14,padding:"8px 12px",background:"rgba(224,122,142,0.12)",border:"1px solid rgba(224,122,142,0.3)",borderRadius:5,fontSize:11,color:"#e07a8e",maxWidth:640,width:"100%"}}>{error}</div>}
        </div>
      )}

      {/* ═══ GAME ═══ */}
      {(phase==="running"||phase==="done")&&spec&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",animation:"fadeIn 0.5s ease"}}>
          <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h2 style={{fontFamily:F.serif,fontSize:19,fontWeight:400,color:"#e8b84d",margin:0}}>{spec.title}</h2>
              {humanAgentId&&<span style={{fontSize:8,fontFamily:F.mono,color:"#8ee07a",padding:"1px 6px",background:"rgba(142,224,122,0.1)",border:"1px solid rgba(142,224,122,0.25)",borderRadius:10}}>Playing as {spec.agents.find(a=>a.id===humanAgentId)?.name}</span>}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setPhase("review")} style={{padding:"4px 10px",background:"rgba(232,184,77,0.08)",border:"1px solid rgba(232,184,77,0.15)",borderRadius:4,color:"rgba(232,184,77,0.6)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Spec</button>
              {Object.keys(portraits).length>0&&<button onClick={()=>setPhase("portraits")} style={{padding:"4px 10px",background:"rgba(200,150,224,0.08)",border:"1px solid rgba(200,150,224,0.15)",borderRadius:4,color:"rgba(200,150,224,0.6)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Art</button>}
              {storyChapters.length>0&&<button onClick={()=>setPhase("story")} style={{padding:"4px 10px",background:"rgba(200,150,224,0.1)",border:"1px solid rgba(200,150,224,0.2)",borderRadius:4,color:"#c896e0",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Story ({storyChapters.length})</button>}
              {rounds.length>0&&<button onClick={copyLog} style={{padding:"4px 10px",background:copied?"rgba(142,224,122,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${copied?"rgba(142,224,122,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:4,color:copied?"#8ee07a":"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>{copied?"✓ Copied":"Copy Log"}</button>}
              <button onClick={exportGame} style={{padding:"4px 10px",background:"rgba(125,189,232,0.08)",border:"1px solid rgba(125,189,232,0.2)",borderRadius:4,color:"#7dbde8",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Export</button>
              <button onClick={reset} style={{padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>New</button>
            </div>
          </div>
          <div style={{display:"flex",flex:1,overflow:"hidden"}}>
            {/* Sidebar */}
            <div style={{width:260,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.07)",padding:"14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
              {worldImage&&<div style={{width:"100%",borderRadius:6,overflow:"hidden",border:"1px solid rgba(232,184,77,0.15)"}}><img src={worldImage} alt="World" style={{width:"100%",height:"auto",display:"block"}} /></div>}
              {worldState&&<div><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:1.5,color:"rgba(255,255,255,0.3)",marginBottom:5}}>Shared</div><ResourceBar resources={worldState.shared_pool} color="#e8b84d" /></div>}
              {spec.agents.map((agent,i)=><AgentCard key={agent.id} agent={agent} state={worldState?.agents[agent.id]} identity={identities[agent.id]} color={COLORS[i%COLORS.length]} activeId={simPhase?.id||null} isHuman={agent.id===humanAgentId} portrait={portraits[agent.id]} />)}
            </div>
            {/* Main */}
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div ref={logRef} style={{flex:1,overflowY:"auto",padding:"0",display:"flex",flexDirection:"column"}}>
                {(rounds.length > 0 || busy) && <RoundNav rounds={rounds} busy={busy} viewingRound={viewingRound} setViewingRound={setViewingRound} liveRoundNum={liveRoundNum} />}

                <div style={{padding:"18px 24px",flex:1}}>
                  {rounds.length===0&&!busy&&!humanPrompt&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><div style={{fontFamily:F.serif,fontSize:17,color:"rgba(255,255,255,0.35)",fontStyle:"italic"}}>Ready.</div></div>}

                  {(()=>{
                    const displayRound = viewingRound ?? (rounds.length > 0 ? rounds.length - 1 : null);
                    const isViewingLatest = viewingRound === null;
                    return (<>
                      {/* Completed round view */}
                      {displayRound != null && displayRound < rounds.length && !isViewingLatest && (
                        <RoundEntry round={rounds[displayRound]} spec={spec} />
                      )}

                      {/* Latest view: show last completed round when not busy */}
                      {isViewingLatest && !busy && rounds.length > 0 && (
                        <RoundEntry round={rounds[rounds.length - 1]} spec={spec} />
                      )}

                      {/* Live section — only when viewing latest */}
                      {isViewingLatest && (liveTurns.length>0||liveNegotiations.length>0||liveConversations.length>0) && (
                        <div style={{marginBottom:20}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{fontFamily:F.mono,fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"rgba(255,255,255,0.45)"}}>Round {liveRoundNum}</div><div style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>in progress</div><div style={{flex:1,height:1,background:"rgba(255,255,255,0.08)"}} /></div>
                          {liveTurns.map((t,i)=><LiveTurnEntry key={i} turn={t} spec={spec} />)}
                          {liveNegotiations.map((n,i)=><NegotiationEntry key={`n${i}`} nego={n} spec={spec} />)}
                          {humanPrompt?.type !== "chat_negotiate" && humanPrompt?.type !== "chat_private" && liveConversations.map((c,i)=><ConversationEntry key={`c${i}`} convo={c} spec={spec} />)}
                        </div>
                      )}

                      {/* Human inputs — only when viewing latest */}
                      {isViewingLatest && (<>
                        {humanPrompt?.type==="action"&&<HumanActionPanel agent={humanPrompt.data.agent} spec={spec} worldState={humanPrompt.data.worldState} onSubmit={submitHumanInput} color={COLORS[spec.agents.findIndex(a=>a.id===humanAgentId)%COLORS.length]} injectedEvent={humanPrompt.data.injectedEvent} />}
                        {(humanPrompt?.type==="negotiation_response"||humanPrompt?.type==="counter_response")&&<HumanNegotiationPanel type={humanPrompt.type} proposerName={humanPrompt.data.proposerName} proposal={humanPrompt.data.proposal} onSubmit={submitHumanInput} />}
                        {humanPrompt?.type==="channel_pick"&&<HumanChannelPicker agents={humanPrompt.data.agents} humanAgentId={humanAgentId} onPick={(target)=>submitHumanInput({target})} />}
                        {humanPrompt?.type==="interlude"&&<InterludePanel spec={humanPrompt.data.spec||spec} worldState={humanPrompt.data.worldState} roundNum={humanPrompt.data.roundNum} onContinue={(injections)=>submitHumanInput(injections)} />}
                        {(humanPrompt?.type === "chat_negotiate" || humanPrompt?.type === "chat_private") && (
                          <>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                              <button onClick={() => setVoiceMode(v => !v)}
                                style={{ padding: "4px 12px", background: voiceMode ? "rgba(142,224,122,0.1)" : "rgba(232,184,77,0.08)", border: `1px solid ${voiceMode ? "rgba(142,224,122,0.25)" : "rgba(232,184,77,0.2)"}`, borderRadius: 4, color: voiceMode ? "#8ee07a" : "#e8b84d", fontFamily: F.mono, fontSize: 10, cursor: "pointer" }}>
                                {voiceMode ? "\u2328 Text Mode" : "\uD83C\uDF99 Voice Mode"}
                              </button>
                            </div>
                            {voiceMode ? (
                              <LiveVoiceChatPanel
                                otherName={humanPrompt.data.otherName}
                                onComplete={(thread) => submitHumanInput(thread)}
                                color={COLORS[spec.agents.findIndex(a => a.id === humanAgentId) % COLORS.length]}
                                title={humanPrompt.data.title}
                                data={humanPrompt.data}
                                spec={spec}
                              />
                            ) : (
                              <HumanChatPanel otherName={humanPrompt.data.otherName} title={humanPrompt.data.title} initialThread={[]}
                                onComplete={(thread) => submitHumanInput(thread)}
                                getAIResponse={async (currentThread) => { const d = humanPrompt.data; const threadForPrompt = currentThread.map(m => ({ from: m.from === "YOU" ? d.humanName : m.from, text: m.text })); const roundResult = d.roundResult || { narration: "Negotiation before resolution." }; try { const turnR = await callLLM(buildConversationTurnPrompt(d.specObj, d.aiAgent, d.ws.agents[d.aiAgentId], d.ids[d.aiAgentId], d.humanName, threadForPrompt, roundResult, d.roundNum), `Continue as ${d.aiAgent.name}. JSON.`, 500); return turnR.message || "<END TALK>"; } catch (e) { console.warn("AI chat response failed:", e); return "I need a moment to think. <END TALK>"; } }}
                                color={COLORS[spec.agents.findIndex(a => a.id === humanAgentId) % COLORS.length]}
                              />
                            )}
                          </>
                        )}
                      </>)}

                      {isViewingLatest && busy && !humanPrompt && <PhaseIndicator info={simPhase} agents={spec.agents} />}
                    </>);
                  })()}
                </div>
              </div>
              {phase!=="done"&&!humanPrompt&&(
                <div style={{padding:"10px 24px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={playRound} disabled={busy} style={{padding:"8px 16px",background:busy?"rgba(255,255,255,0.03)":"#e8b84d",color:busy?"rgba(255,255,255,0.2)":"#0f0f0e",border:"none",borderRadius:5,fontFamily:F.mono,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:"uppercase",cursor:busy?"default":"pointer"}}>Round {currentRound}</button>
                  {!humanAgentId&&<button onClick={playAll} disabled={busy} style={{padding:"8px 16px",background:"rgba(255,255,255,0.04)",color:busy?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:5,fontFamily:F.mono,fontSize:10,textTransform:"uppercase",cursor:busy?"default":"pointer"}}>Run All</button>}
                  {!humanAgentId&&<label style={{display:"flex",alignItems:"center",gap:4,fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.4)",cursor:"pointer",userSelect:"none"}}><input type="checkbox" checked={skipInterludes} onChange={e=>setSkipInterludes(e.target.checked)} style={{margin:0}} />Skip interludes</label>}
                  {rounds.length>0&&<button onClick={rerunRound} disabled={busy} style={{padding:"8px 16px",background:busy?"rgba(255,255,255,0.02)":"rgba(232,184,77,0.08)",color:busy?"rgba(255,255,255,0.15)":"rgba(232,184,77,0.7)",border:`1px solid ${busy?"rgba(255,255,255,0.05)":"rgba(232,184,77,0.2)"}`,borderRadius:5,fontFamily:F.mono,fontSize:10,textTransform:"uppercase",cursor:busy?"default":"pointer"}}>Redo Last</button>}
                  {rounds.length>0&&<button onClick={replayFromStart} disabled={busy} style={{padding:"8px 16px",background:busy?"rgba(255,255,255,0.02)":"rgba(125,189,232,0.08)",color:busy?"rgba(255,255,255,0.15)":"rgba(125,189,232,0.7)",border:`1px solid ${busy?"rgba(255,255,255,0.05)":"rgba(125,189,232,0.2)"}`,borderRadius:5,fontFamily:F.mono,fontSize:10,textTransform:"uppercase",cursor:busy?"default":"pointer"}}>Replay</button>}
                  {!busy&&(<div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:8,fontFamily:F.mono,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:1,marginRight:4}}>{humanAgentId?"Switch":"Jump In"}</span>
                    <button onClick={()=>setHumanAgentId(null)} style={{padding:"6px 14px",background:!humanAgentId?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${!humanAgentId?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:5,color:!humanAgentId?"#ede4d3":"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>Spectator</button>
                    {spec.agents.map((a,i)=>{const c=COLORS[i%COLORS.length];const sel=humanAgentId===a.id;return <button key={a.id} onClick={()=>setHumanAgentId(a.id)} style={{padding:"6px 14px",background:sel?`${c}22`:"rgba(255,255,255,0.03)",border:`1px solid ${sel?`${c}55`:"rgba(255,255,255,0.06)"}`,borderRadius:5,color:sel?c:"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:10,cursor:"pointer"}}>{a.name}</button>})}
                  </div>)}
                </div>
              )}
              {phase==="done"&&!busy&&(
                <div style={{padding:"10px 24px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  <span style={{fontSize:9,color:"rgba(255,255,255,0.35)",textTransform:"uppercase"}}>Game Over</span>
                  {rounds.length>0&&<button onClick={rerunRound} style={{padding:"6px 12px",background:"rgba(232,184,77,0.08)",color:"rgba(232,184,77,0.7)",border:"1px solid rgba(232,184,77,0.2)",borderRadius:5,fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>Redo Last</button>}
                  {rounds.length>0&&<button onClick={replayFromStart} style={{padding:"6px 12px",background:"rgba(125,189,232,0.08)",color:"#7dbde8",border:"1px solid rgba(125,189,232,0.2)",borderRadius:5,fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>Replay</button>}
                  {storyChapters.length>0&&<button onClick={()=>setPhase("story")} style={{padding:"6px 12px",background:"rgba(200,150,224,0.12)",color:"#c896e0",border:"1px solid rgba(200,150,224,0.25)",borderRadius:5,fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>Read Story</button>}
                  <button onClick={copyLog} style={{padding:"6px 12px",background:copied?"rgba(142,224,122,0.15)":"rgba(255,255,255,0.04)",color:copied?"#8ee07a":"rgba(255,255,255,0.5)",border:`1px solid ${copied?"rgba(142,224,122,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:5,fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>{copied?"✓ Copied":"Copy Log"}</button>
                  <button onClick={exportGame} style={{padding:"6px 12px",background:"rgba(125,189,232,0.08)",color:"#7dbde8",border:"1px solid rgba(125,189,232,0.2)",borderRadius:5,fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>Export</button>
                  <button onClick={reset} style={{padding:"6px 12px",background:"rgba(232,184,77,0.12)",color:"#e8b84d",border:"1px solid rgba(232,184,77,0.25)",borderRadius:5,fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>New</button>
                </div>
              )}
            </div>
          </div>
          {error&&<div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",padding:"7px 16px",background:"rgba(224,122,142,0.15)",border:"1px solid rgba(224,122,142,0.3)",borderRadius:5,fontSize:11,color:"#e07a8e",fontFamily:F.mono,zIndex:100}}>{error}<button onClick={()=>setError(null)} style={{marginLeft:8,background:"none",border:"none",color:"#e07a8e",cursor:"pointer"}}>×</button></div>}
        </div>
      )}

      {/* ═══ STORY ═══ */}
      {phase==="story"&&spec&&(
        <div style={{minHeight:"100vh",animation:"fadeIn 0.5s ease"}}>
          <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h2 style={{fontFamily:F.serif,fontSize:19,fontWeight:400,color:"#c896e0",margin:0}}>{spec.title}</h2>
              <span style={{fontSize:8,fontFamily:F.mono,color:"rgba(200,150,224,0.5)",padding:"1px 6px",background:"rgba(200,150,224,0.08)",border:"1px solid rgba(200,150,224,0.2)",borderRadius:10}}>Story</span>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              {storyChapters.length>0&&(
                <>
                  <select value={ttsVoice} onChange={e=>{stopTTS();clearTtsCache();setTtsVoice(e.target.value)}} style={{padding:"3px 6px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontFamily:F.mono,fontSize:9,cursor:"pointer",outline:"none"}}>
                    {TTS_VOICES.map(v=><option key={v} value={v} style={{background:"#1a1a1e"}}>{v}</option>)}
                  </select>
                  {ttsPlaying!==null?(<button onClick={stopTTS} style={{padding:"4px 10px",background:"rgba(224,122,142,0.12)",border:"1px solid rgba(224,122,142,0.25)",borderRadius:4,color:"#e07a8e",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>◼ Stop</button>):(<button onClick={playAllTTS} disabled={ttsLoading!==null} style={{padding:"4px 10px",background:ttsLoading!==null?"rgba(255,255,255,0.03)":"rgba(232,184,77,0.1)",border:`1px solid ${ttsLoading!==null?"rgba(255,255,255,0.06)":"rgba(232,184,77,0.25)"}`,borderRadius:4,color:ttsLoading!==null?"rgba(255,255,255,0.3)":"#e8b84d",fontFamily:F.mono,fontSize:9,cursor:ttsLoading!==null?"default":"pointer"}}>▶ Read All</button>)}
                  <button onClick={copyStory} style={{padding:"4px 10px",background:copied?"rgba(142,224,122,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${copied?"rgba(142,224,122,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:4,color:copied?"#8ee07a":"rgba(255,255,255,0.4)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>{copied?"✓ Copied":"Copy Story"}</button>
                </>
              )}
              <button onClick={exportGame} style={{padding:"4px 10px",background:"rgba(125,189,232,0.08)",border:"1px solid rgba(125,189,232,0.2)",borderRadius:4,color:"#7dbde8",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Export</button>
              <button onClick={()=>{stopTTS();const totalR=spec.round_structure?.rounds||5;const isDone=rounds.length>=totalR||rounds[rounds.length-1]?.game_over;setPhase(isDone?"done":"running")}} style={{padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontFamily:F.mono,fontSize:9,cursor:"pointer"}}>Back to Game</button>
              <button onClick={()=>{stopTTS();reset()}} style={{padding:"4px 10px",background:"rgba(232,184,77,0.08)",border:"1px solid rgba(232,184,77,0.2)",borderRadius:4,color:"#e8b84d",fontFamily:F.mono,fontSize:9,cursor:"pointer",textTransform:"uppercase"}}>New</button>
            </div>
          </div>
          <div style={{maxWidth:720,margin:"0 auto",padding:"40px 24px"}}>
            <div style={{textAlign:"center",marginBottom:48}}>
              <h1 style={{fontFamily:F.serif,fontSize:38,fontWeight:400,color:"#e8b84d",margin:"0 0 12px 0",lineHeight:1.2}}>{spec.title}</h1>
              <p style={{fontFamily:F.serif,fontSize:14,color:"rgba(255,255,255,0.4)",fontStyle:"italic",margin:0,lineHeight:1.7}}>{spec.situation?.setting?.split(".").slice(0,2).join(".")+"."}</p>
              <div style={{width:60,height:1,background:"rgba(232,184,77,0.3)",margin:"20px auto"}} />
              <div style={{display:"flex",justifyContent:"center",gap:16}}>
                {spec.agents.map((a,i)=>(<span key={a.id} style={{fontFamily:F.mono,fontSize:10,color:COLORS[i%COLORS.length]}}>{a.name}</span>))}
              </div>
            </div>
            {storyChapters.map((ch, i) => (
              <div key={i} style={{marginBottom:48,animation:"fadeIn 0.6s ease both",animationDelay:`${i*0.1}s`}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <span style={{fontSize:9,fontFamily:F.mono,color:"rgba(200,150,224,0.4)",textTransform:"uppercase",letterSpacing:2,whiteSpace:"nowrap"}}>Chapter {i+1}</span>
                  <div style={{flex:1,height:1,background:"rgba(200,150,224,0.1)"}} />
                  {ttsPlaying===i?(
                    <button onClick={stopTTS} style={{padding:"2px 8px",background:"rgba(224,122,142,0.12)",border:"1px solid rgba(224,122,142,0.2)",borderRadius:3,color:"#e07a8e",fontFamily:F.mono,fontSize:8,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{display:"inline-flex",gap:2}}><span style={{width:2,height:8,background:"#e07a8e",animation:"pulse 0.6s ease infinite"}} /><span style={{width:2,height:8,background:"#e07a8e",animation:"pulse 0.6s ease 0.15s infinite"}} /><span style={{width:2,height:8,background:"#e07a8e",animation:"pulse 0.6s ease 0.3s infinite"}} /></span> Playing
                    </button>
                  ):ttsLoading===i?(
                    <span style={{fontSize:8,fontFamily:F.mono,color:"rgba(232,184,77,0.5)",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:10,height:10,border:"1.5px solid rgba(232,184,77,0.2)",borderTopColor:"#e8b84d",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}} /> Loading…
                    </span>
                  ):(
                    <button onClick={()=>playChapterTTS(i)} style={{padding:"2px 8px",background:ttsCachedChapters.has(i)?"rgba(142,224,122,0.06)":"rgba(232,184,77,0.06)",border:`1px solid ${ttsCachedChapters.has(i)?"rgba(142,224,122,0.15)":"rgba(232,184,77,0.15)"}`,borderRadius:3,color:ttsCachedChapters.has(i)?"rgba(142,224,122,0.5)":"rgba(232,184,77,0.5)",fontFamily:F.mono,fontSize:8,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.color=ttsCachedChapters.has(i)?"#8ee07a":"#e8b84d";e.target.style.borderColor=ttsCachedChapters.has(i)?"rgba(142,224,122,0.35)":"rgba(232,184,77,0.35)"}} onMouseLeave={e=>{e.target.style.color=ttsCachedChapters.has(i)?"rgba(142,224,122,0.5)":"rgba(232,184,77,0.5)";e.target.style.borderColor=ttsCachedChapters.has(i)?"rgba(142,224,122,0.15)":"rgba(232,184,77,0.15)"}}>{ttsCachedChapters.has(i)?"↻ Replay":"▶ Read Aloud"}</button>
                  )}
                  <span style={{fontSize:9,fontFamily:F.mono,color:"rgba(255,255,255,0.15)"}}>Round {ch.roundNumber}</span>
                </div>
                <h3 style={{fontFamily:F.serif,fontSize:22,fontWeight:400,color:"#c896e0",margin:"0 0 16px 0",lineHeight:1.3}}>{ch.title.replace(/^(chapter\s*\d+[:\s—–-]*)/i,"").replace(/^["']+|["']+$/g,"")}</h3>
                {chapterImages[i] && (
                  <div style={{margin:"0 0 20px 0",borderRadius:8,overflow:"hidden",border:"1px solid rgba(200,150,224,0.1)"}}>
                    <img src={chapterImages[i]} alt={`Chapter ${i+1}`} style={{width:"100%",display:"block"}} />
                  </div>
                )}
                {ch.body.split("\n\n").filter(Boolean).map((para, j) => (
                  <p key={j} style={{fontFamily:F.serif,fontSize:15,color:"rgba(255,255,255,0.72)",lineHeight:1.85,margin:"0 0 16px 0",textIndent:j>0?"1.5em":"0"}}>{para.trim()}</p>
                ))}
              </div>
            ))}
            {storyBusy && (
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 0",animation:"fadeIn 0.3s ease"}}>
                <div style={{width:14,height:14,border:"2px solid rgba(200,150,224,0.2)",borderTopColor:"#c896e0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
                <span style={{fontFamily:F.serif,fontSize:14,color:"rgba(200,150,224,0.5)",fontStyle:"italic"}}>Writing chapter {storyProgress}…</span>
              </div>
            )}
            {!storyBusy && storyChapters.length > 0 && storyChapters.length < (spec.round_structure?.rounds||5) && (
              <div style={{textAlign:"center",padding:"24px 0",animation:"fadeIn 0.4s ease"}}>
                <span style={{fontFamily:F.serif,fontSize:13,color:"rgba(255,255,255,0.25)",fontStyle:"italic"}}>The story continues… ({storyChapters.length} of {spec.round_structure?.rounds||5} chapters)</span>
              </div>
            )}
            {!storyBusy && storyChapters.length >= (spec.round_structure?.rounds||5) && (
              <div style={{textAlign:"center",padding:"32px 0",animation:"fadeIn 0.6s ease"}}>
                <div style={{width:40,height:1,background:"rgba(232,184,77,0.3)",margin:"0 auto 16px"}} />
                <span style={{fontFamily:F.serif,fontSize:14,color:"rgba(232,184,77,0.4)",fontStyle:"italic"}}>fin.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
