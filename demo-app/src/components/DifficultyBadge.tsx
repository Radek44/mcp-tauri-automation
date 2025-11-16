interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[difficulty]}`}
      data-testid="difficulty-badge"
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}
