import { useState } from "react";
import GraphModule from "./GraphModule";
import "./Districts.css";
import {
  DISTRICTS,
  getDistrictsByRegion,
  getRegionByDistrict,
  CurrentYear,
  type District,
} from "./graph.types";
import { useDistrictStats } from "./useDistrictStats";
import { districtMapImages } from "../useDistrictMap";

function DistrictPage() {
  const [pageDistrict, setPageDistrict] = useState<District>("Jalgaon");
  const currentRegion = getRegionByDistrict(pageDistrict);
  const { GDDP, Percapita, loading, error } = useDistrictStats(
    pageDistrict,
    CurrentYear,
  );
  const Districtimage =
    districtMapImages[pageDistrict] ?? districtMapImages["Jalgaon"];

  // Add this to debug
  console.log("GDDP data:", GDDP);
  console.log("District GDDP:", GDDP.district[CurrentYear]);
  console.log("State GDDP:", GDDP["Maharashtra"][CurrentYear]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const shareInGSDP = (
    (GDDP.district[CurrentYear] / GDDP["Maharashtra"][CurrentYear]) *
    100
  ).toFixed(2);

  return (
    <>
      <div className="district-wrapper">
        <span className="district-label">{pageDistrict}</span>

        <select
          className="district-select"
          value={pageDistrict}
          onChange={(e) => setPageDistrict(e.target.value as District)}
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="JalgaonPage">
        <div className="Summary">
          <div className="district_image">
            <img
              src={Districtimage}
              alt={`${pageDistrict} district map`}
              className="DistrictPhoto"
            />
          </div>
          <div className="DistrictInfo">
            <h3>GDDP:</h3>
            <p>{GDDP.district[CurrentYear]} ₹</p>
          </div>
          <div className="DistrictInfo">
            <h3>Per Capita Income:</h3>
            <p>{Percapita.district[CurrentYear]} ₹ Per Annum</p>
          </div>
          <div className="DistrictInfo">
            <h3>Share in GSDP:</h3>
            <p>{shareInGSDP}%</p>
          </div>
        </div>
        <GraphModule
          query={{
            years: "all",
            districts: [pageDistrict],
            columns: ["gddp"],
          }}
          config={{
            type: "line",
            title: "Nominal GDDP of " + pageDistrict,
            yAxisLabel: "GDDP (in Crores)",
            legendVisible: true,
            legendPosition: "bottom",
            colors: ["#0D9488", "#1fd5c6ff", "#0d5c55ff"],
            height: 300,
          }}
        />
        <GraphModule
          query={{
            years: ["2023_24"],
            districts: ["Maharashtra", pageDistrict],
            columns: [
              "primary_sector",
              "secondary_sector",
              "services_tertiary_sector",
            ],
          }}
          config={{
            type: "doublepie",
            title: "Sector Share - (2023-24)",
            colors: ["#5B2D8B", "#3B5FCC", "#1E3A8A"],
            height: 300,
            doublePieConfig: {
              leftTitle: "Maharashtra",
              rightTitle: pageDistrict,
            },
          }}
        />

        {/* <div className="pie" style={{display : "flex"}}>
                <GraphModule
                    query={{
                        years: ['2023_24'],
                        districts: ['Mumbai City and Suburban'],
                        columns: ['agriculture_allied_activities', 'industry', 'services_tertiary_sector'],
                    }}
                    config={{
                        type: 'pie',
                        title: '',
                        legendPosition: 'bottom',
                        colors: ['#FF6384', '#36A2EB', '#FFCE56'],
                        height: 300,
                    }}
                />
                <GraphModule
                    query={{
                        years: ['2023_24'],
                        districts: ['Jalgaon'],
                        columns: ['agriculture_allied_activities', 'industry', 'services_tertiary_sector'],
                    }}
                    config={{
                        type: 'pie',
                        title: '',
                        legendPosition: 'bottom',
                        colors: ['#36A2EB', '#FFCE56'],
                        height: 300,
                    }}
                />
            </div> */}

        <GraphModule
          query={{
            years: [
              "2011_12",
              "2012_13",
              "2013_14",
              "2014_15",
              "2015_16",
              "2016_17",
              "2017_18",
              "2018_19",
              "2019_20",
              "2020_21",
              "2021_22",
              "2022_23",
              "2023_24",
            ],
            districts: getDistrictsByRegion(currentRegion!),
            columns: ["gddp"],
          }}
          config={{
            type: "line",
            title:
              "Nominal GDDP (Comparison of Districts within " +
              currentRegion +
              ")",
            legendPosition: "bottom",
            xAxisLabel: "Year",
            colors: ["#1E3A8A", "#3B5FCC", "#F59E0B", "#0D9488", "#7C5AB8"],
            height: 300,
          }}
        />
        <div className="extra-div"></div>
        {/* <div className="InitiativesSection">
                <h2>MITRA'S Initiatives in {pageDistrict}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Initiative</th>
                            <th>Description</th>
                            <th>Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>MahaSTRIDE</td>
                            <td>MahaSTRIDE is strengthening Jalgaon’s entrepreneurial ecosystem by enabling MSMEs, startups, and youth with funding access, skilling, and innovation support across Maharashtra.</td>
                            <td>Through MahaSTRIDE’s initiatives, Jalgaon is seeing accelerated enterprise growth, increased employment opportunities, and stronger integration into Maharashtra’s innovation-driven economy.</td>
                        </tr>
                        <tr>
                            <td>Agricultural Innovation Hubs</td>
                            <td>MITRA has established Agricultural Innovation Hubs in Jalgaon to promote modern farming techniques, provide training to farmers, and facilitate access to markets.</td>
                            <td>These hubs have led to increased crop yields, improved farmer incomes, and the adoption of sustainable agricultural practices in the region.</td>
                        </tr>
                        <tr>
                            <td>Skill Development Programs</td>
                            <td>MITRA conducts skill development programs tailored to the needs of Jalgaon’s youth, focusing on vocational training and digital skills.</td>
                            <td>These programs have enhanced employability, leading to higher job placements and entrepreneurship among the youth of Jalgaon.</td>
                        </tr>
                    </tbody>
                </table>
            </div> */}
        {/* <p>the Projections used here are V1 and more improvements to be made in future versions.</p> */}
      </div>
    </>
  );
}
export default DistrictPage;
