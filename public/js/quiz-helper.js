/**
 * Quiz Helper Script 
 * Ensures quiz submissions are properly processed
 */

document.addEventListener('DOMContentLoaded', function() {
  const quizForm = document.getElementById('quizForm');
  
  if (quizForm) {
    // Backup all form inputs before submission
    quizForm.addEventListener('submit', function(e) {
      // Don't interfere with the form's normal validation
      if (!quizForm.checkValidity()) {
        return;
      }
      
      // Store form data in localStorage as backup
      const formData = new FormData(quizForm);
      const formDataObj = {};
      
      // Debug output showing all form fields
      console.log('Form submission data:');
      for (const [key, value] of formData.entries()) {
        console.log(`Submitting: ${key} = ${value}`);
        
        // For arrays like svar[0], svar[1], etc.
        if (key.includes('[') && key.includes(']')) {
          const mainKey = key.split('[')[0];
          const subKey = key.split('[')[1].split(']')[0];
          
          if (!formDataObj[mainKey]) {
            formDataObj[mainKey] = {};
          }
          
          formDataObj[mainKey][subKey] = value;
        } else {
          formDataObj[key] = value;
        }
      }
      
      // Save to localStorage with timestamp
      try {
        const backupKey = 'quiz_backup_' + Date.now();
        localStorage.setItem(backupKey, JSON.stringify(formDataObj));
        console.log('Quiz answers backed up to localStorage with key:', backupKey);
        console.log('Answers object:', formDataObj);
        
        // Add backup info to submission
        const backupInfo = document.createElement('input');
        backupInfo.type = 'hidden';
        backupInfo.name = 'debug_backup_key';
        backupInfo.value = backupKey;
        quizForm.appendChild(backupInfo);
      } catch (error) {
        console.error('Could not back up form data:', error);
      }
      
      // Disable the submit button to prevent double submissions
      const submitButtons = quizForm.querySelectorAll('button[type="submit"]');
      submitButtons.forEach(button => {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sender inn...';
      });
      
      // Set a timeout to re-enable the button if form doesn't submit
      setTimeout(() => {
        submitButtons.forEach(button => {
          button.disabled = false;
          button.innerHTML = 'Lever svar';
        });
      }, 10000); // 10 seconds timeout
    });
  }
});
