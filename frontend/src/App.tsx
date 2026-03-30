import "./App.css";
import Navbar from "./components/Navbar";
import HomePage from "./pages/Home";
//import DistrictPage from './components/districtPages/Districts'
import { Route, Routes } from "react-router";
import UtilityBar from "./components/UtilityBar";
import MSride from "./pages/Initiatives/MahaSTRIDE";
import Footer from "./components/Footer";
import ScrollToAnchor from "./components/ScrollToAnchor";
import DistrictPage from "./components/districtPages/Districts";
import AAPDash from "./components/AAP/AAPEntry";
import AAPDashboard from "./components/AAP/AAPDash";
import SDGMain from "./components/SDG/SDGMain";

function App() {
  return (
    <div className="AppDiv" id="ToPageTop">
      {/* <UtilityBar />
      <Navbar />
      <ScrollToAnchor /> */}
      <section className="AppBody">
        <Routes>
          <Route index element={<HomePage />} />
          <Route
            path="/Annual-Action-Plan"
            element={<AAPDash district="Nashik" />}
          />
          <Route path="/AAP-Dashboard" element={<AAPDashboard />} />
          <Route path="/mahastride" element={<MSride />} />
          <Route path="/districts" element={<DistrictPage />} />
          <Route path="/sdg" element={<SDGMain />} />
        </Routes>
      </section>
      <Footer />
    </div>
  );
}

export default App;
