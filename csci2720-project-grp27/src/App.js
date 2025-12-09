import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

/* Placeholder pages */
function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>CSCI 2720 Course Project</h1>
      <p>Welcome to the venue exploration app.</p>
    </div>
  );
}

function Map() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Map Page</h2>
      <p>Map of venues will be displayed here.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Navigation bar */}
      <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <Link to="/" style={{ marginRight: "10px" }}>Home</Link>
        <Link to="/map">Map</Link>
      </nav>

      {/* Page routing */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </Router>
  );
}

export default App;
