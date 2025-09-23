import React from 'react';

const Services = () => {
  const services = [
    {
      title: "Soil Monitoring",
      description: "Advanced sensors measure soil moisture, pH levels, nutrient content, and temperature to optimize irrigation and fertilization.",
      features: ["Real-time soil moisture tracking", "pH level monitoring", "Nutrient analysis", "Temperature sensing"],
      icon: "🌱"
    },
    {
      title: "Weather Integration",
      description: "Connect with local weather stations and meteorological services for accurate weather forecasting and climate data.",
      features: ["Local weather forecasts", "Historical climate data", "Rainfall predictions", "Temperature alerts"],
      icon: "🌤️"
    },
    {
      title: "Crop Health Monitoring",
      description: "AI-powered image analysis and sensor data to detect diseases, pests, and growth patterns in your crops.",
      features: ["Disease detection", "Pest identification", "Growth tracking", "Yield prediction"],
      icon: "🔍"
    },
    {
      title: "Automated Irrigation",
      description: "Smart irrigation systems that automatically adjust water delivery based on soil conditions and weather forecasts.",
      features: ["Automated watering schedules", "Water usage optimization", "Zone-based control", "Leak detection"],
      icon: "💧"
    },
    {
      title: "Data Analytics Dashboard",
      description: "Comprehensive analytics platform providing insights into farm performance, trends, and optimization opportunities.",
      features: ["Performance metrics", "Trend analysis", "Custom reports", "Mobile access"],
      icon: "📊"
    },
    {
      title: "Alert System",
      description: "Real-time notifications for critical events, weather changes, and system issues to keep you informed 24/7.",
      features: ["SMS notifications", "Email alerts", "Mobile push notifications", "Custom alert rules"],
      icon: "🔔"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive IoT solutions designed to optimize every aspect of your agricultural operations. 
              From soil monitoring to automated irrigation, we provide the tools you need for smart farming.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{service.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>
                
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Services;
