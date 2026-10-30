import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Clinic from './pages/Clinic.jsx'
import Booking from './pages/Booking.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForClinics from './pages/ForClinics.jsx'
import Cabinet from './pages/cabinet/index.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clinics" element={<Catalog />} />
          <Route path="/clinics/:slug" element={<Clinic />} />
          <Route path="/booking/:slug" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/for-clinics" element={<ForClinics />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
