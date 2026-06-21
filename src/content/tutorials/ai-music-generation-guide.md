---
title: "AI Music Creation in Practice: Generating Music, Arrangements & Compositions with Chinese AI Models"
description: "Create music with Chinese AI models: music generation, melody continuation, style transfer, and MIDI arrangement. Includes complete API call code for MusicGen + TianGong SkyMusic + NetEase TianYin."
category: "Advanced Models"
date: 2026-06-27
tags: ["Music", "Composition", "MusicGen", "MIDI", "TianGong", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will create music with AI:

- AI text-to-music generation
- Melody continuation and style transfer
- MIDI arrangement assistance
- Chinese AI music API integration

> 🎯 You don't need a conservatory background. Just describe "a light piano piece, rainy café atmosphere" and AI generates complete background music.

---

## TianGong SkyMusic API Integration

```python
from openai import OpenAI
import os
import base64
import json

class SkyMusicClient:
    """TianGong SkyMusic AI music generation"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("TIANGONG_API_KEY"),
            base_url="https://api.tiangong.cn/v1",
        )

    def generate_music(
        self,
        prompt: str,
        duration: int = 30,
        genre: str = "Pop",
        bpm: int = None,
    ) -> dict:
        """Generate music from a text description"""
        response = self.client.chat.completions.create(
            model="skymusic-v1",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a music generation AI.

Generation parameters:
- Description: {prompt}
- Genre: {genre}
- Duration: {duration} seconds
{f'- BPM: {bpm}' if bpm else ''}

Return JSON:
{{
  "title": "Track title",
  "description": "Music description",
  "instruments": ["Instruments used"],
  "mood": "Mood tags",
  "audio_url": "Generated audio URL"
}}""",
                },
            ],
            temperature=0.8,
            max_tokens=500,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"error": "Generation failed"}

    def continue_melody(self, midi_data: str, style: str = "Keep original style") -> dict:
        """Continue an existing melody"""
        response = self.client.chat.completions.create(
            model="skymusic-v1",
            messages=[
                {
                    "role": "system",
                    "content": f"""Continue the following melody, {style}.

Output JSON:
{{
  "continuation": "Continuation description",
  "bars_added": number of bars added,
  "harmonic_progression": ["Chord progression"],
  "suggested_instruments": ["Suggested instruments"]
}}""",
                },
                {"role": "user", "content": midi_data[:2000]},
            ],
            temperature=0.6,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def style_transfer(
        self,
        source_url: str,
        target_style: str,
    ) -> dict:
        """Music style transfer — Pop → Jazz / Rock → Classical"""
        response = self.client.chat.completions.create(
            model="skymusic-v1",
            messages=[
                {
                    "role": "system",
                    "content": f"""Convert the music to 「{target_style}」 style.
Preserve the melodic skeleton while changing arrangement style, rhythmic patterns, and instrumentation.

Return JSON:
{{
  "result_url": "Converted audio URL",
  "style_changes": ["Specific change descriptions"],
  "preserved_elements": ["Elements preserved"]
}}""",
                },
                {"role": "user", "content": f"Audio: {source_url}"},
            ],
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
skymusic = SkyMusicClient()

result = skymusic.generate_music(
    "A gentle piano solo, like moonlight spilling over the ocean, serene with a touch of melancholy",
    duration=60,
    genre="Classical",
    bpm=72,
)
print(f"🎵 {result.get('title', 'Untitled')}: {result.get('description', '')}")
```

---

## AI Composition Assistant

```python
class AIComposer:
    """AI composition and arrangement assistant"""

    def __init__(self):
        self.client = client

    def generate_chord_progression(
        self,
        key: str = "C Major",
        mood: str = "Warm",
        bars: int = 16,
    ) -> dict:
        """AI generates chord progressions"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a professional composer. Generate a chord progression based on the following conditions:

Key: {key}
Mood: {mood}
Length: {bars} bars

Output JSON:
{{
  "progression": ["Chord progression list"],
  "roman_analysis": ["Roman numeral analysis"],
  "cadences": ["Cadence annotations"],
  "suggestions": "Arrangement suggestions"
}}

Format: one chord per bar, e.g. C → Am → F → G""",
                },
            ],
            temperature=0.5,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def generate_bassline(self, chords: list[str], style: str = "Pop") -> str:
        """Generate a bassline from chords"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a bassline based on the chord progression ({style} style).

Chords: {chords}

Output bass notes per bar (eighth-note rhythm), format:
| C E G C' | A E A E | ...""",
                },
            ],
            temperature=0.6,
        )
        return response.choices[0].message.content

    def generate_drum_pattern(
        self,
        style: str = "Rock",
        bpm: int = 120,
        bars: int = 8,
    ) -> str:
        """AI generates drum patterns"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Generate a {style} drum pattern.

BPM: {bpm}
Length: {bars} bars

Output drum notation per bar (Kick/Snare/Hi-Hat), format:
Bar 1: K=Kick S=Snare H=Hi-Hat
|K H S H | K K S H | ...""",
                },
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content

    def arrange_section(
        self,
        section_type: str,
        melody: str,
        mood: str,
    ) -> str:
        """AI arranges a specific section"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Arrange the「{section_type}」section.

Main melody: {melody}
Mood: {mood}

Provide arrangement suggestions:
- Instrumentation choices
- Voice arrangement
- Dynamics changes
- Effects usage""",
                },
            ],
            temperature=0.5,
        )
        return response.choices[0].message.content

# Usage
composer = AIComposer()

# Generate a chord progression
chords = composer.generate_chord_progression(
    key="D Minor",
    mood="Melancholic yet resilient",
    bars=8,
)
print(f"Chord progression: {' → '.join(chords.get('progression', []))}")
print(f"Roman numeral analysis: {chords.get('roman_analysis', [])}")

# Generate a bassline
bass = composer.generate_bassline(chords.get("progression", ["Dm", "Bb", "F", "C"]))
print(f"\nBassline:\n{bass}")
```

---

## AI Lyric Writing

```python
class AILyricist:
    """AI Lyricist"""

    def write_lyrics(
        self,
        topic: str,
        style: str = "Chinese Classical",
        structure: str = "Verse-Chorus-Verse-Chorus-Bridge-Chorus",
    ) -> dict:
        """AI writes lyrics"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a professional lyricist. Write lyrics in the「{style}」style.

Topic: {topic}
Structure: {structure}

Requirements:
- Consistent rhyme scheme
- Rich imagery
- Memorable chorus hook
- Emotional depth and progression

Output JSON:
{{
  "title": "Song title",
  "verses": ["Verse 1", "Verse 2"],
  "chorus": "Chorus",
  "bridge": "Bridge",
  "rhyme_scheme": "Rhyme scheme",
  "key_imagery": ["Core imagery"]
}}""",
                },
            ],
            temperature=0.8,
            max_tokens=1500,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

    def analyze_song(self, lyrics: str) -> dict:
        """Analyze a song"""
        response = self.client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": """Analyze this song. Output JSON:
{
  "genre": "Genre",
  "theme": "Theme",
  "emotional_arc": "Emotional arc",
  "literary_devices": ["Literary devices used"],
  "difficulty": "Performance difficulty"
}""",
                },
                {"role": "user", "content": lyrics},
            ],
            temperature=0.3,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {}

# Usage
lyricist = AILyricist()
song = lyricist.write_lyrics("A decade of wandering, a lamp in the rainy night", style="Chinese Classical")
print(f"🎵 {song.get('title', 'Untitled')}")
print(f"\nChorus:\n{song.get('chorus', '')}")
```

---

## NetEase TianYin API Integration

```python
class NetEaseTianYin:
    """NetEase TianYin AI Music API"""

    BASE_URL = "https://music.163.com/api/ai"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def text_to_music(self, text: str, duration: int = 30) -> bytes:
        """Text-to-music generation"""
        import requests

        response = requests.post(
            f"{self.BASE_URL}/generate",
            headers=self.headers,
            json={
                "prompt": text,
                "duration": duration,
                "format": "mp3",
            },
        )

        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"Generation failed: {response.text}")

    def search_sound_effect(self, query: str) -> list[dict]:
        """Search for sound effects"""
        import requests

        response = requests.get(
            f"{self.BASE_URL}/sound-effects",
            headers=self.headers,
            params={"q": query},
        )

        return response.json().get("data", [])
```

---

## AI Music Tool Comparison

| Tool | Type | Strengths | Best For |
|------|------|-----------|----------|
| **TianGong SkyMusic** | Text to Music | Strong Chinese language understanding | Background music / Ad soundtracks |
| **NetEase TianYin** | API + Editor | Full-featured | Professional music production |
| **Meta MusicGen** | Open-source local | Free and controllable | Research / Customization |
| **Suno AI** | Cloud generation | High quality | Complete song creation |
| **MuseGAN** | MIDI generation | Multi-track | Arrangement assistance |

---

## Next Steps

- [AI Digital Human Guide](/tutorials/ai-digital-human-guide/)
- [AI Video Editing](/tutorials/ai-video-editing-guide/)

> 📝 Based on DeepSeek + TianGong SkyMusic + MusicGen, June 2026.
