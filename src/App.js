import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import Coup from './coup/CoupApp';
import Dss from './dss/DssApp';
import NoPage from './components/NoPage';
import { CoupProvider } from './coup/context/CoupState';
import { DssProvider } from './dss/context/DssState';

function App() {
	return (
		<Router>
			<Switch>
				<Route exact path="/" component={Home} />
				<Route
					path="/coup"
					render={() => (
						<CoupProvider>
							<Coup />
						</CoupProvider>
					)}
				/>
				<Route
					path="/dss"
					render={() => (
						<DssProvider>
							<Dss />
						</DssProvider>
					)}
				/>
				<Route component={NoPage} />
			</Switch>
		</Router>
	);
}

export default App;
