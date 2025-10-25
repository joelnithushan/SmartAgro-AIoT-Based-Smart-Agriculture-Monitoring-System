import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      title: 'IoT Monitoring',
      description: 'Track soil moisture, temperature, humidity, and crop health in real-time with advanced sensor networks.',
      image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'AI Chatbot',
      description: 'Get instant farming advice, crop recommendations, and solutions to agricultural challenges 24/7.',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Smart Irrigation',
      description: 'Optimize water usage with automated irrigation systems based on real-time soil and weather data.',
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1920&q=80"
            alt="Smart Farming"
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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Smart Farming for a Sustainable Future
              </h1>
          <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed">
            Empowering farmers with IoT sensors, AI-driven insights, and automated solutions for better yields and sustainable practices.
          </p>
                  <Link
                    to="/login"
            className="inline-block px-10 py-4 bg-[#2E7D32] text-white text-lg font-semibold rounded-full hover:bg-[#1B5E20] transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
            Get Started
                  </Link>
        </motion.div>
      </section>

      {/* Introduction Section */}
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
              Welcome to SmartAgro
            </h2>
            <p className="text-lg md:text-xl text-[#8D6E63] max-w-3xl mx-auto leading-relaxed">
              SmartAgro combines cutting-edge IoT technology, artificial intelligence, and data analytics 
              to revolutionize farming. Monitor your crops, optimize resources, and make informed decisions 
              with our intelligent agricultural platform.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
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
            src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80"
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
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-white mb-8 leading-relaxed">
              Join thousands of farmers who are already using SmartAgro to increase productivity 
              and sustainability. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-10 py-4 bg-[#2E7D32] text-white text-lg font-semibold rounded-full hover:bg-[#1B5E20] transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create Account
              </Link>
              <Link
                to="/about"
                className="px-10 py-4 bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white text-lg font-semibold rounded-full hover:bg-white hover:text-[#2E7D32] transition-all duration-300 ease-in-out shadow-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
