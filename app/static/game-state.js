(() => {
  const key = 'matematica-descomplicada-partida';
  const limit = 10;

  function starsFor(correct) {
    if (correct >= 9) return 3;
    if (correct >= 5) return 2;
    return 1;
  }

  function read() {
    let state;
    try {
      state = JSON.parse(sessionStorage.getItem(key));
    } catch {
      return null;
    }
    if (!state || !['adventure', 'free'].includes(state.mode)) return null;
    const { answered, correct, errors, result } = state;
    if (typeof state.instructionsSeen !== 'boolean') state.instructionsSeen = true;
    state.pending = state.pending ?? null;
    if (state.pending && (
      !Number.isInteger(state.pending.question?.id) || state.pending.question.id <= 0 ||
      typeof state.pending.question.enunciado !== 'string' ||
      !Number.isSafeInteger(state.pending.answer)
    )) return null;
    if (![answered, correct, errors].every(Number.isInteger) ||
        answered < 0 || answered > limit || correct < 0 || errors < 0 ||
        correct + errors !== answered) return null;
    if (state.mode === 'adventure') {
      if (answered === limit) {
        if (!result || result.correct !== correct || result.errors !== errors) return null;
        result.stars = starsFor(correct);
      } else if (result !== null) return null;
    }
    return state;
  }

  function save(state) {
    sessionStorage.setItem(key, JSON.stringify(state));
    return state;
  }

  function start(mode) {
    if (!['adventure', 'free'].includes(mode)) return null;
    return save({ mode, answered: 0, correct: 0, errors: 0, result: null, pending: null, instructionsSeen: false });
  }

  function acknowledgeInstructions() {
    const state = read();
    if (!state) return null;
    state.instructionsSeen = true;
    return save(state);
  }

  function setPending(question, answer) {
    const state = read();
    if (!state || state.result || state.pending) return null;
    state.pending = { question, answer };
    return save(state);
  }

  function clearPending(questionId) {
    const state = read();
    if (!state?.pending || state.pending.question.id !== questionId) return null;
    state.pending = null;
    return save(state);
  }

  function record(correctAnswer, questionNumber, questionId) {
    const state = read();
    if (!state || state.mode !== 'adventure' || state.result ||
        state.answered !== questionNumber - 1 || state.pending?.question.id !== questionId) return null;
    state.answered += 1;
    if (correctAnswer) state.correct += 1;
    else state.errors += 1;
    state.pending = null;
    if (state.answered === limit) {
      state.result = { correct: state.correct, errors: state.errors, stars: starsFor(state.correct) };
    }
    return save(state);
  }

  window.MathGame = { limit, read, start, acknowledgeInstructions, setPending, clearPending, record, starsFor };
})();
