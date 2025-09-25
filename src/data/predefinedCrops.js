// Sri Lanka-centric crop data with recommended ranges for Northern Province conditions
export const PREDEFINED_CROPS = [
  {
    cropName: "Rice (Paddy)",
    variety: "BG 300",
    recommendedRanges: {
      soilMoisturePct: { min: 30, max: 50 },
      airTemperature: { min: 25, max: 35 },
      airHumidity: { min: 60, max: 80 },
      soilTemperature: { min: 22, max: 30 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Main staple crop of Sri Lanka. Requires consistent moisture and warm temperatures."
  },
  {
    cropName: "Rice (Paddy)",
    variety: "BG 352",
    recommendedRanges: {
      soilMoisturePct: { min: 30, max: 50 },
      airTemperature: { min: 25, max: 35 },
      airHumidity: { min: 60, max: 80 },
      soilTemperature: { min: 22, max: 30 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "High-yielding variety suitable for Northern Province conditions."
  },
  {
    cropName: "Chili",
    variety: "Miris",
    recommendedRanges: {
      soilMoisturePct: { min: 20, max: 40 },
      airTemperature: { min: 22, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Spicy chili variety popular in Sri Lankan cuisine. Drought tolerant."
  },
  {
    cropName: "Onion",
    variety: "Red Onion",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 18, max: 28 },
      airHumidity: { min: 40, max: 60 },
      soilTemperature: { min: 16, max: 26 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Essential kitchen crop. Requires well-drained soil and moderate moisture."
  },
  {
    cropName: "Tomato",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 30, max: 50 },
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Versatile crop for cooking. Sensitive to extreme temperatures."
  },
  {
    cropName: "Brinjal (Eggplant)",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 22, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Popular vegetable in Sri Lankan curries. Heat tolerant."
  },
  {
    cropName: "Okra (Ladies Finger)",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 24, max: 34 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 22, max: 30 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Heat-loving crop. Produces well in hot, dry conditions."
  },
  {
    cropName: "Cucumber",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 30, max: 50 },
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 60, max: 80 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Cool-season crop. Requires consistent moisture and moderate temperatures."
  },
  {
    cropName: "Green Beans",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 18, max: 28 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 16, max: 24 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Nitrogen-fixing legume. Good for soil health and nutrition."
  },
  {
    cropName: "Cabbage",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 30, max: 50 },
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 60, max: 80 },
      soilTemperature: { min: 13, max: 23 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Cool-season crop. Best grown in cooler months or highland areas."
  },
  {
    cropName: "Carrot",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 13, max: 23 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Root vegetable. Requires loose, well-drained soil."
  },
  {
    cropName: "Radish",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 13, max: 23 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Fast-growing root crop. Good for quick harvests."
  },
  {
    cropName: "Spinach",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 30, max: 50 },
      airTemperature: { min: 15, max: 25 },
      airHumidity: { min: 60, max: 80 },
      soilTemperature: { min: 13, max: 23 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Leafy green vegetable. Rich in iron and vitamins."
  },
  {
    cropName: "Coriander",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 18, max: 28 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 16, max: 24 },
      airQualityIndex: { min: 0, max: 50 }
    },
    notes: "Aromatic herb. Essential for Sri Lankan cooking."
  },
  {
    cropName: "Curry Leaves",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 20, max: 40 },
      airTemperature: { min: 20, max: 30 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 18, max: 26 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Essential herb for Sri Lankan cuisine. Perennial plant."
  },
  {
    cropName: "Pumpkin",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 22, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Versatile vegetable. Can be used in curries and desserts."
  },
  {
    cropName: "Bitter Gourd",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 24, max: 34 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 22, max: 30 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Medicinal vegetable. Heat and drought tolerant."
  },
  {
    cropName: "Ridge Gourd",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 22, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Climbing vegetable. Requires support structure."
  },
  {
    cropName: "Snake Gourd",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 22, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Long, slender gourd. Popular in Sri Lankan curries."
  },
  {
    cropName: "Ash Gourd",
    variety: "Local",
    recommendedRanges: {
      soilMoisturePct: { min: 25, max: 45 },
      airTemperature: { min: 22, max: 32 },
      airHumidity: { min: 50, max: 70 },
      soilTemperature: { min: 20, max: 28 },
      airQualityIndex: { min: 0, max: 60 }
    },
    notes: "Large gourd variety. Used in traditional medicine and cooking."
  }
];
