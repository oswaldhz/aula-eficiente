import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Importa tus componentes
import Teachers from "./components/Teachers";
import Classrooms from "./components/Classrooms";
import Students from "./components/Students";
import Activities from "./components/Activities";
import Grades from "./components/Grades";

// Estilo simple moderno
const navStyle = {
  padding: "10px",
  backgroundColor: "#1e3a8a", // azul oscuro
  display: "flex",
  justifyContent: "space-around",
  marginBottom: "20px",
  borderRadius: "8px",
};

const linkStyle = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "bold",
};

const headerStyle = {
  textAlign: "center",
  marginTop: "20px",
  color: "#1e3a8a",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  padding: "0 20px",
  fontFamily: "Arial, sans-serif",
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <h1 style={headerStyle}>App de Calificaciones</h1>

        <nav style={navStyle}>
          <Link to="/teachers" style={linkStyle}>Teachers</Link>
          <Link to="/classrooms" style={linkStyle}>Classrooms</Link>
          <Link to="/students" style={linkStyle}>Students</Link>
          <Link to="/activities" style={linkStyle}>Activities</Link>
          <Link to="/grades" style={linkStyle}>Grades</Link>
        </nav>

        <div style={containerStyle}>
          <Routes>
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route path="/students" element={<Students />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/" element={<div>Bienvenido a la App de Calificaciones</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
