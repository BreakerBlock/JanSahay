export type GrievanceCategory = {
  id: string;
  name: string;
  nameHi: string;
  slaDays: number;
  icon: string;
};

// Broad top-level service taxonomy modelled on the public-service themes visible
// in current CPGRAMS/DARPG material. A production responsibility matrix can add
// department-specific subcategories without changing the filing experience.
export const grievanceCategories: GrievanceCategory[] = [
  { id: 'water', name: 'Water & sanitation', nameHi: 'जल एवं स्वच्छता', slaDays: 7, icon: '💧' },
  { id: 'roads', name: 'Roads & public transport', nameHi: 'सड़क एवं सार्वजनिक परिवहन', slaDays: 10, icon: '🛣️' },
  { id: 'power', name: 'Power & street lighting', nameHi: 'बिजली एवं स्ट्रीट लाइट', slaDays: 3, icon: '⚡' },
  { id: 'health', name: 'Health services', nameHi: 'स्वास्थ्य सेवाएँ', slaDays: 7, icon: '🏥' },
  { id: 'housing', name: 'Housing & urban services', nameHi: 'आवास एवं शहरी सेवाएँ', slaDays: 14, icon: '🏠' },
  { id: 'waste', name: 'Waste collection & cleanliness', nameHi: 'कचरा संग्रह एवं सफ़ाई', slaDays: 3, icon: '♻️' },
  { id: 'pensions', name: 'Pensions', nameHi: 'पेंशन', slaDays: 21, icon: '🧓' },
  { id: 'epfo_labour', name: 'EPFO & labour', nameHi: 'ईपीएफओ एवं श्रम', slaDays: 21, icon: '👷' },
  { id: 'banking', name: 'Banking & financial services', nameHi: 'बैंकिंग एवं वित्तीय सेवाएँ', slaDays: 21, icon: '🏦' },
  { id: 'railways', name: 'Railways', nameHi: 'रेलवे', slaDays: 14, icon: '🚆' },
  { id: 'telecom', name: 'Telecom & mobile services', nameHi: 'दूरसंचार एवं मोबाइल सेवाएँ', slaDays: 14, icon: '📶' },
  { id: 'education', name: 'Education & scholarships', nameHi: 'शिक्षा एवं छात्रवृत्ति', slaDays: 21, icon: '🎓' },
  { id: 'police_home', name: 'Police, safety & home affairs', nameHi: 'पुलिस, सुरक्षा एवं गृह मामले', slaDays: 14, icon: '🛡️' },
  { id: 'land_revenue', name: 'Land, property & revenue', nameHi: 'भूमि, संपत्ति एवं राजस्व', slaDays: 21, icon: '🗺️' },
  { id: 'food_distribution', name: 'Ration & food distribution', nameHi: 'राशन एवं खाद्य वितरण', slaDays: 7, icon: '🌾' },
  { id: 'social_welfare', name: 'Social welfare & benefits', nameHi: 'सामाजिक कल्याण एवं लाभ', slaDays: 21, icon: '🤝' },
  { id: 'vehicle_services', name: 'Driving licence & vehicle services', nameHi: 'ड्राइविंग लाइसेंस एवं वाहन सेवाएँ', slaDays: 14, icon: '🚘' },
  { id: 'environment', name: 'Environment & pollution', nameHi: 'पर्यावरण एवं प्रदूषण', slaDays: 14, icon: '🌿' },
  { id: 'postal', name: 'Postal services', nameHi: 'डाक सेवाएँ', slaDays: 14, icon: '📮' },
  { id: 'digital_services', name: 'Government portals & digital services', nameHi: 'सरकारी पोर्टल एवं डिजिटल सेवाएँ', slaDays: 10, icon: '💻' },
  { id: 'taxation', name: 'Taxation & public revenue', nameHi: 'कराधान एवं सार्वजनिक राजस्व', slaDays: 21, icon: '🧾' },
  { id: 'agriculture', name: 'Agriculture & farmer services', nameHi: 'कृषि एवं किसान सेवाएँ', slaDays: 14, icon: '🚜' },
  { id: 'consumer', name: 'Consumer affairs', nameHi: 'उपभोक्ता मामले', slaDays: 21, icon: '🛒' },
  { id: 'aadhaar_identity', name: 'Aadhaar & identity services', nameHi: 'आधार एवं पहचान सेवाएँ', slaDays: 21, icon: '🪪' },
  { id: 'other', name: 'Other public service', nameHi: 'अन्य जन सेवा', slaDays: 14, icon: '📌' },
];

export const grievanceCategoryIds = new Set(grievanceCategories.map((category) => category.id));

