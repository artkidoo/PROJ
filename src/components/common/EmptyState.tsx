import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) => {
  return (
    <div className="border border-dashed border-[#242424] rounded-lg p-10 flex flex-col items-center justify-center text-center bg-[#0A0A0A] my-4">
      {Icon && (
        <div className="w-12 h-12 rounded-md bg-[#141414] border border-[#242424] flex items-center justify-center text-neutral-400 mb-4">
          <Icon size={22} />
        </div>
      )}
      <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-xs text-neutral-400 max-w-md mt-1.5 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-5">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-md transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-[#141414] hover:bg-[#1C1C1C] border border-[#242424] rounded-md transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
