import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { calculateFitScore, parseResume } from '../utils/resume_parser.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get all resumes
router.get('/', async (req, res) => {
    try {
        const { data: resumes, error } = await supabase
            .from('resumes')
            .select('*');

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch resumes' });
        }
        res.json(resumes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

// Get a single resume by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: resume, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(error);
            return res.status(404).json({ error: 'resume not found' });
        }

        res.json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

// Create a new resume
router.post('/', async (req, res) => {
    try {
        // Assuming the request body contains the metadata
        const { name, email, college, fit_score, resumeText } = req.body;

        const { data: resume, error } = await supabase
            .from('resumes')
            .insert([
                {
                    name,
                    email,
                    college,
                    fit_score,
                    resumeText,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to create resume' });
        }

        // Log resume information to the console
        console.log(`resume Name: ${name}, Email: ${email}, Fit Score: ${fit_score}`);

        res.status(201).json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create resume' });
    }
});

// Update an existing resume
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: resume, error } = await supabase
            .from('resumes')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to update resume' });
        }

        res.json(resume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update resume' });
    }
});

// Delete a resume
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('resumes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to delete resume' });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
});


// GET all resumes
router.get('/all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('resumes')
            .select('*');

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch resumes' });
        }

        res.json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

export default router;
