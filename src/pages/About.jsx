import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };


  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
            alt="Smart Farming Technology"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
            }}
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
              About SmartAgro
            </h1>
          <p className="text-xl md:text-2xl text-white leading-relaxed">
            Transforming agriculture through innovation, technology, and sustainable practices.
          </p>
        </motion.div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20"
          >
            {/* Mission */}
            <div className="bg-white bg-opacity-50 backdrop-blur-md rounded-2xl p-10 shadow-lg">
              <h2 className="text-3xl font-bold text-[#2E7D32] mb-6">Our Mission</h2>
              <p className="text-lg text-[#8D6E63] leading-relaxed mb-4">
                To empower farmers with cutting-edge technology and data-driven insights that enable 
                sustainable farming practices, increase productivity, and ensure food security for future generations.
              </p>
              <p className="text-lg text-[#8D6E63] leading-relaxed">
                We believe that every farmer, regardless of farm size, deserves access to smart agricultural 
                tools that can transform their operations and improve their livelihoods.
              </p>
      </div>

            {/* Vision */}
            <div className="bg-white bg-opacity-50 backdrop-blur-md rounded-2xl p-10 shadow-lg">
              <h2 className="text-3xl font-bold text-[#2E7D32] mb-6">Our Vision</h2>
              <p className="text-lg text-[#8D6E63] leading-relaxed mb-4">
                To become the leading smart agriculture platform in South Asia, revolutionizing farming 
                through IoT, AI, and sustainable practices that benefit both farmers and the environment.
              </p>
              <p className="text-lg text-[#8D6E63] leading-relaxed">
                We envision a future where technology and nature work in harmony, creating resilient 
                agricultural ecosystems that can adapt to climate change and feed growing populations.
              </p>
            </div>
          </motion.div>

          {/* Our Story */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-2xl shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
              alt="Smart Farming Equipment"
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1530210124551-ab211c98d3b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-3xl text-center">
                <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
                <p className="text-lg text-white leading-relaxed">
                  SmartAgro was founded in 2025 as a university project by a team of agricultural scientists, engineers, and technologists 
                  who witnessed firsthand the challenges faced by farmers in Sri Lanka. From unpredictable weather 
                  patterns to water scarcity and pest infestations, we saw the need for a comprehensive solution 
                  that combines IoT sensors, AI analytics, and practical farming wisdom. This innovative project aims to serve 
                  farmers across the country, helping them make informed decisions and achieve sustainable growth.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Values Section */}
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
              Our Core Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Innovation',
                description: 'Continuously advancing agricultural technology to meet evolving farming needs.',
                image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Sustainability',
                description: 'Promoting eco-friendly practices that preserve resources for future generations.',
                image: 'https://images.unsplash.com/photo-1591167986108-ab5aa4b85c73?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Farmer-Centric',
                description: 'Putting farmers first in everything we design, develop, and deliver.',
                image: 'https://images.unsplash.com/photo-1595429274346-cda3c0e75c71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative bg-white bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={value.image}
                    alt={value.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
            </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-[#2E7D32] mb-4">{value.title}</h3>
                  <p className="text-[#8D6E63] leading-relaxed">{value.description}</p>
            </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
