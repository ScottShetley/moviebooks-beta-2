// client/src/pages/CreateConnectionPage.js
import React from 'react';
// Import the form component that contains the actual creation logic and UI
import CreateConnectionForm from '../components/Connection/CreateConnectionForm/CreateConnectionForm';

/**
 * Renders the page dedicated to creating a new connection.
 * This component primarily acts as a container for the CreateConnectionForm.
 */
const CreateConnectionPage = () => {
  return (
    // Main container div for the page.
    // Consider adding a CSS module and a container class (e.g., styles.createPageContainer)
    // for consistent page layout and styling (max-width, padding, margins).
    <div>
      {/* Render the CreateConnectionForm component, which handles all the form fields and submission logic. */}
      <CreateConnectionForm />
    </div>
  );
};

export default CreateConnectionPage;
