import express from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '{{ port }}', 10);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '{{ component_name }}', timestamp: new Date().toISOString() });
});

// Ready check endpoint
app.get('/ready', (_req, res) => {
  res.json({ status: 'ready' });
});

app.listen(PORT, () => {
  console.log(`[{{ component_name }}] Server listening on port ${PORT}`);
});
