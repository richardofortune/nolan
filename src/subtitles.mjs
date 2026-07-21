/**
 * Subtitle sidecars — the segment manifest, spoken as SRT and WebVTT.
 *
 * The captions are authored and their timing is derived, so we already hold
 * exactly what a subtitle track is: `{ start, end, text }` in the video's
 * timeline. Emitting `.srt` / `.vtt` alongside the film is close to free, and it
 * buys two things a burned-in caption can't: the demo becomes searchable, and a
 * screen reader (or a viewer who needs them) gets real text instead of pixels.
 *
 * Pure string functions — no browser, no ffmpeg — so this is trivially testable
 * and runs in `burn` and `post` modes alike.
 */

/** seconds → "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT), by separator. */
function stamp(seconds, sep) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
}

/** `<` starts a tag in VTT cue text; escape the three that matter. */
const escVtt = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Segments → SRT. Empty in → empty string (no cues, no file worth writing). */
export function toSRT(segments) {
  return segments
    .map((seg, i) =>
      `${i + 1}\n${stamp(seg.start, ",")} --> ${stamp(seg.end, ",")}\n${seg.text}\n`)
    .join("\n");
}

/** Segments → WebVTT. Speaker becomes a cue `<v Name>` voice tag when known. */
export function toVTT(segments) {
  const cues = segments.map((seg) => {
    const name = seg.actor?.name;
    const line = name ? `<v ${escVtt(name)}>${escVtt(seg.text)}` : escVtt(seg.text);
    return `${stamp(seg.start, ".")} --> ${stamp(seg.end, ".")}\n${line}\n`;
  });
  return `WEBVTT\n\n${cues.join("\n")}`;
}

export const SUBTITLE_FORMATS = {
  srt: { ext: "srt", render: toSRT },
  vtt: { ext: "vtt", render: toVTT },
};
