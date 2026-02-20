import type { District } from "./districtPages/graph.types";

// --- SVG imports ---
import Ahilyanagar from "../assets/Maps/Ahilyanagar.svg";
import Akola from "../assets/Maps/Akola.svg";
import Amravati from "../assets/Maps/Amravati.svg";
import Beed from "../assets/Maps/Beed.svg";
import Bhandara from "../assets/Maps/Bhandara.svg";
import Buldhana from "../assets/Maps/Buldhana.svg";
import Chandrapur from "../assets/Maps/Chandrapur.svg";
import ChhatrapatiSambhajiNagar from "../assets/Maps/Chhatrapati Sambhaji Nagar.svg";
import Dharashiv from "../assets/Maps/Dharashiv.svg";
import Dhule from "../assets/Maps/Dhule.svg";
import Gadchiroli from "../assets/Maps/Gadchiroli.svg";
import Gondia from "../assets/Maps/Gondia.svg";
import Hingoli from "../assets/Maps/Hingoli.svg";
import Jalgaon from "../assets/Maps/Jalgaon.svg";
import Jalna from "../assets/Maps/Jalna.svg";
import Kolhapur from "../assets/Maps/Kolhapur.svg";
import Latur from "../assets/Maps/Latur.svg";
import MumbaiCitySuburban from "../assets/Maps/Mumbai City and Suburban.svg";
import Nagpur from "../assets/Maps/Nagpur.svg";
import Nanded from "../assets/Maps/Nanded.svg";
import Nandurbar from "../assets/Maps/Nandurbar.svg";
import Nashik from "../assets/Maps/Nashik.svg";
import Parbhani from "../assets/Maps/Parbhani.svg";
import Pune from "../assets/Maps/Pune.svg";
import Raigad from "../assets/Maps/Raigad.svg";
import Ratnagiri from "../assets/Maps/Ratnagiri.svg";
import Sangli from "../assets/Maps/Sangli.svg";
import Satara from "../assets/Maps/Satara.svg";
import Sindhudurg from "../assets/Maps/Sindhudurg.svg";
import Solapur from "../assets/Maps/Solapur.svg";
import ThanePalghar from "../assets/Maps/Thane and Palghar.svg";
import Wardha from "../assets/Maps/Wardha.svg";
import Washim from "../assets/Maps/Washim.svg";
import Yavatmal from "../assets/Maps/Yavatmal.svg";
import Maharashtra from "../assets/Maps/Mumbai City and Suburban.svg"; // Placeholder SVG for Maharashtra

// ✅ FULLY TYPE-SAFE MAP
export const districtMapImages: Record<District, string> = {
  Ahilyanagar,
  Akola,
  Amravati,
  Beed,
  Bhandara,
  Buldhana,
  Chandrapur,
  "Chhatrapati Sambhaji Nagar": ChhatrapatiSambhajiNagar,
  Dharashiv,
  Dhule,
  Gadchiroli,
  Gondia,
  Hingoli,
  Jalgaon,
  Jalna,
  Kolhapur,
  Latur,
  "Mumbai City and Suburban": MumbaiCitySuburban,
  Nagpur,
  Nanded,
  Nandurbar,
  Nashik,
  Parbhani,
  Pune,
  Raigad,
  Ratnagiri,
  Sangli,
  Satara,
  Sindhudurg,
  Solapur,
  "Thane and Palghar": ThanePalghar, // 👈 merged SVG
  Wardha,
  Washim,
  Yavatmal,
  Maharashtra,
};
