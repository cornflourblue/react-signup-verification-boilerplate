import React from 'react';
import { Link } from 'react-router-dom';

function Overview({ match }) {
    const { path } = match;

    return (
        <div>
            <h1>Admin</h1>
            <p>This section can only be accessed by administrators.</p>
            <p>
                <Link to={`${path}/users`} className="mr-4">Manage Users</Link>
                <Link to={`${path}/utilities`} className="mr-4">Manage Utilities</Link>
            </p>
        </div>
    );
}

export { Overview };