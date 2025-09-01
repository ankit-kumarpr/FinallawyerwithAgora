import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const WebNav = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const BASE_URL = "https://law101-git-low3-ashish8.vercel.app";

  const handleNav = (route) => {
    window.location.href = `${BASE_URL}${route}`;
  };

  const navItems = [
    { id: "/", label: "Home" },
    { id: "/about", label: "About Us" },
    { id: "/chat", label: "Chat With Lawyer" },
    { id: "/document", label: "Documentary Lawyers" },
  ];

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="position-fixed w-100 top-0 z-3 bg-white shadow-sm bottom-1"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      style={{
        boxShadow:
          scrollY > 10 ? "0 4px 30px rgba(0, 0, 0, 0.1)" : "none",
        borderBottom:
          scrollY > 10 ? "1px solid rgba(0, 0, 0, 0.05)" : "none",
      }}
    >
      <nav className="navbar navbar-expand-md container py-1">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleNav("/")}
          className="navbar-brand cursor-pointer"
          style={{ cursor: "pointer" }}
        >
          <img
            src="/images/logo.png"
            alt="Logo"
            height="70"
            style={{ maxWidth: "150px", objectFit: "contain" }}
          />
        </motion.div>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Desktop Nav */}
        <div className="collapse navbar-collapse d-none d-md-flex justify-content-end">
          <ul className="navbar-nav">
            {navItems.map((item) => (
              <li
                className="nav-item position-relative"
                key={item.id}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  onClick={() => handleNav(item.id)}
                  className="nav-link text-dark px-3"
                  style={{ background: "none", border: "none" }}
                >
                  {item.label}
                </button>
                {hovered === item.id && (
                  <motion.div
                    layoutId="navUnderline"
                    className="position-absolute start-0 bottom-0 w-100 bg-primary"
                    style={{ height: "2px" }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.ul
              className="d-md-none list-unstyled mt-3 w-100"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={mobileMenuVariants}
            >
              {navItems.map((item) => (
                <motion.li
                  key={item.id}
                  variants={mobileItemVariants}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="mb-2"
                >
                  <button
                    onClick={() => handleNav(item.id)}
                    className="btn btn-light w-100 text-start px-3"
                  >
                    {item.label}
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </motion.div>
  );
};

export default WebNav;
