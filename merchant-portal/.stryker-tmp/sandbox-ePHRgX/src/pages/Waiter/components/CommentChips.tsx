/**
 * CommentChips — Comentários Automáticos (quarta camada)
 * Princípio: Zero teclado, multi-seleção, presets inteligentes.
 */
// @ts-nocheck


import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

export interface Comment {
  id: string;
  label: string;
  icon?: string;
}

interface CommentChipsProps {
  comments: Comment[];
  selectedIds: string[];
  onToggle: (commentId: string) => void;
}

export function CommentChips({ comments, selectedIds, onToggle }: CommentChipsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing[2],
      }}
    >
      {comments.map((comment) => {
        const isSelected = selectedIds.includes(comment.id);
        
        return (
          <button
            key={comment.id}
            onClick={() => onToggle(comment.id)}
            style={{
              minHeight: 48,
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: 24,
              border: `2px solid ${isSelected ? colors.action.base : colors.border.subtle}`,
              background: isSelected 
                ? `${colors.action.base}22` 
                : colors.surface.layer2,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {comment.icon && (
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {comment.icon}
              </span>
            )}
            <span style={{ 
              fontSize: 14,
              fontWeight: isSelected ? 'bold' : 'normal',
              color: isSelected ? colors.action.base : colors.text.secondary 
            }}>
              {comment.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

