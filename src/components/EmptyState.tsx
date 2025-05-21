// components/EmptyState.tsx
import { Plus } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { EmptyStateProps } from '../types';

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <Card className="p-8 text-center">
    <div className="mb-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
        <Plus size={24} className="text-purple-600 dark:text-purple-400" />
      </div>
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 mb-6">
      {description}
    </p>
    <Button onClick={onButtonClick}>
      {buttonText}
    </Button>
  </Card>
);

export default EmptyState;