---
title: "Chinese AI Comics & Animation: Storyboarding, Character Design & Inbetweening with Kling/Hunyuan/GLM"
description: "Generate comics and animation with Chinese AI models: AI comic storyboarding, consistent character design, animation inbetweening, and AI auto-coloring. Includes StoryDiffusion, ToonCrafter and Kling complete creative workflow."
category: "Advanced Models"
date: 2026-06-27
tags: ["Comics", "Animation", "Storyboarding", "Character Design", "AIGC", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will use AI to create comics and animation:

- AI comic storyboarding and script generation
- Consistent character design
- Automatic animation inbetweening
- AI auto-coloring

> One person + AI = an animation studio. Storyboarding -> line art -> coloring -> inbetweening -> compositing — AI accelerates every step by 10x.

---

## Comic Storyboarding

```python
class ComicStoryboardAI:
    """AI comic storyboard generation"""

    def __init__(self):
        self.client = client

    def generate_storyboard(self, story: str, pages: int = 8, panels_per_page: int = 4) -> dict:
        """Generate comic storyboard from a story"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Convert the following story into a {pages}-page comic storyboard script.

Story: {story}

Output JSON:
{{
  "title": "Comic title",
  "pages": [
    {{
      "page_number": 1,
      "panels": [
        {{
          "panel_number": 1,
          "shot_type": "Wide/Medium/Close-up/Extreme close-up/Bird's eye",
          "angle": "Camera angle (eye-level/low-angle/high-angle)",
          "composition": "Composition description",
          "action": "Action description",
          "dialogue": "Dialogue/Narration",
          "sfx": "Sound effect text",
          "mood": "Atmosphere",
          "image_prompt": "AI image generation prompt in English"
        }}
      ]
    }}
  ],
  "character_expressions": "Character expression change notes",
  "color_palette": "Color scheme",
  "pacing_notes": "Pacing notes"
}}

Storyboarding principles:
- Hook at the beginning, cliffhanger at the end
- Fast pace for action scenes (small many panels), slow pace for emotional scenes (large panels)
- No more than 3 lines of dialogue per panel""",
                },
            ],
            temperature=0.8,
            max_tokens=3000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_dialogue(self, scene: str, characters: list[dict]) -> list[dict]:
        """Generate character dialogue"""
        chars_text = json.dumps(characters, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Write comic dialogue for the following scene.

Scene: {scene}
Characters: {chars_text}

Output JSON array:
[
  {{
    "character": "Speaking character name",
    "dialogue": "Dialogue content",
    "inner_thought": "Inner monologue (if any)",
    "expression": "Expression (with narration notes if needed)",
    "action": "Simultaneous action"
  }}
]

Dialogue requirements: match character personality, advance the plot, sound natural""",
                },
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

# Usage
comic_ai = ComicStoryboardAI()

story = "A teenager finds an injured black cat on the way home from school and takes it home to care for it. The next morning, he wakes up to find the cat has turned into a girl who says she is a cursed cat spirit — she needs to grant him three wishes to break the curse."

storyboard = comic_ai.generate_storyboard(story, pages=4, panels_per_page=3)
print(f"Comic title: {storyboard.get('title')}")

for page in storyboard.get("pages", []):
    print(f"\nPage {page['page_number']}:")
    for panel in page.get("panels", []):
        print(f"  [{panel['shot_type']}] {panel['action'][:50]}...")
```

---

## Consistent Character Design

```python
class CharacterDesigner:
    """AI character designer — ensures consistency across multiple images"""

    def design_character(self, description: str, style: str = "Anime") -> dict:
        """Design a character"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Design a {style}-style character.

Character description: {description}

Output JSON:
{{
  "name": "Character name",
  "appearance": {{
    "age": "Apparent age",
    "height": "Height and build",
    "face": "Face shape, eye shape, nose shape, mouth shape",
    "hair": "Hairstyle, hair color, length",
    "eyes": "Eye color and features",
    "clothing": "Clothing description (casual/combat/special)",
    "accessories": ["Accessories"],
    "distinctive_features": ["Distinguishing features"]
  }},
  "personality": {{
    "mbti_style": "Personality type",
    "speech_style": "Speech manner",
    "habits": ["Signature gestures"],
    "likes": ["Likes"],
    "dislikes": ["Dislikes"]
  }},
  "expression_sheet": [
    {{"emotion": "Expression", "description": "Facial feature description", "image_prompt": "Image generation prompt"}}
  ],
  "character_sheet_prompt": "Character turnaround image generation prompt (front/side/back)",
  "consistency_keywords": ["Keywords to ensure character consistency (add to every generation)"]
}}""",
                },
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_pose(self, character: dict, pose_description: str, background: str = "") -> str:
        """Generate a pose-specific prompt for the character"""
        keywords = " ".join(character.get("consistency_keywords", []))
        name = character.get("name", "")
        appearance = json.dumps(character.get("appearance", {}), ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a specific pose AI image generation prompt for a character.

Character name: {name}
Character appearance: {appearance}
Consistency keywords: {keywords}
Pose description: {pose_description}
Background: {background or "Simple background"}

Generate a detailed English Stable Diffusion prompt with the following requirements:
1. Include character consistency keywords
2. Describe pose and expression in detail
3. Specify art style (anime/manga style)
4. Include quality keywords (masterpiece, best quality)
5. Include negative prompt suggestions""",
                },
            ],
            temperature=0.5,
            max_tokens=500,
        )
        return response.choices[0].message.content

# Usage
designer = CharacterDesigner()

character = designer.design_character(
    "A 17-year-old cat spirit girl with long silver-white hair, amber-colored vertical pupils, cat ears and tail that she usually hides. Wears a school uniform. Tsundere personality but gentle at heart.",
    style="Anime",
)

print(f"Character: {character.get('name')}")
appearance = character.get("appearance", {})
print(f"Appearance: {appearance.get('hair')}, {appearance.get('eyes')}")
print(f"Clothing: {appearance.get('clothing')}")
print(f"Consistency keywords: {', '.join(character.get('consistency_keywords', []))}")

# Generate a specific pose
prompt = designer.generate_pose(character, "Sitting by the window watching the rain, side profile, melancholic expression")
print(f"\nImage generation prompt: {prompt[:200]}...")
```

---

## Animation Inbetweening

```python
class AnimationFrameAI:
    """AI animation inbetweening"""

    def generate_inbetween_frames(self, frame1_desc: str, frame2_desc: str, count: int = 3) -> list[dict]:
        """Generate inbetween frames between two keyframes"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate descriptions for {count} inbetween frames between the following two frames.

Start frame: {frame1_desc}
End frame: {frame2_desc}

Output JSON array ({count} inbetween frames, in order):
[
  {{
    "frame_number": Frame number,
    "progress_percent": Progress percentage,
    "description": "Frame description (detailed)",
    "key_changes": ["Changes from the previous frame"],
    "easing": "Easing type (ease-in/ease-out/linear)",
    "image_prompt": "Image generation prompt"
  }}
]

Note: Motion should follow animation principles (slow in/out, follow-through, squash and stretch)""",
                },
            ],
            temperature=0.5,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def generate_animation_sequence(self, keyframes: list[dict], fps: int = 12) -> dict:
        """Generate a complete animation sequence plan from keyframes"""
        keyframes_text = json.dumps(keyframes, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a complete animation sequence plan based on keyframes.

Keyframes: {keyframes_text}
Target frame rate: {fps} fps

Output JSON:
{{
  "total_frames": Total frame count,
  "duration_seconds": Duration,
  "keyframe_positions": ["Frame numbers where keyframes are located"],
  "tweening_plan": [
    {{
      "between_keyframes": "Between keyframes X and Y",
      "frame_count": Number of inbetween frames,
      "motion_type": "Motion type (translation/rotation/scale/deformation)",
      "easing_curve": "Easing curve"
    }}
  ],
  "looping": true/false,
  "post_processing": ["Post-processing suggestions (e.g., motion blur, ghosting, etc.)"]
}}""",
                },
            ],
            temperature=0.3,
            max_tokens=1200,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
anim_ai = AnimationFrameAI()

# Generate inbetween frames
inbetweens = anim_ai.generate_inbetween_frames(
    "A girl stands by the window, arms hanging naturally at her sides, calm expression",
    "The girl raises her right hand to wave goodbye, a smile appears on her face",
    count=3,
)

for frame in inbetweens:
    print(f"Frame {frame['frame_number']} ({frame['progress_percent']}%): {frame['description'][:60]}...")
```

---

## AI Auto-Coloring

```python
class AIColorist:
    """AI auto-coloring"""

    def suggest_color_scheme(self, scene_description: str, mood: str, time_of_day: str) -> dict:
        """AI suggests a color scheme"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Suggest a color scheme for a comic/animation scene.

Scene: {scene_description}
Mood: {mood}
Time of day: {time_of_day}

Output JSON:
{{
  "palette_name": "Color scheme name",
  "colors": {{
    "primary": {{"hex": "#XXXXXX", "usage": "Primary color usage"}},
    "secondary": {{"hex": "#XXXXXX", "usage": "Secondary color usage"}},
    "accent": {{"hex": "#XXXXXX", "usage": "Accent color usage"}},
    "background": {{"hex": "#XXXXXX", "usage": "Background color"}},
    "shadow": {{"hex": "#XXXXXX", "usage": "Shadow color"}},
    "highlight": {{"hex": "#XXXXXX", "usage": "Highlight color"}}
  }},
  "character_colors": {{
    "skin": "#XXXXXX",
    "hair": "#XXXXXX",
    "eyes": "#XXXXXX",
    "clothing": ["#XXXXXX"]
  }},
  "lighting": {{
    "type": "Light source type",
    "direction": "Light direction",
    "intensity": "Strong/Medium/Soft",
    "color_temperature": "Color temperature (warm/cool/neutral)"
  }},
  "color_harmony": "Color harmony explanation",
  "mood_board_keywords": ["Mood board keywords"]
}}""",
                },
            ],
            temperature=0.6,
            max_tokens=1000,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_coloring_prompt(self, line_art_description: str, color_scheme: dict) -> str:
        """Generate a coloring prompt"""
        scheme_text = json.dumps(color_scheme, ensure_ascii=False)

        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a coloring prompt for line art.

Line art description: {line_art_description}
Color scheme: {scheme_text}

Generate an English Stable Diffusion img2img prompt with:
- Specify coloring style (flat/cel-shading/oil painting/watercolor etc.)
- Include lighting setup
- Color reference
- Quality keywords""",
                },
            ],
            temperature=0.4,
            max_tokens=400,
        )
        return response.choices[0].message.content

# Usage
colorist = AIColorist()

scheme = colorist.suggest_color_scheme(
    "A Japanese-style classroom, sunset light streaming through the window, a girl stands alone in the empty classroom",
    mood="Warm but slightly melancholic",
    time_of_day="Dusk",
)

print(f"Color scheme: {scheme.get('palette_name')}")
colors = scheme.get("colors", {})
for name, info in colors.items():
    print(f"  {name}: {info['hex']} — {info['usage']}")

print(f"\nLighting: {scheme.get('lighting', {}).get('type')} | Direction: {scheme.get('lighting', {}).get('direction')}")
```

---

## Comics & Animation AI Toolchain

```
Story Inspiration -> AI Storyboarding -> AI Character Design -> AI Line Art Generation
                                      |
                                 AI Auto-Coloring
                                      |
                                 AI Scene Backgrounds
                                      |
                          +--- AI Animation Inbetweening ---+
                          |                                 |
                    ToonCrafter                        Kling
                    (Illustration to Video)     (Text to Video)
                          +-------------+-----------------+
                                        |
                                 AI Voice + SFX + BGM
                                        |
                                   Final Product
```

---

## Tools Available in China

| Tool | Function | Cost |
|------|------|------|
| **StoryDiffusion** | Story -> Continuous comic images | Open source, free |
| **ToonCrafter** | Two illustrations -> Animation inbetweens | Open source, free |
| **Kling** | Text/Image -> Video | Paid API |
| **Jimeng** | Text -> Image/Video | Paid API |
| **Tongyi Wanxiang** | Text -> Image | Free quota |
| **LiblibAI** | Online SD image generation | Free + Paid |

---

## Next Steps

- [AI 3D Generation](/tutorials/ai-3d-generation-guide/)
- [AI Video Generation](/tutorials/kling-video-generation-guide/)

> Based on StoryDiffusion + ToonCrafter + Kling, June 2026.
