# FlashLearn: Spaced Repetition Flashcard System

FlashLearn is an application designed to enhance your learning process through the science of spaced repetition. This application helps you remember information more effectively by showing flashcards at strategic intervals based on how well you know each card.

## Screenshot
<img width="1493" alt="image" src="https://github.com/user-attachments/assets/52505ef3-4256-4dfb-8a42-4fcffe107048" />


## Demo Video

[Watch the FlashLearn Demo Video](https://drive.google.com/file/d/1E3SZVYT2aRHbZFGtabwp18fu2rEhl2nB/view?usp=drive_link)

## Features

- **Create Flashcards**: Add your own cards with questions/terms on the front and answers/explanations on the back
- **Review System**: Intelligent spaced repetition algorithm that schedules reviews based on your performance
- **Progress Tracking**: Visual progress indicators and statistics about your learning journey
- **Card Management**: Edit, delete, and filter your flashcards by learning status
- **Responsive Design**: Works well on desktop browsers of various sizes

## How It Works

1. **Create Cards**: Add terms, concepts, or questions you want to learn
2. **Review Cards**: Cards due for review will appear in your review queue
3. **Rate Your Performance**: After reviewing each card, rate it as:
   - **Hard (5m)**: You'll see it again in 5 minutes
   - **Good (1d)**: You'll see it again in 1 day
   - **Easy (×2)**: The review interval doubles each time

The spaced repetition algorithm automatically manages review scheduling to optimize your memory retention.

## Technical Documentation

refer to the [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) file. This document provides a comprehensive overview of:

- Front-end and back-end architecture
- API endpoints and route implementations
- Data models and service layer
- Authentication flow
- Spaced repetition algorithm

## Setup and Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Build the application:
   ```
   npm run build
   ```

3. Start the server:
   ```
   npm start
   ```

4. Access the application in your browser at:
   ```
   http://localhost:3000
   ```

## Usage

1. Register a new username (or log in with an existing one)
2. Navigate between tabs:
   - **Review**: Practice cards that are due for review
   - **Create**: Add new flashcards to your collection
   - **Manage**: View, edit, or delete your existing cards

## Project Structure

- **Frontend**: React-based SPA built with Vite
- **Backend**: Express server providing REST API endpoints
- **State Management**: React Context API for state management
- **Styling**: Custom CSS for all components

## Technical Notes

- User authentication is session-based (without passwords for demonstration purposes)
- Cards are stored in server memory (no database for this implementation)
- The application uses a single server.js file to handle both static content and API services

## Licensing

### Icons
- All icons used in this project are from Google Fonts Material Icons and are licensed under the Apache License 2.0
