import React from 'react';
import ContactForm from '../components/ContactForm';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About Us</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We are dedicated to building innovative solutions that help businesses and individuals achieve their goals.
                Our platform combines cutting-edge technology with user-friendly design to deliver exceptional experiences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Vision</h2>
              <p className="text-gray-600 dark:text-gray-300">
                To become the leading platform in our industry, known for our commitment to excellence,
                innovation, and customer satisfaction. We strive to make a positive impact on the world
                through technology.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Values</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Innovation and Creativity</li>
                <li>Customer First</li>
                <li>Excellence in Everything We Do</li>
                <li>Integrity and Transparency</li>
                <li>Continuous Learning and Growth</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Team</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We are a diverse team of passionate individuals who bring together their unique skills
                and experiences to create something extraordinary. Our team members are experts in their
                respective fields and are committed to delivering the best possible solutions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Have questions or want to learn more? We'd love to hear from you. You can reach out to us at{' '}
                    <a
                      href="mailto:contact@example.com"
                      className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      contact@example.com
                    </a>
                  </p>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <p>123 Business Street</p>
                    <p>City, State 12345</p>
                    <p>Phone: (555) 123-4567</p>
                  </div>
                </div>
                <div>
                  <ContactForm />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 