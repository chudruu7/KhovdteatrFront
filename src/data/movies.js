// src/data/movies.js

const movies = {
  featured: {
    id: 1,
    title: "Dune: Part Two",
    genre: ["Action", "Adventure", "Sci-Fi"],
    rating: "8.8",
    duration: "2h 46m",
    releaseDate: "2024-03-01",
    description: "Пол Атрейдес өөрийн гэр бүлийг сүйрүүлсэн хуйвалдагчдаас өшөөгөө авахын тулд Чани болон Фременүүдтэй нэгдэн дайнд мордоно. Тэрээр өөрийн амьдралын хайр болон ертөнцийн хувь заяа хоёрын аль нэгийг сонгох хэцүү сонголттой тулгарах болно.",
    // Hero хэсэгт зориулсан хэвтээ зураг (Backdrop)
    posterUrl: "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", 
    // Босоо зураг
    coverUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Josh Brolin"],
    director: "Denis Villeneuve"
  },
  
  nowShowing: [
    {
      id: 1,
      title: "Dune: Part Two",
      genre: ["Action", "Adventure", "Sci-Fi"],
      rating: "8.8",
      duration: "2h 46m",
      releaseDate: "2024-03-01",
      description: "Пол Атрейдес Фременүүдтэй нэгдэн, гэр бүлийнхээ өшөөг авахаар тэмцэнэ.",
      posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w"
    },
    {
      id: 2,
      title: "Godzilla x Kong: The New Empire",
      genre: ["Action", "Sci-Fi", "Thriller"],
      rating: "7.2",
      duration: "1h 55m",
      releaseDate: "2024-03-29",
      description: "Бүхнийг чадагч Конг болон аймшигт Годзилла нар хүн төрөлхтөнд заналхийлж буй нууцлаг аюулын эсрэг нэгдэх болно.",
      posterUrl: "https://image.tmdb.org/t/p/w500/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg",
      trailerUrl: "https://www.youtube.com/embed/lV1OOlGwExM"
    },
    {
      id: 3,
      title: "Kung Fu Panda 4",
      genre: ["Animation", "Action", "Comedy"],
      rating: "7.6",
      duration: "1h 34m",
      releaseDate: "2024-03-08",
      description: "По өөрийн залгамжлагчийг хайхын сацуу шинэ дайсантай тулгарна.",
      posterUrl: "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
      trailerUrl: "https://www.youtube.com/embed/_inKs4eeHiI"
    },
    {
      id: 4,
      title: "Interstellar",
      genre: ["Adventure", "Drama", "Sci-Fi"],
      rating: "8.7",
      duration: "2h 49m",
      releaseDate: "2014-11-07",
      description: "Хүн төрөлхтнийг аврахын тулд сансрын нисгэгчид өтний нүхээр аялна.",
      posterUrl: "/public/interstellar.jpg",
      trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E"
    },
    {
        id: 5,
        title: "Oppenheimer",
        genre: ["Biography", "Drama", "History"],
        rating: "8.5",
        duration: "3h 0m",
        releaseDate: "2023-07-21",
        description: "Америкийн эрдэмтэн Ж.Роберт Оппенхаймер болон атомын бөмбөгийг бүтээх үйл явц.",
        posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg"
    }
  ],
  
  comingSoon: [
    {
      id: 6,
      title: "Deadpool & Wolverine",
      genre: ["Action", "Comedy", "Sci-Fi"],
      rating: "TBA",
      duration: "TBA",
      releaseDate: "2024-07-26",
      description: "Уэйд Уилсон буюу Дэдпул өөрийн тайван амьдралаа орхин Волверинтэй нэгдэхэд хүрнэ.",
      posterUrl: "/public/deadpool.jpg",
      trailerUrl: "https://www.youtube.com/embed/uJMCNJP2ipI"
    },
    {
      id: 7,
      title: "Despicable Me 4",
      genre: ["Animation", "Comedy", "Family"],
      rating: "TBA",
      duration: "TBA",
      releaseDate: "2024-07-03",
      description: "Грү болон түүний гэр бүлд шинэ адал явдал тохиолдоно.",
      posterUrl: "/public/despicable.jpg",
      trailerUrl: "https://www.youtube.com/embed/qQdBZXy15p0"
    },
    {
        id: 8,
        title: "Inside Out 2",
        genre: ["Animation", "Comedy", "Drama"],
        rating: "TBA",
        duration: "TBA",
        releaseDate: "2024-06-14",
        description: "Райли өсвөр насанд хүрч, шинэ сэтгэл хөдлөлүүдтэй танилцана.",
        posterUrl: "/public/Inside_Out_2_poster.jpg",
        trailerUrl: "https://www.youtube.com/embed/LEjhY15eCx0"
      }
  ]
};

const news = [
  {
    id: 1,
    title: "IMAX технологи Ховд аймагт",
    excerpt: "Тун удахгүй манай кино театрт IMAX танхим ашиглалтад орох гэж байна.",
    date: "2025-06-15",
    image: "https://images.unsplash.com/photo-1517604931442-71053e3e2c28?w=600&h=400&fit=crop",
    content: "Дэлхийн стандартын дуу дүрсний өндөр чанарыг мэдрүүлэх IMAX танхимын засварын ажил 80%-тай явж байна..."
  },
  {
    id: 2,
    title: "Оскар 2024: Ялагчид тодорлоо",
    excerpt: "'Оппенхаймер' кино шилдэг зураглаач болон найруулагчийн шагналыг хүртлээ.",
    date: "2024-03-11",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop",
    content: "96 дахь удаагийн Оскарын шагнал гардуулах ёслол амжилттай болж өндөрлөлөө..."
  }
];

const promotions = [
  {
    id: 1,
    title: "Хосуудын багц",
    description: "2 тасалбар + Дунд попкорн + 2 ундаа = 35,000₮",
    validUntil: "2024-12-31",
    color: "from-pink-500 to-rose-500" // UI дээр ашиглах градиент өнгө
  },
  {
    id: 2,
    title: "Оюутны хямдрал",
    description: "Даваа-Баасан гарагуудад 18:00 цагаас өмнө 30% хямдрал",
    validUntil: "2024-12-31",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 3,
    title: "Гэр бүлийн өдөр",
    description: "Бямба гараг бүр хүүхдийн тасалбар 50% хямдралтай",
    validUntil: "2024-09-01",
    color: "from-amber-500 to-orange-500"
  }
];

export { movies, news, promotions };