import './App.css'
import Navbar from './components/Navbar'
import HomePage from './pages/Home'
//import DistrictPage from './components/districtPages/Districts'
import { Route, Routes } from 'react-router'
import AAPEntry from './components/AAP/AAPEntry'
import UtilityBar from './components/UtilityBar'
import MSride from './pages/Initiatives/MahaSTRIDE'
import Footer from './components/Footer'

function App() {

  return (
    <div className="AppDiv">  
      <UtilityBar/>
      <Navbar/>
      <div className="AppBody">
        <Routes>
          <Route index element={<HomePage/>}/>
          <Route path='/Districts' element={<AAPEntry district='Pune'/>}/>
          <Route path='/mahastride' element={<MSride/>}/>
        </Routes>
      </div>
      <Footer/>
    </div>
  )
}

export default App