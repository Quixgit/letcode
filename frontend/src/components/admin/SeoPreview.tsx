interface SeoPreviewProps {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function SeoPreview({ title, description, url, image }: SeoPreviewProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex-1 rounded-lg border border-md-outline-variant p-3">
        <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-wide text-md-on-surface-variant">
          Google
        </p>
        <p className="m-0 truncate text-[13px] text-[#202124]">{url}</p>
        <p className="m-0 truncate text-lg text-[#1a0dab]">{title || "Untitled"}</p>
        <p className="m-0 line-clamp-2 text-[13px] text-[#4d5156]">
          {description || "No description set."}
        </p>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border border-md-outline-variant">
        <p className="m-0 mb-2 px-3 pt-3 text-[11px] font-medium uppercase tracking-wide text-md-on-surface-variant">
          Social card
        </p>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-md-surface-container-low text-[12px] text-md-on-surface-variant">
            No image set
          </div>
        )}
        <div className="p-3">
          <p className="m-0 truncate text-[11px] uppercase text-md-on-surface-variant">{new URL(url).hostname}</p>
          <p className="m-0 truncate text-sm font-medium text-md-on-surface">{title || "Untitled"}</p>
          <p className="m-0 line-clamp-2 text-[12px] text-md-on-surface-variant">{description || "No description set."}</p>
        </div>
      </div>
    </div>
  );
}
