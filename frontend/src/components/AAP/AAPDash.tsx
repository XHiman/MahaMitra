import { useEffect, useState } from "react";

/* ---------------- TYPES ---------------- */

type Scheme = {
  id: string;
  name: string;
  currentFyBudget: number;
};

type Sector = {
  id: string;
  name: string;
};

type DSP = {
  id: string;
  name: string;
};

type UnitSuggestion = string;

type DistrictSummary = {
  district: string;
  totalCost: number;
  interventionCount: number;
};

type PhysicalTarget = {
  objective: string;
  quantity: number;
  unit: string;
};

/* ---------------- COMPONENT ---------------- */

export default function AnnualActionPlan() {
  const [mode, setMode] = useState<"none" | "input" | "view">("none");

  /* HEADER STATE */
  const [district, setDistrict] = useState("");
  const [financialYear, setFinancialYear] = useState("");

  /* INTERVENTION */
  const [sector, setSector] = useState("");
  const [objective, setObjective] = useState("");
  const [specificIntervention, setSpecificIntervention] = useState("");
  const [interventionRationale, setInterventionRationale] = useState("");

  /* BUDGET */
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [apportionedBudget, setApportionedBudget] = useState<number>(0);
  const [financingGap, setFinancingGap] = useState<number>(0);
  const [sourceOfFinancing, setSourceOfFinancing] = useState("");

  /* DSP MULTI SELECT */
  const [selectedDSPs, setSelectedDSPs] = useState<string[]>([]);

  /* TARGETS */
  const [targets, setTargets] = useState<PhysicalTarget[]>([
    { objective: "", quantity: 0, unit: "" }
  ]);

  const [employmentPotential, setEmploymentPotential] = useState<number>(0);

  /* BACKEND DATA */
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [dsps, setDsps] = useState<DSP[]>([]);
  const [unitSuggestions, setUnitSuggestions] = useState<UnitSuggestion[]>([]);
  const [districtSummary, setDistrictSummary] = useState<DistrictSummary[]>([]);

  /* ---------------- FETCH FUNCTIONS ---------------- */

  async function fetchSchemes() {
    const res = await fetch("/api/schemes");
    setSchemes(await res.json());
  }

  async function fetchSectors() {
    const res = await fetch("/api/sectors");
    setSectors(await res.json());
  }

  async function fetchDSPs() {
    const res = await fetch("/api/dsps");
    setDsps(await res.json());
  }

  async function fetchUnitSuggestions() {
    const res = await fetch("/api/aap/unit-suggestions");
    setUnitSuggestions(await res.json());
  }

  async function fetchDistrictSummary() {
    const res = await fetch("/api/aap/district-summary");
    setDistrictSummary(await res.json());
  }

  useEffect(() => {
    fetchSchemes();
    fetchSectors();
    fetchDSPs();
    fetchUnitSuggestions();
    fetchDistrictSummary();
  }, []);

  /* ---------------- AUTO FINANCING GAP ---------------- */

  useEffect(() => {
    if (selectedScheme) {
      setFinancingGap(selectedScheme.currentFyBudget - apportionedBudget);
    }
  }, [apportionedBudget, selectedScheme]);

  /* ---------------- TARGET HANDLERS ---------------- */

function updateTarget<K extends keyof PhysicalTarget>(
  index: number,
  field: K,
  value: PhysicalTarget[K]
) {
  setTargets(prev => {
    const updated = [...prev];
    updated[index] = { ...updated[index], [field]: value };
    return updated;
  });
}

  function addTarget() {
    if (targets.length < 5) {
      setTargets([...targets, { objective: "", quantity: 0, unit: "" }]);
    }
  }

  function removeTarget(index: number) {
    setTargets(targets.filter((_, i) => i !== index));
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="AAP-container">

      {/* HEADER */}
      <header className="AAP-header">
        <h1>Annual Action Plan — Dashboard</h1>

        <div className="AAP-header-inputs">
          <input
            placeholder="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />

          <input
            placeholder="Financial Year (e.g., 2025–26)"
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
          />
        </div>
      </header>

      <div className="AAP-layout">

        {/* SIDEBAR */}
        <aside className="AAP-sidebar">
          <button onClick={() => setMode("input")}>Input AAP</button>
          <button onClick={() => setMode("view")}>View AAP</button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="AAP-content">

          {/* DEFAULT — EXPLANATION + SUMMARY */}
          {mode === "none" && (
            <section>
              <h3>What is an Annual Action Plan?</h3>
              <p>
                The Annual Action Plan (AAP) captures district-level interventions,
                mapped schemes, allocated budgets, physical targets, and employment impact.
              </p>

              <h3>District Intervention Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Total Intervention Cost (₹ Lakhs)</th>
                    <th># of Interventions</th>
                  </tr>
                </thead>
                <tbody>
                  {districtSummary.map((row, i) => (
                    <tr key={i}>
                      <td>{row.district}</td>
                      <td>{row.totalCost}</td>
                      <td>{row.interventionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* INPUT MODE */}
          {mode === "input" && (
            <form className="AAP-form">

              {/* INTERVENTION DETAILS */}
              <section>
                <h3>Intervention Details</h3>

                <select value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="">Select Sector</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>

                <textarea
                  placeholder="Objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />

                <input
                  placeholder="Specific Intervention"
                  value={specificIntervention}
                  onChange={(e) => setSpecificIntervention(e.target.value)}
                />

                <input
                  placeholder="Intervention Rationale"
                  value={interventionRationale}
                  onChange={(e) => setInterventionRationale(e.target.value)}
                />
              </section>

              {/* BUDGET */}
              <section>
                <h3>Budget Information</h3>

                <input
                  type="number"
                  placeholder="Estimated Cost (₹ Lakhs)"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                />

                <select onChange={(e) => {
                  const scheme = schemes.find(s => s.id === e.target.value);
                  setSelectedScheme(scheme || null);
                }}>
                  <option value="">Select Mapping Scheme</option>
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <input disabled value={selectedScheme?.currentFyBudget ?? ""} placeholder="Current FY Budget" />

                <select multiple value={selectedDSPs} onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(o => o.value);
                  setSelectedDSPs(values);
                }}>
                  {dsps.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Apportioned Budget (₹ Lakhs)"
                  value={apportionedBudget}
                  onChange={(e) => setApportionedBudget(Number(e.target.value))}
                />

                <input disabled value={financingGap} placeholder="Financing Gap (Auto)" />

                <input
                  placeholder="Source of Financing"
                  value={sourceOfFinancing}
                  onChange={(e) => setSourceOfFinancing(e.target.value)}
                />
              </section>

              {/* PHYSICAL TARGETS */}
              <section>
                <h3>Physical Targets</h3>

                {targets.map((t, index) => (
                  <div key={index} className="Target-row">

                    <input
                      placeholder="Target Objective"
                      value={t.objective}
                      onChange={(e) => updateTarget(index, "objective", e.target.value)}
                    />

                    <input
                      type="number"
                      placeholder="Quantity"
                      value={t.quantity}
                      onChange={(e) => updateTarget(index, "quantity", Number(e.target.value))}
                    />

                    <input
                      list="unit-list"
                      placeholder="Unit"
                      value={t.unit}
                      onChange={(e) => updateTarget(index, "unit", e.target.value)}
                    />

                    {targets.length > 1 && (
                      <button type="button" onClick={() => removeTarget(index)}>Remove</button>
                    )}
                  </div>
                ))}

                {targets.length < 5 && (
                  <button type="button" onClick={addTarget}>+ Add Target</button>
                )}

                <datalist id="unit-list">
                  {unitSuggestions.map((u, i) => (
                    <option key={i} value={u} />
                  ))}
                </datalist>

                <input
                  type="number"
                  placeholder="Employment Potential (Jobs)"
                  value={employmentPotential}
                  onChange={(e) => setEmploymentPotential(Number(e.target.value))}
                />
              </section>

              <button type="submit">Submit Annual Action Plan</button>

            </form>
          )}

          {/* VIEW MODE */}
          {mode === "view" && (
            <section>
              <h3>View AAP Records</h3>
              <p>Table & filters will be rendered here.</p>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
