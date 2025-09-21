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

      {/* Pricing Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your farm's needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-primary-600 mb-4">$29<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="text-gray-600">Up to 5 sensors</li>
                <li className="text-gray-600">Basic monitoring</li>
                <li className="text-gray-600">Email alerts</li>
                <li className="text-gray-600">Mobile app access</li>
              </ul>
              <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200">
                Get Started
              </button>
            </div>

            <div className="bg-primary-600 rounded-lg p-8 text-center text-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Professional</h3>
              <div className="text-4xl font-bold mb-4">$79<span className="text-lg text-primary-100">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li>Up to 20 sensors</li>
                <li>Advanced analytics</li>
                <li>SMS & email alerts</li>
                <li>Weather integration</li>
                <li>Automated irrigation</li>
              </ul>
              <button className="w-full bg-white text-primary-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                Get Started
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-primary-600 mb-4">$199<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="text-gray-600">Unlimited sensors</li>
                <li className="text-gray-600">AI-powered insights</li>
                <li className="text-gray-600">Custom integrations</li>
                <li className="text-gray-600">24/7 support</li>
                <li className="text-gray-600">API access</li>
              </ul>
              <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers who have transformed their operations with our IoT monitoring solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
