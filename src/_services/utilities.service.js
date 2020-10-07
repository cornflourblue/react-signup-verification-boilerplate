import { BehaviorSubject } from 'rxjs';

import config from 'config';
import { fetchWrapper } from '@/_helpers';

const utilitySubject = new BehaviorSubject(null);
const baseUrl = `${config.apiUrl}/utilities`;

export const utilitiesService = {
    enable,
    disable,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    user: utilitySubject.asObservable(),
    get utilityValue () { return utilitySubject.value }
};

function enable(id) {
    return fetchWrapper.post(`${baseUrl}/enable/${id}`);
}

function disable(id) {
    return fetchWrapper.post(`${baseUrl}/disable/${id}`);
}

function getAll() {
    return fetchWrapper.get(baseUrl);
}

function getById(id) {
    return fetchWrapper.get(`${baseUrl}/${id}`);
}

function create(params) {
    return fetchWrapper.post(baseUrl, params);
}

function update(id, params) {
    return fetchWrapper.put(`${baseUrl}/${id}`, params)
}

// prefixed with underscore because 'delete' is a reserved word in javascript
function _delete(id) {
    return fetchWrapper.delete(`${baseUrl}/${id}`)
}
