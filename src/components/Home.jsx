import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import Socials from './Socials';

function Home() {
  return (
    <main className="fade-in d-flex-column vh-100 justify-content-center">
      <div className="d-flex-column mt-5 h-50 flex-center font-impact">
        <Link to="/coup">
          <Button size="lg">Coup</Button>
        </Link>
        <Link to="/dss" className="mt-4">
          <Button size="lg">Drunk, Stoned, or Stupid</Button>
        </Link>
      </div>
      <Socials />
    </main>
  );
}

export default Home;
