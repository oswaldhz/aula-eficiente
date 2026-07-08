import { AlertTriangle } from "lucide-react";
import * as Dialog from "./Dialog";

export default function ConfirmDialog({ open, onOpenChange, title, message, onConfirm, loading }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content title={title} onClose={() => onOpenChange(false)}>
        <div className="px-5 py-3 flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>
        </div>
        <Dialog.Footer>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            Delete
          </button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
