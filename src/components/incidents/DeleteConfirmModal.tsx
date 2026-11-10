import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  incidentTitle: string;
  incidentId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  incidentTitle,
  incidentId,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-xl p-5 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white">
              Delete Incident Report?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete incident <span className="font-mono text-rose-300 font-bold">{incidentId}</span>?
            </p>
            <p className="text-xs text-slate-400 italic line-clamp-2">
              "{incidentTitle}"
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              This will remove the report and de-assign any mobilized emergency units.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
