const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const TMDB_TOKEN = process.env.TMDB_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_TOKEN}`,
    accept: 'application/json',
  },
});

// Route: GET /api/movies?type=now_playing OR ?genre=28 OR ?query=batman
app.get('/api/movies', async (req, res) => {
  const { type = 'popular', genre, query, page = 1 } = req.query;
  const validTypes = ['popular', 'now_playing', 'top_rated', 'upcoming'];

  if (!query && !genre && !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid movie type or genre' });
  }
  if (isNaN(page) || page < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }

  let url = '';
  if (query) {
    url = `/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`;
  } else if (genre) {
    url = `/discover/movie?with_genres=${encodeURIComponent(genre)}&language=en-US&page=${page}`;
  } else {
    url = `/movie/${type}?language=en-US&page=${page}`;
  }

  try {
    const response = await axiosInstance.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching movies:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to fetch movie list from TMDB' });
  }
});

// Route: GET /api/movie/:id for movie details
app.get('/api/movie/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  try {
    const response = await axiosInstance.get(`/movie/${id}?language=en-US`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching movie details:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Route: GET /api/movie/:id/credits for movie cast
app.get('/api/movie/:id/credits', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  try {
    const response = await axiosInstance.get(`/movie/${id}/credits?language=en-US`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching movie credits:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to fetch movie credits' });
  }
});

// Route: GET /api/movie/:id/similar for similar movies
app.get('/api/movie/:id/similar', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  try {
    const response = await axiosInstance.get(`/movie/${id}/similar?language=en-US`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching similar movies:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
});

// ✅ NEW: GET /api/movies/byIds?ids=27205,667216,...
app.get('/api/movies/byIds', async (req, res) => {
  const ids = req.query.ids?.split(',') || [];

  if (!TMDB_TOKEN) {
    return res.status(500).json({ error: 'TMDB token not set in environment variables' });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No movie IDs provided' });
  }

  try {
    const promises = ids.map((id) =>
      axiosInstance.get(`/movie/${id}?language=en-US`).then((r) => r.data)
    );

    const results = await Promise.all(promises);
    res.json({ results });
  } catch (err) {
    console.error('Error fetching movies by IDs:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    res.status(500).json({ error: 'Failed to fetch movies by IDs' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
