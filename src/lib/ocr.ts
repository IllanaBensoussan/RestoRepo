// Reads a receipt file into text. Both libraries are loaded only when a receipt is scanned.

export type Progress = (pct: number) => void;

async function pdfText(file: File, onProgress: Progress): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group text runs by their vertical position to rebuild receipt lines.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      rows.set(key, [...(rows.get(key) || []), { x: item.transform[4], s: item.str }]);
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, runs]) => lines.push(runs.sort((a, b) => a.x - b.x).map((r) => r.s).join(' ')));
    onProgress(Math.round((p / doc.numPages) * 100));
  }
  return lines.join('\n');
}

async function imageText(file: File, onProgress: Progress): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['fra', 'eng', 'heb'], 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export function readReceipt(file: File, onProgress: Progress) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  return isPdf ? pdfText(file, onProgress) : imageText(file, onProgress);
}
