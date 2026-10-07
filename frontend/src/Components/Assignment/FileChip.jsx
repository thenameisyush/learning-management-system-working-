// import { FileIcon } from "../Notes/NoteCard";
import {
  FaFileAlt,
  FaFileExcel,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
} from "react-icons/fa";
import { formatBytes } from "../../utils/formatters";

const ICONS = {
  pdf: { Icon: FaFilePdf, color: "text-red-600" },
  doc: { Icon: FaFileWord, color: "text-blue-600" },
  docx: { Icon: FaFileWord, color: "text-blue-600" },
  ppt: { Icon: FaFilePowerpoint, color: "text-orange-600" },
  pptx: { Icon: FaFilePowerpoint, color: "text-orange-600" },
  xls: { Icon: FaFileExcel, color: "text-green-600" },
  xlsx: { Icon: FaFileExcel, color: "text-green-600" },
};

const FileIcon = ({ format, className = "" }) => {
  const { Icon, color } =
    ICONS[format] || {
      Icon: FaFileAlt,
      color: "text-slate-500",
    };

  return <Icon className={`${color} ${className}`} aria-hidden="true" />;
};

/** One file row with View/Download - shared by assignment attachments and submission files. */
export default function FileChip({ file, busy, onOpen, onDownload, viewable }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
      <FileIcon format={file.format} className="text-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.originalName}</p>
        <p className="text-xs text-slate-500 uppercase">
          {file.format} &middot; {formatBytes(file.size)}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {viewable && (
          <button
            type="button"
            disabled={busy}
            onClick={onOpen}
            className="min-h-[40px] px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            View
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDownload}
          className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold disabled:opacity-60 ${
            viewable ? "border border-slate-300 text-slate-700 hover:bg-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          Download
        </button>
      </div>
    </div>
  );
}
