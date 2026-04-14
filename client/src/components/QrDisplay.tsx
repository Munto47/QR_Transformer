import QRCode from "qrcode";
import { useEffect, useState } from "react";

type Props = {
  payload: string | null;
};

function QrInner({ payload }: { payload: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setError("生成失败");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {dataUrl ? (
        <>
          <img
            src={dataUrl}
            alt=""
            width={280}
            height={280}
            className="rounded-lg border border-zinc-100 dark:border-zinc-800"
          />
          <a
            href={dataUrl}
            download="qr.png"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
          >
            下载
          </a>
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            保存为 PNG 到本地
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">生成中…</p>
      )}
    </div>
  );
}

export function QrDisplay({ payload }: Props) {
  if (!payload) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          上传并处理完成后，将在此显示二维码
        </p>
      </div>
    );
  }

  return <QrInner payload={payload} />;
}
