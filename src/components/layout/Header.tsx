// components/Header.tsx
import { Menu, Moon, Settings, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import MobileMenu from '../MobileMenu';
import ConnectWalletModal from '../modals/ConnectWalletModal';
import SettingsModal from '../modals/SettingsModal';
import Logo from '../ui/Logo';
import NavItem from '../ui/NavItem';
import WalletButton from '../ui/WalletButton';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rpcEndpoint, setRpcEndpoint] = useState('https://api.mainnet-beta.solana.com');
  const [gasPriority, setGasPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const navItems = [
    { name: 'Swap', path: '/swap' },
    { name: 'Positions', path: '/lp-positions' },
    { name: 'Create', path: '/create-lp' },
    { name: 'Deposit', path: '/deposit' },
    { name: 'Withdraw', path: '/withdraw' },
  ];

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Settings saved:', { rpcEndpoint, gasPriority });
    setShowSettings(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavItem key={item.path} name={item.name} path={item.path} />
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="DEX settings"
              >
                <Settings size={20} />
              </button>
              
              <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
              
              <WalletButton />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-3">
              <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Open mobile menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          navItems={navItems} 
        />
      </header>

      {showSettings && (
        <SettingsModal
          rpcEndpoint={rpcEndpoint}
          gasPriority={gasPriority}
          onRpcChange={setRpcEndpoint}
          onGasPriorityChange={setGasPriority}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}

      {showConnectWallet && (
        <ConnectWalletModal onClose={() => setShowConnectWallet(false)} />
      )}
    </>
  );
};

// Small reusable component for theme toggle
const ThemeToggleButton = ({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) => (
  <button
    onClick={toggleTheme}
    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
  </button>
);

export default Header;