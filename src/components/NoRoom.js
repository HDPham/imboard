import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function NoRoom() {
  const { pathname } = useLocation();

  return (
    <main className="d-flex-column flex-center vh-100">
      <Link to={'/' + pathname.split('/').at(-2)}>
        &larr; Not In Room, Go To Home
      </Link>
    </main>
  );
}

export default NoRoom;
