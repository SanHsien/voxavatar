import type { CharacterMessage } from '../character-message';

export interface CharacterBubbleProps {
  message: CharacterMessage | null;
}

export function CharacterBubble({ message }: CharacterBubbleProps) {
  if (!message) return null;
  return (
    <div
      aria-live="polite"
      className={`character-bubble mood-${message.mood}`}
      data-testid="character-bubble"
      role="status"
    >
      <span className="character-bubble-text">{message.text}</span>
    </div>
  );
}
