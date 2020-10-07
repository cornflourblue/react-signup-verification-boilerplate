import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { utilitiesService, alertService } from '@/_services';

function AddEdit({ history, match }) {
    const { id } = match.params;
    const isAddMode = !id;
    
    const initialValues = {
        name: '',
        status: 'true'
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string()
            .required('Utility name is required'),
        status: Yup.boolean()
            .required('Utility status is required')
    });

    function onSubmit(fields, { setStatus, setSubmitting }) {
        setStatus();
        if (isAddMode) {
            createUtility(fields, setSubmitting);
        } else {
            updateUtility(id, fields, setSubmitting);
        }
    }

    function createUtility(fields, setSubmitting) {
        utilitiesService.create(fields)
            .then(() => {
                alertService.success('Utility added successfully', { keepAfterRouteChange: true });
                history.push('.');
            })
            .catch(error => {
                setSubmitting(false);
                alertService.error(error);
            });
    }

    function updateUtility(id, fields, setSubmitting) {
        utilitiesService.update(id, fields)
            .then(() => {
                alertService.success('Update successful', { keepAfterRouteChange: true });
                history.push('..');
            })
            .catch(error => {
                setSubmitting(false);
                alertService.error(error);
            });
    }

    return (
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
            {({ errors, touched, isSubmitting, setFieldValue }) => {
                useEffect(() => {
                    if (!isAddMode) {
                        // get utility and set form fields
                        utilitiesService.getById(id).then(utility => {
                            const fields = ['name', 'status'];
                            fields.forEach(field => setFieldValue(field, utility[field], false));
                        });
                    }
                }, []);

                return (
                    <Form>
                        <h1>{isAddMode ? 'Add Utility' : 'Edit Utility'}</h1>
                        <div className="form-row">
                            <div className="form-group col-5">
                                <label>Utility Name</label>
                                <Field name="name" type="text" className={'form-control' + (errors.name && touched.name ? ' is-invalid' : '')} />
                                <ErrorMessage name="name" component="div" className="invalid-feedback" />
                            </div>
                            <div className="form-group col-2">
                                <label>Utility Status</label>
                                <Field name="status" as="select" className={'form-control' + (errors.status && touched.status ? ' is-invalid' : '')}>
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </Field>
                                <ErrorMessage name="status" component="div" className="invalid-feedback" />
                            </div>
                        </div>
                        <div className="form-group">
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                                {isSubmitting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                {isAddMode ? 'Add' : 'Save'}
                            </button>
                            <Link to={isAddMode ? '.' : '..'} className="btn btn-link">Cancel</Link>
                        </div>
                    </Form>
                );
            }}
        </Formik>
    );
}

export { AddEdit };