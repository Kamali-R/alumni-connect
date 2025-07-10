import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Styled Components for Navbar
const Navbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #212121;
  padding: 1rem 2rem;
  color: #fff;
`;

const NavLeft = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavRight = styled.div`
  display: flex;
  gap: 1rem;
`;

const NavLink = styled.a`
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  &:hover {
    color: #64b5f6;
  }
`;

// Hero Section
const HeroSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 2rem 0;
  gap: 2rem;
  flex-wrap: wrap;
`;

const HeroImage = styled.img`
  width: 350px;
  max-width: 90vw;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
`;

const Slider = styled.div`
  max-width: 400px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(30, 60, 90, 0.08);
  padding: 2rem;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const SlideTitle = styled.h2`
  color: #1976d2;
  margin-bottom: 1rem;
`;

const SlideDesc = styled.p`
  color: #444;
  font-size: 1.1rem;
`;

const HomePage = () => {
  // Slider content
  const slides = [
    {
      title: "Connect with Alumni",
      desc: "Find and connect with alumni from your institution to expand your professional network."
    },
    {
      title: "Post & Find Jobs",
      desc: "Share job opportunities or discover openings posted by fellow alumni."
    },
    {
      title: "Events & Reunions",
      desc: "Stay updated on upcoming alumni events, webinars, and reunions."
    },
    {
      title: "Mentorship Programs",
      desc: "Offer or seek mentorship to foster growth and career development."
    }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      <Navbar>
        <NavLeft>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/contact">Contact Us</NavLink>
          <NavLink href="/about">About Us</NavLink>
        </NavLeft>
        <NavRight>
          <NavLink href="/register">Register</NavLink>
          <NavLink href="/login">Login</NavLink>
        </NavRight>
      </Navbar>

      <HeroSection>
        <HeroImage
          src="https://images.unsplash.com/photo-1517520287167-4bbf64a00d66?auto=format&fit=crop&w=600&q=80"
          alt="Alumni Connect"
        />
        <Slider>
          <SlideTitle>{slides[current].title}</SlideTitle>
          <SlideDesc>{slides[current].desc}</SlideDesc>
        </Slider>
      </HeroSection>
    </>
  );
};

export default HomePage;
