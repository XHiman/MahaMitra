import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToAnchor() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      const navbar = document.querySelector(".Navbar"); // add class to navbar

      if (element) {
        const navbarHeight = navbar ? navbar.clientHeight : 0;
        const elementPosition =
          element.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
          top: elementPosition - navbarHeight,
          behavior: "smooth",
        });
      }
    }
  }, [location]);

  return null;
}
