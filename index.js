
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Contact = require('./models/Contact.model');
require('dotenv').config();

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("Connected to DB!");
  })
  .catch(() => {
    console.log("Connection failed!");
  });

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/contacts', (req, res) => {
    Contact.find({})
        .then(contacts => {
            res.render('contacts', { contacts, editMode: false });
        })
        .catch(err => {
            res.status(500).render('error', { message: 'Error fetching contacts' });
        });
});

app.get('/edit-contacts', (req, res) => {
    Contact.find({})
        .then(contacts => {
            res.render('contacts', { contacts, editMode: true });
        })
        .catch(err => {
            res.status(500).render('error', { message: 'Error fetching contacts' });
        });
});

app.get('/add-contact', (req, res) => {
    res.render('add-contact');
});

app.post('/add-contact', async (req, res) => {
    try {
        const newContact = new Contact(req.body);
        await newContact.save();
        res.redirect('/contacts');
    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            let errors = {};
            if (error.code === 11000) {
                errors.email = 'There already exists a contact with that email';
            } else {
                Object.keys(error.errors).forEach((key) => {
                    errors[key] = error.errors[key].message;
                });
            }
            return res.status(400).render('add-contact', { errors: Object.values(errors) });
        }
        res.status(500).render('error', { message: 'Error adding contact' });
    }
});

app.get('/edit-contact/:id', (req, res) => {
    Contact.findById(req.params.id)
        .then(contact => {
            if (!contact) {
                return res.status(404).render('error', { message: 'Contact not found' });
            }
            res.render('edit-contact', { contact });
        })
        .catch(err => {
            res.status(500).render('error', { message: 'Error fetching contact' });
        });
});

app.post('/edit-contact/:id', async (req, res) => {
    try {
        const updatedContact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedContact) {
            return res.status(404).render('error', { message: 'Contact not found' });
        }
        res.redirect('/contacts');
    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            let errors = {};
            if (error.code === 11000) {
                errors.email = 'There already exists a contact with that email';
            } else {
                Object.keys(error.errors).forEach((key) => {
                    errors[key] = error.errors[key].message;
                });
            }
            return res.status(400).render('edit-contact', { contact: req.body, errors: Object.values(errors) });
        }
        res.status(500).render('error', { message: 'Error updating contact' });
    }
});

app.get('/delete-contact/:id', (req, res) => {
    Contact.findByIdAndDelete(req.params.id)
        .then(() => {
            res.redirect('/contacts');
        })
        .catch(err => {
            res.status(500).render('error', { message: 'Error deleting contact' });
        });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
