export function Header() {
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