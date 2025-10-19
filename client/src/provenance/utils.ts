export const isUrl = (s: string) => /^https?:\/\//i.test(s);

export const isAgentAddr = (s: string) => /^agent1[0-9a-z]+$/i.test(s);

export const short = (s: string, n = 12) => s.length > n ? s.slice(0, n) + "…" : s;

export const fmtTime = (iso: string) => new Date(iso).toLocaleString();

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};
