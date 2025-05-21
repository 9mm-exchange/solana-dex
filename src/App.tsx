import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import Layout from './components/layout/Layout';
import { TransactionNotifications } from './components/notifications/TransactionNotifications';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';
import { WalletContextProvider } from './context/WalletContext';
import CreateLP from './pages/CreateLP';
import CreateLPNew from './pages/CreateLPNew';
import Deposit from './pages/Deposit';
import DepositNew from './pages/DepositNew';
import Home from './pages/Home';
import LPPositions from './pages/LPPositions';
import LPPositionsNew from './pages/LPPositionsNew';
import Swap from './pages/Swap';
import SwapNew from './pages/SwapNew';
import Withdraw from './pages/Withdraw';
import WithdrawLPNew from './pages/WithdrawNew';

function App() {
  return (
    <WalletContextProvider>
      <ThemeProvider>
      <TransactionProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/swap-new" element={<SwapNew />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/deposit-new" element={<DepositNew />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/withdraw-new" element={<WithdrawLPNew />} />
              <Route path="/lp-positions" element={<LPPositions />} />
              <Route path="/lp-positions-new" element={<LPPositionsNew />} />
              <Route path="/create-lp" element={<CreateLP />} />
              <Route path="/create-lp-new" element={<CreateLPNew />} />
            </Route>
          </Routes>
        </Router>
          {/* Transaction Notifications */}
          <TransactionNotifications />
          
          {/* Toast Notifications (for other non-transaction messages) */}
          <ToastContainer pauseOnFocusLoss={false} theme="colored" />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'hsl(var(--primary-foreground))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'hsl(var(--destructive-foreground))',
                },
              },
            }}
          />

    </TransactionProvider>
      </ThemeProvider>
    </WalletContextProvider>
  );
}

export default App;