// components/PoolStatsCard.tsx
import Card, { CardBody } from './ui/Card';
import { PoolStatsCardProps } from '../types';

const PoolStatsCard: React.FC<PoolStatsCardProps> = ({
  title,
  value,
  gradient,
  icon,
}) => (
  <Card className={`bg-gradient-to-r ${gradient} text-white`}>
    <CardBody>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-opacity-80 mb-1">{title}</h3>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          {icon}
        </div>
      </div>
    </CardBody>
  </Card>
);

export default PoolStatsCard;