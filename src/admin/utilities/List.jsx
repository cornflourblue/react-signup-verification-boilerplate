import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';

import { utilitiesService } from '@/_services';

function List({ match }) {
    const { path } = match;
    const [utilities, setUtilities] = useState(null);

    useEffect(() => {
        utilitiesService.getAll().then(x => setUtilities(x));
    }, []);

    function deleteUtility(id) {
        setUtilities(utilities.map(x => {
            if (x.id === id) { x.isDeleting = true; }
            return x;
        }));
        utilitiesService.delete(id).then(() => {
            setUtilities(utilities => utilities.filter(x => x.id !== id));
        });
    }

    function utilityStatus(status) {
        if (status) { return <span role="img" aria-label="green-circle">🟢</span>; }
        else if (!status) { return <span role="img" aria-label="red-circle">🔴</span>; }
        else { return <span role="img" aria-label="warning">⚠️</span>; }
    }

    function parseDateTime(timestamp) {
        return <Moment fromNow>{timestamp}</Moment>;
    }

    return (
        <div>
            <h1>Utilities</h1>
            <p>All utilities from secure (admin only) api end point:</p>
            <Link to={`${path}/add`} className="btn btn-sm btn-success mb-2">Add Utility</Link>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th style={{ width: '10%' }} className="text-center">Status</th>
                        <th style={{ width: '40%' }}>Utility</th>
                        <th style={{ width: '40%' }}>Last Modified</th>
                        <th style={{ width: '10%' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {utilities && utilities.map(utility =>
                        <tr key={utility.id}>
                            <td  className="text-center">{utilityStatus(utility.status)}</td>
                            <td>{utility.name}</td>
                            <td>{parseDateTime(utility.modified)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                                <Link to={`${path}/edit/${utility.id}`} className="btn btn-sm btn-primary mr-1">Edit</Link>
                                <button onClick={() => deleteUtility(utility.id)} className="btn btn-sm btn-danger" style={{ width: '60px' }} disabled={utility.isDeleting}>
                                    {utility.isDeleting 
                                        ? <span className="spinner-border spinner-border-sm"></span>
                                        : <span>Delete</span>
                                    }
                                </button>
                            </td>
                        </tr>
                    )}
                    {!utilities &&
                        <tr>
                            <td colSpan="4" className="text-center">
                                <span className="spinner-border spinner-border-lg align-center"></span>
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    );
}

export { List };