/**
 * 在客户端将活动标题与二维码图合成 PNG 并触发下载。
 */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const t = text.trim() || " ";
  const lines: string[] = [];
  let line = "";
  for (const ch of t) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [t];
}

export async function downloadActivityPosterPng(params: {
  activityName: string;
  /** 与页面同源的图片 URL，例如 `/api/activity-qrs/:id/image` */
  qrImageUrl: string;
  /** 下载文件名（不含扩展名） */
  fileBaseName: string;
}): Promise<void> {
  const { activityName, qrImageUrl, fileBaseName } = params;

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("二维码图片加载失败"));
    img.src = qrImageUrl;
  });

  const padding = 16;
  const contentW = 288;
  const fontSize = 15;
  const lineHeight = Math.round(fontSize * 1.4);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不可用");

  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;

  const titleLines = wrapLines(ctx, activityName, contentW - padding * 2);
  const titleH = titleLines.length * lineHeight + padding * 2;

  const qrDrawW = Math.min(img.naturalWidth || 280, contentW);
  const qrDrawH = (img.naturalHeight / img.naturalWidth) * qrDrawW;

  canvas.width = contentW + padding * 2;
  canvas.height = titleH + qrDrawH + padding * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#18181b";
  ctx.textBaseline = "top";
  let y = padding;
  for (const ln of titleLines) {
    ctx.fillText(ln, padding, y);
    y += lineHeight;
  }

  const qrX = (canvas.width - qrDrawW) / 2;
  ctx.drawImage(img, qrX, titleH, qrDrawW, qrDrawH);

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("导出失败"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileBaseName}.png`;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      },
      "image/png",
      0.95
    );
  });
}
