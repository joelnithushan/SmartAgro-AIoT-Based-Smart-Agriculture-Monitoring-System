// Comprehensive Crop Database with Real Agricultural Parameter Ranges
// Data sourced from agricultural research and farming best practices

export const cropDatabase = {
  // Vegetables
  tomatoes: {
    name: "Tomatoes",
    category: "Vegetables",
    variety: "Cherry",
    description: "Popular warm-season vegetable",
    recommendedRanges: {
      airTemperature: { min: 18, max: 29 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 80 },
      soilTemperature: { min: 20, max: 30 },
      airQualityIndex: { min: 0, max: 150 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "High",
    lightNeeds: "Full Sun"
  },
  
  lettuce: {
    name: "Lettuce",
    category: "Leafy Greens",
    variety: "Romaine",
    description: "Cool-season leafy vegetable",
    recommendedRanges: {
      airTemperature: { min: 7, max: 21 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 60, max: 85 },
      soilTemperature: { min: 10, max: 20 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Spring-Fall",
    waterNeeds: "Medium",
    lightNeeds: "Partial Sun"
  },

  peppers: {
    name: "Bell Peppers",
    category: "Vegetables",
    variety: "Sweet",
    description: "Warm-season vegetable",
    recommendedRanges: {
      airTemperature: { min: 21, max: 29 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun"
  },

  cucumbers: {
    name: "Cucumbers",
    category: "Vegetables",
    variety: "Slicing",
    description: "Warm-season vine crop",
    recommendedRanges: {
      airTemperature: { min: 18, max: 27 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 80 },
      soilTemperature: { min: 16, max: 24 },
      airQualityIndex: { min: 0, max: 130 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "High",
    lightNeeds: "Full Sun"
  },

  // Fruits
  strawberries: {
    name: "Strawberries",
    category: "Fruits",
    variety: "June-bearing",
    description: "Perennial fruit crop",
    recommendedRanges: {
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 65, max: 80 },
      soilMoisturePct: { min: 60, max: 85 },
      soilTemperature: { min: 12, max: 22 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "High",
    lightNeeds: "Full Sun"
  },

  // Grains
  wheat: {
    name: "Wheat",
    category: "Grains",
    variety: "Winter",
    description: "Cool-season cereal grain",
    recommendedRanges: {
      airTemperature: { min: 10, max: 24 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 8, max: 20 },
      airQualityIndex: { min: 0, max: 150 }
    },
    growingSeason: "Fall-Spring",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun"
  },

  rice: {
    name: "Rice",
    category: "Grains",
    variety: "Long-grain",
    description: "Warm-season cereal grain",
    recommendedRanges: {
      airTemperature: { min: 20, max: 35 },
      airHumidity: { min: 70, max: 90 },
      soilMoisturePct: { min: 80, max: 95 },
      soilTemperature: { min: 18, max: 30 },
      airQualityIndex: { min: 0, max: 200 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "Very High",
    lightNeeds: "Full Sun"
  },

  // Herbs
  basil: {
    name: "Basil",
    category: "Herbs",
    variety: "Sweet",
    description: "Warm-season aromatic herb",
    recommendedRanges: {
      airTemperature: { min: 18, max: 27 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 16, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun"
  },

  mint: {
    name: "Mint",
    category: "Herbs",
    variety: "Spearmint",
    description: "Perennial aromatic herb",
    recommendedRanges: {
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 80 },
      soilTemperature: { min: 12, max: 22 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Spring-Fall",
    waterNeeds: "High",
    lightNeeds: "Partial Sun"
  },

  // Root Vegetables
  carrots: {
    name: "Carrots",
    category: "Root Vegetables",
    variety: "Orange",
    description: "Cool-season root vegetable",
    recommendedRanges: {
      airTemperature: { min: 10, max: 24 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 8, max: 20 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Spring-Fall",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun"
  },

  potatoes: {
    name: "Potatoes",
    category: "Root Vegetables",
    variety: "Russet",
    description: "Cool-season tuber crop",
    recommendedRanges: {
      airTemperature: { min: 15, max: 24 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 60, max: 85 },
      soilTemperature: { min: 12, max: 20 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "High",
    lightNeeds: "Full Sun"
  },

  // Legumes
  beans: {
    name: "Green Beans",
    category: "Legumes",
    variety: "Bush",
    description: "Warm-season legume",
    recommendedRanges: {
      airTemperature: { min: 18, max: 27 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 16, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun"
  },

  // Tropical Crops
  bananas: {
    name: "Bananas",
    category: "Tropical Fruits",
    variety: "Cavendish",
    description: "Tropical fruit tree",
    recommendedRanges: {
      airTemperature: { min: 24, max: 32 },
      airHumidity: { min: 75, max: 90 },
      soilMoisturePct: { min: 60, max: 85 },
      soilTemperature: { min: 22, max: 28 },
      airQualityIndex: { min: 0, max: 150 }
    },
    growingSeason: "Year-round",
    waterNeeds: "High",
    lightNeeds: "Full Sun"
  },

  // Spices
  turmeric: {
    name: "Turmeric",
    category: "Spices",
    variety: "Curcuma longa",
    description: "Tropical spice crop",
    recommendedRanges: {
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 60, max: 80 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Spring-Summer",
    waterNeeds: "High",
    lightNeeds: "Partial Sun"
  },

  // ============================================================================
  // SRI LANKA FAMILIAR CROPS
  // ============================================================================

  // Rice Varieties (Sri Lanka's staple crop)
  samba_rice: {
    name: "Samba Rice",
    category: "Sri Lankan Grains",
    variety: "Traditional Samba",
    description: "Traditional Sri Lankan rice variety - main season crop",
    recommendedRanges: {
      airTemperature: { min: 24, max: 32 },
      airHumidity: { min: 75, max: 90 },
      soilMoisturePct: { min: 80, max: 95 },
      soilTemperature: { min: 22, max: 28 },
      airQualityIndex: { min: 0, max: 200 }
    },
    growingSeason: "Maha Season (Oct-Mar)",
    waterNeeds: "Very High",
    lightNeeds: "Full Sun",
    region: "All regions of Sri Lanka"
  },

  nadu_rice: {
    name: "Nadu Rice",
    category: "Sri Lankan Grains",
    variety: "Short Grain Nadu",
    description: "Popular Sri Lankan rice variety - short grain",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 75, max: 90 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 180 }
    },
    growingSeason: "Yala Season (Apr-Sep)",
    waterNeeds: "High",
    lightNeeds: "Full Sun",
    region: "Low country and mid country"
  },

  // Coconut (Sri Lanka's tree of life)
  coconut: {
    name: "Coconut",
    category: "Sri Lankan Tree Crops",
    variety: "Typica (Local)",
    description: "Sri Lanka's most important tree crop - 'Tree of Life'",
    recommendedRanges: {
      airTemperature: { min: 26, max: 32 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 60, max: 80 },
      soilTemperature: { min: 24, max: 28 },
      airQualityIndex: { min: 0, max: 150 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "Coastal and low country"
  },

  // Tea (Sri Lanka's famous export)
  ceylon_tea: {
    name: "Ceylon Tea",
    category: "Sri Lankan Plantations",
    variety: "Camellia sinensis",
    description: "World-famous Sri Lankan tea - high grown",
    recommendedRanges: {
      airTemperature: { min: 18, max: 24 },
      airHumidity: { min: 80, max: 90 },
      soilMoisturePct: { min: 70, max: 85 },
      soilTemperature: { min: 16, max: 22 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round (peak: Mar-May, Sep-Nov)",
    waterNeeds: "High",
    lightNeeds: "Partial Sun",
    region: "Hill country (Nuwara Eliya, Kandy)"
  },

  // Rubber
  rubber: {
    name: "Rubber",
    category: "Sri Lankan Plantations",
    variety: "Hevea brasiliensis",
    description: "Sri Lankan rubber plantation crop",
    recommendedRanges: {
      airTemperature: { min: 24, max: 30 },
      airHumidity: { min: 75, max: 85 },
      soilMoisturePct: { min: 65, max: 80 },
      soilTemperature: { min: 22, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Year-round",
    waterNeeds: "High",
    lightNeeds: "Full Sun",
    region: "Wet zone low country"
  },

  // Spices (Sri Lanka's spice garden)
  ceylon_cinnamon: {
    name: "Ceylon Cinnamon",
    category: "Sri Lankan Spices",
    variety: "Cinnamomum verum",
    description: "True cinnamon - Sri Lanka's famous spice",
    recommendedRanges: {
      airTemperature: { min: 22, max: 28 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 60, max: 80 },
      soilTemperature: { min: 20, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Partial Sun",
    region: "Southwestern coastal belt"
  },

  cardamom: {
    name: "Cardamom",
    category: "Sri Lankan Spices",
    variety: "Elettaria cardamomum",
    description: "Queen of spices - Sri Lankan cardamom",
    recommendedRanges: {
      airTemperature: { min: 18, max: 25 },
      airHumidity: { min: 75, max: 90 },
      soilMoisturePct: { min: 70, max: 85 },
      soilTemperature: { min: 16, max: 22 },
      airQualityIndex: { min: 0, max: 80 }
    },
    growingSeason: "Year-round",
    waterNeeds: "High",
    lightNeeds: "Shade",
    region: "Hill country (Kandy, Matale)"
  },

  pepper: {
    name: "Black Pepper",
    category: "Sri Lankan Spices",
    variety: "Piper nigrum",
    description: "King of spices - Sri Lankan pepper",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 60, max: 80 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Partial Sun",
    region: "Wet zone low country"
  },

  // Vegetables (Common Sri Lankan vegetables)
  gotukola: {
    name: "Gotukola",
    category: "Sri Lankan Leafy Greens",
    variety: "Centella asiatica",
    description: "Traditional Sri Lankan leafy green - medicinal herb",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 75, max: 90 },
      soilMoisturePct: { min: 70, max: 85 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round",
    waterNeeds: "High",
    lightNeeds: "Shade",
    region: "All regions"
  },

  kankun: {
    name: "Kankun",
    category: "Sri Lankan Leafy Greens",
    variety: "Ipomoea aquatica",
    description: "Water spinach - popular Sri Lankan leafy vegetable",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 80, max: 95 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Very High",
    lightNeeds: "Full Sun",
    region: "Low country wetlands"
  },

  brinjal: {
    name: "Brinjal (Eggplant)",
    category: "Sri Lankan Vegetables",
    variety: "Local Purple",
    description: "Popular Sri Lankan vegetable - purple variety",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 60, max: 75 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  okra: {
    name: "Okra (Bandakka)",
    category: "Sri Lankan Vegetables",
    variety: "Local Green",
    description: "Popular Sri Lankan vegetable - green okra",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 130 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  // Fruits (Sri Lankan tropical fruits)
  king_coconut: {
    name: "King Coconut",
    category: "Sri Lankan Fruits",
    variety: "Thambili",
    description: "Sri Lankan king coconut - refreshing drink",
    recommendedRanges: {
      airTemperature: { min: 26, max: 32 },
      airHumidity: { min: 70, max: 85 },
      soilMoisturePct: { min: 60, max: 80 },
      soilTemperature: { min: 24, max: 28 },
      airQualityIndex: { min: 0, max: 150 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "Coastal and low country"
  },

  mango: {
    name: "Mango",
    category: "Sri Lankan Fruits",
    variety: "Karutha Kolomban",
    description: "Popular Sri Lankan mango variety",
    recommendedRanges: {
      airTemperature: { min: 24, max: 32 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 22, max: 28 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Dec-May",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  papaya: {
    name: "Papaya",
    category: "Sri Lankan Fruits",
    variety: "Red Lady",
    description: "Popular Sri Lankan papaya variety",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  // Root Crops
  manioc: {
    name: "Manioc (Cassava)",
    category: "Sri Lankan Root Crops",
    variety: "Local White",
    description: "Traditional Sri Lankan root crop - drought resistant",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Low",
    lightNeeds: "Full Sun",
    region: "Dry zone and low country"
  },

  sweet_potato: {
    name: "Sweet Potato",
    category: "Sri Lankan Root Crops",
    variety: "Local Red",
    description: "Traditional Sri Lankan sweet potato variety",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  // Additional Sri Lankan Crops from Statistics Lanka
  maize: {
    name: "Maize (Corn)",
    category: "Sri Lankan Grains",
    variety: "Local Hybrid",
    description: "Grown in both Maha and Yala seasons across districts",
    recommendedRanges: {
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All districts"
  },

  groundnut: {
    name: "Groundnut (Peanut)",
    category: "Sri Lankan Legumes",
    variety: "Local",
    description: "Widely cultivated, especially in Vavuniya and Kilinochchi",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Low",
    lightNeeds: "Full Sun",
    region: "Vavuniya, Kilinochchi, Dry zone"
  },

  green_gram: {
    name: "Green Gram (Mung Bean)",
    category: "Sri Lankan Legumes",
    variety: "Local",
    description: "Common leguminous crop - soil fertility contributor",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  black_gram: {
    name: "Black Gram (Urad Dal)",
    category: "Sri Lankan Legumes",
    variety: "Local",
    description: "Common leguminous crop - nitrogen fixing",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  cowpea: {
    name: "Cowpea",
    category: "Sri Lankan Legumes",
    variety: "Local",
    description: "Legume contributing to soil fertility",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  soybean: {
    name: "Soybean",
    category: "Sri Lankan Legumes",
    variety: "Local",
    description: "Legume contributing to soil fertility and protein",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  red_onion: {
    name: "Red Onion",
    category: "Sri Lankan Vegetables",
    variety: "Local Red",
    description: "Major vegetable, particularly in Yala season",
    recommendedRanges: {
      airTemperature: { min: 18, max: 26 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 16, max: 22 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Yala season (Apr-Sep)",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  big_onion: {
    name: "Big Onion",
    category: "Sri Lankan Vegetables",
    variety: "Local Large",
    description: "Major vegetable, particularly in Yala season",
    recommendedRanges: {
      airTemperature: { min: 18, max: 26 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 16, max: 22 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Yala season (Apr-Sep)",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  chili: {
    name: "Chili",
    category: "Sri Lankan Spices",
    variety: "Local Hot",
    description: "Spice and condiment with significant cultivation",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  sesame: {
    name: "Sesame",
    category: "Sri Lankan Oil Crops",
    variety: "Local",
    description: "Spice and condiment with significant cultivation",
    recommendedRanges: {
      airTemperature: { min: 24, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 22, max: 28 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Low",
    lightNeeds: "Full Sun",
    region: "Dry zone and low country"
  },

  kurakkan: {
    name: "Kurakkan (Finger Millet)",
    category: "Sri Lankan Grains",
    variety: "Traditional",
    description: "Traditional grain, especially in drier areas",
    recommendedRanges: {
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 50, max: 70 },
      soilMoisturePct: { min: 40, max: 70 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 120 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Low",
    lightNeeds: "Full Sun",
    region: "Drier areas, Dry zone"
  },

  tobacco: {
    name: "Tobacco",
    category: "Sri Lankan Commercial Crops",
    variety: "Local",
    description: "Commercial crop for local and export markets",
    recommendedRanges: {
      airTemperature: { min: 20, max: 28 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 18, max: 24 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Maha & Yala seasons",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  },

  papaya_sri_lankan: {
    name: "Papaya (Sri Lankan)",
    category: "Sri Lankan Fruits",
    variety: "Local Red",
    description: "Popular Sri Lankan papaya variety - local cultivation",
    recommendedRanges: {
      airTemperature: { min: 22, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilMoisturePct: { min: 50, max: 75 },
      soilTemperature: { min: 20, max: 26 },
      airQualityIndex: { min: 0, max: 100 }
    },
    growingSeason: "Year-round",
    waterNeeds: "Medium",
    lightNeeds: "Full Sun",
    region: "All regions"
  }
};

// Helper functions
export const getCropCategories = () => {
  const categories = [...new Set(Object.values(cropDatabase).map(crop => crop.category))];
  // Sort with Sri Lankan categories first
  const sriLankanCategories = categories.filter(cat => cat.includes('Sri Lankan'));
  const otherCategories = categories.filter(cat => !cat.includes('Sri Lankan'));
  return [...sriLankanCategories.sort(), ...otherCategories.sort()];
};

export const getCropsByCategory = (category) => {
  return Object.entries(cropDatabase)
    .filter(([key, crop]) => crop.category === category)
    .map(([key, crop]) => ({ key, ...crop }));
};

export const getCropByKey = (key) => {
  return cropDatabase[key] ? { key, ...cropDatabase[key] } : null;
};

export const searchCrops = (query) => {
  const searchTerm = query.toLowerCase();
  return Object.entries(cropDatabase)
    .filter(([key, crop]) => 
      crop.name.toLowerCase().includes(searchTerm) ||
      crop.category.toLowerCase().includes(searchTerm) ||
      crop.variety.toLowerCase().includes(searchTerm)
    )
    .map(([key, crop]) => ({ key, ...crop }));
};

// Sri Lankan specific helper functions
export const getSriLankanCrops = () => {
  return Object.entries(cropDatabase)
    .filter(([key, crop]) => crop.category.includes('Sri Lankan'))
    .map(([key, crop]) => ({ key, ...crop }));
};

export const getCropsByRegion = (region) => {
  return Object.entries(cropDatabase)
    .filter(([key, crop]) => crop.region && crop.region.toLowerCase().includes(region.toLowerCase()))
    .map(([key, crop]) => ({ key, ...crop }));
};

// Default crop for Sri Lankan users
export const getDefaultSriLankanCrop = () => {
  return {
    key: 'samba_rice',
    ...cropDatabase.samba_rice
  };
};

// Default crop for new users
export const getDefaultCrop = () => {
  return {
    key: 'tomatoes',
    ...cropDatabase.tomatoes
  };
};
