import { useState } from "react";
import "./MahaSTRIDE.css"

function MSride() {
    const tabs = [
    "Government Documents",
    "Project Documents",
    "District Strategic Plans",
    "Annual Action Plan"
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);

  const dataMap = {
    "Government Documents": [
      { id: 1, title: "MahaSTRIDE GR 14 Mar 2024", link: "/GR_MahaSTRIDE.pdf" }
    ],
    "Project Documents": [
      { id: 1, title: "Project Charter 2024", link: "/Project_Charter.pdf" }
    ],
    "District Strategic Plans": [
      { id: 1, title: "Mumbai Strategy Plan", link: "/Mumbai_Strategy.pdf" }
    ],
    "Annual Action Plan": [
      { id: 1, title: "Annual Action Plan 2024", link: "/AAP_2024.pdf" }
    ]
  };

  return (
    
    <div className="MStride">
        <div className="Content">
            <title>MahaSTRIDE</title>
            <h1>MahaSTRIDE</h1>
            <img src="/img1.jpg" alt="MahaSTRIDE" className="InitiativeImage"/>
            <h3>Maharashtra Strengthen Institutional Capabilities in Districts for Enabling Growth (MahaSTRIDE)</h3>
            <div className="PageContent">
              <p>
                Maharashtra Institution for Transformation (MITRA) has embarked upon an ambitious initiative, with the support of The World Bank Group, to Strengthen Institutional Capabilities in Districts for Enabling Growth (MahaSTRIDE). MahaSTRIDE has been approved by the Hon. Cabinet, Government of Maharashtra vide Government Resolution No. WBK-2024/Pra.Kra.13/Kaa. 1417 dated March 14, 2024. <br/>
                The estimated cost of the project is Rs 2,232 crore(USD 268.97 million) and out of the total funds required for the implementation of the project, 70% (estimated Rs 1,562 crore / USD 188.28 million) will be financed by loans from the World Bank and the remaining 30% (estimated Rs 670 crore/ USD 80.69 million) will be provided by the state government.<br/>
                The Project Objective of MahaSTRIDE is to strengthen institutional capabilities, services, and the data ecosystem for enabling inclusive economic growth in districts while focusing on the following 3 Result Areas:
              </p>
              <ul>
                <li>
                  <h5>Result Area 1: Strengthened institutional capabilities and services for enabling inclusive economic growth in districts.</h5>
                  <p>This area will enable Ease of Doing Business (EoDB) in Maharashtra by improving those government services captured via the Business Reform Action Plan (issued periodically by Department for Promotion of Industry and Internal Trade, Government of India), the National e-Governance Service Delivery Assessment conducted by the Department of Administrative Reforms and Public Grievances, Government of India, and the services available on GoM’s MAITRI portal. Activities under RA2 focus on the following results.</p>
                  <ul>
                    <li>Strengthened institutions and policies for data</li>
                    <li>Improved use of data and capacity for evidence-based policymaking</li>
                    <li>Improved state capacity and coordination for growth initiatives</li>
                  </ul>
                </li>
                <li>
                  <h5>Results Area 2: Improved access for businesses to time-bound e-government services.</h5>
                  <p>RA2 will focus on building and empowering capacity at a district level, and assist the implementation of evidence-based planning, partnerships with private sector, and strong monitoring and evaluation (M&E) systems. Specifically, it will enable the following results:</p>
                  <ul>
                    <li>Improved delivery timelines, timeliness, and accountability of G2B services</li>
                    <li>Gathering beneficiary feedback on services delivered to improve transparency & accountability</li>
                    <li>Onboarding services for tourism sector to MAITRI</li>
                  </ul>
                </li>
                <li>
                  <h5>Result Area 3: Strengthened state institutions for data-driven policy and decision-making.</h5>
                  <p>Activities under RA3 aim to build capacity in the State for data management, sharing, dissemination and use through a new policy framework (State Data Policy), creation of a new institution (the State Data Authority) and strengthening capabilities of the Directorate of Economic and Statistics (DES), and the Maharashtra Remote Sensing Application Center (MRSAC), GoM. It also seeks to strengthen capabilities in MITRA to enable it to lead coordination in implementation of the recommendations of the OTD Roadmap. Specifically, it will enable the following results.</p>
                  <ul>
                    <li>Strengthened implementation of economic growth-oriented initiatives in districts as identified in the District Strategic Plans</li>
                    <li>Improved district data systems for planning and monitoring:</li>
                    <li>Strengthened policy and institutions for tourism to support implementation of recommendations made by the Maharashtra Economic Advisory Council</li>
                  </ul>
                </li>
              </ul>
            </div>
        </div>
        <div className="SideBar">
          <h3>Related Links</h3>
          <ul>
            <li><a href="https://mahamitra.org/districts">District Statistics</a></li>
            <li><a href="https://documents.worldbank.org/en/publication/documents-reports/documentdetail/099111224161533219">MahaSTRIDE @ World Bank</a></li>
          </ul>
          <h3>Downloads</h3>

          <div className="Download-selector">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                className={`Download-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {index !== tabs.length - 1 && <span className="tab-separator"></span>}
              </button>
            ))}
          </div>

          <div className="Download-GR">
            <table>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Title Document</th>
                  <th>Link</th>
                </tr>
              </thead>

              <tbody>
                {dataMap[activeTab as keyof typeof dataMap].map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}

export default MSride;