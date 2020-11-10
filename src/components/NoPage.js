import React from 'react';
import { Link } from 'react-router-dom';

const NoPage = () => {
	return (
		<main className="d-flex-column flex-center vh-100">
			<Link
				to={({ pathname }) => {
					const subPathname = pathname.split('/')[1];
					return subPathname === 'coup' || subPathname === 'dss'
						? `/${subPathname}`
						: '/';
				}}
			>
				&larr; Page does not exist!
			</Link>
		</main>
	);
};

export default NoPage;
