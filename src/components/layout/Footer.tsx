import React from 'react';
import { Twitter, Globe, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Logo and Description */}
          <div>
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              TanFi
              </span>
            </div>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
              The most intuitive and efficient DEX for swapping tokens and providing liquidity with minimal fees and maximum rewards.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-purple-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-500 transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-500 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Tokenomics</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Audit Reports</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">API</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Statistics</a></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Community</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Governance</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Bug Bounty</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            © {new Date().getFullYear()} TanFi Swap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;