import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FeatherIcon as EtherealIcon, LineChart, Wallet, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';
import { features } from '../data/mockData';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'EtherealIcon':
        return <EtherealIcon className="w-6 h-6 text-purple-500" />;
      case 'LineChart':
        return <LineChart className="w-6 h-6 text-purple-500" />;
      case 'Wallet':
        return <Wallet className="w-6 h-6 text-purple-500" />;
      case 'DollarSign':
        return <DollarSign className="w-6 h-6 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Trade tokens with ease
              </span>
              <br />
              <span>on TanFi</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Swap tokens, provide liquidity, and earn rewards on the most user-friendly DEX platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate('/swap')}>
                Start Trading <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/lp-positions')}>
                View LP Positions
              </Button>
            </div>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl">
            <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 backdrop-blur-sm"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <EtherealIcon size={48} className="text-white" />
                </div>
                <h2 className="mt-6 text-3xl font-bold">TanFi</h2>
                <p className="mt-2">Your gateway to DeFi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose TanFi?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We've built a platform that combines security, speed, and user experience
            to deliver the best trading experience possible.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardBody>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  {renderFeatureIcon(feature.icon)}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl text-white">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Powering DeFi Everywhere</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold">$1.2B+</div>
            <div className="mt-2 text-purple-200">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">245K+</div>
            <div className="mt-2 text-purple-200">Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">$520M+</div>
            <div className="mt-2 text-purple-200">Total Liquidity</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">2.1M+</div>
            <div className="mt-2 text-purple-200">Transactions</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <Card glass className="p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of traders already using TanFi to trade tokens with minimal fees and maximum rewards.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/swap')}>
              Start Trading
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/create-lp')}>
              Create Liquidity Pool
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Home;