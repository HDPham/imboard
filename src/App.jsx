import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import Home from './components/Home';
import Coup from './coup/CoupApp';
import Dss from './dss/DssApp';
import NoPage from './components/NoPage';
import coupStore from './coup/store';
import dssStore from './dss/store';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/coup/*"
          element={
            <Provider store={coupStore}>
              <Coup />
            </Provider>
          }
        />
        <Route
          path="/dss/*"
          element={
            <Provider store={dssStore}>
              <Dss />
            </Provider>
          }
        />
        <Route element={<NoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
