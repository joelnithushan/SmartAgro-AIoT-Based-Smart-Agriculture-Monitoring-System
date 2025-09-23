import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About SmartAgro
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing agriculture through innovative IoT technology, helping farmers 
              make data-driven decisions for sustainable and profitable farming.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At AgriIoT, we believe that technology should serve the earth and those who cultivate it. 
                Our mission is to empower farmers with cutting-edge IoT solutions that provide real-time 
                insights into their agricultural operations.
              </p>
              <p className="text-lg text-gray-600">
                We're committed to making precision agriculture accessible to farmers of all sizes, 
                from small family farms to large agricultural enterprises, helping them optimize 
                resources, increase yields, and promote sustainable farming practices.
              </p>
            </div>
            <div className="bg-primary-100 rounded-lg p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-white">🌱</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Sustainable Agriculture</h3>
                <p className="text-gray-600">
                  Promoting environmentally friendly farming practices through smart technology
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                Continuously pushing the boundaries of agricultural technology to deliver 
                cutting-edge solutions that drive real results.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Partnership</h3>
              <p className="text-gray-600">
                Building lasting relationships with farmers, understanding their unique 
                challenges, and providing personalized support.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainability</h3>
              <p className="text-gray-600">
                Committed to environmental stewardship and helping farmers adopt 
                sustainable practices for future generations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600">
              Passionate experts dedicated to agricultural innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {[
              { name: "Joel Nithushan A.T", role: "Project Lead", emoji: "👨‍💻" },
              { name: "Kageepan K", role: "Team Member", emoji: "👨‍🔬" },
              { name: "Diltan T", role: "Team Member", emoji: "👨‍🌾" },
              { name: "Shiromy K.B", role: "Team Member", emoji: "👩‍💼" },
              { name: "Kanistan T", role: "Team Member", emoji: "👨‍🔧" }
            ].map((member, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{member.emoji}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Our Impact</h2>
            <p className="text-xl text-primary-100">
              Numbers that speak to our commitment to agricultural excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-primary-100">Active Farms</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50M+</div>
              <div className="text-primary-100">Acres Monitored</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">25%</div>
              <div className="text-primary-100">Average Yield Increase</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-primary-100">System Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
