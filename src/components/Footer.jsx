import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0b0b0b] border-t border-white/10 relative overflow-hidden font-sans">
      {/* Top Gradient Line (Cinematic Glow) */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

      <div className="container mx-auto px-6 max-w-7xl py-16">
        
        {/* Top Section: Brand & Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-10">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white-100">
                <img src="/kdt.png" alt="KDT" />
              </div>
              <span className="text-gray-400 font-bold text-sm tracking-wider">
                    ХОВД АЙМГИЙН 
                    ХӨГЖИМТ ДРАМЫН ТЕАТР
                  </span>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Кино ертөнцийн гайхамшгийг бидэнтэй хамт мэдэр. Хамгийн сүүлийн үеийн технологи, тав тухтай орчин.
            </p>
          </div>

          {/* Newsletter Input */}
          <div className="w-full lg:w-auto">
            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Шинэлэг мэдээлэл авах</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="И-мэйл хаягаа оруулна уу" 
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all w-full sm:w-80"
              />
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-red-900/20 whitespace-nowrap">
                Бүртгүүлэх
              </button>
            </div>
          </div>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 border-t border-white/5 pt-12">
          
          {/* Column 1 */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Холбоос</h3>
            <ul className="space-y-3 text-sm">
              {['Кино жагсаалт', 'Цагийн хуваарь', 'Үнэ тариф', 'Бэлгийн карт'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center group">
                    <span className="w-0 group-hover:w-2 h-[1px] bg-red-600 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Тусламж</h3>
            <ul className="space-y-3 text-sm">
              {['Түгээмэл асуулт', 'Нууцлалын бодлого', 'Үйлчилгээний нөхцөл', 'Буцаалтын журам'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-300 block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <h3 className="text-white font-bold mb-6 text-lg">Холбоо барих</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Монгол улс Ховд аймгийн Хөгжимт Драмын театр</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hover:text-white transition-colors cursor-pointer">khovdthearer1950@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hover:text-white transition-colors cursor-pointer">+976 7777-2292</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Socials (Mobile usually fits better here or bottom) */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">Биднийг дагах</h3>
            <div className="flex space-x-4">
               {/* Facebook */}
               <a href="https://www.facebook.com/profile.php?id=100068662068394" className="w-10 h-10 rounded-full bg-white-100 hover:blue-100">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
               </a>
               {/* Instagram */}
               <a href="https://www.instagram.com" className="w-10 h-10 rounded-full bg-white-100 hover:pink-100">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 3h9a4.5 4.5 0 014.5 4.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9A4.5 4.5 0 017.5 3z" /></svg>
               </a>
               {/* Youtube */}
               <a href="https://www.youtube.com" className="w-10 h-10 rounded-full bg-white-100 hover:red-500">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
               </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p className="mb-4 md:mb-0">
            ©2025 Б.ТӨМӨРЧӨДӨРИЙН БҮТЭЭЛ
          </p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;