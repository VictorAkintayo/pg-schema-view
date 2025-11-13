<?php

// Get user email from environment variable (assuming it's set)
$email = getenv('HNG_EMAIL');

// If email not found, set a default
if (!$email) {
  $email = 'your-email@example.com';
}

// Get current date time in ISO 8601 format (UTC)
$currentTime = gmdate('Y-m-d\TH:i:sP');

// Replace with your actual GitHub repository URL
$githubUrl = 'https://github.com/yourusername/your-repo';

// Prepare the response data
$responseData = [
  'email' => $email,
  'current_datetime' => $currentTime,
  'github_url' => $githubUrl,
];

// Set header to indicate JSON response
header('Content-Type: application/json');

// Encode data to JSON and echo the response
echo json_encode($responseData);
