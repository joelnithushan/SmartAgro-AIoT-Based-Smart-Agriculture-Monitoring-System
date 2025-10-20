import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Services() {
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const services = [
    {
      title: 'Real-time Farm Monitoring',
      description: 'Monitor your farm\'s soil moisture, temperature, humidity, and environmental conditions 24/7 with IoT sensors. Get instant insights and alerts directly to your device.',
      image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80',
      link: '/user/dashboard'
    },
    {
      title: 'Smart Irrigation System',
      description: 'Automate your irrigation based on real-time soil moisture data and weather forecasts. Save up to 50% on water usage while maintaining optimal crop health.',
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
      link: '/user/alerts'
    },
    {
      title: 'AI-powered Crop Advisory',
      description: 'Get personalized crop recommendations, disease detection, and yield predictions powered by machine learning algorithms trained on agricultural data.',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
      link: '/user/ai-chatbot'
    },
    {
      title: 'Fertilizer Management & Scheduling',
      description: 'Optimize fertilizer application with smart scheduling based on crop needs, soil analysis, and growth stages. Reduce costs and improve yields.',
      image: 'https://images.unsplash.com/photo-1595429274346-cda3c0e75c71?auto=format&fit=crop&w=800&q=80',
      link: '/user/crops'
    },
    {
      title: 'Alert & Notification System',
      description: 'Receive instant alerts via SMS, email, or push notifications for critical events like low soil moisture, extreme temperatures, or pest detection.',
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
      link: '/user/alerts'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80"
            alt="Smart Agriculture Services"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Our Smart Farming Services
          </h1>
          <p className="text-xl md:text-2xl text-white leading-relaxed">
            Comprehensive solutions designed to modernize your agricultural operations and maximize productivity.
          </p>
        </motion.div>
      </section>

      {/* Introduction */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#2E7D32] mb-6">
              Transforming Agriculture with Technology
            </h2>
            <p className="text-xl text-[#8D6E63] max-w-3xl mx-auto leading-relaxed">
              SmartAgro offers a complete suite of intelligent farming solutions that combine IoT sensors, 
              AI analytics, and automated systems to help you make data-driven decisions and achieve sustainable growth.
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className="group bg-white bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                    <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-[#8D6E63] leading-relaxed mb-6">{service.description}</p>
                  <Link
                    to={service.link}
                    className="inline-block px-8 py-3 bg-[#4CAF50] text-white font-semibold rounded-full hover:bg-[#2E7D32] transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Learn More
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 px-6 bg-white bg-opacity-30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#2E7D32] mb-6">
              Why Choose SmartAgro?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real-Time Insights',
                description: 'Access live data and analytics from anywhere, anytime through our web and mobile platforms.',
                image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Cost Savings',
                description: 'Reduce water, fertilizer, and labor costs by up to 40% with intelligent automation and optimization.',
                image: 'https://images.unsplash.com/photo-1591167986108-ab5aa4b85c73?auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Expert Support',
                description: '24/7 customer support and agricultural expert consultation to help you get the most from our platform.',
                image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative bg-white bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-[#2E7D32] mb-4">{feature.title}</h3>
                  <p className="text-[#8D6E63] leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80"
            alt="Agriculture Field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-12 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white mb-8 leading-relaxed">
              Join over 10,000 farmers who trust SmartAgro for their agricultural needs. 
              Start your free trial today and experience the future of farming.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-10 py-4 bg-[#4CAF50] text-white text-lg font-semibold rounded-full hover:bg-[#2E7D32] transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="px-10 py-4 bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white text-lg font-semibold rounded-full hover:bg-white hover:text-[#2E7D32] transition-all duration-300 ease-in-out shadow-lg"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
