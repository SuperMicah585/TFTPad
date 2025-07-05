import { Link, useLocation } from 'react-router-dom'

export function Header() {
   const location = useLocation();
   
   return(
       <div className="border-b border-gray-800 px-6 py-4 relative z-20" style={{ backgroundColor: '#964B00' }}>
           <div className="flex items-center justify-between">
               <div className="flex items-center relative">
                   <img 
                       src="/favicon.png" 
                       alt="TFTPad Logo" 
                       className="w-12 h-12"
                   />
                   <h1 className="text-2xl font-bold text-white absolute left-14">TFTPad</h1>
               </div>
               
               {/* Navigation Bar - centered */}
               <nav className="flex items-center space-x-6">
                   <Link 
                       to="/" 
                       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname === '/'
                               ? 'bg-orange-300 text-gray-800 shadow-md'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Home
                   </Link>
                   <Link 
                       to="/blog" 
                       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                           location.pathname === '/blog'
                               ? 'bg-orange-300 text-gray-800 shadow-md'
                               : 'text-orange-200 hover:text-white hover:bg-orange-300/20'
                       }`}
                   >
                       Blog
                   </Link>
               </nav>
               
               <a 
                   href="https://buymeacoffee.com/tftpad" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="border-2 border-orange-300 hover:bg-orange-300 hover:text-gray-800 text-orange-200 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
               >
                   <span>🧃</span>
                   Buy me a Celsius
               </a>
           </div>
       </div>
   )
}