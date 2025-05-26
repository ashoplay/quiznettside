const Quiz = require('../models/Quiz');

/**
 * Gets a quiz by ID, with proper error handling
 * @param {string} id - The quiz ID to fetch
 * @returns {Promise<Object|null>} - The quiz object or null if not found
 */
exports.getQuizById = async (id) => {
  try {
    if (!id) return null;
    
    const quiz = await Quiz.findById(id)
      .populate('opprettetAv', 'brukernavn');
    
    return quiz || null;
  } catch (error) {
    console.error('Error in getQuizById:', error);
    return null;
  }
};
