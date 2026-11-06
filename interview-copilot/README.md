# Interview Copilot

Live mock-interview practice: it listens to the interviewer, detects when they've finished a question, and streams a tailored answer from Claude using your resume, the job description and your notes.

## Run it
1. `cd interview-copilot && python3 -m http.server 8000`
2. Open http://localhost:8000 in **Chrome or Edge** (speech recognition needs one of these).
3. Paste your Anthropic API key (console.anthropic.com), resume, job description and notes.
4. Click **Start listening** and allow the microphone.

## Controls
- Answers fire automatically after the interviewer pauses (adjust the silence slider).
- `Space`: answer now · `M`: pause the mic while you speak · `Esc`: stop the current answer
- Each answer has Copy, Regenerate and Shorter buttons. Export saves the session as Markdown.
- "Skip speech that isn't a question" lets Claude ignore your own answers and small talk.

## Notes
- The mic must be able to hear the interviewer: same room, or a video call on speakers.
- Chrome's speech recognition sends audio to Google to transcribe it. Your API key and context are stored only in this browser (the key only if you tick "Remember").
