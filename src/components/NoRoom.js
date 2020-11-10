import React from 'react';
import { Link } from 'react-router-dom';

const NoRoom = () => {
	return (
		<main className="d-flex-column flex-center vh-100">
			<Link to={({ pathname }) => `/${pathname.split('/')[1]}`}>
				&larr; Not In Room, Go Back
			</Link>
		</main>
	);
};

export default NoRoom;
