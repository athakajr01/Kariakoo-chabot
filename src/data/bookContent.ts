export interface BookChunk {
  id: string;
  chapter?: string;
  topic: string;
  keywords: string[];
  content: string;
}

export const BOOK_CHUNKS: BookChunk[] = [
  {
    id: "intro",
    topic: "Introduction",
    keywords: ["fursa", "biashara", "machimbo", "kelvin kibenje"],
    content: "Title: Fursa za Kibiashara na Machimbo (Business Opportunities and Their Sources). Author: Mwl. Kelvin Kibenje Kyaluoko. Year: 2023. The book provides guidance on various business opportunities in Tanzania, specifically focusing on where to find products at wholesale prices (machimbo) and how to manage these businesses."
  },
  {
    id: "mitumba",
    chapter: "1",
    topic: "Mitumba (Second-hand Clothes)",
    keywords: ["mitumba", "nguo", "bales", "grade", "ilala boma"],
    content: "Mitumba (Second-hand Clothes): Grades: Grade 1 (A) and Grade 2 (B). Weights: 30kg, 45kg, 60kg, 70kg, 100kg. Sources: China, Korea, Turkey, Canada, USA. Types: Children's clothes, t-shirts, shirts, jeans, suits, curtains, bedsheets. Tips: Iron clothes before selling, sell cotton clothes quickly as they fade in sun. Contacts for Bales: Ms. Nice Alex (0769297877 - Ilala boma), Celine Richard (0714582044 - Kijitonyama)."
  },
  {
    id: "innerwear",
    chapter: "2",
    topic: "Nguo za Ndani (Innerwear)",
    keywords: ["innerwear", "nguo za ndani", "kariakoo", "mchikichi", "mtaji"],
    content: "Nguo za Ndani (Innerwear): High demand (90% of people wear them). Low capital needed (starting from 200,000 TSh). Sources: China is best for low prices (1,000 - 2,000 TSh per piece). Kariakoo Sources: Mchikichi street, Gogo, Sikukuu. Contacts: 0672137344, 0757443282."
  },
  {
    id: "cosmetics",
    chapter: "3",
    topic: "Vipodozi (Cosmetics)",
    keywords: ["vipodozi", "cosmetics", "urembo", "rasta", "zanzibar"],
    content: "Vipodozi (Cosmetics): High demand, especially for women. Kariakoo Sources: Bigborn area, Mafia street, Pemba street, Jangwani street. Products: Hair extensions (rasta), lipstick, nail polish, perfume, lotions, scrubs. Contacts: Jackline (@kariakoovipodozi - 0655155782), Tesha (0685935530), Eliya (0782787995). Zanzibar Source: 0717675860."
  },
  {
    id: "carwash",
    chapter: "4",
    topic: "Carwash",
    keywords: ["carwash", "usafi", "magari", "vifaa"],
    content: "Carwash: Location is key (near main roads, bars, churches, salons). Equipment: High-pressure washer, water pump, cleaning machines, vacuums. Services: Interior cleaning, engine cleaning, waxing."
  },
  {
    id: "drinks",
    chapter: "5",
    topic: "Vinywaji (Drinks)",
    keywords: ["vinywaji", "drinks", "soda", "juice", "manzese"],
    content: "Vinywaji (Drinks): High demand (soda, juice, energy drinks, water, alcohol). Source: Manzese (wholesale agents in Dar es Salaam). Tips: Be a supplier for events, restaurants."
  },
  {
    id: "grocery",
    chapter: "6",
    topic: "Genge (Grocery/Fresh Produce)",
    keywords: ["genge", "mbogamboga", "matunda", "chakula"],
    content: "Genge (Grocery/Fresh Produce): Daily necessity. Low capital. Location: Busy areas, residential areas (door-to-door delivery). Products: Tomatoes, onions, vegetables, fruits."
  },
  {
    id: "motorcycle",
    chapter: "7",
    topic: "Vifaa vya Pikipiki (Motorcycle Parts)",
    keywords: ["pikipiki", "bodaboda", "spare parts", "kariakoo"],
    content: "Vifaa vya Pikipiki (Motorcycle Parts): Growing market due to bodaboda. Capital: At least 3,000,000 TSh. Sources: Kariakoo (Swahili street, Nyamwezi, Mafia, Sikukuu, Kiungani, Congo). Contact: 0756876358."
  },
  {
    id: "phone",
    chapter: "8",
    topic: "Vifaa vya Simu (Phone Accessories)",
    keywords: ["simu", "accessories", "charger", "earphones", "kariakoo"],
    content: "Vifaa vya Simu (Phone Accessories): Products: Glass protectors, covers, chargers, earphones, batteries, memory cards. Capital: Starting from 200,000 TSh. Sources: Kariakoo (Agrey and Likoma streets). Contacts: 0628647484 (screens, batteries), 0711607724 (small phones)."
  },
  {
    id: "small_industry",
    chapter: "9",
    topic: "Viwanda Vidogo Vidogo (Small Industries)",
    keywords: ["viwanda", "industry", "sabuni", "mafuta", "packaging"],
    content: "Viwanda Vidogo Vidogo (Small Industries): Ideas: Fish feed, tailoring, soap making, natural oils, grain processing, sausage making, sanitary pads, ice cream, packaging, toothpicks, leather belts/wallets, peanut grinding. Capital: 500,000 - 2,000,000 TSh."
  },
  {
    id: "students_employees",
    chapter: "10",
    topic: "Business for Students/Employees",
    keywords: ["wanafunzi", "wafanyakazi", "students", "employees", "utt"],
    content: "Business for Students/Employees: Students: Accessories, skin jeans (Ilala Boma/Karume), phone accessories, cosmetics, running errands (kutumwa). Employees: Financial investments (UTT, real estate), services (MC, decoration), rentals (speakers, chairs), professional consulting, graphics, websites, football viewing centers."
  },
  {
    id: "kariakoo_sources",
    chapter: "11",
    topic: "Specific Kariakoo Machimbo (Sources)",
    keywords: ["kariakoo", "machimbo", "plastic", "nguo", "viatu", "umeme"],
    content: "Specific Kariakoo Machimbo (Sources): Plastic items: Livingstone and Aggrey streets, Mchikichi. Cello Tanzania (Chang'ombe), Jambo Plastic (Vingunguti). Artificial flowers: Sikukuu and Aggrey, Nilkant tower (Upanga). Women's clothes: Raha street (Wanyama Hotel), Nyamwezi, Narung'ombe (Barcelona building). Men's clothes: Mchikichi Complex, Congo street. Innerwear: Swahili, Nyamwezi, Sikukuu. Mats/Tarpaulins: Narung'ombe and Sikukuu. Packaging: Tandamti and Sikukuu. Religious items (Kanzu): Msikiti wa Mtoro (Livingstone), Msikiti wa Kiblateni (Sikukuu). Watches/Jewelry: Warioba building (near NBC Kariakoo). Shoes: Congo and Narung'ombe, DDC building, Shamba la Bibi. Building materials/Plumbing: Mbaruku, Swahili, Kiungani, Mchikichi and Gogo. Electrical appliances: 0748090061 (Kodtec). Fabrics (Jora): Tandamti and Likoma. Bedding (Mashuka/Pazia): Aggrey and Livingstone, 'Mama Mangala' (026000), Nyamwezi and Swahili."
  },
  {
    id: "advice",
    topic: "General Advice",
    keywords: ["ushauri", "advice", "mtaji", "winga", "marketing"],
    content: "General Advice: Start small if capital is low. Be a 'Winga' (broker) if you have no stock - find customers and get products from others. Manage capital wisely: 50% for stock, 20% for 6 months rent, 10% for equipment, 10% for initial salaries, 3% for permits, 3% for marketing, 2% for transport. Be honest and build a brand."
  }
];

export const BOOK_CONTENT = BOOK_CHUNKS.map(c => c.content).join("\n\n");
