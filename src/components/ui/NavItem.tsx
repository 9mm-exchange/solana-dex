// components/ui/NavItem.tsx
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  name: string;
  path: string;
}

const NavItem: React.FC<NavItemProps> = ({ name, path }) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {name}
    </Link>
  );
};

export default NavItem;