// components/WarningAlert.tsx
import { AlertTriangle } from 'lucide-react';

const WarningAlert = () => (
  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm flex gap-2">
    <div className="shrink-0 mt-0.5">
      <AlertTriangle size={18} />
    </div>
    <p>
      You will receive both tokens based on the current pool ratio. The amounts you receive may vary due to price movements since your deposit.
    </p>
  </div>
);

export default WarningAlert;