import { Link, useLocation } from 'react-router-dom';
import { AiFillHome, AiOutlineHome, AiFillPlusCircle, AiOutlinePlusCircle } from 'react-icons/ai';
import { FaUser, FaRegUser, FaNewspaper, FaRegNewspaper } from 'react-icons/fa';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      IconActive: AiFillHome,
      IconInactive: AiOutlineHome,
    },
    {
      path: '/news',
      label: 'News',
      IconActive: FaNewspaper,
      IconInactive: FaRegNewspaper,
    },
    {
      path: '/create',
      label: 'Create',
      IconActive: AiFillPlusCircle,
      IconInactive: AiOutlinePlusCircle,
    },
    {
      path: '/profile',
      label: 'Profile',
      IconActive: FaUser,
      IconInactive: FaRegUser,
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      <main className="container py-4">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="container flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.IconActive : item.IconInactive;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center ${
                  isActive ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                <Icon className="text-2xl" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout; 