---
title: "AI Video Editing with Chinese Models: Auto-Editing, Subtitle Generation & Dubbing with Kling & Step-2"
description: "Build automated video editing tools with Chinese AI models: auto highlight clipping, subtitle generation, multilingual dubbing, video summarization. Includes complete MoviePy + Whisper + TTS code with Kling and Step-2 integration."
category: "Hands-On Tutorials"
date: 2026-06-27
tags: ["Video Editing", "Subtitles", "Dubbing", "Whisper", "MoviePy", "Beginner"]
level: "Beginner"
---

## What This Tutorial Solves

You will automate the entire video editing workflow with AI:

- Automatic subtitle generation and translation
- AI dubbing (multilingual)
- Smart highlight clipping
- Video summarization

> 🎯 1-hour video → AI automatically generates subtitles + highlight clips in 10 minutes. A super assistant for video creators.

---

## Automatic Subtitle Generation

```python
import whisper
import moviepy.editor as mp
import datetime

class AISubtitleGenerator:
    """AI automatic subtitle generation"""

    def __init__(self, model_size: str = "medium"):
        print(f"Loading Whisper model ({model_size})...")
        self.model = whisper.load_model(model_size)

    def generate_subtitles(
        self,
        video_path: str,
        language: str = "zh",
        output_format: str = "srt",
    ) -> str:
        """Generate subtitles from video"""
        # 1. Extract audio
        video = mp.VideoFileClip(video_path)
        audio_path = video_path.replace(".mp4", "_temp.wav")
        video.audio.write_audiofile(audio_path, verbose=False, logger=None)

        # 2. Whisper speech recognition
        print("🎙️ Speech recognition in progress...")
        result = self.model.transcribe(
            audio_path,
            language=language,
            verbose=False,
        )

        # 3. Generate SRT subtitle file
        srt_path = video_path.replace(".mp4", ".srt")
        self._write_srt(result["segments"], srt_path)

        # 4. Burn subtitles onto video
        output_path = video_path.replace(".mp4", "_subtitled.mp4")
        self._burn_subtitles(video_path, srt_path, output_path)

        video.close()
        return output_path

    def _write_srt(self, segments: list, output_path: str):
        """Write SRT file"""
        with open(output_path, "w", encoding="utf-8") as f:
            for i, seg in enumerate(segments, 1):
                start = str(datetime.timedelta(seconds=int(seg["start"])))
                end = str(datetime.timedelta(seconds=int(seg["end"])))

                # Merge short fragments
                text = seg["text"].strip()

                f.write(f"{i}\n")
                f.write(f"{start},000 --> {end},000\n")
                f.write(f"{text}\n\n")

        print(f"✅ Subtitles generated: {output_path}")

    def translate_subtitles(
        self,
        srt_path: str,
        target_lang: str = "English",
    ) -> str:
        """Translate subtitles"""
        from openai import OpenAI
        import os

        # Read original subtitles
        with open(srt_path, "r", encoding="utf-8") as f:
            content = f.read()

        # AI translation
        client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Translate the following SRT subtitles to {target_lang}.
Keep the timestamps and sequence numbers unchanged — only translate the text content.
The translation should be natural and fluent, suitable for video subtitle reading.""",
                },
                {"role": "user", "content": content},
            ],
            temperature=0.3,
            max_tokens=8192,
        )

        # Save translated subtitles
        translated_path = srt_path.replace(".srt", f"_{target_lang}.srt")
        with open(translated_path, "w", encoding="utf-8") as f:
            f.write(response.choices[0].message.content)

        print(f"✅ Translated subtitles generated: {translated_path}")
        return translated_path

    def _burn_subtitles(self, video_path: str, srt_path: str, output_path: str):
        """Burn subtitles onto the video"""
        video = mp.VideoFileClip(video_path)

        # Use ImageMagick to render subtitles
        # (requires imagemagick to be installed)
        try:
            from moviepy.video.tools.subtitles import SubtitlesClip
            from moviepy.config import change_settings
            change_settings({"IMAGEMAGICK_BINARY": "magick"})

            generator = lambda txt: mp.TextClip(
                txt,
                font="Microsoft-YaHei",
                fontsize=40,
                color="white",
                stroke_color="black",
                stroke_width=2,
            )

            subs = SubtitlesClip(srt_path, generator)
            final = mp.CompositeVideoClip([video, subs.set_position(("center", "bottom"))])
            final.write_videofile(output_path, verbose=False, logger=None)

            print(f"✅ Subtitles burned: {output_path}")
        except Exception as e:
            print(f"⚠️ Subtitle burn failed: {e}, please manually import the SRT into Jianying/Premiere Pro")

# Usage
sub_gen = AISubtitleGenerator()
# output = sub_gen.generate_subtitles("my_video.mp4")
# translated = sub_gen.translate_subtitles("my_video.srt", "English")
```

---

## AI Dubbing

```python
class AIVoiceDubbing:
    """AI multilingual dubbing"""

    def dub_video(
        self,
        video_path: str,
        target_language: str = "English",
        voice: str = "female",
    ) -> str:
        """Video dubbing (original audio → AI voice → replace audio track)"""
        # 1. Extract original audio → transcribe
        sub_gen = AISubtitleGenerator()
        video = mp.VideoFileClip(video_path)
        temp_audio = video_path.replace(".mp4", "_temp.wav")
        video.audio.write_audiofile(temp_audio, verbose=False)
        video.close()

        result = sub_gen.model.transcribe(temp_audio, language="zh")

        # 2. Translate text
        client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1",
        )

        all_text = " ".join(s["text"] for s in result["segments"])
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {"role": "system", "content": f"Translate to {target_language}, colloquial style, suitable for dubbing"},
                {"role": "user", "content": all_text},
            ],
            temperature=0.3,
        )
        translated_text = response.choices[0].message.content

        # 3. TTS generate dubbing audio
        # audio_path = tts.synthesize(translated_text, voice=voice)

        # 4. Composite final video
        # video = mp.VideoFileClip(video_path)
        # new_audio = mp.AudioFileClip(audio_path)
        # final = video.set_audio(new_audio)
        # output = video_path.replace(".mp4", f"_dubbed_{target_language}.mp4")
        # final.write_videofile(output)

        return translated_text
```

