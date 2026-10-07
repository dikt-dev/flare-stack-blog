import type { JSONContent } from "@tiptap/react";

/** 从 TipTap JSON 提取所有纯文本 */
function collectText(node: JSONContent): string {
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  if (!Array.isArray(node.content)) return "";
  return node.content.map(collectText).join("");
}

/** 提取第一段的纯文本，超过 120 字截断 + 省略号 */
export function extractSummary(content: JSONContent | null): string | null {
  if (!content || !Array.isArray(content.content)) return null;
  for (const node of content.content) {
    if (node.type === "paragraph") {
      const text = collectText(node).trim();
      if (!text) continue;
      if (text.length <= 120) return text;
      return `${text.slice(0, 120)}…`;
    }
  }
  return null;
}

/** 提取正文里第一张图片的 src */
export function extractFirstImageSrc(
  content: JSONContent | null,
): string | null {
  if (!content || !Array.isArray(content.content)) return null;
  for (const node of content.content) {
    if (node.type === "image" && node.attrs?.src) {
      return String(node.attrs.src);
    }
    // 递归查找嵌套内容
    const nested = extractFirstImageSrc(node);
    if (nested) return nested;
  }
  return null;
}