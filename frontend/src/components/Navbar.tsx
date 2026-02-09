import { Link, useLocation } from "react-router-dom"
import "./Navbar.css"

function Navbar() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (routes: string[]) => 
    routes.some(route => path.startsWith(route))

  const isExactHome = path === "/"

  return (
    <nav className="Navbar" role="navigation">
      <ul>

        <li className={isExactHome ? "active" : ""}>
          <Link to="">Home</Link>
        </li>

        <li className={`hasDropdown ${isActive(["/about-us"]) ? "active" : ""}`}>
          <Link to="/about-us">About Department</Link>
          <div className="dropdown">
            <Link to="/about-us/introduction">Introduction</Link>
            <Link to="/about-us/objectives">Objectives & Functions</Link>
            <Link to="/about-us/organogram">Organogram</Link>
            <Link to="/about-us/desks">Desks & Subjects</Link>
          </div>
        </li>

        <li className={isActive(["/districts"]) ? "active" : ""}>
          <Link to="/districts">Districts</Link>
        </li>

        <li className={`hasDropdown ${isActive(["/initiatives"]) ? "active" : ""}`}>
          <Link to="/initiatives">Initiatives</Link>
            <div className="dropdown">
              <Link to="/mahastride">MahaSTRIDE</Link>
              <Link to="/mrdp">MRDP</Link>
              <Link to="/muwrep">MUWREP</Link>
              <Link to="/shore">Shore</Link>
            </div>
        </li>

        <li className={isActive(["/publications"]) ? "active" : ""}>
          <Link to="/publications">Publications</Link>
        </li>

        <li className={isActive(["/announcements"]) ? "active" : ""}>
          <Link to="/announcements">Announcements</Link>
        </li>

        <li className={isActive(["/rti"]) ? "active" : ""}>
          <Link to="/rti">Disclosures & RTI</Link>
        </li>

        <li className={isActive(["/contact-us"]) ? "active" : ""}>
          <Link to="/contact-us">Contact</Link>
        </li>
        <li>
          <div className="hmenu">
            <svg viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </div>
        </li>
      </ul>



    </nav>
  )
}

export default Navbar
