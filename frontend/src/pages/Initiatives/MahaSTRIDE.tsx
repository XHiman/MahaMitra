import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./MahaSTRIDE.css";

interface DLIItem {
  Period: string;
  ID: string;
  Title: string;
  Description: string;
  Status: string;
  Funds: string;
}

const images = ["/MahaSTRIDE_Banner.png"];

function MSride() {
  const tabs = [
    "Government Documents",
    "Project Documents",
    "District Strategic Plans",
    "Annual Action Plan",
  ];

  const [activeTab, setActiveTab] = useState<string | null>(tabs[0]);

  const dataMap = {
    "Government Documents": [
      { id: 1, title: "MahaSTRIDE GR 14 Mar 2024", link: "/GR_MahaSTRIDE.pdf" },
      { id: 2, title: "State Data Authority", link: "/SDA_GR.pdf" },
      { id: 3, title: "Tourism Policy", link: "/Tourism_Policy_GR.pdf" },
      { id: 4, title: "MAITRI", link: "/MAITRI.pdf" },
      {
        id: 5,
        title: "MAITRI 2.0 Launch Notification",
        link: "/MAITRI_2.0_Launch_Notification.pdf",
      },
    ],
    "Project Documents": [
      {
        id: 1,
        title: "Project Appraisal Document",
        link: "/PAD_MahaSTRIDE.pdf",
      },
      { id: 2, title: "Operation Manual", link: "/Operation_Manual.pdf" },
    ],
    "District Strategic Plans": [
      { id: 1, title: "Mumbai Strategy Plan", link: "/Mumbai_Strategy.pdf" },
    ],
    "Annual Action Plan": [
      { id: 1, title: "Annual Action Plan 2024", link: "/AAP_2024.pdf" },
    ],
  };

  const [data, setData] = useState<DLIItem[]>([]);
  const [activeDLITab, setActiveDLITab] = useState<string>("");

  useEffect(() => {
    fetch("/DLI_Period_Data.csv")
      .then((response) => response.text())
      .then((text) => {
        const rows = text.split("\n").filter((row) => row.trim() !== "");
        const headers = rows[0].split(",");

        const parsedData: DLIItem[] = rows.slice(1).map((row) => {
          const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          // Handles commas inside quotes

          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.replace(/^"|"$/g, "").trim();
          });

          return obj as DLIItem;
        });

        setData(parsedData);

        const periods = Array.from(
          new Set(parsedData.map((item) => item.Period)),
        );

        if (periods.length > 0) {
          setActiveDLITab(periods[0]);
        }
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, []);

  const DLItabs = Array.from(new Set(data.map((item) => item.Period)));

  const filteredData = data.filter((item) => item.Period === activeDLITab);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Preload images to prevent flash
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Auto rotation
  useEffect(() => {
    if (isPaused) return;

    timeoutRef.current = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, isPaused]);

  const handleImageClick = (imgSrc: string) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "Image-Overlay";
    overlay.style.backgroundImage = `url(${imgSrc})`;
    // Close on click
    overlay.onclick = () => document.body.removeChild(overlay);
    // Add to DOM
    document.body.appendChild(overlay);
  };

  return (
    <section className="MStride" id="content">
      <title>MahaSTRIDE</title>
      <div
        className="Title-banner"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background layers for crossfade */}
        {images.map((img, i) => (
          <div
            key={img}
            className={`Banner-bg ${i === index ? "active" : ""}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>
      <div className="SideBar">
        <div className="Links-Header">
          <h3>Sections</h3>
        </div>
        <ul className="Links-List">
          <li>
            <Link to="#DLI-Section">
              <span>Acheivement Progress</span>
            </Link>
          </li>
          <li>
            <Link to="#img-collage">
              <span>Image Gallery</span>
            </Link>
          </li>
        </ul>
        <div className="Links-Header">
          <h3>Related Links</h3>
        </div>

        <ul className="Links-List">
          <li>
            <Link to="/districts">
              <span>District Statistics</span>
              <span className="link-arrow">→</span>
            </Link>
          </li>

          <li>
            <a href="/Annual-Action-Plan">
              <span>AAP Dashboard</span>
              <span className="link-arrow">→</span>
            </a>
          </li>

          <li>
            <a
              href="https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099111224161533219"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>MahaSTRIDE @ World Bank</span>
              <span className="link-arrow">→</span>
            </a>
          </li>
        </ul>
        <div className="Links-Header">
          <h3>Downloads</h3>
        </div>
        <div className="Download-Section">
          {tabs.map((tab) => (
            <div key={tab} className="Download-Item">
              <button
                className={`Download-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              >
                {tab}
              </button>

              {activeTab === tab && (
                <div className="Download-GR">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title Document</th>
                        <th>Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataMap[tab as keyof typeof dataMap].map((item: any) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.title}</td>
                          <td>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="Content">
        <nav id="Breadcrumb">
          <a href="/">Home</a> &gt; <a href="/Initiatives">Initiatives</a> &gt;{" "}
          <span>MahaSTRIDE</span>
        </nav>
        <section className="PageContent">
          <h3>
            Maharashtra Strengthen Institutional Capabilities in Districts for
            Enabling Growth (MahaSTRIDE)
          </h3>
          <div className="stat-strip">
            <div className="stat-card">
              <span>₹2,232 Cr</span>
              <label>Total Project Cost</label>
            </div>
            {/* 
            <div className="stat-card">
              <span>On-Track</span>
              <label>Project Status</label>
            </div> */}
            <div className="stat-card">
              <span>11.0%</span>
              <label>DLI Achiement(%)</label>
            </div>
            <div className="stat-card">
              <span>₹1,562 Cr</span>
              <label>World Bank Contribution</label>
            </div>
            <div className="stat-card">
              <span>₹670 Cr</span>
              <label>GoM Contribution</label>
            </div>
          </div>
          <div className="PageContent">
            <p>Project Implementation Units:</p>
            <div className="Coordination-Logos">
              <ul>
                <li>
                  <a
                    href="https://mahades.maharashtra.gov.in/home.do?lang=en"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/Logo_DES.jpg"
                      alt="Department of Economics and Statistics"
                    />
                  </a>
                </li>
                <li>
                  <a
                    href="https://mrsac.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/Logo_MRSAC.png"
                      alt="Maharashtra Remote Sensing Application Center"
                    />
                  </a>
                </li>
                {/* <li><img src="/Logo_DOI.png" alt="Department of Industry" /></li> */}
                <li>
                  <a
                    href="https://maharashtratourism.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src="/Logo_DOT.png" alt="Department of Tourism" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.mahaarchaeology.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/Logo_DOCA.png"
                      alt="Department of Culture and Archaeology"
                    />
                  </a>
                </li>
              </ul>
            </div>
            <p>
              Maharashtra Institution for Transformation (MITRA) has embarked
              upon an ambitious initiative, funded by The World Bank Group, to
              Strengthen Institutional Capabilities in Districts for Enabling
              Growth (MahaSTRIDE). MahaSTRIDE has been approved by the Hon.
              Cabinet, Government of Maharashtra vide Government Resolution No.
              WBK-2024/Pra.Kra.13/Kaa. 1417 dated March 14, 2024. <br />
              The estimated cost of the project is Rs 2,232 crore(USD 268.97
              million) and out of the total funds required for the
              implementation of the project, 70% (estimated Rs 1,562 crore / USD
              188.28 million) will be financed by loans from the World Bank and
              the remaining 30% (estimated Rs 670 crore/ USD 80.69 million) will
              be provided by the state government.
              <br />
              The Project Objective of MahaSTRIDE is to strengthen institutional
              capabilities, services, and the data ecosystem for enabling
              inclusive economic growth in districts while focusing on the
              following 3 Result Areas:
            </p>
            <ul>
              <li>
                <h4>
                  Results Area I: Strengthened district systems for enabling
                  growth
                </h4>
                <ul>
                  <li>
                    <u>
                      Strengthened implementation of growth initiatives in
                      districts:
                    </u>
                    <p>
                      Support for implementation of the five-year District
                      Strategic Plans (“DSPs”) through an incentive framework
                      that will trigger fiscal rewards to districts that achieve
                      performance targets on an annual basis. Districts will be
                      supported through: <br />
                      (a) district strategic units (“DSUs”); (b) rationalization
                      of existing schemes and alignment of expenditures with DSP
                      targets; (c) identifying and addressing competency gaps
                      across select district agencies in the growth driving
                      sectors; and (d) annual performance evaluations of the
                      DSPs to allow implementation gaps/ challenges to be timely
                      addressed.{" "}
                    </p>
                  </li>
                  <li>
                    <u>
                      Improved district data systems for planning and
                      monitoring:
                    </u>
                    <p>
                      Support to provide district administrations with all
                      data/evidence required for decision making and for
                      monitoring implementation of DSPs, including: (a) linking
                      existing management information systems (“MIS”) to enable
                      a consolidated view of fund flows and details of
                      schemes/programs under implementation in districts,
                      including the Maharashtra Planning Schemes Information
                      Management System (“MPSIMS”), the Integrated Planning
                      Office Automation System (“iPAS”), the DSP Monitoring and
                      Evaluation (“M&E”) Dashboard, the Budget Estimation,
                      Allocation and Monitoring System (“BEAMS”), and the Public
                      Financial Management System (“PFMS”); (b) digitizing
                      existing databases containing district statistics; (c)
                      building a dynamic Statistical Business Register (“SBR”)
                      to enable tracking of district level business development
                      and economic activity; (d) collecting data on new
                      socio-economic indicators through new surveys; and (e)
                      launching a geoportal for districts including the geo
                      spatial data layers created and maintained by the
                      Maharashtra Remote Sensing Application Centre (“MRSAC”),
                      all these data sets to feed into an integrated district
                      data dashboard that will allow tracking of physical and
                      financial progress of DSP implementation.
                    </p>
                  </li>
                  <li>
                    <u>Strengthened policy and institutions for tourism:</u>
                    <p>
                      Support for piloting deconcentration of the planning and
                      implementation of developmental activities in the tourism
                      sector to allow for creation of destination management
                      organizations (“DMOs”), preparation of destination
                      management plans (“DMPs”), and carrying out skill training
                      programs in select destinations.
                    </p>
                  </li>
                </ul>
              </li>
              <li>
                <h4>
                  Results Area II: Improved access for businesses to time-bound
                  e-government services
                </h4>
                <ul>
                  <li>
                    <u>Improved access for identified services:</u>
                    <br />
                    <p>
                      Support for: (a) strengthening the Online Service Delivery
                      Portals; (b) increasing the number of delivery channels
                      including setting up the offline delivery channels Udyog
                      Seva Kendras (“USKs”); (c) bringing more services onto the
                      MAITRI portal; and (d) prioritizing onboarding of
                      government services in the tourism sector onto the
                      Maharashtra Industry, Trade, and Investment Facilitation
                      Act (“MAITRI”) portal.
                    </p>
                  </li>
                  <li>
                    <u>
                      Improved delivery timelines, timeliness, and
                      accountability:
                    </u>
                    <br />
                    <p>
                      Support for: (a) conducting process re-engineering to
                      streamline processes and eliminate unnecessary approvals
                      and other bottlenecks; (b) close monitoring of the
                      timeliness of service delivery; and (c) gathering and
                      disclosing beneficiary feedback on services delivered to
                      improve transparency and accountability.
                    </p>
                  </li>
                </ul>
              </li>
              <li>
                <h4>
                  Results Area III: Strengthened state institutions for
                  data-driven policy and decision-making
                </h4>
                <ul>
                  <li>
                    <u>Strengthened institutions and policies for data:</u>
                    <br />
                    <p>
                      Support for: (a) the creation of a conducive data
                      governance architecture in Maharashtra to facilitate the
                      integration of digital data flows at the state and
                      district levels while safeguarding data privacy and
                      security through the establishment of the State Data
                      Authority (“SDA”) to serve as the primary regulator for
                      public sector data, and to be tasked with formulating a
                      comprehensive State Data Policy, ensuring compliance with
                      data standards and exchange protocols, and enhancing data
                      interoperability; (b) the introduction of a data
                      stewardship program through the SDA to coordinate
                      significant data initiatives and build capacity at the
                      state and district level; and (c) for line departments to
                      digitize and publish essential datasets in an open,
                      machine-readable format.
                    </p>
                  </li>
                  <li>
                    <u>
                      Improved use of data and capacity for evidence-based
                      policymaking:
                    </u>
                    <br />
                    <p>
                      Support capacity building initiatives, including: (a)
                      district-level representative household surveys for
                      monitoring labor market dynamics and scheme performance;
                      (b) the introduction of a Unified Master Indicator
                      Platform (“Maha Data Bank”), incorporating the Sustainable
                      Development Goal (“SDG”), state indicator framework, and
                      district indicator framework; and (c) establishing a
                      framework for collection of tourism statistics through
                      periodic surveys and release of analytical reports on
                      tourism that draw on the data sets collected from the
                      surveys.
                    </p>
                  </li>
                  <li>
                    <u>
                      Improved state capacity and coordination for growth
                      initiatives:
                    </u>
                    <br />
                    <p>
                      Support for: (a) building domain competencies within the
                      Maharashtra Institute for Transformation (“MITRA”) to
                      enable it to lead dialogue and coordinate with concerned
                      line departments and the state decision making agencies on
                      policy reforms, as laid down in the One trillion-dollar
                      Roadmap (“OTD Roadmap”), including through the Asset
                      Monetization (“AM Policy”) to be developed by the
                      Government of Maharashtra; and (b) piloting the
                      implementation of the AM Policy in the tourism sector
                      through commercialization of state government owned
                      tourism properties.
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </section>
        <section id="DLI-Section">
          <h3>Achievement Disbursement Progress Record</h3>

          {/* Parent Tabs Row */}
          <div className="DLI-Tabs-Row">
            {DLItabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDLITab(tab)}
                className={`DLI-tab ${activeDLITab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Single Table Container */}
          <div className="Period-Table">
            <table>
              <thead>
                <tr>
                  <th>DLI Title</th>
                  <th>Description</th>
                  <th>Funds Allocation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const statusClass =
                    item.Status === "Completed"
                      ? "row-completed"
                      : item.Status === "Off-Track"
                        ? "row-offtrack"
                        : "";

                  return (
                    <tr key={item.ID} className={statusClass}>
                      <td>{item.Title}</td>
                      <td>{item.Description}</td>
                      <td>
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(Number(item.Funds))}
                      </td>
                      <td>{item.Status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="img_collage" id="img-collage">
          <img
            src="/Mahastride_2.png"
            alt="MahaSTRIDE"
            className="Content-Image"
            style={{
              height: "400px",
              gridRow: "1 / span 2",
              gridColumn: "1",
            }}
            onClick={() => handleImageClick("/Mahastride_2.png")}
          />
          <img
            src="/Mahastride_1.JPG"
            alt="MahaSTRIDE"
            className="Content-Image"
            style={{
              width: "200px",
              height: "200px",
              gridRow: "1",
              gridColumn: "2",
              objectFit: "cover",
            }}
            onClick={() => handleImageClick("/Mahastride_1.JPG")}
          />
          <img
            src="/Mahastride_2.png"
            alt="MahaSTRIDE"
            className="Content-Image"
            style={{
              width: "200px",
              height: "200px",
              gridRow: "2",
              gridColumn: "2",
              objectFit: "cover",
            }}
            onClick={() => handleImageClick("/Mahastride_2.png")}
          />
        </section>
      </div>
    </section>
  );
}

export default MSride;
