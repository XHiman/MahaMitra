import MaharashtraEmblem from "/Seal_of_Maharashtra.svg";
import DigitalIndiaLogo from "/Digital_India.svg";
import MitraLogo from "/MITRALogo.svg";
import LanguageButton from "/Language.svg";
// import SkipToContent from "/SkipToMC.svg"
import AccessButton from "/AccessCirc.svg";
import SearchButton from "/search.svg";
import SitemapButton from "/sitemap.svg";

import React from "react";
import "./Utilitybar.css";
import { Link } from "react-router-dom";

function Utilitybar() {
  return (
    <header className="Utilitybar" role="banner">
      {/* Top Government Strip */}
      <div className="TopSide">
        <div className="GovText">
          <span lang="mr">
            <a href="https://maharashtra.gov.in/">महाराष्ट्र शासन</a>
          </span>
          <span>
            <a href="https://maharashtra.gov.in/">Government of Maharashtra</a>
          </span>
        </div>

        <nav className="UBAccess" aria-label="Utility Navigation">
          <ul>
            <li>
              <Link
                to="#content"
                className="icon-btn"
                aria-label="Skip to Main Content"
              >
                <button className="icon-btn" aria-label="Skip to Main Content">
                  <span
                    className=""
                    aria-hidden="true"
                    style={{ color: "black" }}
                  >
                    Skip to Main Content
                  </span>
                </button>
              </Link>
            </li>

            <li>
              <button className="icon-btn" aria-label="Search">
                <img src={SearchButton} alt="" aria-hidden="true" />
              </button>
            </li>

            <li>
              <button className="icon-btn" aria-label="Sitemap">
                <img src={SitemapButton} alt="" aria-hidden="true" />
              </button>
            </li>

            <li>
              <button className="icon-btn" aria-label="Accessibility Options">
                <img src={AccessButton} alt="" aria-hidden="true" />
              </button>
            </li>

            <li>
              <button className="icon-btn" aria-label="Language Selection">
                <img src={LanguageButton} alt="" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Utility Row */}
      <div className="BottomSide">
        <div className="LeftSide">
          <img
            src={MitraLogo}
            className="utilLogo"
            alt="MITRA – Maharashtra Institution for Transformation Logo"
          />

          <div className="UBText">
            <h2>Maharashtra Institution for Transformation (MITRA)</h2>
            <h3>Planning Department, Government of Maharashtra</h3>
          </div>
        </div>

        <div className="RightSide">
          <img
            src={DigitalIndiaLogo}
            className="digitalIndiaLogo"
            alt="Digital India Initiative Logo"
            onClick={() =>
              window.open("https://www.digitalindia.gov.in/", "_blank")
            }
          />
          <img
            src={MaharashtraEmblem}
            className="emblemLogo"
            alt="Seal of Government of Maharashtra"
          />
        </div>
      </div>
    </header>
  );
}

export default React.memo(Utilitybar);
