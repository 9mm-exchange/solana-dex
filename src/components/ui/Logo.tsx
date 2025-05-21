// components/ui/Logo.tsx
import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex items-center cursor-pointer" 
      onClick={() => navigate('/')}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center">
        <img 
          src="logo-tf.png" 
          className="w-8 h-8 text-white" 
          alt="TanFi Logo"
        />
      </div>
      <span className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        TanFi
      </span>
    </div>
  );
};

export default Logo;