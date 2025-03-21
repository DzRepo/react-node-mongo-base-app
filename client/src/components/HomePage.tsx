import { useState } from 'react';
import { Button, Card, CardContent, Typography, TextField, Box, Grid, Paper } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

export default function HomePage() {
  const [count, setCount] = useState(0);
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-8">
      {/* Hero Section - Using Tailwind for layout and Material-UI for typography */}
      <Paper elevation={3} className="bg-gradient-to-r from-primary-500 to-primary-700 p-8 rounded-xl">
        <Typography variant="h3" className="text-white font-bold mb-4">
          Welcome to React Node App
        </Typography>
        <Typography variant="h6" className="text-white opacity-90">
          A modern full-stack application built with React, Node.js, and MongoDB
        </Typography>
      </Paper>

      {/* Features Grid - Using Material-UI Grid with Tailwind styling */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent>
              <Typography variant="h5" className="text-primary-600 font-semibold mb-2">
                React
              </Typography>
              <Typography variant="body1" className="text-gray-600">
                Modern UI components with TypeScript
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent>
              <Typography variant="h5" className="text-primary-600 font-semibold mb-2">
                Node.js
              </Typography>
              <Typography variant="body1" className="text-gray-600">
                Powerful backend with Express
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent>
              <Typography variant="h5" className="text-primary-600 font-semibold mb-2">
                MongoDB
              </Typography>
              <Typography variant="body1" className="text-gray-600">
                Flexible document database
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Interactive Section - Mixing Material-UI components with Tailwind */}
      <Card className="p-6">
        <Typography variant="h4" className="font-bold mb-4">
          Interactive Demo
        </Typography>
        <Box className="flex items-center space-x-4">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setCount(count - 1)}
            startIcon={<RemoveIcon />}
            className="!bg-gray-600 hover:!bg-gray-700"
          >
            Decrease
          </Button>
          <Typography variant="h4" className="font-semibold">
            {count}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCount(count + 1)}
            startIcon={<AddIcon />}
            className="!bg-primary-600 hover:!bg-primary-700"
          >
            Increase
          </Button>
        </Box>
      </Card>

      {/* Form Demo - Using Material-UI components with Tailwind spacing */}
      <Card className="p-6">
        <Typography variant="h4" className="font-bold mb-4">
          Form Demo
        </Typography>
        <Box component="form" className="space-y-4">
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            className="!bg-white"
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            variant="outlined"
            className="!bg-white"
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            className="!bg-primary-600 hover:!bg-primary-700"
          >
            Submit
          </Button>
        </Box>
      </Card>
    </div>
  );
} 