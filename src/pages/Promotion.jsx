import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const PlansAndPromotion = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-[#08080a] text-gray-900 dark:text-white font-sans selection:bg-red-500 selection:text-white overflow-hidden relative transition-colors duration-300">
            <Header movies={[]} onSearchResults={() => {}} />

            {/* Фонны бүдэг туяа - Light mode дээр илүү зөөлөн */}
            <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10">
                <div className="absolute top-1/4 left-10 w-96 h-96 bg-red-300 dark:bg-red-900 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full blur-[150px]"></div>
            </div>

            <main className="relative z-10 grid md:grid-cols-2 gap-12 items-center justify-center min-h-[85vh] px-6 max-w-7xl mx-auto pt-48 pb-20">
                
                {/* Зүүн тал: Текст */}
                <div className="space-y-8 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-mono tracking-widest uppercase text-gray-500 dark:text-gray-400">
                            Хөгжүүлэлт явагдаж байна
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none">
                        Урамшууллын <span className="text-red-500">картууд</span> <br /> 
                        тун удахгүй.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto md:mx-0 font-light leading-relaxed">
                        Бид илүү уян хатан багцууд болон онцгой урамшууллуудыг танд хүргэхээр ажиллаж байна. Тун удахгүй.
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="group inline-flex items-center gap- px-8 py-4 bg-gray-900 dark:bg-transparent border-2 border-gray-900 dark:border-white text-white dark:text-white rounded-xl text-lg font-semibold transition-all hover:bg-gray-700 dark:hover:bg-white hover:border-gray-700 dark:hover:text-black active:scale-95"
                    >   
                        Нүүр хуудас
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5 transition-transform group-hover:translate-x-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                {/* Баруун тал: Зургууд болон Лугшиж буй цагиргууд */}
                <div className="relative flex items-center justify-center h-full min-h-[400px]">
                    
                    {/* Цагираг 1: Дотор талын лугшилт */}
                    <div className="absolute w-80 h-80 border border-gray-300 dark:border-white/20 rounded-full z-0 custom-pulse-fast"></div>
                    
                    {/* Цагираг 2: Дунд талын лугшилт */}
                    <div className="absolute w-[400px] h-[400px] border border-gray-200 dark:border-white/10 rounded-full z-0 custom-pulse-slow"></div>
                    
                    {/* Цагираг 3: Хамгийн гадна талын бүдэг лугшилт */}
                    <div className="absolute w-[550px] h-[550px] border border-gray-100 dark:border-white/5 rounded-full z-0 custom-pulse-outer"></div>
                    
                    {/* Зургууд - public хавтаснаас */}
                    <img 
                        src="/black.png" 
                        alt="Black promotion card"
                        className="absolute w-64 h-auto rounded-3xl rotate-[-10deg] translate-x-[-40px] z-10 opacity-90 dark:opacity-80 shadow-xl dark:shadow-2xl object-cover"
                    />
                    <img 
                        src="/white.png" 
                        alt="White promotion card"
                        className="absolute w-64 h-auto rounded-3xl rotate-[5deg] translate-x-[20px] z-20 shadow-[0_20px_50px_rgba(239,68,68,0.15)] dark:shadow-[0_20px_50px_rgba(239,68,68,0.3)] object-cover"
                    />
                    
                </div>
            </main>

            {/* Лугших хөдөлгөөний CSS */}
            <style>{`
                @keyframes pulseWave {
                    0% { transform: scale(0.95); opacity: 0.1; }
                    50% { transform: scale(1.05); opacity: 0.4; }
                    100% { transform: scale(0.95); opacity: 0.1; }
                }
                .custom-pulse-fast {
                    animation: pulseWave 3s ease-in-out infinite;
                }
                .custom-pulse-slow {
                    animation: pulseWave 4.5s ease-in-out infinite;
                    animation-delay: 0.5s;
                }
                .custom-pulse-outer {
                    animation: pulseWave 6s ease-in-out infinite;
                    animation-delay: 1s;
                }
            `}</style>
        </div>
    );
};

export default PlansAndPromotion;