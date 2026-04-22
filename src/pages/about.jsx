import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

// --- Assets & Data ---
const HERO_IMAGE = "https://scontent.fuln1-1.fna.fbcdn.net/v/t39.30808-6/476967268_929474882684572_2942961818996190460_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=2a1932&_nc_ohc=vQ7LWsEoKWIQ7kNvwHV7f7F&_nc_oc=Ado1Qf_69WZp7P0lEV-TldhjLr5WUmqtuOBmzSBS5MtfTd3QMLyXEteSEP6FgdH8olw&_nc_zt=23&_nc_ht=scontent.fuln1-1.fna&_nc_gid=qHD1PgLbRkGuq5HnDO9wPg&_nc_ss=7a3a8&oh=00_Af3LWoot6JIWs4NgbFBn7sCZ7F_5jwGvcc3inh7Z03jDjg&oe=69EE7CED";

const STATS = [
    { label: "Байгуулагдсан он", value: "1950" },
    { label: "Үзвэрийн танхим", value: "1" },
    { label: "Үзэгчийн суудал", value: "293" },
    { label: "Технологи", value: "Projector" },
];

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-red-500 selection:text-white">
            <Header movies={[]} onSearchResults={() => {}} />

            <main>
                {/* 1. CINEMATIC HERO SECTION */}
                <section className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={HERO_IMAGE} 
                            alt="Cinema Hall" 
                            className="w-full h-full object-cover opacity-60 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#050505] via-white/60 dark:via-[#050505]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/80 dark:from-[#050505]/80 to-transparent" />
                    </div>

                    <div className="relative z-10 container mx-auto px-6 max-w-7xl mt-20">
                        <h4 className="text-red-600 dark:text-red-500 font-bold tracking-[0.3em] uppercase mb-4 animate-fade-in-up">
                            Ховд Аймгийн Хөгжимт Драмын Театр
                        </h4>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 max-w-4xl text-gray-900 dark:text-white">
                            КИНО УРЛАГИЙН <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">
                                ШИНЭ ЭРИН ҮЕ
                            </span>
                        </h1>
                        <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl max-w-2xl leading-relaxed border-l-4 border-red-600 pl-6">
                            Бид дурсамж бүтээдэг, мэдрэмж бэлэглэдэг соёл урлагийн төв юм.
                        </p>
                    </div>
                </section>

                {/* 2. STATS BAR */}
                <section className="relative z-20 -mt-20 container mx-auto px-6 max-w-7xl mb-24">
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-100 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
                        {STATS.map((stat, idx) => (
                            <div key={idx} className="text-center py-4 border-r border-gray-200 dark:border-white/5 last:border-0">
                                <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. MISSION & STORY */}
                <section className="container mx-auto px-6 max-w-7xl py-12 md:py-24">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="w-full md:w-1/2 relative">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600 rounded-full blur-[80px] opacity-40 dark:opacity-20"></div>
                            <img 
                                src="https://scontent.fuln1-1.fna.fbcdn.net/v/t1.6435-9/173006689_278902727144141_1540042823781681460_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=2a1932&_nc_ohc=GlDHJZUIdcIQ7kNvwHnQHTL&_nc_oc=Adq_EWAWnOA1hUzt05WdhFGbegG_GhChzQkR1QPjcYO9xj2wN42tnUZcbcOxBlL0qyU&_nc_zt=23&_nc_ht=scontent.fuln1-1.fna&_nc_gid=WnChQqBJj-4p5Dk-dxzBpg&_nc_ss=7a3a8&oh=00_Af1IhvBuSRVkBJxO01tXykU_OL986txW36k4Q-OyET8aZw&oe=6A100806" 
                                alt="Audience" 
                                className="rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 grayscale hover:grayscale-0 transition-all duration-700 ease-in-out"
                            />
                            <div className="absolute -bottom-10 -right-5 md:-right-10 bg-white dark:bg-[#111] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-xs hidden md:block">
                                <p className="text-gray-600 dark:text-gray-400 italic text-sm">
                                    "Тус театр нь баруун бүсийн соёлын гол төвийн үүрэг гүйцэтгэж, жүжиг, хөгжмийн тоглолт болон уламжлалт монгол урлагийг толилуулан орон нутгийн өв соёлыг хадгалж, түгээн дэлгэрүүлдэг."
                                </p>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-1/2">
                            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight text-gray-900 dark:text-white">
                                БИДНИЙ <span className="text-red-600 dark:text-red-500">ТҮҮХ</span>
                            </h2>
                            <div className="space-y-6 text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                <p>
                                   1933 онд байгуулагдсан тус театр нь Монголын орон нутгийн хамгийн эртний соёлын байгууллагуудын нэг юм. Алс баруун бүс нутагт урлагийг хөгжүүлэх, хөдөө орон нутгийн иргэдэд тайзны урлагийг хүртээмжтэй хүргэх зорилгоор байгуулагдсан. Олон арван жилийн хугацаанд жүжигчин, хөгжимчин, тайзны уран бүтээлчдийн хэд хэдэн үеийг бэлтгэн гаргаж, улсын урлагийн салбарт үнэтэй хувь нэмэр оруулсаар иржээ.
                                </p>
                                <p>    
                                    Тоглолтоос гадна тус театр нь <strong className="text-gray-900 dark:text-white">соёлын боловсрол олгох, залуучуудыг урлагт татан оролцуулах чухал төв</strong> болдог. <strong className="text-gray-900 dark:text-white">Сургалт, семинар, бүсийн наадам, бусад театртай хамтарсан уран бүтээлийн ажиллагааг зохион байгуулснаар соёл хоорондын харилцааг бэхжүүлж,</strong> Ховд аймгийн биет бус соёлын өвийг хадгалах үйлсэд чухал хувь нэмэр оруулж байна.
                                </p>
                                <button 
                                    onClick={() => navigate('/schedule')}
                                    className="group mt-4 inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold border-b border-red-500 pb-1 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                >
                                    Цагийн хуваарь харах
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. FEATURES */}
                <section className="container mx-auto px-6 max-w-7xl py-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">ОНЦГОЙ ТУРШЛАГА</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
                        {/* Box 1 */}
                        <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10">
                            <img 
                                src="https://scontent.fuln1-1.fna.fbcdn.net/v/t39.30808-6/480773998_934565272175533_2821675809146286106_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=jdR4EhJhMAYQ7kNvwEiEptV&_nc_oc=Adr2VC5oazQNRwuuRHLWTpXbGGx0-IwjQXbrGWRvM3Htz2rDSwvFc8cmDxoCQ-vZhP8&_nc_zt=23&_nc_ht=scontent.fuln1-1.fna&_nc_gid=G2i32gwdhMD_rYioiwR-kw&_nc_ss=7a3a8&oh=00_Af0PSyIQUyrfX-lkilIG0TxcKxmkbzYIlkdCYmNxhwA_qw&oe=69EE8B58" 
                                alt="Seat" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-white/20 dark:via-black/20 to-transparent opacity-90" />
                            <div className="absolute bottom-0 left-0 p-8">
                                <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Үзвэр үйлчилгээ</h3>
                                <p className="text-gray-600 dark:text-gray-400">Шинэ театрын үзүүлбэр үзүүлдэг</p>
                            </div>
                        </div>

                        {/* Box 2 */}
                        <div className="bg-gray-50 dark:bg-[#111] p-8 rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col justify-between hover:border-red-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-600/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4 group-hover:bg-red-600 group-hover:text-white transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Dolby Atmos</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">360 градусын дуугаралт, бодит мэдрэмж.</p>
                            </div>
                        </div>

                        {/* Box 3 */}
                        <div className="relative bg-gray-50 dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden group">
                             <img 
                                src="/public/seat.png" 
                                alt="Seat" 
                                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black to-transparent" />
                             <div className="absolute bottom-0 left-0 p-8 relative z-10">
                                <h3 className="text-xl font-bold mb-2 text-yellow-600 dark:text-yellow-400"> Танхим</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Тав тухтай орчин</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. LOCATION & CONTACT - GOOGLE MAPS EMBED (ҮНЭГҮЙ) */}
                <section className="bg-gray-50 dark:bg-white/5 border-y border-gray-200 dark:border-white/5">
                    <div className="container mx-auto px-6 max-w-7xl py-20">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h4 className="text-red-600 dark:text-red-500 tracking-widest uppercase font-bold mb-2">Бид хаана вэ?</h4>
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">ХОЛБОО БАРИХ</h2>
                                
                                <div className="space-y-8">
                                    <ContactItem 
                                        icon={
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                            </>
                                        }
                                        title="Хаяг"
                                        text="Ховд аймаг, Жаргалант сум, Төв талбайн зүүн талд"
                                    />
                                    <ContactItem 
                                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />}
                                        title="Утас"
                                        text="+976 7777-2292"
                                    />
                                    <ContactItem 
                                        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />}
                                        title="Имэйл"
                                        text="khovdthearer1950@gmail.com"
                                    />
                                </div>

                                {/* Гарын авлага товч */}
                                <a 
                                    href="https://www.google.com/maps/place/Ховд+аймаг" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                    </svg>
                                    Google Maps дээр заавар авах
                                </a>
                            </div>

                            {/* GOOGLE MAPS EMBED IFRAME - БҮРЭН ҮНЭГҮЙ */}
                            <div className="h-[400px] w-full rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2675.6154871369547!2d91.63941431585117!3d48.00590796833096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x42e5b8b8b8b8b8b7%3A0xb8b8b8b8b8b8b8b8!2z0KXQvtCy0LQg0JDQudC80LDQs9C40LnQvSDRgtC10LDRgtGA!5e0!3m2!1smn!2smn!4v1620000000000!5m2!1smn!2smn"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm border-t border-gray-200 dark:border-white/5">
                <p>© 2026 Б.Төмөрчөдөрийн бүтээл. Бүх эрх хуулиар хамгаалагдсан.</p>
            </footer>
        </div>
    );
};

// Helper Component
const ContactItem = ({ icon, title, text }) => (
    <div className="flex items-start gap-4 group">
        <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {icon}
            </svg>
        </div>
        <div>
            <h5 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h5>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{text}</p>
        </div>
    </div>
);

export default About;