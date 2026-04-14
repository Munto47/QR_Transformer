import { useCallback, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function UploadZone({ onFile, disabled }: Props) {
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const file = list?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        drag
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
          : "border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        点击上传或将图片拖到此处
      </p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        上传
      </label>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        支持常见图片格式，单张不超过 5MB
      </p>
    </div>
  );
}
