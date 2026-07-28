const express = require('express');
const router = express.Router();

const applicationController = require('./controllers/applicationController');
const componentController = require('./controllers/componentController');
const userController = require('./controllers/userController');

// Applications Routes
router.get('/applications', applicationController.getAllApplications);
router.get('/applications/:id', applicationController.getApplicationById);
router.post('/applications', applicationController.createApplication);
router.put('/applications/:id', applicationController.updateApplication);
router.delete('/applications/:id', applicationController.deleteApplication);

// Components Routes
router.get('/components', componentController.getAllComponents);
router.get('/components/:id', componentController.getComponentById);
router.post('/components', componentController.createComponent);
router.put('/components/:id', componentController.updateComponent);
router.delete('/components/:id', componentController.deleteComponent);

// Users Routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;