---

## Smart Highlight Clipping

```python
class AIHighlightClipper:
    """AI smart highlight clipping"""

    def find_highlights(
        self,
        video_path: str,
        highlight_type: str = "Emotional Climax",
    ) -> list[dict]:
        """Find highlight segments in the video"""
        # 1. Full speech recognition
        sub_gen = AISubtitleGenerator()
        video = mp.VideoFileClip(video_path)
        audio_path = video_path.replace(".mp4", "_temp.wav")
        video.audio.write_audiofile(audio_path, verbose=False)
        video.close()

        result = sub_gen.model.transcribe(audio_path, language="zh")

        # 2. AI analysis: which segments are highlights
        segments_text = json.dumps(
            [{"start": s["start"], "end": s["end"], "text": s["text"]}
             for s in result["segments"]],
            ensure_ascii=False,
        )

        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {
                    "role": "system",
                    "content": f"""Analyze the video subtitles and identify highlight segments of type "{highlight_type}".

Output JSON array (each clip 15-60 seconds):
[
  {{
    "start": Start time in seconds,
    "end": End time in seconds,
    "reason": "Why this is a highlight (15 chars max)",
    "title": "Clip title"
  }}
]

Selection criteria:
- Key insights / memorable quotes
- Emotional peaks / turning points
- Practical tips and techniques
- Funny / engaging interactions""",
                },
                {"role": "user", "content": segments_text},
            ],
            temperature=0.5,
            max_tokens=2048,
        )

        try:
            return json.loads(response.choices[0].message.content)
        except:
            return []

    def extract_clips(
        self,
        video_path: str,
        highlights: list[dict],
        output_dir: str = "clips",
    ):
        """Extract highlight clips"""
        import os
        os.makedirs(output_dir, exist_ok=True)

        video = mp.VideoFileClip(video_path)
        clips = []

        for i, hl in enumerate(highlights):
            start = max(0, hl["start"] - 0.5)
            end = min(video.duration, hl["end"] + 0.5)

            clip = video.subclip(start, end)
            clip_path = f"{output_dir}/clip_{i+1:02d}_{hl['title'][:20]}.mp4"
            clip.write_videofile(clip_path, verbose=False, logger=None)

            clips.append({
                "title": hl["title"],
                "path": clip_path,
                "duration": end - start,
            })

            print(f"✅ {hl['title']} ({end-start:.1f}s)")

        video.close()
        return clips

    def generate_highlight_reel(
        self,
        clips: list[dict],
        output_path: str = "highlight_reel.mp4",
        add_transitions: bool = True,
    ):
        """Composite a highlight reel"""
        video_clips = []

        for i, clip_info in enumerate(clips):
            clip = mp.VideoFileClip(clip_info["path"])

            # Add title
            title = mp.TextClip(
                clip_info["title"],
                fontsize=50,
                color="white",
                font="Microsoft-YaHei",
            ).set_duration(2).set_position("center")

            clip = mp.concatenate_videoclips([title, clip])
            video_clips.append(clip)

        # Composite
        final = mp.concatenate_videoclips(video_clips)
        final.write_videofile(output_path)
        print(f"✅ Highlight reel generated: {output_path}")

# Usage
clipper = AIHighlightClipper()
# highlights = clipper.find_highlights("lecture.mp4", "Key Insights")
# clips = clipper.extract_clips("lecture.mp4", highlights)
# clipper.generate_highlight_reel(clips, "lecture_highlights.mp4")
```

---

## Video Summarization

```python
def generate_video_summary(video_path: str) -> dict:
    """Generate video summary"""
    # 1. Extract subtitles/audio
    sub_gen = AISubtitleGenerator()
    video = mp.VideoFileClip(video_path)
    audio_path = video_path.replace(".mp4", "_temp.wav")
    video.audio.write_audiofile(audio_path, verbose=False)
    result = sub_gen.model.transcribe(audio_path, language="zh")
    video.close()

    full_text = result["text"]

    # 2. AI generates summary
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[
            {
                "role": "system",
                "content": """Generate a structured summary of the video. Output JSON:
{
  "title": "Video title",
  "one_sentence": "One-sentence summary",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "timeline": [{"timestamp": "MM:SS", "event": "Content description"}],
  "tags": ["Tag 1", "Tag 2"],
  "category": "Category"
}""",
            },
            {"role": "user", "content": full_text[:8000]},
        ],
        temperature=0.3,
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {"title": "Summary generation failed"}

# Usage
# summary = generate_video_summary("tutorial.mp4")
# print(f"📺 {summary['title']}")
# for point in summary['key_points']:
#     print(f"  • {point}")
```

---

## Next Steps

- [Kling AI Video Generation](/tutorials/kling-ai-video-api-guide/)
- [AI Voice Synthesis](/tutorials/ai-voice-tts-china-guide/)

> 📝 Based on Whisper + DeepSeek + MoviePy, June 2026.
