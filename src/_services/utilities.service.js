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

function enable() {
    return fetchWrapper.get(`${baseUrl}/enable`);
}

function disable() {
    return fetchWrapper.get(`${baseUrl}/disable`);
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
        .then(utility => {
            // update stored user if the logged in user updated their own record
            if (utility.id === utilitySubject.value.id) {
                // publish updated user to subscribers
                utility = { ...utilitySubject.value, ...utility };
                utilitySubject.next(utility);
            }
            return utility;
        });
}

// prefixed with underscore because 'delete' is a reserved word in javascript
function _delete(id) {
    return fetchWrapper.delete(`${baseUrl}/${id}`)
}
