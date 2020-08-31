import { Role } from './'
import { alertService } from '@/_services';

// array in local storage for registered users
const usersKey = 'react-signup-verification-boilerplate-users';
let users = JSON.parse(localStorage.getItem(usersKey)) || [];

export function configureFakeBackend() {
    let realFetch = window.fetch;
    window.fetch = function (url, opts) {
        return new Promise((resolve, reject) => {
            // wrap in timeout to simulate server api call
            setTimeout(handleRoute, 500);

            function handleRoute() {
                const { method } = opts;
                switch (true) {
                    case url.endsWith('/accounts/authenticate') && method === 'POST':
                        return authenticate();
                    case url.endsWith('/accounts/refresh-token') && method === 'POST':
                        return refreshToken();
                    case url.endsWith('/accounts/revoke-token') && method === 'POST':
                        return revokeToken();
                    case url.endsWith('/accounts/register') && method === 'POST':
                        return register();
                    case url.endsWith('/accounts/verify-email') && method === 'POST':
                        return verifyEmail();
                    case url.endsWith('/accounts/forgot-password') && method === 'POST':
                        return forgotPassword();
                    case url.endsWith('/accounts/validate-reset-token') && method === 'POST':
                        return validateResetToken();
                    case url.endsWith('/accounts/reset-password') && method === 'POST':
                        return resetPassword();
                    case url.endsWith('/accounts') && method === 'GET':
                        return getUsers();
                    case url.match(/\/accounts\/\d+$/) && method === 'GET':
                        return getUserById();
                    case url.endsWith('/accounts') && method === 'POST':
                        return createUser();
                    case url.match(/\/accounts\/\d+$/) && method === 'PUT':
                        return updateUser();
                    case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
                        return deleteUser();
                    default:
                        // pass through any requests not handled above
                        return realFetch(url, opts)
                            .then(response => resolve(response))
                            .catch(error => reject(error));
                }
            }

            // route functions

            function authenticate() {
                const { email, password } = body();
                const user = users.find(x => x.email === email && x.password === password && x.isVerified);

                if (!user) return error('Email or password is incorrect');

                // add refresh token to user
                user.refreshTokens.push(generateRefreshToken());
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    email: user.email,
                    title: user.title,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    jwtToken: generateJwtToken(user)
                });
            }

            function refreshToken() {
                const refreshToken = getRefreshToken();
                
                if (!refreshToken) return unauthorized();

                const user = users.find(x => x.refreshTokens.includes(refreshToken));
                
                if (!user) return unauthorized();

                // replace old refresh token with a new one and save
                user.refreshTokens = user.refreshTokens.filter(x => x !== refreshToken);
                user.refreshTokens.push(generateRefreshToken());
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    email: user.email,
                    title: user.title,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    jwtToken: generateJwtToken(user)
                })
            }

            function revokeToken() {
                if (!isAuthenticated()) return unauthorized();
                
                const refreshToken = getRefreshToken();
                const user = users.find(x => x.refreshTokens.includes(refreshToken));
                
                // revoke token and save
                user.refreshTokens = user.refreshTokens.filter(x => x !== refreshToken);
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok();
            }

            function register() {
                const user = body();
    
                if (users.find(x => x.email === user.email)) {
                    // display email already registered "email" in alert
                    setTimeout(() => {
                        alertService.info(`
                            <h4>Email Already Registered</h4>
                            <p>Your email ${user.email} is already registered.</p>
                            <p>If you don't know your password please visit the <a href="${location.origin}/account/forgot-password">forgot password</a> page.</p>
                            <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.</div>
                        `, { autoClose: false });
                    }, 1000);

                    // always return ok() response to prevent email enumeration
                    return ok();
                }
    
                // assign user id and a few other properties then save
                user.id = newUserId();
                if (user.id === 1) {
                    // first registered user is an admin
                    user.role = Role.Admin;
                } else {
                    user.role = Role.User;
                }
                user.dateCreated = new Date().toISOString();
                user.verificationToken = new Date().getTime().toString();
                user.isVerified = false;
                user.refreshTokens = [];
                delete user.confirmPassword;
                users.push(user);
                localStorage.setItem(usersKey, JSON.stringify(users));

                // display verification email in alert
                setTimeout(() => {
                    const verifyUrl = `${location.origin}/account/verify-email?token=${user.verificationToken}`;
                    alertService.info(`
                        <h4>Verification Email</h4>
                        <p>Thanks for registering!</p>
                        <p>Please click the below link to verify your email address:</p>
                        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                        <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.</div>
                    `, { autoClose: false });
                }, 1000);

                return ok();
            }
    
            function verifyEmail() {
                const { token } = body();
                const user = users.find(x => !!x.verificationToken && x.verificationToken === token);
                
                if (!user) return error('Verification failed');
                
                // set is verified flag to true if token is valid
                user.isVerified = true;
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok();
            }

            function forgotPassword() {
                const { email } = body();
                const user = users.find(x => x.email === email);
                
                // always return ok() response to prevent email enumeration
                if (!user) return ok();
                
                // create reset token that expires after 24 hours
                user.resetToken = new Date().getTime().toString();
                user.resetTokenExpires = new Date(Date.now() + 24*60*60*1000).toISOString();
                localStorage.setItem(usersKey, JSON.stringify(users));

                // display password reset email in alert
                setTimeout(() => {
                    const resetUrl = `${location.origin}/account/reset-password?token=${user.resetToken}`;
                    alertService.info(`
                        <h4>Reset Password Email</h4>
                        <p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                        <p><a href="${resetUrl}">${resetUrl}</a></p>
                        <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.</div>
                    `, { autoClose: false });
                }, 1000);

                return ok();
            }

            function validateResetToken() {
                const { token } = body();
                const user = users.find(x =>
                    !!x.resetToken && x.resetToken === token &&
                    new Date() < new Date(x.resetTokenExpires)
                );
                
                if (!user) return error('Invalid token');
                
                return ok();
            }

            function resetPassword() {
                const { token, password } = body();
                const user = users.find(x =>
                    !!x.resetToken && x.resetToken === token &&
                    new Date() < new Date(x.resetTokenExpires)
                );
                
                if (!user) return error('Invalid token');
                
                // update password and remove reset token
                user.password = password;
                user.isVerified = true;
                delete user.resetToken;
                delete user.resetTokenExpires;
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok();
            }

            function getUsers() {
                if (!isAuthorized(Role.Admin)) return unauthorized();

                return ok(users);
            }

            function getUserById() {
                if (!isAuthenticated()) return unauthorized();
    
                let user = users.find(x => x.id === idFromUrl());

                // users can get own profile and admins can get all profiles
                if (user.id !== currentUser().id && !isAuthorized(Role.Admin)) {
                    return unauthorized();
                }

                return ok(user);
            }
    
            function createUser() {
                if (!isAuthorized(Role.Admin)) return unauthorized();
    
                const user = body();
                if (users.find(x => x.email === user.email)) {
                    return error(`Email ${user.email} is already registered`);
                }

                // assign user id and a few other properties then save
                user.id = newUserId();
                user.dateCreated = new Date().toISOString();
                user.isVerified = true;
                user.refreshTokens = [];
                delete user.confirmPassword;
                users.push(user);
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok();
            }
    
            function updateUser() {
                if (!isAuthenticated()) return unauthorized();
    
                let params = body();
                let user = users.find(x => x.id === idFromUrl());

                // users can update own profile and admins can update all profiles
                if (user.id !== currentUser().id && !isAuthorized(Role.Admin)) {
                    return unauthorized();
                }

                // only update password if included
                if (!params.password) {
                    delete params.password;
                }
                // don't save confirm password
                delete params.confirmPassword;

                // update and save user
                Object.assign(user, params);
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    email: user.email,
                    title: user.title,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                });
            }
    
            function deleteUser() {
                if (!isAuthenticated()) return unauthorized();
    
                let user = users.find(x => x.id === idFromUrl());

                // users can delete own account and admins can delete any account
                if (user.id !== currentUser().id && !isAuthorized(Role.Admin)) {
                    return unauthorized();
                }

                // delete user then save
                users = users.filter(x => x.id !== idFromUrl());
                localStorage.setItem(usersKey, JSON.stringify(users));
                return ok();
            }
    
            // helper functions

            function ok(body) {
                resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) });
            }

            function unauthorized() {
                resolve({ status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })) });
            }

            function error(message) {
                resolve({ status: 400, text: () => Promise.resolve(JSON.stringify({ message })) });
            }

            function isAuthenticated() {
                return !!currentUser();
            }
    
            function isAuthorized(role) {
                const user = currentUser();
                if (!user) return false;
                return user.role === role;
            }
    
            function idFromUrl() {
                const urlParts = url.split('/');
                return parseInt(urlParts[urlParts.length - 1]);
            }

            function body() {
                return opts.body && JSON.parse(opts.body);    
            }

            function newUserId() {
                return users.length ? Math.max(...users.map(x => x.id)) + 1 : 1;
            }

            function generateJwtToken(user) {
                // create token that expires in 15 minutes
                const tokenPayload = { 
                    exp: Math.round(new Date(Date.now() + 15*60*1000).getTime() / 1000),
                    id: user.id
                }
                return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
            }

            function currentUser() {
                // check if jwt token is in auth header
                const authHeader = opts.headers['Authorization'] || '';
                if (!authHeader.startsWith('Bearer fake-jwt-token')) return;

                // check if token is expired
                const jwtToken = JSON.parse(atob(authHeader.split('.')[1]));
                const tokenExpired = Date.now() > (jwtToken.exp * 1000);
                if (tokenExpired) return;

                const user = users.find(x => x.id === jwtToken.id);
                return user;
            }

            function generateRefreshToken() {
                const token = new Date().getTime().toString();

                // add token cookie that expires in 7 days
                const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString();
                document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/`;

                return token;
            }

            function getRefreshToken() {
                // get refresh token from cookie
                return (document.cookie.split(';').find(x => x.includes('fakeRefreshToken')) || '=').split('=')[1];
            }
        });
    }
}