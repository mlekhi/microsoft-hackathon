/*
 * quizModal.js
 * A reusable vanilla JS component to display a multiple-choice quiz popup with shuffled answers.
 */

// Call this function with the parsed quiz object:
// { question: string, choices: {A: string, B: string, C: string, D: string}, answer: 'A'|'B'|'C'|'D', explanation: string }
function showQuizModal(quiz) {
    // Remove any existing modal
    const existing = document.getElementById('quizModalBackdrop');
    if (existing) existing.remove();
  
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'quizModalBackdrop';
    backdrop.className = 'quiz-backdrop';
  
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'quiz-modal';
  
    // Question
    const qEl = document.createElement('div');
    qEl.className = 'quiz-question';
    qEl.textContent = quiz.question;
    modal.appendChild(qEl);
  
    // Prepare and shuffle choices
    const entries = Object.entries(quiz.choices); // [ ['A', text], ... ]
    // Fisher-Yates shuffle
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    // Map shuffled entries to new labels A-D
    const labels = ['A', 'B', 'C', 'D'];
    const newChoices = {};
    let correctLabel = '';
    entries.forEach(([origKey, text], idx) => {
      const label = labels[idx];
      newChoices[label] = text;
      if (origKey === quiz.answer) correctLabel = label;
    });
  
    // Choices list
    const ul = document.createElement('ul');
    ul.className = 'quiz-choices';
    labels.forEach(letter => {
      const li = document.createElement('li');
      const labelEl = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'quizChoice';
      input.value = letter;
      labelEl.appendChild(input);
      labelEl.append(` ${letter}. ${newChoices[letter]}`);
      li.appendChild(labelEl);
      ul.appendChild(li);
    });
    modal.appendChild(ul);
  
    // Footer buttons
    const footer = document.createElement('div');
    footer.className = 'quiz-footer';
  
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn';
    submitBtn.textContent = 'Submit';
    footer.appendChild(submitBtn);
  
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';
    footer.appendChild(cancelBtn);
  
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  
    // Handlers
    cancelBtn.onclick = () => backdrop.remove();
  
    submitBtn.onclick = () => {
      const selected = modal.querySelector('input[name=quizChoice]:checked');
      if (!selected) return alert('Please select an answer');
      const choice = selected.value;
      const resultMsg = document.createElement('p');
      if (choice === correctLabel) {
        resultMsg.textContent = '✅ Correct!';
        resultMsg.style.color = 'green';
      } else {
        resultMsg.textContent = `❌ Wrong. Correct answer: ${correctLabel}`;
        resultMsg.style.color = 'red';
      }
      const expEl = document.createElement('p');
      expEl.textContent = quiz.explanation;
      expEl.className = 'quiz-explanation';
  
      // Clear choices & buttons
      ul.remove();
      footer.remove();
  
      modal.appendChild(resultMsg);
      modal.appendChild(expEl);
  
      // Add Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn';
      closeBtn.textContent = 'Close';
      closeBtn.onclick = () => backdrop.remove();
      modal.appendChild(closeBtn);
    };
  }
  
  // Expose globally
  window.showQuizModal = showQuizModal;
  