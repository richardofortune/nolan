/**
 * feedback — the shortest path from "this is wrong" to a filed issue.
 *
 * Builds a prefilled GitHub issue URL and opens it. The build is pure and takes
 * its `meta` as an argument rather than reading `process`, so it is testable
 * without a browser or a platform.
 *
 * Privacy: the body carries only what the caller typed plus four declared
 * version fields. Nothing about the user's app travels unless they explicitly
 * pass `--with-context`, per invocation. There is no sticky setting — sticky
 * context sharing is how people leak things they forgot they turned on.
 */
import { spawn } from "node:child_process";
import { homedir } from "node:os";

const ISSUES_NEW = "https://github.com/richardofortune/nolan/issues/new";

/** GitHub 414s on prefilled URLs somewhere past ~8KB. Stay well under it. */
const CONTEXT_LIMIT = 4000;
const URL_LIMIT = 6000;
const TITLE_LIMIT = 70;

/** Fence language from the file's extension — plain fence when we don't know. */
const fenceLang = (name) => {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  return ["json", "js", "mjs", "md", "html", "css", "txt"].includes(ext) ? (ext === "txt" ? "" : ext) : "";
};

const footerOf = (meta) =>
  `<sub>nolan ${meta.nolan} · node ${meta.node} · ${meta.platform} ${meta.arch} · filed with \`nolan feedback\`</sub>`;

const titleOf = (message) => {
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > TITLE_LIMIT ? oneLine.slice(0, TITLE_LIMIT - 1) + "…" : oneLine;
};

const assemble = (message, block, meta) =>
  [message, block, `---\n${footerOf(meta)}`].filter(Boolean).join("\n\n");

const link = (title, body) =>
  `${ISSUES_NEW}?labels=feedback&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

/**
 * Strip local paths out of a summary nolan pre-writes for the user.
 *
 * The friction footers build their sentence from whatever just went wrong, and
 * node's own errors quote absolute paths — so without this, the command we tell
 * the user to run would file their directory tree. Their own typed message is
 * never touched; this is only for text nolan puts in their mouth.
 */
export function redactPaths(text) {
  return text.split(process.cwd() + "/").join("").split(process.cwd()).join(".").split(homedir()).join("~");
}

/**
 * @param {{message: string, context?: {name: string, text: string}, meta: object}} input
 * @returns {string} a prefilled issues/new URL
 */
export function buildFeedbackUrl({ message, context, meta }) {
  const title = titleOf(message);

  let block = "";
  if (context) {
    const text =
      context.text.length > CONTEXT_LIMIT
        ? context.text.slice(0, CONTEXT_LIMIT) + "\n…(truncated)"
        : context.text;
    block = `**${context.name}**\n\`\`\`${fenceLang(context.name)}\n${text}\n\`\`\``;
  }

  const url = link(title, assemble(message, block, meta));
  if (!context || url.length <= URL_LIMIT) return url;

  // Too big even after capping. Drop it rather than send a URL GitHub rejects.
  const byHand = `_Context was too long to prefill — please attach \`${context.name}\` to this issue._`;
  return link(title, assemble(message, byHand, meta));
}

/**
 * Open a URL in the platform browser. Resolves false on any failure so the
 * caller can fall back to printing it — a feedback command that dies because
 * the opener is missing would be its own joke.
 *
 * @returns {Promise<boolean>}
 */
export function openUrl(url) {
  const [cmd, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];

  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
      child.on("error", () => resolve(false));
      child.on("spawn", () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}
