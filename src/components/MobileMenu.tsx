// components/MobileMenu.tsx
import { X } from 'lucide-react';
import NavItem from './ui/NavItem';
import WalletButton from './ui/WalletButton';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: { name: string; path: string }[];
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navItems }) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.path} name={item.name} path={item.path} />
        ))}
        <div className="pt-2">
          <WalletButton />
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;