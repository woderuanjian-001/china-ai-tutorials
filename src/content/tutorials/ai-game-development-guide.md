---
title: "Game AI with Chinese LLMs: NPC Dialogue, Story Generation & Level Design Using DeepSeek and Qwen"
description: "Build intelligent games with Chinese AI models: natural NPC conversations, dynamic story generation, automated level design, and AI companions. Complete Unity + Chinese AI API integration with production-ready code examples using DeepSeek and Qwen."
category: "Hands-On Tutorials"
date: 2026-06-20
tags: ["Games", "NPC", "Story", "Level Design", "Unity", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will use AI to make games smarter:

- Natural language NPC dialogue (no more fixed script lines)
- AI-driven dynamic story generation
- Automated level design
- AI game companions and opponents

> 🎯 Traditional NPCs have only three lines like "Greetings, hero!" AI NPCs can discuss philosophy, fall in love, and tell stories only you two know.

---

## AI NPC Dialogue System

```python
class AINPCSystem:
    """AI NPC dialogue system"""

    def __init__(self):
        self.client = client
        self.npc_profiles = {}
        self.conversation_history = {}

    def create_npc(self, npc_id: str, profile: dict):
        """Create an AI NPC character"""
        self.npc_profiles[npc_id] = {
            "name": profile["name"],
            "role": profile["role"],
            "personality": profile["personality"],
            "backstory": profile["backstory"],
            "knowledge": profile.get("knowledge", []),
            "world_context": profile.get("world_context", ""),
        }
        self.conversation_history[npc_id] = []

    def chat_with_npc(
        self,
        npc_id: str,
        player_id: str,
        player_message: str,
        game_state: dict = None,
    ) -> dict:
        """Chat with an NPC"""
        npc = self.npc_profiles.get(npc_id)
        if not npc:
            return {"reply": "..."}

        # Conversation history (last 10 turns)
        history = self.conversation_history[npc_id][-10:]

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are an NPC in the game. Respond strictly according to your character profile.

Character: {npc['name']}
Identity: {npc['role']}
Personality: {npc['personality']}
Backstory: {npc['backstory']}
Relevant knowledge: {', '.join(npc['knowledge'])}
World setting: {npc['world_context']}

{f'Current game state: {json.dumps(game_state, ensure_ascii=False)}' if game_state else ''}

Rules:
- Always stay in character; do not say anything the character would not know
- Replies should be natural and emotional, not robotic
- Advance the narrative to potentially trigger quests or plot points
- Keep replies between 50-150 words
- Occasionally use action tags, e.g. (smiles), (sighs), (glances around warily)""",
                },
                *history,
                {"role": "user", "content": player_message},
            ],
            temperature=0.7,
            max_tokens=300,
        )

        reply = response.choices[0].message.content

        # Save dialogue history
        self.conversation_history[npc_id].append(
            {"role": "user", "content": player_message}
        )
        self.conversation_history[npc_id].append(
            {"role": "assistant", "content": reply}
        )

        # Check if an event should be triggered
        event = self._check_event_trigger(npc_id, player_message, reply)

        return {"npc_name": npc["name"], "reply": reply, "event": event}

    def _check_event_trigger(self, npc_id: str, player_msg: str, npc_reply: str) -> dict:
        """Detect if a game event should be triggered"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Check if the conversation triggers a game event.

Player: {player_msg}
NPC reply: {npc_reply}

Output JSON:
{{
  "triggered": true/false,
  "event_type": "quest/combat/trade/clue/none",
  "event_name": "Event name",
  "event_description": "Event description"
}}""",
                },
            ],
            temperature=0.1,
            max_tokens=200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"triggered": False}

# Usage
npc_system = AINPCSystem()

# Create a blacksmith NPC
npc_system.create_npc("blacksmith_01", {
    "name": "Old Tie",
    "role": "Weaponshop blacksmith",
    "personality": "Bold and straightforward, loves terrible puns, relentlessly strict about weapon quality",
    "backstory": "Once the kingdom's greatest swordsman, retired after injury to open this smithy. Knows many secrets of the martial world.",
    "knowledge": ["Weapon forging", "Underworld rumors", "Ancient ruin locations"],
    "world_context": "The Demon Lord is about to awaken; all races are preparing for war",
})

# Chat
result = npc_system.chat_with_npc(
    "blacksmith_01",
    "player_001",
    "Old Tie, I want to forge a blade that can slay dragons!",
    game_state={"player_level": 15, "gold": 200, "quest_progress": "Searching for dragon scales"},
)
print(f"🗡️ {result['npc_name']}: {result['reply']}")
if result["event"]:
    print(f"⚡ Quest triggered: {result['event']}")
```

---

## AI Dynamic Story Generation

```python
class AIStoryGenerator:
    """AI dynamic story system"""

    def generate_quest(
        self,
        world_state: dict,
        player_profile: dict,
        difficulty: str = "Medium",
    ) -> dict:
        """Generate a dynamic quest"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""As a game narrative designer, generate a quest suitable for the current world state.

World state: {json.dumps(world_state, ensure_ascii=False)}
Player profile: {json.dumps(player_profile, ensure_ascii=False)}
Difficulty: {difficulty}

Output JSON:
{{
  "quest_name": "Quest name",
  "quest_type": "Main/Side/Daily/Hidden",
  "description": "Quest description (immersive narrative)",
  "objectives": [
    {{"type": "kill/collect/talk/explore", "target": "target", "count": quantity}}
  ],
  "rewards": {{"gold": gold, "exp": experience, "items": ["item list"]}},
  "npc_involved": ["Related NPCs"],
  "dialogue_lines": ["Key dialogue lines"],
  "choices": [
    {{
      "description": "Choice description",
      "consequence": "Consequence"
    }}
  ],
  "lore": "World-building supplement"
}}""",
                },
            ],
            temperature=0.8,
            max_tokens=1500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"quest_name": "Random quest"}

    def evolve_world(self, world_state: dict, player_actions: list[str]) -> dict:
        """Advance world state based on player actions"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Update the world state based on player actions.

Current world: {json.dumps(world_state, ensure_ascii=False)}
Player actions: {', '.join(player_actions)}

Output JSON (only the changed portions):
{{
  "changes": ["Specific changes"],
  "new_events": ["Newly occurring events"],
  "affected_factions": {{"Faction name": "Attitude change (Friendly/Neutral/Hostile)"}},
  "world_tension": "Current world tension (1-10)"
}}""",
                },
            ],
            temperature=0.5,
        )

        try:
            changes = json.loads(response.choices[0].message.content)
            world_state.update(changes)
            return world_state
        except:
            return world_state

# Usage
story = AIStoryGenerator()

quest = story.generate_quest(
    world_state={"era": "Eve of the Demon Lord's awakening", "factions": {"Humans": "Preparing for war", "Elves": "Observing"}},
    player_profile={"name": "Arthur", "class": "Swordsman", "level": 15, "reputation": "Rising star of the Knight Order"},
)
print(f"📜 New quest: {quest.get('quest_name')}")
print(f"Description: {quest.get('description')}")
for obj in quest.get("objectives", []):
    print(f"  • {obj['type']}: {obj.get('target', '?')} x{obj.get('count', 1)}")
```

---

## AI Level Auto-Design

```python
class AILevelDesigner:
    """AI level designer"""

    def generate_dungeon(
        self,
        theme: str,
        player_level: int,
        rooms: int = 10,
    ) -> dict:
        """AI generates a dungeon"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design a dungeon (suitable for level {player_level} players).

Theme: {theme}
Number of rooms: {rooms}

Output JSON:
{{
  "dungeon_name": "Dungeon name",
  "atmosphere": "Atmosphere description",
  "rooms": [
    {{
      "id": room number,
      "type": "entrance/battle/puzzle/treasure/boss/safe",
      "name": "Room name",
      "description": "Visual description",
      "enemies": [{{"name": "Monster name", "level": level, "count": quantity}}],
      "puzzle": "Puzzle description",
      "treasure": ["Possible loot"],
      "exits": [connected room IDs]
    }}
  ],
  "boss": {{"name": "Boss name", "abilities": ["skills"], "loot": "drop"}},
  "difficulty_curve": "Difficulty curve description"
}}""",
                },
            ],
            temperature=0.7,
            max_tokens=2048,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_encounter(self, party_level: int, environment: str) -> dict:
        """AI generates an encounter"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design an encounter.

Party level: {party_level}
Environment: {environment}

Output JSON:
{{
  "encounter_name": "Encounter name",
  "description": "Scene the players encounter",
  "enemies": [enemy configs],
  "terrain_features": ["Terrain features"],
  "tactics_suggestion": "Tactical advice",
  "difficulty": "Easy/Medium/Hard/Deadly",
  "xp_reward": XP reward
}}

Balance rule: Total monster CR ≈ 80-120% of party level""",
                },
            ],
            temperature=0.6,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
level_designer = AILevelDesigner()

dungeon = level_designer.generate_dungeon(
    theme="A forgotten dwarven mine, now overrun by the undead",
    player_level=12,
    rooms=8,
)
print(f"🏰 {dungeon.get('dungeon_name')}")
print(f"Atmosphere: {dungeon.get('atmosphere')}")
for room in dungeon.get("rooms", []):
    print(f"  [{room['type']}] {room['name']}")
```

---

## Unity C# Integration

```csharp
// Calling AI dialogue API from Unity
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

public class AINPCController : MonoBehaviour
{
    private string apiKey = "your-deepseek-key";
    private string apiUrl = "https://api.deepseek.com/v1/chat/completions";

    public string npcProfile = @"
    You are Wang, the tavern keeper in the game.
    Warm and talkative, always well-informed.
    You know every piece of gossip in town.";

    public async void TalkToNPC(string playerMessage, System.Action<string> callback)
    {
        var payload = new
        {
            model = "deepseek-v4-pro",
            messages = new[]
            {
                new { role = "system", content = npcProfile },
                new { role = "user", content = playerMessage }
            },
            temperature = 0.7,
            max_tokens = 200
        };

        string json = JsonUtility.ToJson(payload);

        using (UnityWebRequest request = new UnityWebRequest(apiUrl, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("Authorization", $"Bearer {apiKey}");

            await request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<APIResponse>(request.downloadHandler.text);
                callback?.Invoke(response.choices[0].message.content);
            }
            else
            {
                callback?.Invoke("(NPC is temporarily unavailable)");
            }
        }
    }

    [System.Serializable]
    private class APIResponse
    {
        public Choice[] choices;
    }

    [System.Serializable]
    private class Choice
    {
        public Message message;
    }

    [System.Serializable]
    private class Message
    {
        public string content;
    }
}
```

---

## Next Steps

- [AI Digital Human Guide](/tutorials/ai-digital-human-guide/)
- [AI Video Editing](/tutorials/ai-video-editing-guide/)

> 📝 Based on DeepSeek + Unity + Python, June 2026.
