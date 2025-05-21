document.getElementById('quiz-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Validate that all questions have answers
  const questions = document.querySelectorAll('.quiz-question');
  let allAnswered = true;
  
  questions.forEach(question => {
    const questionId = question.dataset.questionId;
    const answered = document.querySelector(`input[name="question-${questionId}"]:checked`);
    
    if (!answered) {
      allAnswered = false;
      // Highlight unanswered question
      question.classList.add('unanswered');
    } else {
      question.classList.remove('unanswered');
    }
  });
  
  if (!allAnswered) {
    alert('Vennligst svar på alle spørsmål før du leverer.');
    return;
  }
  
  // Proceed with submission if all questions are answered
  this.submit();
});