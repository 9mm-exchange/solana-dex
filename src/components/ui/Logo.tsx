// components/ui/Logo.tsx
import { useNavigate } from 'react-router-dom';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex items-center cursor-pointer" 
      onClick={() => navigate('/')}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <img 
          src="https://dex.9mm.pro/homeLogo.png" 
          className="w-8 h-8 text-white" 
          alt="9mm Logo"
        />
      </div>
      <span className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        9mm
      </span>
    </div>
  );
};

export default Logo;