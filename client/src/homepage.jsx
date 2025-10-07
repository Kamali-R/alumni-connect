import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import React, { useState } from 'react';
import './index.css';
// Import your logo image (make sure to add this file to your project)
import logo from './logo.png'; 
import { Link } from 'react-router-dom';
const AlumniConnect = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const handleContactSubmit = async (e) => {
  e.preventDefault();

  try {
    await axios.post('http://localhost:5000/contact', contactForm); // ✅ Send to backend
    alert('Message sent successfully!');
    setContactForm({ firstName: '', lastName: '', email: '', message: '' });
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const CheckIcon = () => (
    <svg className="w-4 h-4 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
    </svg>
  );

  const MenuIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
    </svg>
  );

return (
  <div className="bg-gray-50 min-h-screen pt-16">
    {/* Navigation with logo */}
    <nav className="bg-white shadow-sm py-4 fixed top-0 w-full z-50">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Alumni Connect Logo" className="h-8 w-auto" />
          <span className="ml-2 font-medium text-gray-800">Alumni Connect</span>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <a href="#home" className="text-gray-700 hover:text-indigo-600 text-sm">Home</a>
          <a href="#features" className="text-gray-700 hover:text-indigo-600 text-sm">Features</a>
          <a href="#contact" className="text-gray-700 hover:text-indigo-600 text-sm">Contact</a>
          <Link to="/Login" className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">
  Login
</Link>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-500"
        >
          <MenuIcon />
        </button>
      </div>
    </nav>

    {/* Mobile menu dropdown */}
{mobileMenuOpen && (
  <div className="md:hidden fixed right-4 top-16 bg-white shadow-lg rounded-md z-50 w-56 border border-gray-200">
    <div className="py-2">
      <a 
        href="#home" 
        onClick={() => setMobileMenuOpen(false)}
        className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
      >
        Home
      </a>
      <a 
        href="#features" 
        onClick={() => setMobileMenuOpen(false)}
        className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
      >
        Features
      </a>
      <a 
        href="#contact" 
        onClick={() => setMobileMenuOpen(false)}
        className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
      >
        Contact
      </a>
      <div className="border-t border-gray-200 my-1"></div>
      <Link 
        to="/Login" 
        onClick={() => setMobileMenuOpen(false)}
        className="block px-4 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md mx-2 mt-1 transition-colors duration-200"
      >
        Login
      </Link>
    </div>
  </div>
)}
     {/* Hero Section with background image */}
<section id="home" className="pt-20 py-12 bg-[url('./hero-bg.jpg')] bg-cover bg-center">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex justify-center"> {/* Added justify-center */}
      <div className="w-full md:w-2/3 lg:w-1/2 bg-white bg-opacity-50 p-8 rounded-lg text-center"> {/* Added text-center */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Connect with your university community
        </h1>
        <p className="text-gray-600 mb-6">
          Alumni Connect brings together students and alumni to foster mentorship, networking, and lifelong connections.
        </p>
        <Link to="/register">
  <button className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded mx-auto">
    Get Started
  </button>
</Link>
      </div>
    </div>
  </div>
</section>
      {/* Features Section */}
      <section id="features" className="py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Mentorship Matching", description: "Connect students with alumni mentors based on career interests and goals." },
              { title: "Job Board", description: "Access exclusive job and internship opportunities posted by alumni." },
              { title: "Alumni Directory", description: "Search and connect with alumni based on industry, location, and graduation year." },
              { title: "Community Forums", description: "Engage in discussions and share insights with specialized forums for different fields." },
              { title: "Event Management", description: "Organize and manage virtual and in-person events, reunions, and networking opportunities." },
              { title: "Resource Library", description: "Access a curated collection of career resources, guides, and educational materials." }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Who Benefits?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alumni Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alumni</h3>
              <p className="text-gray-600 mb-4">Stay connected with your alma mater, mentor current students, and network with fellow graduates.</p>
              <ul className="space-y-1 mb-4 text-sm">
                <li className="flex items-center">
                  <CheckIcon />
                  <span>Mentorship opportunities</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon />
                  <span>Job posting privileges</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon />
                  <span>Alumni-exclusive events</span>
                </li>
              </ul>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm w-full hover:bg-indigo-700">Alumni Portal</button>
            </div>

            {/* Student Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
              <p className="text-gray-600 mb-4">Connect with successful alumni, find mentors in your field, and discover internship opportunities.</p>
              <ul className="space-y-1 mb-4 text-sm">
                <li className="flex items-center">
                  <CheckIcon />
                  <span>Career guidance</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon />
                  <span>Internship opportunities</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon />
                  <span>Industry insights</span>
                </li>
              </ul>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm w-full hover:bg-indigo-700">Student Portal</button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Get In Touch</h2>
          <div className="bg-gray-50 rounded-lg p-6 shadow-sm max-w-md mx-auto">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="firstName"
                  placeholder="First Name" 
                  value={contactForm.firstName}
                  onChange={handleInputChange}
                  className="px-3 py-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input 
                  type="text" 
                  name="lastName"
                  placeholder="Last Name" 
                  value={contactForm.lastName}
                  onChange={handleInputChange}
                  className="px-3 py-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                value={contactForm.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <textarea 
                name="message"
                placeholder="Message" 
                rows="3" 
                value={contactForm.message}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
     {/* Simplified Footer */}
<footer className="bg-gray-800 text-white pt-8 pb-6">
  <div className="max-w-5xl mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div>
        <div className="flex items-center mb-4">
          <img src={logo} alt="Alumni Connect Logo" className="h-8 w-auto" />
          <span className="ml-2 font-medium">Alumni Connect</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">Bridging the gap between alumni and students to create meaningful connections.</p>
        <div className="flex space-x-4">
          {/* Facebook */}
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
            <span className="sr-only">Facebook</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
            </svg>
          </a>
          
          {/* Twitter */}
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
            <span className="sr-only">Twitter</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
          
          {/* LinkedIn */}
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
            <span className="sr-only">LinkedIn</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"></path>
            </svg>
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#home" className="text-gray-400 hover:text-white transition duration-300">Home</a></li>
            <li><a href="#features" className="text-gray-400 hover:text-white transition duration-300">Features</a></li>
            <li><a href="#contact" className="text-gray-400 hover:text-white transition duration-300">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</a></li>
            <li><a href="/terms-of-service" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-700 pt-6">
      <p className="text-gray-400 text-sm text-center">&copy; {new Date().getFullYear()} Alumni Connect. All rights reserved.</p>
    </div>
  </div>
</footer>
    </div>
  ); 
};
export default AlumniConnect;