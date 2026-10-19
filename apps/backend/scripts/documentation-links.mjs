import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";

function prose(source) {
  let fence = null;
  return source
    .split(/\r?\n/)
    .map((line) => {
      const mark = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
      if (mark && !fence) {
        fence = mark;
        return "";
      }
      if (fence) {
        if (mark?.[0] === fence[0] && mark.length >= fence.length) fence = null;
        return "";
      }
      return line;
    })
    .join("\n");
}

export function headingIds(source) {
  const content = prose(source),
    ids = new Set();
  for (const match of content.matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const plain = match[1]
      .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/`+([^`]+)`+/g, (_, code) => code.replace(/_/g, "\uE000"))
      .replace(/(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}])/gu, "")
      .replace(/[`*~]/g, "")
      .replace(/\uE000/g, "_");
    const base = [...plain.toLowerCase()]
      .filter((c) => c === "-" || c === "_" || !/[\p{P}\p{S}]/u.test(c))
      .join("")
      .trim()
      .replace(/\s/g, "-");
    let id = base,
      suffix = 0;
    while (ids.has(id)) id = `${base}-${++suffix}`;
    ids.add(id);
  }
  for (const match of content.matchAll(
    /<(?:a|h[1-6])\b[^>]*\b(?:id|name)=["']([^"']+)["']/gi,
  ))
    ids.add(match[1]);
  return ids;
}

export function checkDocumentationLinks(files) {
  const failures = [],
    anchors = new Map();
  let links = 0,
    fragments = 0;
  for (const file of files) {
    const source = prose(readFileSync(file, "utf8")).replace(
      /`+[^`\n]*`+/g,
      "",
    );
    for (const match of source.matchAll(
      /\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g,
    )) {
      const link = match[1] || match[2];
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link)) continue;
      links++;
      try {
        const hash = link.indexOf("#");
        const path = decodeURIComponent(hash < 0 ? link : link.slice(0, hash));
        const fragment =
          hash < 0 ? "" : decodeURIComponent(link.slice(hash + 1));
        const target = path ? resolve(dirname(file), path) : file;
        if (!existsSync(target)) throw Error("missing target");
        if (
          fragment &&
          statSync(target).isFile() &&
          extname(target).toLowerCase() === ".md"
        ) {
          fragments++;
          if (!anchors.has(target))
            anchors.set(target, headingIds(readFileSync(target, "utf8")));
          if (!anchors.get(target).has(fragment))
            throw Error("missing heading/anchor");
        }
      } catch (error) {
        failures.push({ file, link, reason: error.message });
      }
    }
  }
  return { documents: files.length, links, fragments, failures };
}
