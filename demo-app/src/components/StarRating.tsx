import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex gap-1" data-testid="star-rating">
      {stars.map((star) => {
        const filled = star <= Math.round(rating);

        return (
          <motion.div
            key={star}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
          >
            <Star
              size={size}
              className={`${
                filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              } ${interactive ? 'cursor-pointer' : ''} transition-colors`}
              onClick={() => handleClick(star)}
              data-testid={`star-${star}`}
            />
          </motion.div>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}
